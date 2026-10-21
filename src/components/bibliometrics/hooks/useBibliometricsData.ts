import { useState, useEffect, useRef, useCallback } from "react";
import {
  BibliometricOverview,
  NetworkResponse,
  ThematicMapResponse,
  ThematicEvolutionResponse,
  BibliometricLawsResponse,
} from "../../../types/bibliometrics";
import {
  fetchBibliometricsOverview,
  fetchBibliometricsNetwork,
  fetchBibliometricsThematicMap,
  fetchBibliometricsThematicEvolution,
  fetchBibliometricsLaws,
} from "../../../services/bibliometricsApi";
import { BibliometricsDataParams, ACADEMIC_STOPWORDS_PRESET } from "../types";

export interface UseBibliometricsDataReturn {
  dataParams: BibliometricsDataParams;
  setDataParams: React.Dispatch<React.SetStateAction<BibliometricsDataParams>>;
  overview: BibliometricOverview | null;
  network: NetworkResponse | null;
  thematic: ThematicMapResponse | null;
  evolution: ThematicEvolutionResponse | null;
  laws: BibliometricLawsResponse | null;
  loading: boolean;
  error: string | null;
  applyDataParams: (
    overrideParams?: Partial<BibliometricsDataParams>,
  ) => Promise<void>;
  addStopword: (tag: string) => Promise<void>;
  removeStopword: (tag: string) => Promise<void>;
  clearStopwords: () => Promise<void>;
  addAcademicPresets: () => Promise<void>;
}

export function useBibliometricsData(
  workspaceId: string,
  filePath: string,
  isOpen: boolean,
): UseBibliometricsDataReturn {
  const [dataParams, setDataParams] = useState<BibliometricsDataParams>({
    networkType: "keywords",
    minFrequency: 3,
    topN: 40,
    sliceCount: 3,
    excludeKeywords: [],
  });

  const [overview, setOverview] = useState<BibliometricOverview | null>(null);
  const [network, setNetwork] = useState<NetworkResponse | null>(null);
  const [thematic, setThematic] = useState<ThematicMapResponse | null>(null);
  const [evolution, setEvolution] = useState<ThematicEvolutionResponse | null>(
    null,
  );
  const [laws, setLaws] = useState<BibliometricLawsResponse | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cached corpus-level data (overview & laws do not change with node filters)
  const corpusCache = useRef<{
    filePath: string;
    overview: BibliometricOverview;
    laws: BibliometricLawsResponse;
  } | null>(null);

  const fetchData = useCallback(
    async (paramsToUse: BibliometricsDataParams, forceRefresh = false) => {
      if (!workspaceId || !filePath) return;
      setLoading(true);
      setError(null);

      try {
        // 1. Fetch corpus-level stats if not in cache or force refresh
        if (
          forceRefresh ||
          !corpusCache.current ||
          corpusCache.current.filePath !== filePath
        ) {
          const [ov, lw] = await Promise.all([
            fetchBibliometricsOverview(workspaceId, filePath),
            fetchBibliometricsLaws(workspaceId, filePath),
          ]);
          corpusCache.current = { filePath, overview: ov, laws: lw };
          setOverview(ov);
          setLaws(lw);
        }

        // 2. Fetch filtered visualization datasets via allSettled for resilience
        const [netSettled, tmSettled, teSettled] = await Promise.allSettled([
          fetchBibliometricsNetwork(workspaceId, {
            file_path: filePath,
            network_type: paramsToUse.networkType,
            min_frequency: paramsToUse.minFrequency,
            top_n: paramsToUse.topN,
            exclude_keywords: paramsToUse.excludeKeywords,
          }),
          fetchBibliometricsThematicMap(workspaceId, {
            file_path: filePath,
            network_type: paramsToUse.networkType,
            min_frequency: paramsToUse.minFrequency,
            top_n: paramsToUse.topN,
            exclude_keywords: paramsToUse.excludeKeywords,
          }),
          fetchBibliometricsThematicEvolution(workspaceId, {
            file_path: filePath,
            slice_count: paramsToUse.sliceCount,
            min_frequency: Math.max(2, paramsToUse.minFrequency - 1),
            exclude_keywords: paramsToUse.excludeKeywords,
          }),
        ]);

        if (netSettled.status === "fulfilled") {
          setNetwork(netSettled.value);
        } else {
          setError(
            netSettled.reason?.message ||
              "Failed to compute co-occurrence network",
          );
        }

        if (tmSettled.status === "fulfilled") {
          setThematic(tmSettled.value);
        }

        if (teSettled.status === "fulfilled") {
          setEvolution(teSettled.value);
        }
      } catch (err: any) {
        setError(err?.message || "Failed to compute bibliometric analysis");
      } finally {
        setLoading(false);
      }
    },
    [workspaceId, filePath],
  );

  // Initial load when modal opens or target file changes
  useEffect(() => {
    if (isOpen) {
      fetchData(dataParams, false);
    }
  }, [isOpen, filePath]);

  const applyDataParams = useCallback(
    async (overrideParams?: Partial<BibliometricsDataParams>) => {
      const nextParams = { ...dataParams, ...overrideParams };
      setDataParams(nextParams);
      await fetchData(nextParams, true);
    },
    [dataParams, fetchData],
  );

  const addStopword = useCallback(
    async (rawInput: string) => {
      if (!rawInput.trim()) return;
      const cleanTags = rawInput
        .split(/[,;\n]+/)
        .map((t) =>
          t
            .trim()
            .toLowerCase()
            .replace(/^[^a-z0-9]+|[^a-z0-9]+$/g, ""),
        )
        .filter((t) => t.length > 1);

      const updated = [...dataParams.excludeKeywords];
      cleanTags.forEach((tag) => {
        if (!updated.includes(tag)) {
          updated.push(tag);
        }
      });

      const nextParams = { ...dataParams, excludeKeywords: updated };
      setDataParams(nextParams);
      await fetchData(nextParams);
    },
    [dataParams, fetchData],
  );

  const removeStopword = useCallback(
    async (tagToRemove: string) => {
      const updated = dataParams.excludeKeywords.filter(
        (t) => t !== tagToRemove,
      );
      const nextParams = { ...dataParams, excludeKeywords: updated };
      setDataParams(nextParams);
      await fetchData(nextParams);
    },
    [dataParams, fetchData],
  );

  const clearStopwords = useCallback(async () => {
    const nextParams = { ...dataParams, excludeKeywords: [] };
    setDataParams(nextParams);
    await fetchData(nextParams);
  }, [dataParams, fetchData]);

  const addAcademicPresets = useCallback(async () => {
    const updated = [...dataParams.excludeKeywords];
    ACADEMIC_STOPWORDS_PRESET.forEach((tag) => {
      if (!updated.includes(tag)) {
        updated.push(tag);
      }
    });
    const nextParams = { ...dataParams, excludeKeywords: updated };
    setDataParams(nextParams);
    await fetchData(nextParams);
  }, [dataParams, fetchData]);

  return {
    dataParams,
    setDataParams,
    overview,
    network,
    thematic,
    evolution,
    laws,
    loading,
    error,
    applyDataParams,
    addStopword,
    removeStopword,
    clearStopwords,
    addAcademicPresets,
  };
}
