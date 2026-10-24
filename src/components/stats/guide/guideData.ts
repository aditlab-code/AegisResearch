import { AnalysisType, MeasurementScale } from "../../../types/stats";

export type GuideTab = "wizard" | "matrix" | "workflow";

export type WizardPurpose =
  | "comparison"
  | "correlation"
  | "prediction"
  | "instrument"
  | "reduction"
  | "exploration";

export type WizardGroupDesign =
  | "1_sample"
  | "2_indep"
  | "2_paired"
  | "3_plus_indep"
  | "2_factors"
  | "ancova_covar";

export interface MatrixEntry {
  scale: MeasurementScale;
  purpose: string;
  groups: string;
  design: string;
  normalTest: { title: string; type: AnalysisType };
  nonParamAlt?: { title: string; type: AnalysisType };
  note: string;
}

export interface RecommendationResult {
  primary: { title: string; type: AnalysisType };
  alternative: { title: string; type: AnalysisType } | null;
  rationale: string;
  assumptions: string[];
}

export interface WorkflowStepItem {
  id: number;
  tag: string;
  tagColorClass: string;
  iconName: "check" | "chart" | "compare" | "play";
  title: string;
  description: string;
  criteriaTitle: string;
  criteria: { text: string; colorClass: string }[];
  footnote?: string;
  actionLabel: string;
  actionType?: AnalysisType;
  actionTargetTab?: GuideTab;
}

export const MATRIX_DATA: MatrixEntry[] = [
  {
    scale: "nominal",
    purpose: "2-Category Independence / Association Test",
    groups: "2 Categories",
    design: "Independent",
    normalTest: { title: "Chi-Square Test", type: "chisquare" },
    note: "Tests nominal variable associations with Cramér's V.",
  },
  {
    scale: "nominal",
    purpose: "Multi-Category Frequency Comparison",
    groups: "3+ Categories",
    design: "Independent",
    normalTest: { title: "Chi-Square Test", type: "chisquare" },
    note: "R x C contingency table comparing observed vs expected frequencies.",
  },
  {
    scale: "ordinal",
    purpose: "2 Independent Groups Comparison",
    groups: "2 Groups",
    design: "Independent",
    normalTest: { title: "Mann-Whitney U Test", type: "mann_whitney" },
    note: "Non-parametric alternative to independent t-test for comparing median ranks.",
  },
  {
    scale: "ordinal",
    purpose: "2 Paired / Repeated Conditions Comparison",
    groups: "2 Conditions",
    design: "Paired (Pre-Post)",
    normalTest: { title: "Wilcoxon Signed-Rank", type: "wilcoxon" },
    note: "Non-parametric alternative to paired t-test for repeated Likert or ranked scores.",
  },
  {
    scale: "ordinal",
    purpose: "3+ Independent Groups Comparison",
    groups: "3+ Groups",
    design: "Independent",
    normalTest: { title: "Kruskal-Wallis H Test", type: "kruskal" },
    note: "Non-parametric alternative to One-Way ANOVA for comparing median ranks.",
  },
  {
    scale: "ordinal",
    purpose: "Correlation & Monotonic Association",
    groups: "Bivariate",
    design: "Independent / Paired",
    normalTest: {
      title: "Spearman Rank Correlation",
      type: "correlation_spearman",
    },
    note: "Spearman's rank correlation coefficient rho for ranked or non-normal data.",
  },
  {
    scale: "scale",
    purpose: "Single Sample Mean Test",
    groups: "1 Sample",
    design: "Compared to benchmark",
    normalTest: { title: "One-Sample t-Test", type: "ttest_one_sample" },
    nonParamAlt: { title: "Wilcoxon Signed-Rank", type: "wilcoxon" },
    note: "Compares a continuous sample mean against a hypothesized population benchmark.",
  },
  {
    scale: "scale",
    purpose: "2 Independent Groups Comparison",
    groups: "2 Groups",
    design: "Independent",
    normalTest: {
      title: "Independent Samples t-Test",
      type: "ttest_independent",
    },
    nonParamAlt: { title: "Mann-Whitney U Test", type: "mann_whitney" },
    note: "Compares means of two independent groups (includes Levene & Welch tests).",
  },
  {
    scale: "scale",
    purpose: "2 Paired / Repeated Conditions Comparison",
    groups: "2 Conditions",
    design: "Paired (Pre-Post)",
    normalTest: { title: "Paired Samples t-Test", type: "ttest_paired" },
    nonParamAlt: { title: "Wilcoxon Signed-Rank", type: "wilcoxon" },
    note: "Compares mean difference scores between repeated measures (pre vs post).",
  },
  {
    scale: "scale",
    purpose: "3+ Independent Groups Comparison",
    groups: "3+ Groups",
    design: "Independent",
    normalTest: { title: "One-Way ANOVA", type: "anova_oneway" },
    nonParamAlt: { title: "Kruskal-Wallis H Test", type: "kruskal" },
    note: "Analysis of variance with post-hoc Tukey HSD pairwise contrasts.",
  },
  {
    scale: "scale",
    purpose: "2-Factor & Interaction Analysis",
    groups: "2 Factors",
    design: "Factorial",
    normalTest: { title: "Two-Way Factorial ANOVA", type: "anova_twoway" },
    note: "Tests main effects and interaction effects between two categorical factors.",
  },
  {
    scale: "scale",
    purpose: "Factor Analysis with Continuous Covariate",
    groups: "≥ 2 Groups + Covariate",
    design: "Between Subjects + Covariate",
    normalTest: { title: "Analysis of Covariance (ANCOVA)", type: "ancova" },
    note: "Tests group differences while controlling for continuous covariate(s) via Type II SS.",
  },
  {
    scale: "scale",
    purpose: "Bivariate Linear Correlation",
    groups: "Bivariate",
    design: "Continuous",
    normalTest: { title: "Pearson Correlation", type: "correlation_pearson" },
    nonParamAlt: {
      title: "Spearman Rank Correlation",
      type: "correlation_spearman",
    },
    note: "Measures linear association strength (r) between two continuous variables.",
  },
  {
    scale: "scale",
    purpose: "Outcome Prediction (Y)",
    groups: "1+ Predictors",
    design: "Linear Regression",
    normalTest: { title: "Multiple Linear Regression", type: "regression" },
    note: "OLS regression model with multicollinearity diagnostics (VIF).",
  },
  {
    scale: "scale",
    purpose: "Multivariate Comparison (2+ Y)",
    groups: "1 Factor, 2+ Y",
    design: "Multivariate",
    normalTest: { title: "MANOVA", type: "manova" },
    note: "Tests group differences across multiple continuous dependent variables simultaneously.",
  },
];

export const WORKFLOW_STEPS: WorkflowStepItem[] = [
  {
    id: 1,
    tag: "Step 1: Instrument Quality",
    tagColorClass: "text-cyan-600 dark:text-cyan-400",
    iconName: "check",
    title: "Instrument Validity & Reliability Testing",
    description:
      "Measures whether questionnaire items reliably and consistently evaluate the intended latent construct over time.",
    criteriaTitle: "Decision Criteria (Cronbach's Alpha):",
    criteria: [
      {
        text: "• Alpha >= 0.70 : Excellent / Reliable (Publication Standard)",
        colorClass: "text-emerald-600 dark:text-emerald-400 font-medium",
      },
      {
        text: "• 0.60 <= Alpha < 0.70 : Acceptable / Moderate",
        colorClass: "text-amber-600 dark:text-amber-400",
      },
      {
        text: "• Alpha < 0.60 : Questionable / Inconsistent (Revise or remove poor items)",
        colorClass: "text-red-500",
      },
    ],
    actionLabel: "Run Reliability Analysis",
    actionType: "reliability",
  },
  {
    id: 2,
    tag: "Step 2: Distribution Diagnostics",
    tagColorClass: "text-emerald-600 dark:text-emerald-400",
    iconName: "chart",
    title: "Normality Assumption Testing",
    description:
      "Evaluates whether sample observations follow a normal bell-shaped distribution curve.",
    criteriaTitle: "Decision Criteria (Significance p-value):",
    criteria: [
      {
        text: "• p-value > 0.05 : Normal Distribution (Proceed to Parametric Tests)",
        colorClass: "text-emerald-600 dark:text-emerald-400 font-medium",
      },
      {
        text: "• p-value < 0.05 : Non-Normal Distribution (Switch to Non-Parametric Tests)",
        colorClass: "text-red-500 font-medium",
      },
    ],
    footnote:
      "Methods: Shapiro-Wilk (N < 100) or Kolmogorov-Smirnov (N >= 100).",
    actionLabel: "Check Normality (Descriptives)",
    actionType: "descriptive",
  },
  {
    id: 3,
    tag: "Step 3: Variance Diagnostics",
    tagColorClass: "text-indigo-600 dark:text-indigo-400",
    iconName: "compare",
    title: "Homogeneity of Variances (Levene's Test)",
    description:
      "Essential diagnostic prerequisite before running between-group comparisons (Independent t-Test or ANOVA).",
    criteriaTitle: "Decision Criteria (Levene's p-value):",
    criteria: [
      {
        text: "• p-value >= 0.05 : Homogeneous Variances (Equal variances assumed)",
        colorClass: "text-emerald-600 dark:text-emerald-400 font-medium",
      },
      {
        text: "• p-value < 0.05 : Heterogeneous Variances (Consult Welch's t-test row!)",
        colorClass: "text-amber-600 dark:text-amber-400 font-medium",
      },
    ],
    footnote:
      "AegisResearch automatically computes Student's t and Welch's t simultaneously.",
    actionLabel: "Run Independent t-Test (Includes Levene)",
    actionType: "ttest_independent",
  },
  {
    id: 4,
    tag: "Step 4: Hypothesis Testing",
    tagColorClass: "text-purple-600 dark:text-purple-400",
    iconName: "play",
    title: "Hypothesis Testing & Empirical Significance",
    description:
      "Addresses core research questions and hypotheses using the appropriate parametric or non-parametric test.",
    criteriaTitle: "Testing Track Selection:",
    criteria: [
      {
        text: "• Normal & Homogeneous Requirements Met: Parametric Tests (t-Test, ANOVA, ANCOVA, Regression, Pearson).",
        colorClass: "text-indigo-600 dark:text-indigo-400",
      },
      {
        text: "• Normality Violated / Ordinal Scale: Non-Parametric Tests (Mann-Whitney, Wilcoxon, Kruskal-Wallis, Spearman).",
        colorClass: "text-emerald-600 dark:text-emerald-400",
      },
    ],
    actionLabel: "View Decision Matrix",
    actionTargetTab: "matrix",
  },
];
