import { buildApiUrl } from "./api";
import {
  BibliometricOverview,
  NetworkResponse,
  ThematicMapResponse,
  ThematicEvolutionResponse,
  BibliometricLawsResponse,
} from "../types/bibliometrics";

async function postJson<TReq, TRes>(url: string, payload: TReq): Promise<TRes> {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    let errorDetail = "Bibliometric analysis failed";
    try {
      const errJson = await response.json();
      errorDetail = errJson.detail || errorDetail;
    } catch {
      errorDetail = response.statusText || errorDetail;
    }
    throw new Error(errorDetail);
  }

  return response.json();
}

export async function fetchBibliometricsOverview(
  workspaceId: string,
  filePath: string,
): Promise<BibliometricOverview> {
  const url = buildApiUrl(
    `/api/projects/${encodeURIComponent(workspaceId)}/bibliometrics/overview`,
  );
  return postJson<{ file_path: string }, BibliometricOverview>(url, {
    file_path: filePath,
  });
}

export async function fetchBibliometricsNetwork(
  workspaceId: string,
  payload: {
    file_path: string;
    network_type?: string;
    min_frequency?: number;
    top_n?: number;
    exclude_keywords?: string[];
    method?: string;
  },
): Promise<NetworkResponse> {
  const url = buildApiUrl(
    `/api/projects/${encodeURIComponent(workspaceId)}/bibliometrics/network`,
  );
  return postJson(url, payload);
}

export async function fetchBibliometricsThematicMap(
  workspaceId: string,
  payload: {
    file_path: string;
    network_type?: string;
    min_frequency?: number;
    top_n?: number;
    exclude_keywords?: string[];
  },
): Promise<ThematicMapResponse> {
  const url = buildApiUrl(
    `/api/projects/${encodeURIComponent(workspaceId)}/bibliometrics/thematic-map`,
  );
  return postJson(url, payload);
}

export async function fetchBibliometricsThematicEvolution(
  workspaceId: string,
  payload: {
    file_path: string;
    slice_count?: number;
    min_frequency?: number;
    exclude_keywords?: string[];
  },
): Promise<ThematicEvolutionResponse> {
  const url = buildApiUrl(
    `/api/projects/${encodeURIComponent(workspaceId)}/bibliometrics/thematic-evolution`,
  );
  return postJson(url, payload);
}

export async function fetchBibliometricsLaws(
  workspaceId: string,
  filePath: string,
): Promise<BibliometricLawsResponse> {
  const url = buildApiUrl(
    `/api/projects/${encodeURIComponent(workspaceId)}/bibliometrics/laws`,
  );
  return postJson<{ file_path: string }, BibliometricLawsResponse>(url, {
    file_path: filePath,
  });
}

export async function exportBibliometricsTikz(
  workspaceId: string,
  graphType: string,
  data: any,
): Promise<{ tikz_code: string }> {
  const url = buildApiUrl(
    `/api/projects/${encodeURIComponent(workspaceId)}/bibliometrics/export-tikz`,
  );
  return postJson(url, { graph_type: graphType, data });
}
