import React from "react";
import {
  Sliders,
  BarChart3,
  CheckCircle2,
  GitCompare,
  Layers,
  Ruler,
  BarChart2,
  Tag,
} from "lucide-react";
import { AnalysisType } from "../../../types/stats";

export { validateStevensScales } from "./stevensValidation";

export interface TestMeta {
  id: AnalysisType;
  title: string;
  desc: string;
  icon: React.ComponentType<{ className?: string }>;
  defaultPlotLabel: string;
  hasPlot: boolean;
}

export const TEST_REGISTRY: Record<AnalysisType, TestMeta> = {
  regression: {
    id: "regression",
    title: "Multiple Linear Regression",
    icon: Sliders,
    desc: "Model linear relationships, evaluate coefficients, and test collinearity (VIF).",
    defaultPlotLabel: "Residuals & Q-Q Diagnostics",
    hasPlot: true,
  },
  logistic_regression: {
    id: "logistic_regression",
    title: "Binary Logistic Regression",
    icon: Sliders,
    desc: "Model binary categorical outcomes, calculate Odds Ratios exp(B), Pseudo R², and ROC-AUC classification.",
    defaultPlotLabel: "ROC Curve & AUC",
    hasPlot: true,
  },
  descriptive: {
    id: "descriptive",
    title: "Descriptive Statistics & Normality",
    icon: BarChart3,
    desc: "Calculate summary statistics (Mean, SD, Skewness, Kurtosis) & Shapiro-Wilk test.",
    defaultPlotLabel: "Distribution & Q-Q",
    hasPlot: true,
  },
  reliability: {
    id: "reliability",
    title: "Scale Reliability Analysis",
    icon: CheckCircle2,
    desc: "Evaluate internal consistency across questionnaire items (Cronbach's Alpha).",
    defaultPlotLabel: "None",
    hasPlot: false,
  },
  manova: {
    id: "manova",
    title: "Multivariate Analysis of Variance (MANOVA)",
    icon: GitCompare,
    desc: "Assess group differences across multiple continuous dependent variables simultaneously.",
    defaultPlotLabel: "Group Comparison Boxplot",
    hasPlot: true,
  },
  pca: {
    id: "pca",
    title: "Principal Component Analysis (PCA)",
    icon: Layers,
    desc: "Reduce dimensionality while preserving maximal variance in component loadings.",
    defaultPlotLabel: "None",
    hasPlot: false,
  },
  ttest_one_sample: {
    id: "ttest_one_sample",
    title: "One-Sample t-Test",
    icon: Ruler,
    desc: "Compare sample mean of a continuous variable against a standard hypothesized value.",
    defaultPlotLabel: "Distribution & Q-Q",
    hasPlot: true,
  },
  ttest_independent: {
    id: "ttest_independent",
    title: "Independent Samples t-Test",
    icon: GitCompare,
    desc: "Compare means between two independent groups (with Levene's and Welch's correction).",
    defaultPlotLabel: "Group Comparison Boxplot",
    hasPlot: true,
  },
  ttest_paired: {
    id: "ttest_paired",
    title: "Paired Samples t-Test",
    icon: GitCompare,
    desc: "Compare means between two related or repeated measures (e.g. pre-test vs. post-test).",
    defaultPlotLabel: "Paired Slopegraph",
    hasPlot: true,
  },
  anova_oneway: {
    id: "anova_oneway",
    title: "One-Way ANOVA",
    icon: BarChart3,
    desc: "Compare means across three or more groups with post-hoc Tukey HSD test.",
    defaultPlotLabel: "Group Comparison Boxplot",
    hasPlot: true,
  },
  anova_twoway: {
    id: "anova_twoway",
    title: "Two-Way Factorial ANOVA",
    icon: Layers,
    desc: "Analyze main effects of two categorical factors and their interaction effect on an outcome.",
    defaultPlotLabel: "Cell Means Interaction",
    hasPlot: true,
  },
  ancova: {
    id: "ancova",
    title: "Analysis of Covariance (ANCOVA)",
    icon: BarChart3,
    desc: "Evaluate treatment group differences on a continuous outcome while controlling for continuous covariate(s).",
    defaultPlotLabel: "Adjusted vs Unadjusted Means",
    hasPlot: true,
  },
  correlation_pearson: {
    id: "correlation_pearson",
    title: "Bivariate Pearson Correlation",
    icon: Sliders,
    desc: "Measure linear correlation coefficient (r) and significance among quantitative variables.",
    defaultPlotLabel: "Correlation Matrix Heatmap",
    hasPlot: true,
  },
  mann_whitney: {
    id: "mann_whitney",
    title: "Mann-Whitney U Test",
    icon: BarChart2,
    desc: "Non-parametric rank test comparing distributions between two independent groups.",
    defaultPlotLabel: "Group Comparison Boxplot",
    hasPlot: true,
  },
  wilcoxon: {
    id: "wilcoxon",
    title: "Wilcoxon Signed-Rank Test",
    icon: BarChart2,
    desc: "Non-parametric test for paired observations or non-normal repeated measures.",
    defaultPlotLabel: "Paired Slopegraph",
    hasPlot: true,
  },
  kruskal: {
    id: "kruskal",
    title: "Kruskal-Wallis H Test",
    icon: BarChart2,
    desc: "Non-parametric alternative to one-way ANOVA for comparing three or more independent groups.",
    defaultPlotLabel: "Group Comparison Boxplot",
    hasPlot: true,
  },
  correlation_spearman: {
    id: "correlation_spearman",
    title: "Spearman Rank Correlation",
    icon: BarChart2,
    desc: "Measure monotonic association (rho) for ranked or ordinal variables.",
    defaultPlotLabel: "Correlation Matrix Heatmap",
    hasPlot: true,
  },
  chisquare: {
    id: "chisquare",
    title: "Chi-Square Test of Independence",
    icon: Tag,
    desc: "Analyze cross-tabulation and association between two categorical variables with Cramér's V.",
    defaultPlotLabel: "Observed vs Expected Frequencies",
    hasPlot: true,
  },
};

export function getTestMeta(type: AnalysisType): TestMeta {
  return (
    TEST_REGISTRY[type] || {
      id: type,
      title: "Statistical Analysis",
      desc: "Perform statistical computation.",
      icon: BarChart3,
      defaultPlotLabel: "Diagnostic Visualization",
      hasPlot: true,
    }
  );
}
