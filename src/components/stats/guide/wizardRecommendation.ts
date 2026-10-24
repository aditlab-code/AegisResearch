import { AnalysisType, MeasurementScale } from "../../../types/stats";
import {
  WizardPurpose,
  WizardGroupDesign,
  RecommendationResult,
} from "./guideData";

export function getRecommendation(
  purpose: WizardPurpose,
  scale: MeasurementScale,
  groupDesign: WizardGroupDesign,
  isNormal: boolean,
): RecommendationResult {
  if (purpose === "exploration") {
    return {
      primary: {
        title: "Descriptive Statistics & Normality",
        type: "descriptive",
      },
      alternative: null,
      rationale:
        "Initial exploratory step to evaluate central tendency (Mean, Median, SD) and test the normality assumption with Shapiro-Wilk.",
      assumptions: [
        "Quantitative (Scale) or categorical data",
        "Evaluate Shapiro-Wilk p-value (p > 0.05 = Normal)",
      ],
    };
  }
  if (purpose === "instrument") {
    return {
      primary: {
        title: "Scale Reliability (Cronbach's Alpha)",
        type: "reliability",
      },
      alternative: null,
      rationale:
        "Measures internal consistency reliability for Likert-scale questionnaire items prior to downstream empirical analysis.",
      assumptions: [
        "Ordinal (Likert 1-5) or Scale measurement",
        "Minimum 2 questionnaire items/statements",
        "Publication reliability benchmark: Alpha >= 0.70",
      ],
    };
  }
  if (purpose === "reduction") {
    return {
      primary: {
        title: "Principal Component Analysis (PCA)",
        type: "pca",
      },
      alternative: null,
      rationale:
        "Reduces high-dimensional continuous variables into principal components while retaining maximal variance and information.",
      assumptions: [
        "Interval / Ratio (Scale) continuous data",
        "Sufficient inter-variable correlation (KMO > 0.50)",
        "Adequate sample size",
      ],
    };
  }
  if (purpose === "prediction") {
    return {
      primary: {
        title: "Multiple Linear Regression",
        type: "regression",
      },
      alternative: {
        title: "Multivariate Analysis of Variance (MANOVA)",
        type: "manova",
      },
      rationale:
        "Predicts values of a continuous dependent variable (Y) from one or more predictors (X) with collinearity diagnostics (VIF).",
      assumptions: [
        "Dependent variable (Y) must be continuous (Scale)",
        "Residuals normally distributed and free from autocorrelation (Durbin-Watson)",
        "Absence of multicollinearity (VIF < 10)",
      ],
    };
  }
  if (purpose === "correlation") {
    if (scale === "nominal") {
      return {
        primary: {
          title: "Chi-Square Test of Independence",
          type: "chisquare",
        },
        alternative: null,
        rationale:
          "Tests independence and association between two nominal categorical variables using contingency tables and Cramér's V.",
        assumptions: [
          "Both variables are Nominal or Ordinal",
          "Expected cell frequencies < 5 in at most 20% of cells",
        ],
      };
    }
    if (scale === "ordinal" || !isNormal) {
      return {
        primary: {
          title: "Spearman Rank Correlation",
          type: "correlation_spearman",
        },
        alternative: {
          title: "Bivariate Pearson Correlation",
          type: "correlation_pearson",
        },
        rationale:
          "Measures the strength and monotonic direction of association between two ordinal variables or non-normal continuous data.",
        assumptions: [
          "Ordinal data or non-normal Scale data",
          "Monotonic association between variables",
          "Distribution-free (no normality required)",
        ],
      };
    }
    return {
      primary: {
        title: "Bivariate Pearson Correlation",
        type: "correlation_pearson",
      },
      alternative: {
        title: "Spearman Rank Correlation",
        type: "correlation_spearman",
      },
      rationale:
        "Measures the strength and direction of linear association between two normally distributed continuous variables.",
      assumptions: [
        "Both variables are Interval / Ratio (Scale)",
        "Bivariate normal distribution",
        "Linear relationship without extreme bivariate outliers",
      ],
    };
  }

  // Comparison
  if (scale === "nominal") {
    return {
      primary: {
        title: "Chi-Square Test of Independence",
        type: "chisquare",
      },
      alternative: null,
      rationale:
        "Compares observed vs. expected frequency distributions across categories.",
      assumptions: ["Categorical Nominal or Ordinal data"],
    };
  }
  const isRanked = scale === "ordinal" || !isNormal;
  if (groupDesign === "1_sample") {
    return {
      primary: isRanked
        ? { title: "Wilcoxon Signed-Rank Test", type: "wilcoxon" }
        : { title: "One-Sample t-Test", type: "ttest_one_sample" },
      alternative: isRanked
        ? { title: "One-Sample t-Test", type: "ttest_one_sample" }
        : { title: "Wilcoxon Signed-Rank Test", type: "wilcoxon" },
      rationale: isRanked
        ? "Compares the median of a single sample against a hypothesized standard value for ranked or non-normal data."
        : "Compares a continuous sample mean against a hypothesized population benchmark value (mu0).",
      assumptions: isRanked
        ? ["Ordinal or non-normal Scale data", "Random sample"]
        : [
            "Interval / Ratio (Scale) data",
            "Normally distributed data (p > 0.05 on Shapiro-Wilk)",
          ],
    };
  }
  if (groupDesign === "2_indep") {
    return {
      primary: isRanked
        ? { title: "Mann-Whitney U Test", type: "mann_whitney" }
        : {
            title: "Independent Samples t-Test",
            type: "ttest_independent",
          },
      alternative: isRanked
        ? {
            title: "Independent Samples t-Test",
            type: "ttest_independent",
          }
        : { title: "Mann-Whitney U Test", type: "mann_whitney" },
      rationale: isRanked
        ? "Non-parametric test comparing medians and rank sums between two independent sample groups."
        : "Compares means between two independent groups, featuring Levene's test for equality of variances and Welch's correction.",
      assumptions: isRanked
        ? ["Ordinal or non-normal Scale data", "Mutually independent groups"]
        : [
            "Interval / Ratio (Scale) data",
            "Normally distributed within both groups",
            "Levene's test (p >= 0.05 = Student's t; p < 0.05 = Welch's t)",
          ],
    };
  }
  if (groupDesign === "2_paired") {
    return {
      primary: isRanked
        ? { title: "Wilcoxon Signed-Rank Test", type: "wilcoxon" }
        : { title: "Paired Samples t-Test", type: "ttest_paired" },
      alternative: isRanked
        ? { title: "Paired Samples t-Test", type: "ttest_paired" }
        : { title: "Wilcoxon Signed-Rank Test", type: "wilcoxon" },
      rationale: isRanked
        ? "Compares repeated measures or matched conditions (pre-test vs post-test) for ordinal or non-normal data."
        : "Compares means across two paired or repeated conditions (e.g., pre-treatment vs post-treatment).",
      assumptions: isRanked
        ? ["Paired / matched observations", "Ordinal or non-normal Scale data"]
        : [
            "Interval / Ratio (Scale) data",
            "Differences between paired observations are normally distributed",
          ],
    };
  }
  if (groupDesign === "3_plus_indep") {
    return {
      primary: isRanked
        ? { title: "Kruskal-Wallis H Test", type: "kruskal" }
        : { title: "One-Way ANOVA", type: "anova_oneway" },
      alternative: isRanked
        ? { title: "One-Way ANOVA", type: "anova_oneway" }
        : { title: "Kruskal-Wallis H Test", type: "kruskal" },
      rationale: isRanked
        ? "Non-parametric rank-based alternative to compare median ranks across three or more independent groups."
        : "Compares means across three or more independent groups with post-hoc Tukey HSD for pairwise contrasts.",
      assumptions: isRanked
        ? ["Ordinal or non-normal Scale data", "3 or more independent groups"]
        : [
            "Interval / Ratio (Scale) data",
            "Normally distributed within each group",
            "Homogeneous variances (Levene's test p >= 0.05)",
          ],
    };
  }
  if (groupDesign === "ancova_covar") {
    return {
      primary: {
        title: "Analysis of Covariance (ANCOVA)",
        type: "ancova",
      },
      alternative: isRanked
        ? { title: "Kruskal-Wallis H Test", type: "kruskal" }
        : { title: "One-Way ANOVA", type: "anova_oneway" },
      rationale: isRanked
        ? "Standard ANCOVA evaluates group differences while controlling for continuous covariates, but assumes normally distributed residuals. If normality is violated, rank ANCOVA or non-parametric alternatives can be considered."
        : "Evaluates differences in continuous outcome between treatment groups while statistically controlling for linear effects of one or more continuous covariates (yielding Adjusted Means / Estimated Marginal Means).",
      assumptions: isRanked
        ? [
            "Continuous dependent variable (Scale)",
            "Categorical grouping factor",
            "Continuous covariate(s)",
            "Homogeneity of regression slopes",
          ]
        : [
            "Continuous dependent variable (Scale)",
            "Categorical grouping factor (Nominal/Ordinal)",
            "One or more continuous covariates (Scale)",
            "Homogeneity of regression slopes (Covariate * Factor interaction p >= 0.05)",
            "Normally distributed model residuals (Shapiro-Wilk p >= 0.05)",
            "Homogeneity of error variances (Levene's test p >= 0.05)",
          ],
    };
  }

  // 2_factors
  return {
    primary: {
      title: "Two-Way Factorial ANOVA",
      type: "anova_twoway",
    },
    alternative: null,
    rationale:
      "Tests main effects of two categorical factor variables simultaneously alongside their interaction effect on a continuous outcome.",
    assumptions: [
      "Continuous dependent variable (Scale)",
      "Two categorical factors (Nominal/Ordinal)",
      "Normally distributed residuals and homogeneous variances",
    ],
  };
}
