export type AnalysisType =
  | "descriptive"
  | "reliability"
  | "regression"
  | "logistic_regression"
  | "manova"
  | "pca"
  | "ttest_one_sample"
  | "ttest_independent"
  | "ttest_paired"
  | "anova_oneway"
  | "anova_twoway"
  | "ancova"
  | "correlation_pearson"
  | "mann_whitney"
  | "wilcoxon"
  | "kruskal"
  | "correlation_spearman"
  | "chisquare";

export type MeasurementScale = "nominal" | "ordinal" | "scale";
export type TableStyle = "apa" | "ieee" | "classic";

export interface VariableMeta {
  name: string;
  type?: string;
  scale: MeasurementScale;
}

export interface StatsBaseRequest {
  file_path: string;
  include_plot?: boolean;
  plot_type?: string;
}

export interface DescriptiveRequest extends StatsBaseRequest {
  variables: string[];
  include_normality?: boolean;
  missing_strategy?: "listwise" | "pairwise";
}

export interface FrequencyEntry {
  value: string | number;
  count: number;
  percentage: number;
}

export interface VariableCompletenessAudit {
  n_total: number;
  n_valid: number;
  n_missing: number;
  missing_pct: number;
}

export interface DescriptiveVariableResult {
  variable: string;
  scale?: MeasurementScale;
  n: number;
  n_total?: number;
  n_valid?: number;
  n_missing?: number;
  missing_pct?: number;
  mean?: number | null;
  variance?: number | null;
  std?: number | null;
  median?: number | null;
  min?: number | null;
  max?: number | null;
  iqr?: number | null;
  coeff_variation?: number | null;
  skewness?: number | null;
  kurtosis?: number | null;
  shapiro_w?: number | null;
  shapiro_p?: number | null;
  mode?: string | number | null;
  frequencies?: FrequencyEntry[] | null;
}

export interface DescriptiveResponse {
  analysis_type: "descriptive";
  results: DescriptiveVariableResult[];
  latex_table: string;
  latex_tables?: Record<string, string>;
}

export interface ReliabilityRequest extends StatsBaseRequest {
  items: string[];
}

export interface ItemReliabilityStat {
  item: string;
  mean: number;
  std: number;
  corrected_item_total_corr: number;
  alpha_if_deleted: number;
}

export interface ReliabilityResponse {
  analysis_type: "reliability";
  cronbach_alpha: number;
  items_count: number;
  sample_size: number;
  item_stats: ItemReliabilityStat[];
  latex_table: string;
  latex_tables?: Record<string, string>;
}

export interface RegressionRequest extends StatsBaseRequest {
  dependent: string;
  independents: string[];
  check_vif?: boolean;
  check_durbin_watson?: boolean;
  baseline_independents?: string[];
  missing_strategy?: "listwise" | "pairwise";
}

export interface RegressionCoeff {
  variable: string;
  b: number;
  std_err: number;
  beta: number;
  t: number;
  p_value: number;
  vif?: number | null;
  tolerance?: number | null;
}

export interface CollinearityDiagnostic {
  dimension: number;
  eigenvalue: number;
  condition_index: number;
}

export interface FChangeResult {
  r2_change: number;
  f_change: number;
  df1: number;
  df2: number;
  p_change: number;
}

export interface RegressionResponse {
  analysis_type: "regression";
  dependent: string;
  sample_size?: number;
  sample_audit?: Record<string, VariableCompletenessAudit>;
  r: number;
  r_squared: number;
  adj_r_squared: number;
  f_statistic: number;
  f_p_value: number;
  durbin_watson?: number | null;
  coefficients: RegressionCoeff[];
  collinearity_diagnostics?: CollinearityDiagnostic[];
  f_change?: FChangeResult | null;
  latex_table: string;
  latex_tables?: Record<string, string>;
}

export interface LogisticRegressionRequest extends StatsBaseRequest {
  dependent: string;
  independents: string[];
  cutoff?: number;
  missing_strategy?: "listwise" | "pairwise";
}

export interface LogisticCoeff {
  variable: string;
  b: number;
  std_err: number;
  wald: number;
  df: number;
  p_value: number;
  odds_ratio: number;
  or_ci_lower: number;
  or_ci_upper: number;
}

export interface LogisticRegressionResponse {
  analysis_type: "logistic_regression";
  dependent: string;
  independents: string[];
  sample_size: number;
  sample_audit?: Record<string, VariableCompletenessAudit>;
  reference_category: string;
  event_category: string;
  cutoff: number;
  log_likelihood: number;
  null_log_likelihood: number;
  deviance: number;
  aic: number;
  bic: number;
  model_chi2: number;
  model_chi2_df: number;
  model_chi2_p: number;
  pseudo_r2: {
    mcfadden: number;
    cox_snell: number;
    nagelkerke: number;
  };
  coefficients: LogisticCoeff[];
  classification: {
    cutoff: number;
    tp: number;
    tn: number;
    fp: number;
    fn: number;
    accuracy: number;
    sensitivity: number;
    specificity: number;
    precision: number;
    f1_score: number;
    auc: number;
  };
  roc_curve: {
    threshold: number;
    fpr: number;
    tpr: number;
  }[];
  residuals_summary?: {
    deviance: { min: number; max: number; mean: number; std: number };
    pearson: { min: number; max: number; mean: number; std: number };
  };
  latex_table: string;
  latex_tables?: Record<string, string>;
}

export interface ManovaRequest extends StatsBaseRequest {
  dependents: string[];
  factor: string;
}

export interface ManovaTestResult {
  test_name: string;
  value: number;
  f_stat: number;
  num_df: number;
  den_df: number;
  p_value: number;
}

export interface ManovaGroupDescriptive {
  group: string;
  n: number;
  variables: Record<string, { mean: number; std: number }>;
}

export interface BoxMResult {
  m_stat: number;
  chi2: number;
  df: number;
  p_value: number;
  assumption_met: boolean;
}

export interface ManovaResponse {
  analysis_type: "manova";
  factor: string;
  dependents: string[];
  sample_size: number;
  tests: ManovaTestResult[];
  group_descriptives?: ManovaGroupDescriptive[];
  box_m?: BoxMResult | null;
  latex_table: string;
  latex_tables?: Record<string, string>;
}

export interface PcaRequest extends StatsBaseRequest {
  variables: string[];
  n_components?: number;
}

export interface PcaLoading {
  variable: string;
  components: number[];
}

export interface PcaResponse {
  analysis_type: "pca";
  n_components: number;
  explained_variance_ratio: number[];
  eigenvalues: number[];
  loadings: PcaLoading[];
  kmo?: number | null;
  bartlett_p?: number | null;
  latex_table: string;
  latex_tables?: Record<string, string>;
}

// Parametric Interfaces
export interface ComparativeTestResult {
  test_name: string;
  statistic: number;
  df?: number | null;
  p_value: number;
  mean_diff?: number | null;
  effect_size_name?: string | null;
  effect_size?: number | null;
}

export interface TTestOneSampleRequest extends StatsBaseRequest {
  variable: string;
  test_value?: number;
  alternative?: "two-sided" | "greater" | "less";
  missing_strategy?: "pairwise" | "listwise";
}

export interface TTestOneSampleResponse {
  analysis_type: "ttest_one_sample";
  variable: string;
  test_value: number;
  alternative?: string;
  n: number;
  mean: number;
  std: number;
  mean_diff: number;
  t_statistic: number;
  df: number;
  p_value: number;
  ci_95_lower?: number;
  ci_95_upper?: number;
  cohen_d?: number;
  residuals_normality?: {
    w: number;
    p: number;
  } | null;
  comparative_tests?: ComparativeTestResult[];
  latex_table: string;
  latex_tables?: Record<string, string>;
}

export interface TTestIndependentRequest extends StatsBaseRequest {
  test_variable: string;
  group_variable: string;
  alternative?: "two-sided" | "greater" | "less";
  missing_strategy?: "pairwise" | "listwise";
}

export interface GroupSummary {
  name: string;
  n: number;
  mean: number;
  std: number;
  median?: number;
}

export interface TTestIndependentResponse {
  analysis_type: "ttest_independent";
  test_variable: string;
  group_variable: string;
  alternative?: string;
  group1: GroupSummary;
  group2: GroupSummary;
  levene_f: number;
  levene_p: number;
  residuals_normality?: {
    w: number;
    p: number;
  } | null;
  equal_var: {
    t_statistic: number;
    df: number;
    p_value: number;
    mean_diff: number;
    cohen_d: number;
  };
  welch_var: {
    t_statistic: number;
    df: number;
    p_value: number;
    mean_diff: number;
    cohen_d: number;
  };
  comparative_tests?: ComparativeTestResult[];
  latex_table: string;
  latex_tables?: Record<string, string>;
}

export interface TTestPairedRequest extends StatsBaseRequest {
  var1: string;
  var2: string;
  alternative?: "two-sided" | "greater" | "less";
  missing_strategy?: "pairwise" | "listwise";
}

export interface TTestPairedResponse {
  analysis_type: "ttest_paired";
  var1: string;
  var2: string;
  alternative?: string;
  n: number;
  mean1: number;
  std1: number;
  mean2: number;
  std2: number;
  mean_diff: number;
  std_diff: number;
  correlation: number;
  corr_p_value: number;
  t_statistic: number;
  df: number;
  p_value: number;
  cohen_d?: number;
  residuals_normality?: {
    w: number;
    p: number;
  } | null;
  comparative_tests?: ComparativeTestResult[];
  latex_table: string;
  latex_tables?: Record<string, string>;
}

export interface AnovaOneWayRequest extends StatsBaseRequest {
  dependent: string;
  factor: string;
  post_hoc?: boolean;
}

export interface AnovaOneWayGroup {
  group: string;
  n: number;
  mean: number;
  std: number;
}

export interface TukeyResult {
  group1: string;
  group2: string;
  mean_diff: number;
  p_value: number;
  reject: boolean;
}

export interface AnovaOneWayResponse {
  analysis_type: "anova_oneway";
  dependent: string;
  factor: string;
  total_n: number;
  k_groups: number;
  ss_between: number;
  df_between: number;
  ms_between: number;
  f_statistic: number;
  p_value: number;
  eta_squared: number;
  residuals_normality?: {
    w: number;
    p: number;
  } | null;
  levene_test?: {
    statistic: number;
    p_value: number;
    assumption_met: boolean;
  } | null;
  ss_within: number;
  df_within: number;
  ms_within: number;
  ss_total: number;
  df_total: number;
  groups: AnovaOneWayGroup[];
  post_hoc_tukey?: TukeyResult[];
  latex_table: string;
  latex_tables?: Record<string, string>;
}

export interface AnovaTwoWayRequest extends StatsBaseRequest {
  dependent: string;
  factor1: string;
  factor2: string;
}

export interface AnovaTwoWayEffect {
  source: string;
  sum_sq: number;
  df: number;
  mean_sq: number;
  f_stat: number | null;
  p_value: number | null;
  partial_eta_squared?: number | null;
}

export interface AnovaTwoWayResponse {
  analysis_type: "anova_twoway";
  dependent: string;
  factor1: string;
  factor2: string;
  sample_size: number;
  effects: AnovaTwoWayEffect[];
  residuals_normality?: {
    w: number;
    p: number;
  } | null;
  levene_test?: {
    statistic: number;
    p_value: number;
    assumption_met: boolean;
  } | null;
  latex_table: string;
  latex_tables?: Record<string, string>;
}

export interface AncovaRequest extends StatsBaseRequest {
  dependent: string;
  factor: string;
  covariates: string[];
}

export interface AncovaEffect {
  source: string;
  sum_sq: number;
  df: number;
  mean_sq: number;
  f_statistic: number | null;
  p_value: number | null;
  partial_eta_squared: number | null;
}

export interface AncovaAdjustedMean {
  group: string;
  n: number;
  raw_mean: number;
  adjusted_mean: number;
}

export interface AncovaResponse {
  analysis_type: "ancova";
  dependent: string;
  factor: string;
  covariates: string[];
  total_n: number;
  effects: AncovaEffect[];
  adjusted_means: AncovaAdjustedMean[];
  residuals_normality?: {
    w: number;
    p: number;
  } | null;
  homogeneity_of_slopes?: {
    interaction: string;
    f_statistic: number;
    p_value: number;
    assumption_met: boolean;
  } | null;
  latex_table: string;
  latex_tables?: Record<string, string>;
}

export interface CorrelationRequest extends StatsBaseRequest {
  variables: string[];
}

export interface CorrelationCell {
  r?: number;
  rho?: number;
  p_value: number;
  n: number;
}

export interface CorrelationRow {
  variable: string;
  correlations: CorrelationCell[];
}

export interface CorrelationResponse {
  analysis_type: "correlation_pearson" | "correlation_spearman";
  variables: string[];
  sample_size: number;
  matrix: CorrelationRow[];
  latex_table: string;
  latex_tables?: Record<string, string>;
}

// Non-Parametric Interfaces
export interface MannWhitneyRequest extends StatsBaseRequest {
  test_variable: string;
  group_variable: string;
}

export interface MannWhitneyGroup {
  name: string;
  n: number;
  median: number;
  mean_rank: number;
  sum_ranks: number;
}

export interface MannWhitneyResponse {
  analysis_type: "mann_whitney_u";
  test_variable: string;
  group_variable: string;
  group1: MannWhitneyGroup;
  group2: MannWhitneyGroup;
  u_statistic: number;
  w_statistic: number;
  z_score: number;
  p_value: number;
  latex_table: string;
  latex_tables?: Record<string, string>;
}

export interface WilcoxonSignedRankRequest extends StatsBaseRequest {
  var1: string;
  var2: string;
}

export interface WilcoxonSignedRankResponse {
  analysis_type: "wilcoxon_signed_rank";
  var1: string;
  var2: string;
  n_total: number;
  n_effective: number;
  positive_pairs: number;
  negative_pairs: number;
  median1: number;
  median2: number;
  w_statistic: number;
  z_score: number;
  p_value: number;
  latex_table: string;
  latex_tables?: Record<string, string>;
}

export interface KruskalWallisRequest extends StatsBaseRequest {
  test_variable: string;
  group_variable: string;
}

export interface KruskalGroup {
  group: string;
  n: number;
  median: number;
  mean_rank: number;
}

export interface KruskalWallisResponse {
  analysis_type: "kruskal_wallis";
  test_variable: string;
  group_variable: string;
  sample_size: number;
  k_groups: number;
  h_statistic: number;
  df: number;
  p_value: number;
  groups: KruskalGroup[];
  latex_table: string;
  latex_tables?: Record<string, string>;
}

export interface ChiSquareIndependenceRequest extends StatsBaseRequest {
  row_variable: string;
  col_variable: string;
}

export interface CrosstabCell {
  col: string;
  observed: number;
  expected: number;
}

export interface CrosstabRow {
  row: string;
  cells: CrosstabCell[];
  total: number;
}

export interface ChiSquareIndependenceResponse {
  analysis_type: "chisquare_independence";
  row_variable: string;
  col_variable: string;
  sample_size: number;
  chi2_statistic: number;
  df: number;
  p_value: number;
  cramers_v: number;
  row_labels: string[];
  col_labels: string[];
  crosstab: CrosstabRow[];
  latex_table: string;
  latex_tables?: Record<string, string>;
}

export interface DiagnosticPlotResult {
  plot_type: string;
  image_path: string;
  image_data_url?: string;
  absolute_path?: string;
  latex_snippet: string;
  caption: string;
  label: string;
  variable?: string;
  dependent?: string;
  factor?: string;
  auc?: number;
  [key: string]: any;
}

export interface StandardizedPlotRequest {
  file_path: string;
  plot_type: string;
  dependent?: string;
  factor?: string;
  factor2?: string;
  independents?: string[];
  variables?: string[];
  covariates?: string[];
  var1?: string;
  var2?: string;
  test_value?: number;
  alternative?: string;
  cutoff?: number;
}

export type AnalysisResult = (
  | DescriptiveResponse
  | ReliabilityResponse
  | RegressionResponse
  | LogisticRegressionResponse
  | ManovaResponse
  | PcaResponse
  | TTestOneSampleResponse
  | TTestIndependentResponse
  | TTestPairedResponse
  | AnovaOneWayResponse
  | AnovaTwoWayResponse
  | AncovaResponse
  | CorrelationResponse
  | MannWhitneyResponse
  | WilcoxonSignedRankResponse
  | KruskalWallisResponse
  | ChiSquareIndependenceResponse
) & {
  plot?: DiagnosticPlotResult;
  plot_error?: string;
};
