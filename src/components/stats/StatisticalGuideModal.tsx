import React, { useState, useMemo } from "react";
import {
  X,
  Compass,
  Table,
  Workflow,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Play,
  Ruler,
  BarChart2,
  Tag,
  Sliders,
  Split,
  Layers,
  HelpCircle,
  BarChart3,
  GitCompare,
  Network,
  ArrowRightLeft,
} from "lucide-react";
import { AnalysisType, MeasurementScale } from "../../types/stats";
import { getScaleMeta } from "../../utils/measurementScale";

export interface StatisticalGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectAnalysis: (type: AnalysisType) => void;
}

type GuideTab = "wizard" | "matrix" | "workflow";

interface MatrixEntry {
  scale: MeasurementScale;
  purpose: string;
  groups: string;
  design: string;
  normalTest: { title: string; type: AnalysisType };
  nonParamAlt?: { title: string; type: AnalysisType };
  note: string;
}

export const StatisticalGuideModal: React.FC<StatisticalGuideModalProps> = ({
  isOpen,
  onClose,
  onSelectAnalysis,
}) => {
  const [activeTab, setActiveTab] = useState<GuideTab>("wizard");

  // Wizard State
  const [purpose, setPurpose] = useState<
    | "comparison"
    | "correlation"
    | "prediction"
    | "instrument"
    | "reduction"
    | "exploration"
  >("comparison");
  const [scale, setScale] = useState<MeasurementScale>("scale");
  const [groupDesign, setGroupDesign] = useState<
    "1_sample" | "2_indep" | "2_paired" | "3_plus_indep" | "2_factors"
  >("2_indep");
  const [isNormal, setIsNormal] = useState<boolean>(true);

  // Matrix Filter
  const [matrixFilterScale, setMatrixFilterScale] = useState<
    "all" | MeasurementScale
  >("all");

  // Recommendation logic
  const recommendation = useMemo(() => {
    let primary: { title: string; type: AnalysisType };
    let alternative: { title: string; type: AnalysisType } | null = null;
    let rationale = "";
    let assumptions: string[] = [];

    if (purpose === "exploration") {
      primary = {
        title: "Descriptive Statistics & Normality",
        type: "descriptive",
      };
      rationale =
        "Initial exploratory step to evaluate central tendency (Mean, Median, SD) and test the normality assumption with Shapiro-Wilk.";
      assumptions = [
        "Quantitative (Scale) or categorical data",
        "Evaluate Shapiro-Wilk p-value (p > 0.05 = Normal)",
      ];
    } else if (purpose === "instrument") {
      primary = {
        title: "Scale Reliability (Cronbach's Alpha)",
        type: "reliability",
      };
      rationale =
        "Measures internal consistency reliability for Likert-scale questionnaire items prior to downstream empirical analysis.";
      assumptions = [
        "Ordinal (Likert 1-5) or Scale measurement",
        "Minimum 2 questionnaire items/statements",
        "Publication reliability benchmark: Alpha >= 0.70",
      ];
    } else if (purpose === "reduction") {
      primary = {
        title: "Principal Component Analysis (PCA)",
        type: "pca",
      };
      rationale =
        "Reduces high-dimensional continuous variables into principal components while retaining maximal variance and information.";
      assumptions = [
        "Interval / Ratio (Scale) continuous data",
        "Sufficient inter-variable correlation (KMO > 0.50)",
        "Adequate sample size",
      ];
    } else if (purpose === "prediction") {
      primary = {
        title: "Multiple Linear Regression",
        type: "regression",
      };
      alternative = {
        title: "Multivariate Analysis of Variance (MANOVA)",
        type: "manova",
      };
      rationale =
        "Predicts values of a continuous dependent variable (Y) from one or more predictors (X) with collinearity diagnostics (VIF).";
      assumptions = [
        "Dependent variable (Y) must be continuous (Scale)",
        "Residuals normally distributed and free from autocorrelation (Durbin-Watson)",
        "Absence of multicollinearity (VIF < 10)",
      ];
    } else if (purpose === "correlation") {
      if (scale === "nominal") {
        primary = {
          title: "Chi-Square Test of Independence",
          type: "chisquare",
        };
        rationale =
          "Tests independence and association between two nominal categorical variables using contingency tables and Cramér's V.";
        assumptions = [
          "Both variables are Nominal or Ordinal",
          "Expected cell frequencies < 5 in at most 20% of cells",
        ];
      } else if (scale === "ordinal" || !isNormal) {
        primary = {
          title: "Spearman Rank Correlation",
          type: "correlation_spearman",
        };
        alternative = {
          title: "Bivariate Pearson Correlation",
          type: "correlation_pearson",
        };
        rationale =
          "Measures the strength and monotonic direction of association between two ordinal variables or non-normal continuous data.";
        assumptions = [
          "Ordinal data or non-normal Scale data",
          "Monotonic association between variables",
          "Distribution-free (no normality required)",
        ];
      } else {
        primary = {
          title: "Bivariate Pearson Correlation",
          type: "correlation_pearson",
        };
        alternative = {
          title: "Spearman Rank Correlation",
          type: "correlation_spearman",
        };
        rationale =
          "Measures the strength and direction of linear association between two normally distributed continuous variables.";
        assumptions = [
          "Both variables are Interval / Ratio (Scale)",
          "Bivariate normal distribution",
          "Linear relationship without extreme bivariate outliers",
        ];
      }
    } else {
      // Comparison
      if (scale === "nominal") {
        primary = {
          title: "Chi-Square Test of Independence",
          type: "chisquare",
        };
        rationale =
          "Compares observed vs. expected frequency distributions across categories.";
        assumptions = ["Categorical Nominal or Ordinal data"];
      } else if (groupDesign === "1_sample") {
        if (scale === "ordinal" || !isNormal) {
          primary = {
            title: "Wilcoxon Signed-Rank Test",
            type: "wilcoxon",
          };
          alternative = {
            title: "One-Sample t-Test",
            type: "ttest_one_sample",
          };
          rationale =
            "Compares the median of a single sample against a hypothesized standard value for ranked or non-normal data.";
          assumptions = ["Ordinal or non-normal Scale data", "Random sample"];
        } else {
          primary = {
            title: "One-Sample t-Test",
            type: "ttest_one_sample",
          };
          alternative = {
            title: "Wilcoxon Signed-Rank Test",
            type: "wilcoxon",
          };
          rationale =
            "Compares a continuous sample mean against a hypothesized population benchmark value (mu0).";
          assumptions = [
            "Interval / Ratio (Scale) data",
            "Normally distributed data (p > 0.05 on Shapiro-Wilk)",
          ];
        }
      } else if (groupDesign === "2_indep") {
        if (scale === "ordinal" || !isNormal) {
          primary = {
            title: "Mann-Whitney U Test",
            type: "mann_whitney",
          };
          alternative = {
            title: "Independent Samples t-Test",
            type: "ttest_independent",
          };
          rationale =
            "Non-parametric test comparing medians and rank sums between two independent sample groups.";
          assumptions = [
            "Ordinal or non-normal Scale data",
            "Mutually independent groups",
          ];
        } else {
          primary = {
            title: "Independent Samples t-Test",
            type: "ttest_independent",
          };
          alternative = {
            title: "Mann-Whitney U Test",
            type: "mann_whitney",
          };
          rationale =
            "Compares means between two independent groups, featuring Levene's test for equality of variances and Welch's correction.";
          assumptions = [
            "Interval / Ratio (Scale) data",
            "Normally distributed within both groups",
            "Levene's test (p >= 0.05 = Student's t; p < 0.05 = Welch's t)",
          ];
        }
      } else if (groupDesign === "2_paired") {
        if (scale === "ordinal" || !isNormal) {
          primary = {
            title: "Wilcoxon Signed-Rank Test",
            type: "wilcoxon",
          };
          alternative = {
            title: "Paired Samples t-Test",
            type: "ttest_paired",
          };
          rationale =
            "Compares repeated measures or matched conditions (pre-test vs post-test) for ordinal or non-normal data.";
          assumptions = [
            "Paired / matched observations",
            "Ordinal or non-normal Scale data",
          ];
        } else {
          primary = {
            title: "Paired Samples t-Test",
            type: "ttest_paired",
          };
          alternative = {
            title: "Wilcoxon Signed-Rank Test",
            type: "wilcoxon",
          };
          rationale =
            "Compares means across two paired or repeated conditions (e.g., pre-treatment vs post-treatment).";
          assumptions = [
            "Interval / Ratio (Scale) data",
            "Differences between paired observations are normally distributed",
          ];
        }
      } else if (groupDesign === "3_plus_indep") {
        if (scale === "ordinal" || !isNormal) {
          primary = {
            title: "Kruskal-Wallis H Test",
            type: "kruskal",
          };
          alternative = {
            title: "One-Way ANOVA",
            type: "anova_oneway",
          };
          rationale =
            "Non-parametric rank-based alternative to compare median ranks across three or more independent groups.";
          assumptions = [
            "Ordinal or non-normal Scale data",
            "3 or more independent groups",
          ];
        } else {
          primary = {
            title: "One-Way ANOVA",
            type: "anova_oneway",
          };
          alternative = {
            title: "Kruskal-Wallis H Test",
            type: "kruskal",
          };
          rationale =
            "Compares means across three or more independent groups with post-hoc Tukey HSD for pairwise contrasts.";
          assumptions = [
            "Interval / Ratio (Scale) data",
            "Normally distributed within each group",
            "Homogeneous variances (Levene's test p >= 0.05)",
          ];
        }
      } else {
        // 2_factors
        primary = {
          title: "Two-Way Factorial ANOVA",
          type: "anova_twoway",
        };
        rationale =
          "Tests main effects of two categorical factor variables simultaneously alongside their interaction effect on a continuous outcome.";
        assumptions = [
          "Continuous dependent variable (Scale)",
          "Two categorical factors (Nominal/Ordinal)",
          "Normally distributed residuals and homogeneous variances",
        ];
      }
    }

    return { primary, alternative, rationale, assumptions };
  }, [purpose, scale, groupDesign, isNormal]);

  // Matrix catalog entries
  const matrixData: MatrixEntry[] = [
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

  const filteredMatrix = useMemo(() => {
    if (matrixFilterScale === "all") return matrixData;
    return matrixData.filter((m) => m.scale === matrixFilterScale);
  }, [matrixFilterScale]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-2xl w-full max-w-4xl flex flex-col max-h-[90vh] overflow-hidden text-zinc-900 dark:text-zinc-100 text-xs">
        {/* Header */}
        <div className="px-4 py-2.5 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50 dark:bg-zinc-950">
          <div className="flex items-center gap-2">
            <Compass className="w-4 h-4 text-amber-500 shrink-0" />
            <div>
              <h2 className="text-xs font-semibold tracking-tight text-zinc-800 dark:text-zinc-200">
                Statistical Method Advisor & Research Guide
              </h2>
              <p className="text-[10px] text-zinc-500 dark:text-zinc-400">
                Interactive statistical method selection & quantitative research
                prerequisite guide
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center px-4 pt-1.5 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/40 gap-1">
          <button
            onClick={() => setActiveTab("wizard")}
            className={`px-3 py-1.5 text-xs font-medium border-b-2 flex items-center gap-1.5 transition ${
              activeTab === "wizard"
                ? "border-amber-500 text-amber-600 dark:text-amber-400 font-semibold bg-white dark:bg-zinc-900 rounded-t"
                : "border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
            }`}
          >
            <Compass className="w-3.5 h-3.5 text-amber-500" />
            <span>Interactive Advisor (Wizard)</span>
          </button>
          <button
            onClick={() => setActiveTab("workflow")}
            className={`px-3 py-1.5 text-xs font-medium border-b-2 flex items-center gap-1.5 transition ${
              activeTab === "workflow"
                ? "border-indigo-500 text-indigo-600 dark:text-indigo-400 font-semibold bg-white dark:bg-zinc-900 rounded-t"
                : "border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
            }`}
          >
            <Workflow className="w-3.5 h-3.5 text-indigo-500" />
            <span>Research Workflow & Prerequisites</span>
          </button>
          <button
            onClick={() => setActiveTab("matrix")}
            className={`px-3 py-1.5 text-xs font-medium border-b-2 flex items-center gap-1.5 transition ${
              activeTab === "matrix"
                ? "border-blue-500 text-blue-600 dark:text-blue-400 font-semibold bg-white dark:bg-zinc-900 rounded-t"
                : "border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
            }`}
          >
            <Table className="w-3.5 h-3.5 text-blue-500" />
            <span>Decision Matrix Cheat-Sheet</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 p-4 overflow-y-auto">
          {/* TAB 1: INTERACTIVE WIZARD */}
          {activeTab === "wizard" && (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              {/* Question Form */}
              <div className="md:col-span-7 flex flex-col gap-3.5">
                {/* Step 1: Purpose */}
                <div className="p-3 rounded border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/40">
                  <label className="text-[11px] font-semibold text-zinc-800 dark:text-zinc-200 block mb-1.5">
                    1. What is the primary purpose of your analysis?
                  </label>
                  <div className="grid grid-cols-2 gap-1.5">
                    {[
                      {
                        id: "comparison",
                        label: "Group Comparisons",
                        desc: "Mean / median difference tests",
                      },
                      {
                        id: "correlation",
                        label: "Correlation & Association",
                        desc: "Direction & strength of relationships",
                      },
                      {
                        id: "prediction",
                        label: "Regression & Prediction",
                        desc: "Model effect of X on outcome Y",
                      },
                      {
                        id: "instrument",
                        label: "Questionnaire Reliability",
                        desc: "Cronbach's Alpha consistency",
                      },
                      {
                        id: "reduction",
                        label: "Dimensionality Reduction (PCA)",
                        desc: "Extract principal components",
                      },
                      {
                        id: "exploration",
                        label: "Exploration & Normality",
                        desc: "Mean, SD, Skew, Shapiro-Wilk",
                      },
                    ].map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setPurpose(item.id as any)}
                        className={`p-2 rounded border text-left transition ${
                          purpose === item.id
                            ? "bg-amber-50 dark:bg-amber-950/40 border-amber-500 text-amber-900 dark:text-amber-200 font-semibold"
                            : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800/60"
                        }`}
                      >
                        <div className="text-[11px] leading-tight">
                          {item.label}
                        </div>
                        <div className="text-[9px] text-zinc-400 font-normal leading-tight mt-0.5">
                          {item.desc}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Step 2: Measurement Scale */}
                {purpose !== "instrument" &&
                  purpose !== "reduction" &&
                  purpose !== "exploration" && (
                    <div className="p-3 rounded border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/40">
                      <label className="text-[11px] font-semibold text-zinc-800 dark:text-zinc-200 block mb-1.5">
                        2. What is the measurement scale of your outcome
                        variable?
                      </label>
                      <div className="grid grid-cols-3 gap-1.5">
                        {[
                          {
                            id: "scale",
                            title: "Scale (Interval/Ratio)",
                            sub: "Continuous, numeric metric",
                            icon: Ruler,
                            badge: "text-amber-600 dark:text-amber-400",
                          },
                          {
                            id: "ordinal",
                            title: "Ordinal (Ranked)",
                            sub: "Likert scales, rankings, order",
                            icon: BarChart2,
                            badge: "text-blue-600 dark:text-blue-400",
                          },
                          {
                            id: "nominal",
                            title: "Nominal (Categorical)",
                            sub: "Unordered categories, groups",
                            icon: Tag,
                            badge: "text-purple-600 dark:text-purple-400",
                          },
                        ].map((item) => {
                          const IconComponent = item.icon;
                          return (
                            <button
                              key={item.id}
                              type="button"
                              onClick={() => setScale(item.id as any)}
                              className={`p-2 rounded border text-left transition ${
                                scale === item.id
                                  ? "bg-amber-50 dark:bg-amber-950/40 border-amber-500 text-amber-900 dark:text-amber-200 font-semibold"
                                  : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800/60"
                              }`}
                            >
                              <div className="flex items-center gap-1 mb-0.5">
                                <IconComponent
                                  className={`w-3.5 h-3.5 ${item.badge}`}
                                />
                                <span className="text-[10px] font-medium leading-tight">
                                  {item.title}
                                </span>
                              </div>
                              <div className="text-[9px] text-zinc-400 font-normal leading-tight">
                                {item.sub}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                {/* Step 3: Grouping & Design */}
                {purpose === "comparison" && scale !== "nominal" && (
                  <div className="p-3 rounded border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/40">
                    <label className="text-[11px] font-semibold text-zinc-800 dark:text-zinc-200 block mb-1.5">
                      3. How many groups and what is the sample design?
                    </label>
                    <div className="grid grid-cols-2 gap-1.5 mb-2.5">
                      {[
                        {
                          id: "1_sample",
                          label: "1 Sample",
                          desc: "Compared to benchmark value",
                        },
                        {
                          id: "2_indep",
                          label: "2 Independent Groups",
                          desc: "Control vs Experimental",
                        },
                        {
                          id: "2_paired",
                          label: "2 Paired Conditions",
                          desc: "Pre-test vs Post-test",
                        },
                        {
                          id: "3_plus_indep",
                          label: "3+ Independent Groups",
                          desc: "3+ method variations",
                        },
                        {
                          id: "2_factors",
                          label: "2 Crossed Factors",
                          desc: "Factor A x Factor B",
                        },
                      ].map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setGroupDesign(item.id as any)}
                          className={`p-1.5 rounded border text-left transition ${
                            groupDesign === item.id
                              ? "bg-amber-50 dark:bg-amber-950/40 border-amber-500 text-amber-900 dark:text-amber-200 font-semibold"
                              : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800/60"
                          }`}
                        >
                          <div className="text-[10px] font-medium leading-tight">
                            {item.label}
                          </div>
                          <div className="text-[9px] text-zinc-400 font-normal leading-tight">
                            {item.desc}
                          </div>
                        </button>
                      ))}
                    </div>

                    <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between text-[10px]">
                      <span className="text-zinc-600 dark:text-zinc-400">
                        Data Normality Assumption:
                      </span>
                      <div className="flex items-center gap-2">
                        <label className="flex items-center gap-1 cursor-pointer">
                          <input
                            type="radio"
                            name="normality"
                            checked={isNormal}
                            onChange={() => setIsNormal(true)}
                            className="text-amber-500"
                          />
                          <span>Normal (p &gt; 0.05)</span>
                        </label>
                        <label className="flex items-center gap-1 cursor-pointer">
                          <input
                            type="radio"
                            name="normality"
                            checked={!isNormal}
                            onChange={() => setIsNormal(false)}
                            className="text-amber-500"
                          />
                          <span>Non-Normal / Distribution-Free</span>
                        </label>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Recommendation Box */}
              <div className="md:col-span-5 flex flex-col justify-between p-3.5 rounded-lg border border-amber-300 dark:border-amber-800/80 bg-gradient-to-br from-amber-50/70 to-orange-50/40 dark:from-amber-950/30 dark:to-orange-950/10">
                <div className="space-y-3">
                  <div className="flex items-center gap-1.5 text-amber-800 dark:text-amber-300">
                    <Compass className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    <span className="text-xs font-bold uppercase tracking-wider">
                      Recommended Method
                    </span>
                  </div>

                  {/* Primary Recommendation */}
                  <div className="p-2.5 rounded bg-white dark:bg-zinc-900 border border-amber-200 dark:border-amber-800/60 shadow-xs">
                    <div className="text-[10px] uppercase font-bold text-amber-600 dark:text-amber-400">
                      Primary Test
                    </div>
                    <div className="text-sm font-bold text-zinc-800 dark:text-zinc-100 mt-0.5">
                      {recommendation.primary.title}
                    </div>
                    <p className="text-[10px] text-zinc-600 dark:text-zinc-400 mt-1 leading-relaxed">
                      {recommendation.rationale}
                    </p>
                  </div>

                  {/* Alternative if applicable */}
                  {recommendation.alternative && (
                    <div className="p-2 rounded bg-white/70 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800">
                      <div className="text-[9px] uppercase font-semibold text-zinc-400">
                        Alternative If Normality Violated
                      </div>
                      <div className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 mt-0.5">
                        {recommendation.alternative.title}
                      </div>
                    </div>
                  )}

                  {/* Assumptions checklist */}
                  <div>
                    <span className="text-[10px] font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">
                      Assumptions to Satisfy:
                    </span>
                    <ul className="space-y-1">
                      {recommendation.assumptions.map((asm, idx) => (
                        <li
                          key={idx}
                          className="flex items-start gap-1.5 text-[10px] text-zinc-600 dark:text-zinc-400"
                        >
                          <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0 mt-0.5" />
                          <span>{asm}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Launch Action */}
                <div className="pt-3 border-t border-amber-200 dark:border-amber-800/60 flex flex-col gap-1.5 mt-3">
                  <button
                    onClick={() => {
                      onSelectAnalysis(recommendation.primary.type);
                      onClose();
                    }}
                    className="w-full py-2 px-3 rounded bg-amber-600 hover:bg-amber-700 text-white font-semibold text-[11px] flex items-center justify-center gap-1.5 shadow-xs transition"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Launch {recommendation.primary.title}</span>
                  </button>

                  {recommendation.alternative && (
                    <button
                      onClick={() => {
                        onSelectAnalysis(recommendation.alternative!.type);
                        onClose();
                      }}
                      className="w-full py-1.5 px-3 rounded border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 text-[10px] flex items-center justify-center gap-1 transition"
                    >
                      <span>
                        Launch Alternative: {recommendation.alternative.title}
                      </span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: RESEARCH WORKFLOW & PREREQUISITES */}
          {activeTab === "workflow" && (
            <div className="space-y-4">
              <div className="p-3 rounded-lg border border-indigo-200 dark:border-indigo-900/60 bg-indigo-50/40 dark:bg-indigo-950/20">
                <h3 className="text-xs font-bold text-indigo-900 dark:text-indigo-300 flex items-center gap-1.5">
                  <Workflow className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  Standard Sequence of Tests in Quantitative Research
                </h3>
                <p className="text-[11px] text-zinc-600 dark:text-zinc-400 mt-1">
                  To ensure empirical findings are methodologically valid and
                  defensible in academic defense or journal publication, follow
                  these 4 prerequisite stages sequentially:
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Step 1 */}
                <div className="p-3 rounded border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-600 dark:text-cyan-400">
                        Step 1: Instrument Quality
                      </span>
                      <CheckCircle2 className="w-4 h-4 text-cyan-500" />
                    </div>
                    <h4 className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
                      Instrument Validity & Reliability Testing
                    </h4>
                    <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-1">
                      Measures whether questionnaire items reliably and
                      consistently evaluate the intended latent construct over
                      time.
                    </p>
                    <div className="mt-2 p-2 rounded bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/60 space-y-1 text-[10px]">
                      <div>
                        <strong>
                          Decision Criteria (Cronbach&apos;s Alpha):
                        </strong>
                      </div>
                      <div className="text-emerald-600 dark:text-emerald-400 font-medium">
                        • Alpha &gt;= 0.70 : Excellent / Reliable (Publication
                        Standard)
                      </div>
                      <div className="text-amber-600 dark:text-amber-400">
                        • 0.60 &lt;= Alpha &lt; 0.70 : Acceptable / Moderate
                      </div>
                      <div className="text-red-500">
                        • Alpha &lt; 0.60 : Questionable / Inconsistent (Revise
                        or remove poor items)
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      onSelectAnalysis("reliability");
                      onClose();
                    }}
                    className="mt-3 w-full py-1 text-[10px] font-medium rounded border border-cyan-300 dark:border-cyan-800 text-cyan-700 dark:text-cyan-300 hover:bg-cyan-50 dark:hover:bg-cyan-950/40 transition flex items-center justify-center gap-1"
                  >
                    <span>Run Reliability Analysis</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>

                {/* Step 2 */}
                <div className="p-3 rounded border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                        Step 2: Distribution Diagnostics
                      </span>
                      <BarChart3 className="w-4 h-4 text-emerald-500" />
                    </div>
                    <h4 className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
                      Normality Assumption Testing
                    </h4>
                    <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-1">
                      Evaluates whether sample observations follow a normal
                      bell-shaped distribution curve.
                    </p>
                    <div className="mt-2 p-2 rounded bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/60 space-y-1 text-[10px]">
                      <div>
                        <strong>
                          Decision Criteria (Significance p-value):
                        </strong>
                      </div>
                      <div className="text-emerald-600 dark:text-emerald-400 font-medium">
                        • p-value &gt; 0.05 : Normal Distribution (Proceed to
                        Parametric Tests)
                      </div>
                      <div className="text-red-500 font-medium">
                        • p-value &lt; 0.05 : Non-Normal Distribution (Switch to
                        Non-Parametric Tests)
                      </div>
                      <div className="text-zinc-500 text-[9px] pt-0.5">
                        Methods: Shapiro-Wilk (N &lt; 100) or Kolmogorov-Smirnov
                        (N &gt;= 100).
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      onSelectAnalysis("descriptive");
                      onClose();
                    }}
                    className="mt-3 w-full py-1 text-[10px] font-medium rounded border border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition flex items-center justify-center gap-1"
                  >
                    <span>Check Normality (Descriptives)</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>

                {/* Step 3 */}
                <div className="p-3 rounded border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                        Step 3: Variance Diagnostics
                      </span>
                      <GitCompare className="w-4 h-4 text-indigo-500" />
                    </div>
                    <h4 className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
                      Homogeneity of Variances (Levene&apos;s Test)
                    </h4>
                    <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-1">
                      Essential diagnostic prerequisite before running
                      between-group comparisons (Independent t-Test or ANOVA).
                    </p>
                    <div className="mt-2 p-2 rounded bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/60 space-y-1 text-[10px]">
                      <div>
                        <strong>
                          Decision Criteria (Levene&apos;s p-value):
                        </strong>
                      </div>
                      <div className="text-emerald-600 dark:text-emerald-400 font-medium">
                        • p-value &gt;= 0.05 : Homogeneous Variances (Equal
                        variances assumed)
                      </div>
                      <div className="text-amber-600 dark:text-amber-400 font-medium">
                        • p-value &lt; 0.05 : Heterogeneous Variances (Consult
                        Welch&apos;s t-test row!)
                      </div>
                      <div className="text-zinc-500 text-[9px] pt-0.5">
                        AegisResearch automatically computes Student&apos;s t
                        and Welch&apos;s t simultaneously.
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      onSelectAnalysis("ttest_independent");
                      onClose();
                    }}
                    className="mt-3 w-full py-1 text-[10px] font-medium rounded border border-indigo-300 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition flex items-center justify-center gap-1"
                  >
                    <span>Run Independent t-Test (Includes Levene)</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>

                {/* Step 4 */}
                <div className="p-3 rounded border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">
                        Step 4: Hypothesis Testing
                      </span>
                      <Play className="w-4 h-4 text-purple-500 fill-current" />
                    </div>
                    <h4 className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
                      Hypothesis Testing & Empirical Significance
                    </h4>
                    <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-1">
                      Addresses core research questions and hypotheses using the
                      appropriate parametric or non-parametric test.
                    </p>
                    <div className="mt-2 p-2 rounded bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/60 space-y-1 text-[10px]">
                      <div>
                        <strong>Testing Track Selection:</strong>
                      </div>
                      <div className="text-indigo-600 dark:text-indigo-400">
                        • Normal & Homogeneous Requirements Met:{" "}
                        <strong>Parametric Tests</strong> (t-Test, ANOVA,
                        Regression, Pearson).
                      </div>
                      <div className="text-emerald-600 dark:text-emerald-400">
                        • Normality Violated / Ordinal Scale:{" "}
                        <strong>Non-Parametric Tests</strong> (Mann-Whitney,
                        Wilcoxon, Kruskal-Wallis, Spearman).
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => setActiveTab("matrix")}
                    className="mt-3 w-full py-1 text-[10px] font-medium rounded border border-purple-300 dark:border-purple-800 text-purple-700 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-950/40 transition flex items-center justify-center gap-1"
                  >
                    <span>View Decision Matrix</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: DECISION MATRIX */}
          {activeTab === "matrix" && (
            <div className="space-y-3">
              {/* Scale Filter */}
              <div className="flex items-center justify-between pb-2 border-b border-zinc-200 dark:border-zinc-800">
                <span className="text-[11px] font-semibold text-zinc-700 dark:text-zinc-300">
                  Filter by Measurement Scale:
                </span>
                <div className="flex items-center gap-1">
                  {[
                    { id: "all", label: "All Scales" },
                    { id: "scale", label: "Scale (Interval/Ratio)" },
                    { id: "ordinal", label: "Ordinal" },
                    { id: "nominal", label: "Nominal" },
                  ].map((btn) => (
                    <button
                      key={btn.id}
                      onClick={() => setMatrixFilterScale(btn.id as any)}
                      className={`px-2 py-0.5 rounded text-[10px] font-medium border transition ${
                        matrixFilterScale === btn.id
                          ? "bg-amber-600 text-white border-amber-600"
                          : "bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100"
                      }`}
                    >
                      {btn.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Matrix Table */}
              <div className="border border-zinc-200 dark:border-zinc-800 rounded overflow-x-auto text-[11px]">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-zinc-50 dark:bg-zinc-800/60 border-b border-zinc-200 dark:border-zinc-800 text-[10px] text-zinc-500 uppercase">
                    <tr>
                      <th className="px-2.5 py-1.5 font-semibold">Scale</th>
                      <th className="px-2.5 py-1.5 font-semibold">
                        Research Objective
                      </th>
                      <th className="px-2.5 py-1.5 font-semibold">
                        Groups / Design
                      </th>
                      <th className="px-2.5 py-1.5 font-semibold">
                        Recommended Test (Parametric)
                      </th>
                      <th className="px-2.5 py-1.5 font-semibold">
                        Non-Parametric Alternative
                      </th>
                      <th className="px-2.5 py-1.5 font-semibold text-right">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                    {filteredMatrix.map((row, idx) => {
                      const scaleMeta = getScaleMeta(row.scale);
                      return (
                        <tr
                          key={idx}
                          className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30"
                        >
                          <td className="px-2.5 py-1.5">
                            <span
                              className={`text-[9px] px-1.5 py-0.5 rounded font-mono border ${scaleMeta.badgeClass}`}
                            >
                              {scaleMeta.shortLabel}
                            </span>
                          </td>
                          <td className="px-2.5 py-1.5 font-medium">
                            {row.purpose}
                          </td>
                          <td className="px-2.5 py-1.5 text-zinc-500">
                            {row.groups} ({row.design})
                          </td>
                          <td className="px-2.5 py-1.5 font-semibold text-indigo-600 dark:text-indigo-400">
                            {row.normalTest.title}
                          </td>
                          <td className="px-2.5 py-1.5 text-emerald-600 dark:text-emerald-400">
                            {row.nonParamAlt?.title || "-"}
                          </td>
                          <td className="px-2.5 py-1.5 text-right">
                            <button
                              onClick={() => {
                                onSelectAnalysis(row.normalTest.type);
                                onClose();
                              }}
                              className="px-2 py-0.5 rounded bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/60 text-indigo-600 dark:text-indigo-300 font-semibold text-[10px] border border-indigo-200 dark:border-indigo-800 transition"
                            >
                              Open
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50 dark:bg-zinc-950">
          <div className="text-[10px] text-zinc-400">
            AegisResearch Academic Methodology Advisor — Guiding sound empirical
            research.
          </div>
          <button
            onClick={onClose}
            className="px-3 py-1 text-[11px] font-medium rounded bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 transition"
          >
            Close Guide
          </button>
        </div>
      </div>
    </div>
  );
};
