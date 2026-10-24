import asyncio
from pathlib import Path
from typing import Any

from backend.services.stats_plots import generate_standardized_plot


async def _attach_concurrent_plot(
    project_dir: Path,
    target_file: Path,
    analysis_type: str,
    payload: Any,
    result: dict[str, Any],
) -> dict[str, Any]:
    if not getattr(payload, "include_plot", False):
        return result

    ptype = getattr(payload, "plot_type", None) or ""

    def _generate():
        if analysis_type == "descriptive":
            var = payload.variables[0] if getattr(payload, "variables", None) else None
            return generate_standardized_plot(
                target_file,
                ptype or "distribution_qq",
                project_dir,
                dependent=var,
            )
        elif analysis_type == "regression":
            return generate_standardized_plot(
                target_file,
                ptype or "regression_diagnostics",
                project_dir,
                dependent=payload.dependent,
                independents=payload.independents,
            )
        elif analysis_type == "logistic_regression":
            return generate_standardized_plot(
                target_file,
                ptype or "roc_curve",
                project_dir,
                dependent=payload.dependent,
                independents=payload.independents,
                cutoff=getattr(payload, "cutoff", 0.5),
            )
        elif analysis_type == "manova":
            first_dep = (
                payload.dependents[0] if getattr(payload, "dependents", None) else None
            )
            return generate_standardized_plot(
                target_file,
                ptype or "group_comparison",
                project_dir,
                dependent=first_dep,
                factor=payload.factor,
            )
        elif analysis_type == "ttest_one_sample":
            return generate_standardized_plot(
                target_file,
                ptype or "distribution_qq",
                project_dir,
                dependent=payload.variable,
                test_value=getattr(payload, "test_value", 0.0),
                alternative=getattr(payload, "alternative", "two-sided"),
            )
        elif analysis_type in ("ttest_independent", "mann_whitney"):
            return generate_standardized_plot(
                target_file,
                ptype or "group_comparison",
                project_dir,
                dependent=payload.test_variable,
                factor=payload.group_variable,
                alternative=getattr(payload, "alternative", "two-sided"),
            )
        elif analysis_type in ("ttest_paired", "wilcoxon"):
            return generate_standardized_plot(
                target_file,
                ptype or "paired_slopegraph",
                project_dir,
                var1=payload.var1,
                var2=payload.var2,
                alternative=getattr(payload, "alternative", "two-sided"),
            )
        elif analysis_type in ("anova_oneway", "kruskal"):
            return generate_standardized_plot(
                target_file,
                ptype or "group_comparison",
                project_dir,
                dependent=payload.dependent,
                factor=payload.factor,
            )
        elif analysis_type == "anova_twoway":
            return generate_standardized_plot(
                target_file,
                ptype or "two_way_interaction",
                project_dir,
                dependent=payload.dependent,
                factor=payload.factor1,
                factor2=payload.factor2,
            )
        elif analysis_type == "ancova":
            return generate_standardized_plot(
                target_file,
                ptype or "ancova_means",
                project_dir,
                dependent=payload.dependent,
                factor=payload.factor,
                covariates=payload.covariates,
            )
        elif analysis_type in ("correlation_pearson", "correlation_spearman"):
            method = "spearman" if "spearman" in analysis_type else "pearson"
            return generate_standardized_plot(
                target_file,
                ptype or f"correlation_heatmap_{method}",
                project_dir,
                variables=payload.variables,
            )
        elif analysis_type in ("chisquare", "chisquare_independence"):
            return generate_standardized_plot(
                target_file,
                ptype or "chisquare_mosaic",
                project_dir,
                factor=payload.row_variable,
                factor2=payload.col_variable,
            )
        return None

    try:
        plot_res = await asyncio.to_thread(_generate)
        if plot_res:
            result["plot"] = plot_res
    except Exception as e:  # noqa: BLE001
        result["plot_error"] = str(e)

    return result
