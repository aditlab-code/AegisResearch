import { AnalysisResult, StandardizedPlotRequest } from "../../../types/stats";

export interface DynamicPlotOption {
  id: string;
  label: string;
  colorClass: string;
  buildRequest: () => StandardizedPlotRequest;
}

export function getAvailablePlots(
  result: AnalysisResult | null,
  filePath?: string,
  selectedPlotVar?: string,
): DynamicPlotOption[] {
  if (!result || !filePath) return [];
  const plots: DynamicPlotOption[] = [];

  const indigoClass =
    "bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/50 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800";
  const violetClass =
    "bg-violet-50 hover:bg-violet-100 dark:bg-violet-950/50 dark:hover:bg-violet-900/60 text-violet-700 dark:text-violet-300 border-violet-200 dark:border-violet-800";
  const emeraldClass =
    "bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/50 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800";
  const roseClass =
    "bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/50 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800";
  const skyClass =
    "bg-sky-50 hover:bg-sky-100 dark:bg-sky-950/50 dark:hover:bg-sky-900/60 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-800";
  const amberClass =
    "bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/50 dark:hover:bg-amber-900/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800";
  const tealClass =
    "bg-teal-50 hover:bg-teal-100 dark:bg-teal-950/50 dark:hover:bg-teal-900/60 text-teal-700 dark:text-teal-300 border-teal-200 dark:border-teal-800";
  const blueClass =
    "bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/50 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800";

  if (result.analysis_type === "descriptive") {
    const targetVar = selectedPlotVar || result.results[0]?.variable;
    if (targetVar) {
      plots.push({
        id: "distribution_qq",
        label: "Histogram & Q-Q Plot",
        colorClass: indigoClass,
        buildRequest: () => ({
          file_path: filePath,
          plot_type: "distribution_qq",
          dependent: targetVar,
        }),
      });
    }
  } else if (result.analysis_type === "regression") {
    plots.push({
      id: "regression_diagnostics",
      label: "Residuals vs. Fitted & Normal Q-Q",
      colorClass: indigoClass,
      buildRequest: () => ({
        file_path: filePath,
        plot_type: "regression_diagnostics",
        dependent: result.dependent,
        independents: result.coefficients
          .filter((c) => c.variable !== "(Constant)")
          .map((c) => c.variable),
      }),
    });
  } else if (result.analysis_type === "logistic_regression") {
    plots.push({
      id: "roc_curve",
      label: "ROC Curve & AUC Shading",
      colorClass: violetClass,
      buildRequest: () => ({
        file_path: filePath,
        plot_type: "roc_curve",
        dependent: result.dependent,
        independents: result.independents,
        cutoff: result.cutoff,
      }),
    });
  } else if (result.analysis_type === "ttest_independent") {
    plots.push(
      {
        id: "mean_difference",
        label: "Mean Difference & 95% CI",
        colorClass: emeraldClass,
        buildRequest: () => ({
          file_path: filePath,
          plot_type: "mean_difference",
          dependent: result.test_variable,
          factor: result.group_variable,
          alternative: result.alternative || "two-sided",
        }),
      },
      {
        id: "critical_region",
        label: "Null Distribution & Critical Region",
        colorClass: roseClass,
        buildRequest: () => ({
          file_path: filePath,
          plot_type: "critical_region",
          dependent: result.test_variable,
          factor: result.group_variable,
          alternative: result.alternative || "two-sided",
        }),
      },
      {
        id: "group_comparison",
        label: "Group Comparison (Box & Scatter)",
        colorClass: indigoClass,
        buildRequest: () => ({
          file_path: filePath,
          plot_type: "group_comparison",
          dependent: result.test_variable,
          factor: result.group_variable,
        }),
      },
    );
  } else if (result.analysis_type === "ttest_one_sample") {
    plots.push(
      {
        id: "critical_region",
        label: "Null Distribution & Critical Region",
        colorClass: roseClass,
        buildRequest: () => ({
          file_path: filePath,
          plot_type: "critical_region",
          dependent: result.variable,
          test_value: result.test_value,
          alternative: result.alternative || "two-sided",
        }),
      },
      {
        id: "distribution_qq",
        label: "Distribution & Q-Q Plot",
        colorClass: indigoClass,
        buildRequest: () => ({
          file_path: filePath,
          plot_type: "distribution_qq",
          dependent: result.variable,
        }),
      },
    );
  } else if (result.analysis_type === "ttest_paired") {
    plots.push(
      {
        id: "paired_slopegraph",
        label: "Paired Observations Slopegraph",
        colorClass: skyClass,
        buildRequest: () => ({
          file_path: filePath,
          plot_type: "paired_slopegraph",
          var1: result.var1,
          var2: result.var2,
        }),
      },
      {
        id: "mean_difference",
        label: "Paired Difference & 95% CI",
        colorClass: emeraldClass,
        buildRequest: () => ({
          file_path: filePath,
          plot_type: "mean_difference",
          var1: result.var1,
          var2: result.var2,
          alternative: result.alternative || "two-sided",
        }),
      },
    );
  } else if (result.analysis_type === "anova_oneway") {
    plots.push({
      id: "group_comparison",
      label: "Group Comparison (Box & Scatter)",
      colorClass: indigoClass,
      buildRequest: () => ({
        file_path: filePath,
        plot_type: "group_comparison",
        dependent: result.dependent,
        factor: result.factor,
      }),
    });
  } else if (result.analysis_type === "anova_twoway") {
    plots.push({
      id: "two_way_interaction",
      label: "Cell Means Interaction Plot",
      colorClass: amberClass,
      buildRequest: () => ({
        file_path: filePath,
        plot_type: "two_way_interaction",
        dependent: (result as any).dependent,
        factor: (result as any).factor1,
        factor2: (result as any).factor2,
      }),
    });
  } else if (result.analysis_type === "ancova") {
    plots.push({
      id: "ancova_means",
      label: "Unadjusted vs. Adjusted Means",
      colorClass: tealClass,
      buildRequest: () => ({
        file_path: filePath,
        plot_type: "ancova_means",
        dependent: result.dependent,
        factor: result.factor,
        covariates: result.covariates,
      }),
    });
  } else if (
    result.analysis_type === "correlation_pearson" ||
    result.analysis_type === "correlation_spearman"
  ) {
    plots.push({
      id: "correlation_heatmap",
      label: "Correlation Matrix Heatmap",
      colorClass: violetClass,
      buildRequest: () => ({
        file_path: filePath,
        plot_type: "correlation_heatmap",
        variables:
          (result as any).variables ||
          Object.keys((result as any).matrix || {}),
      }),
    });
  } else if (result.analysis_type === "chisquare_independence") {
    plots.push({
      id: "chisquare_mosaic",
      label: "Observed vs. Expected Frequencies",
      colorClass: blueClass,
      buildRequest: () => ({
        file_path: filePath,
        plot_type: "chisquare_mosaic",
        factor: (result as any).row_variable,
        factor2: (result as any).col_variable,
      }),
    });
  } else if (result.analysis_type === "manova") {
    plots.push({
      id: "group_comparison",
      label: `Group Boxplot (${(result as any).dependents?.[0] || "DV 1"})`,
      colorClass: indigoClass,
      buildRequest: () => ({
        file_path: filePath,
        plot_type: "group_comparison",
        dependent: (result as any).dependents?.[0],
        factor: (result as any).factor,
      }),
    });
  }

  return plots;
}
