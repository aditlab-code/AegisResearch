import { useState, useMemo } from "react";
import { Doc, AnalysisType, AnalysisResult, TableStyle } from "../types";
import { projectService } from "../services/projects";
import { buildApiUrl } from "../services/api";

export interface UseAnalysisWorkspaceParams {
  projectName: string;
  docs: Doc[];
  activeDoc?: Doc | null;
  openDoc: (index: number) => void;
  openOrCreateDoc: (
    name: string,
    kind: "tex" | "md" | "dataset",
    content?: string,
    path?: string,
  ) => void;
  setSaveStatus: (status: string) => void;
}

export function useAnalysisWorkspace({
  projectName,
  docs,
  activeDoc,
  openDoc,
  openOrCreateDoc,
  setSaveStatus,
}: UseAnalysisWorkspaceParams) {
  const [analysisDialogOpen, setAnalysisDialogOpen] = useState(false);
  const [selectedAnalysisType, setSelectedAnalysisType] =
    useState<AnalysisType>("regression");
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(
    null,
  );
  const [resultModalOpen, setResultModalOpen] = useState(false);
  const [guideModalOpen, setGuideModalOpen] = useState(false);
  const [latexOutputModalOpen, setLatexOutputModalOpen] = useState(false);
  const [tableStyle, setTableStyle] = useState<TableStyle>("apa");
  const [datasetColumns, setDatasetColumns] = useState<string[]>([]);
  const [datasetFilePath, setDatasetFilePath] = useState<string>("");
  const [bibliometricsModalOpen, setBibliometricsModalOpen] = useState(false);

  const activeBibFilePath = useMemo(() => {
    const openBib = docs.find((d) => d.name.endsWith(".bib"));
    if (openBib) return openBib.name;
    return "references.bib";
  }, [docs]);

  const handleOpenAnalysis = async (type: AnalysisType) => {
    let targetDataset =
      activeDoc && activeDoc.kind === "dataset"
        ? activeDoc
        : docs.find((d) => d.kind === "dataset");

    // Auto-detect dataset from project files if not yet opened in editor tabs
    if (!targetDataset) {
      try {
        const files = await projectService.getProjectFiles(projectName);
        const datasetFile = files.find((f) =>
          /\.(csv|tsv|parquet|pqt)$/i.test(f.name),
        );
        if (datasetFile) {
          const targetPath = datasetFile.path || datasetFile.name;
          openOrCreateDoc(datasetFile.name, "dataset", "", targetPath);
          targetDataset = {
            name: datasetFile.name,
            path: targetPath,
            kind: "dataset",
            content: "",
          };
          setSaveStatus(`✓ Loaded dataset: ${datasetFile.name}`);
        }
      } catch {
        // ignore
      }
    }

    if (!targetDataset) {
      setSaveStatus(
        "No dataset (.csv/.tsv/.parquet) found. Open or add a dataset to run statistical analysis.",
      );
      return;
    }

    const path = targetDataset.path || targetDataset.name;
    setDatasetFilePath(path);
    setSelectedAnalysisType(type);

    try {
      const url = buildApiUrl(
        `/api/projects/${encodeURIComponent(projectName)}/dataset/schema`,
        { path },
      );
      const res = await fetch(url);
      if (res.ok) {
        const schema = await res.json();
        setDatasetColumns(schema.columns.map((c: any) => c.name));
      } else {
        setDatasetColumns([]);
      }
    } catch {
      setDatasetColumns([]);
    }

    setAnalysisDialogOpen(true);
  };

  const handleOpenDatasetDoc = () => {
    const datasetDocIndex = docs.findIndex((d) => d.kind === "dataset");
    if (datasetDocIndex !== -1) {
      openDoc(datasetDocIndex);
    }
  };

  return {
    analysisDialogOpen,
    setAnalysisDialogOpen,
    selectedAnalysisType,
    setSelectedAnalysisType,
    analysisResult,
    setAnalysisResult,
    resultModalOpen,
    setResultModalOpen,
    guideModalOpen,
    setGuideModalOpen,
    latexOutputModalOpen,
    setLatexOutputModalOpen,
    tableStyle,
    setTableStyle,
    datasetColumns,
    datasetFilePath,
    bibliometricsModalOpen,
    setBibliometricsModalOpen,
    activeBibFilePath,
    handleOpenAnalysis,
    handleOpenDatasetDoc,
  };
}
