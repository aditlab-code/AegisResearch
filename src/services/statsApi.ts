import { buildApiUrl } from "./api";
import {
  DescriptiveRequest,
  DescriptiveResponse,
  ReliabilityRequest,
  ReliabilityResponse,
  RegressionRequest,
  RegressionResponse,
  ManovaRequest,
  ManovaResponse,
  PcaRequest,
  PcaResponse,
  TTestOneSampleRequest,
  TTestOneSampleResponse,
  TTestIndependentRequest,
  TTestIndependentResponse,
  TTestPairedRequest,
  TTestPairedResponse,
  AnovaOneWayRequest,
  AnovaOneWayResponse,
  AnovaTwoWayRequest,
  AnovaTwoWayResponse,
  CorrelationRequest,
  CorrelationResponse,
  MannWhitneyRequest,
  MannWhitneyResponse,
  WilcoxonSignedRankRequest,
  WilcoxonSignedRankResponse,
  KruskalWallisRequest,
  KruskalWallisResponse,
  ChiSquareIndependenceRequest,
  ChiSquareIndependenceResponse,
} from "../types/stats";

async function postJson<TReq, TRes>(url: string, payload: TReq): Promise<TRes> {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    let errorDetail = "Statistical analysis failed";
    try {
      const errJson = await response.json();
      errorDetail = errJson.detail || errorDetail;
    } catch {
      // fallback to statusText
      errorDetail = response.statusText || errorDetail;
    }
    throw new Error(errorDetail);
  }

  return response.json();
}

export const statsApi = {
  runDescriptive: (projectName: string, req: DescriptiveRequest) => {
    const url = buildApiUrl(
      `/api/projects/${encodeURIComponent(projectName)}/stats/descriptive`,
    );
    return postJson<DescriptiveRequest, DescriptiveResponse>(url, req);
  },

  runReliability: (projectName: string, req: ReliabilityRequest) => {
    const url = buildApiUrl(
      `/api/projects/${encodeURIComponent(projectName)}/stats/reliability`,
    );
    return postJson<ReliabilityRequest, ReliabilityResponse>(url, req);
  },

  runRegression: (projectName: string, req: RegressionRequest) => {
    const url = buildApiUrl(
      `/api/projects/${encodeURIComponent(projectName)}/stats/regression`,
    );
    return postJson<RegressionRequest, RegressionResponse>(url, req);
  },

  runManova: (projectName: string, req: ManovaRequest) => {
    const url = buildApiUrl(
      `/api/projects/${encodeURIComponent(projectName)}/stats/manova`,
    );
    return postJson<ManovaRequest, ManovaResponse>(url, req);
  },

  runPca: (projectName: string, req: PcaRequest) => {
    const url = buildApiUrl(
      `/api/projects/${encodeURIComponent(projectName)}/stats/pca`,
    );
    return postJson<PcaRequest, PcaResponse>(url, req);
  },

  // Parametric Tests
  runTTestOneSample: (projectName: string, req: TTestOneSampleRequest) => {
    const url = buildApiUrl(
      `/api/projects/${encodeURIComponent(projectName)}/stats/ttest/one-sample`,
    );
    return postJson<TTestOneSampleRequest, TTestOneSampleResponse>(url, req);
  },

  runTTestIndependent: (projectName: string, req: TTestIndependentRequest) => {
    const url = buildApiUrl(
      `/api/projects/${encodeURIComponent(projectName)}/stats/ttest/independent`,
    );
    return postJson<TTestIndependentRequest, TTestIndependentResponse>(
      url,
      req,
    );
  },

  runTTestPaired: (projectName: string, req: TTestPairedRequest) => {
    const url = buildApiUrl(
      `/api/projects/${encodeURIComponent(projectName)}/stats/ttest/paired`,
    );
    return postJson<TTestPairedRequest, TTestPairedResponse>(url, req);
  },

  runAnovaOneWay: (projectName: string, req: AnovaOneWayRequest) => {
    const url = buildApiUrl(
      `/api/projects/${encodeURIComponent(projectName)}/stats/anova/oneway`,
    );
    return postJson<AnovaOneWayRequest, AnovaOneWayResponse>(url, req);
  },

  runAnovaTwoWay: (projectName: string, req: AnovaTwoWayRequest) => {
    const url = buildApiUrl(
      `/api/projects/${encodeURIComponent(projectName)}/stats/anova/twoway`,
    );
    return postJson<AnovaTwoWayRequest, AnovaTwoWayResponse>(url, req);
  },

  runCorrelationPearson: (projectName: string, req: CorrelationRequest) => {
    const url = buildApiUrl(
      `/api/projects/${encodeURIComponent(projectName)}/stats/correlation/pearson`,
    );
    return postJson<CorrelationRequest, CorrelationResponse>(url, req);
  },

  // Non-Parametric Tests
  runMannWhitney: (projectName: string, req: MannWhitneyRequest) => {
    const url = buildApiUrl(
      `/api/projects/${encodeURIComponent(projectName)}/stats/nonparametric/mann-whitney`,
    );
    return postJson<MannWhitneyRequest, MannWhitneyResponse>(url, req);
  },

  runWilcoxon: (projectName: string, req: WilcoxonSignedRankRequest) => {
    const url = buildApiUrl(
      `/api/projects/${encodeURIComponent(projectName)}/stats/nonparametric/wilcoxon`,
    );
    return postJson<WilcoxonSignedRankRequest, WilcoxonSignedRankResponse>(
      url,
      req,
    );
  },

  runKruskal: (projectName: string, req: KruskalWallisRequest) => {
    const url = buildApiUrl(
      `/api/projects/${encodeURIComponent(projectName)}/stats/nonparametric/kruskal`,
    );
    return postJson<KruskalWallisRequest, KruskalWallisResponse>(url, req);
  },

  runCorrelationSpearman: (projectName: string, req: CorrelationRequest) => {
    const url = buildApiUrl(
      `/api/projects/${encodeURIComponent(projectName)}/stats/nonparametric/spearman`,
    );
    return postJson<CorrelationRequest, CorrelationResponse>(url, req);
  },

  runChiSquare: (projectName: string, req: ChiSquareIndependenceRequest) => {
    const url = buildApiUrl(
      `/api/projects/${encodeURIComponent(projectName)}/stats/chisquare`,
    );
    return postJson<
      ChiSquareIndependenceRequest,
      ChiSquareIndependenceResponse
    >(url, req);
  },
};
