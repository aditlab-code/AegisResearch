import { MeasurementScale, AnalysisType } from "../types/stats";

export function inferMeasurementScale(
  name: string,
  type?: string,
): MeasurementScale {
  const lowerName = name.toLowerCase();
  const lowerType = (type || "").toLowerCase();

  // Non-numeric types are definitely nominal
  if (
    lowerType.includes("str") ||
    lowerType.includes("utf8") ||
    lowerType.includes("object") ||
    lowerType.includes("bool") ||
    lowerType.includes("cat")
  ) {
    return "nominal";
  }

  // Common nominal identifiers
  if (
    lowerName.includes("id") ||
    lowerName.includes("gender") ||
    lowerName.includes("sex") ||
    lowerName.includes("group") ||
    lowerName.includes("class") ||
    lowerName.includes("code") ||
    lowerName.includes("category") ||
    lowerName.includes("city") ||
    lowerName.includes("country")
  ) {
    return "nominal";
  }

  // Common ordinal patterns (Questionnaire, Likert items, rankings)
  if (
    /^q[0-9]+/i.test(lowerName) ||
    lowerName.includes("likert") ||
    lowerName.includes("rank") ||
    lowerName.includes("grade") ||
    lowerName.includes("level") ||
    lowerName.includes("stage") ||
    lowerName.includes("score_likert")
  ) {
    return "ordinal";
  }

  // Default to Scale (Interval / Ratio) for numeric continuous variables
  return "scale";
}

export function getNextScale(current: MeasurementScale): MeasurementScale {
  switch (current) {
    case "scale":
      return "ordinal";
    case "ordinal":
      return "nominal";
    case "nominal":
      return "scale";
  }
}

export interface ScaleMetaInfo {
  label: string;
  shortLabel: string;
  scaleType: MeasurementScale;
  description: string;
  badgeClass: string;
}

export function getScaleMeta(scale: MeasurementScale): ScaleMetaInfo {
  switch (scale) {
    case "scale":
      return {
        label: "Scale (Interval/Ratio)",
        shortLabel: "Scale",
        scaleType: "scale",
        description:
          "Continuous quantitative data (e.g. income, age, test scores).",
        badgeClass:
          "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-300 dark:border-amber-800",
      };
    case "ordinal":
      return {
        label: "Ordinal (Ranked)",
        shortLabel: "Ordinal",
        scaleType: "ordinal",
        description:
          "Ordered categories (e.g. Likert 1-5, education tier, stages).",
        badgeClass:
          "bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border-blue-300 dark:border-blue-800",
      };
    case "nominal":
      return {
        label: "Nominal (Categorical)",
        shortLabel: "Nominal",
        scaleType: "nominal",
        description:
          "Discrete unordered categories (e.g. gender, group, city).",
        badgeClass:
          "bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 border-purple-300 dark:border-purple-800",
      };
  }
}

export interface ScaleValidationResult {
  valid: boolean;
  warning?: string;
}

export function validateSlotScale(
  scale: MeasurementScale,
  role: "dependent" | "independent" | "factor" | "item" | "descriptive",
  analysisType: AnalysisType,
): ScaleValidationResult {
  if (analysisType === "regression") {
    if (role === "dependent" && scale === "nominal") {
      return {
        valid: false,
        warning:
          "Dependent (Y) cannot be Nominal for OLS Linear Regression. Interval/Ratio scale required.",
      };
    }
    if (role === "independent" && scale === "nominal") {
      return {
        valid: true,
        warning:
          "Nominal predictor detected. Ensure variable is coded as binary dummy (0/1).",
      };
    }
  }

  if (analysisType === "manova") {
    if (role === "dependent" && scale === "nominal") {
      return {
        valid: false,
        warning:
          "MANOVA dependent variables must be continuous (Scale / Interval-Ratio).",
      };
    }
    if (role === "factor" && scale === "scale") {
      return {
        valid: true,
        warning:
          "Continuous Scale used as Factor will create sparse single-observation groups. Nominal/Ordinal recommended.",
      };
    }
  }

  if (analysisType === "reliability") {
    if (scale === "nominal") {
      return {
        valid: false,
        warning:
          "Nominal categories cannot be aggregated into a Likert scale reliability index (Alpha).",
      };
    }
  }

  if (analysisType === "pca") {
    if (scale === "nominal") {
      return {
        valid: false,
        warning:
          "PCA requires quantitative metric data (Scale / Ordinal). Unordered Nominals distort component variance.",
      };
    }
  }

  // Parametric Tests Guardrails
  if (analysisType === "ttest_one_sample" || analysisType === "ttest_paired") {
    if (scale === "nominal") {
      return {
        valid: false,
        warning:
          "Parametric t-test requires continuous quantitative data (Scale). For categorical data, use Non-Parametric tests.",
      };
    }
  }

  if (analysisType === "ttest_independent") {
    if (role === "dependent" && scale === "nominal") {
      return {
        valid: false,
        warning:
          "Test variable must be continuous (Scale). For ordinal data, use Mann-Whitney U test.",
      };
    }
    if (role === "factor" && scale === "scale") {
      return {
        valid: true,
        warning:
          "Grouping variable must have 2 distinct groups. Continuous Scale will likely cause errors.",
      };
    }
  }

  if (
    analysisType === "anova_oneway" ||
    analysisType === "anova_twoway" ||
    analysisType === "ancova"
  ) {
    if (role === "dependent" && scale === "nominal") {
      return {
        valid: false,
        warning:
          "ANOVA/ANCOVA dependent variable must be continuous (Scale). For ordinal/ranked data, use Kruskal-Wallis.",
      };
    }
    if (role === "factor" && scale === "scale") {
      return {
        valid: true,
        warning:
          "Continuous variable used as Factor. Factor should be categorical (Nominal/Ordinal) with distinct levels.",
      };
    }
    if (
      analysisType === "ancova" &&
      role === "independent" &&
      scale === "nominal"
    ) {
      return {
        valid: false,
        warning:
          "Covariates in ANCOVA must be continuous quantitative variables (Scale).",
      };
    }
  }

  if (analysisType === "correlation_pearson") {
    if (scale === "nominal") {
      return {
        valid: false,
        warning:
          "Pearson correlation requires continuous metric variables (Scale). For nominal categories, use Chi-Square.",
      };
    }
    if (scale === "ordinal") {
      return {
        valid: true,
        warning:
          "Ordinal variable in Pearson correlation. Consider Spearman Rank correlation for ranked data.",
      };
    }
  }

  // Non-Parametric Tests Guardrails
  if (analysisType === "chisquare") {
    if (scale === "scale") {
      return {
        valid: true,
        warning:
          "Continuous Scale variable in Chi-Square test may produce an excessively sparse cross-tabulation. Nominal/Ordinal recommended.",
      };
    }
  }

  return { valid: true };
}
