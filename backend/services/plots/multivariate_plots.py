"""multivariate_plots.py — Correlation heatmap, chi-square mosaic, and master standardized plot dispatcher."""

from __future__ import annotations

from pathlib import Path
from typing import Any

import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
from scipy import stats

from backend.services.plots.diagnostic_plots import (
    plot_distribution_qq,
    plot_group_comparison,
    plot_hypothesis_critical_region,
    plot_regression_diagnostics,
    plot_roc_curve,
)
from backend.services.plots.interaction_plots import (
    plot_ancova_means,
    plot_mean_difference_ci,
    plot_paired_slopegraph,
    plot_two_way_interaction,
)
from backend.services.plots.plot_core import (
    _sanitize_filename,
    _save_and_encode_fig,
    generate_figure_latex_snippet,
)
from backend.services.stats import (
    StatsError,
    _load_selected_columns,
    sanitize_analysis_data,
)


def plot_correlation_heatmap(
    file_path: Path,
    variables: list[str],
    project_dir: Path,
    method: str = "pearson",
) -> dict[str, Any]:
    """Generates an Annotated Correlation Matrix Heatmap with colorbar."""
    if len(variables) < 2:
        raise StatsError("Correlation heatmap requires at least 2 variables")

    df_raw = _load_selected_columns(file_path, variables)
    df, _ = sanitize_analysis_data(df_raw, variables, missing_strategy="pairwise")

    corr_df = df[variables].corr(method=method)
    matrix = corr_df.values
    filename = f"corr_heatmap_{method}_{len(variables)}vars.png"

    fig, ax = plt.subplots(figsize=(6.0, 5.0), dpi=300)
    cax = ax.imshow(matrix, cmap="coolwarm", vmin=-1.0, vmax=1.0)
    cbar = fig.colorbar(cax, ax=ax, fraction=0.046, pad=0.04)
    cbar.set_label(f"{method.capitalize()} Correlation (r)", fontsize=9)

    ax.set_xticks(range(len(variables)))
    ax.set_yticks(range(len(variables)))
    ax.set_xticklabels(variables, rotation=45, ha="right", fontsize=9)
    ax.set_yticklabels(variables, fontsize=9)

    for i in range(len(variables)):
        for j in range(len(variables)):
            val = matrix[i, j]
            text_color = "white" if abs(val) > 0.6 else "black"
            ax.text(
                j,
                i,
                f"{val:.2f}",
                ha="center",
                va="center",
                color=text_color,
                fontsize=8.5,
                fontweight="bold",
            )

    ax.set_title(
        f"{method.capitalize()} Correlation Heatmap",
        fontsize=11,
        fontweight="bold",
        pad=12,
    )

    out_path, rel_path, data_url = _save_and_encode_fig(fig, project_dir, filename)
    var_list_tex = ", ".join([f"\\textit{{{v}}}" for v in variables])
    caption = f"{method.capitalize()} correlation matrix heatmap for variables: {var_list_tex}."
    label = f"fig:corr_heatmap_{method}"

    return {
        "plot_type": "correlation_heatmap",
        "method": method,
        "variables": variables,
        "image_path": rel_path,
        "image_data_url": data_url,
        "absolute_path": str(out_path),
        "latex_snippet": generate_figure_latex_snippet(rel_path, caption, label),
        "caption": caption,
        "label": label,
    }


def plot_chisquare_mosaic(
    file_path: Path,
    row_var: str,
    col_var: str,
    project_dir: Path,
) -> dict[str, Any]:
    """Generates a Grouped Bar Chart comparing Observed vs. Expected contingency frequencies."""
    cols = [row_var, col_var]
    df_raw = _load_selected_columns(file_path, cols)
    df, _ = sanitize_analysis_data(df_raw, cols, missing_strategy="listwise")
    df[row_var] = df[row_var].astype(str).str.strip()
    df[col_var] = df[col_var].astype(str).str.strip()

    ct = pd.crosstab(df[row_var], df[col_var])
    chi2, p, _dof, expected = stats.chi2_contingency(ct)
    expected_df = pd.DataFrame(expected, index=ct.index, columns=ct.columns)

    safe_r, safe_c = _sanitize_filename(row_var), _sanitize_filename(col_var)
    filename = f"chi2_freq_{safe_r}_{safe_c}.png"

    fig, ax = plt.subplots(figsize=(7.0, 4.5), dpi=300)
    row_levels = list(ct.index)
    col_levels = list(ct.columns)
    x = np.arange(len(row_levels))
    width = 0.8 / (len(col_levels) * 2)

    palette_obs = ["#3b82f6", "#10b981", "#8b5cf6", "#f59e0b", "#ef4444"]
    palette_exp = ["#93c5fd", "#6ee7b7", "#c4b5fd", "#fde68a", "#fca5a5"]

    for j, c in enumerate(col_levels):
        obs_vals = [ct.loc[r, c] for r in row_levels]
        exp_vals = [expected_df.loc[r, c] for r in row_levels]
        color_o = palette_obs[j % len(palette_obs)]
        color_e = palette_exp[j % len(palette_exp)]

        offset = (j - len(col_levels) / 2) * (width * 2) + width / 2
        ax.bar(
            x + offset,
            obs_vals,
            width,
            label=f"Obs ({c})",
            color=color_o,
            edgecolor="#1e293b",
            linewidth=0.5,
        )
        ax.bar(
            x + offset + width,
            exp_vals,
            width,
            label=f"Exp ({c})",
            color=color_e,
            edgecolor="#64748b",
            linestyle="--",
            linewidth=0.5,
        )

    ax.set_xticks(x)
    ax.set_xticklabels(row_levels, fontsize=9.5)
    ax.set_xlabel(row_var, fontsize=10, fontweight="bold")
    ax.set_ylabel("Frequencies / Counts", fontsize=10, fontweight="bold")
    ax.set_title(
        f"Contingency Frequencies: {row_var} × {col_var} (χ² = {chi2:.2f}, p = {p:.3e})",
        fontsize=11,
        fontweight="bold",
        pad=10,
    )
    ax.legend(bbox_to_anchor=(1.02, 1), loc="upper left", frameon=True, fontsize=8)
    ax.grid(True, linestyle="--", alpha=0.35, axis="y")

    out_path, rel_path, data_url = _save_and_encode_fig(fig, project_dir, filename)
    caption = f"Observed vs. expected contingency table frequencies for \\textit{{{row_var}}} by \\textit{{{col_var}}} ($\\chi^2 = {chi2:.2f}, p = {p:.3e}$)."
    label = f"fig:chi2_{safe_r}_{safe_c}"

    return {
        "plot_type": "chisquare_mosaic",
        "row_var": row_var,
        "col_var": col_var,
        "chi2": float(chi2),
        "p_value": float(p),
        "image_path": rel_path,
        "image_data_url": data_url,
        "absolute_path": str(out_path),
        "latex_snippet": generate_figure_latex_snippet(rel_path, caption, label),
        "caption": caption,
        "label": label,
    }


def generate_standardized_plot(
    file_path: Path,
    plot_type: str,
    project_dir: Path,
    *,
    dependent: str | None = None,
    factor: str | None = None,
    factor2: str | None = None,
    independents: list[str] | None = None,
    variables: list[str] | None = None,
    covariates: list[str] | None = None,
    var1: str | None = None,
    var2: str | None = None,
    test_value: float = 0.0,
    alternative: str = "two-sided",
    cutoff: float = 0.5,
) -> dict[str, Any]:
    """Master Unified Dispatcher: Generates publication-ready diagnostic plots with 0-latency Base64 Dual Delivery."""
    ptype = plot_type.strip().lower()

    if ptype in ("distribution_qq", "distribution", "dist_qq"):
        target_var = dependent or (variables[0] if variables else None) or var1
        if not target_var:
            raise StatsError("Distribution plot requires a target variable.")
        return plot_distribution_qq(file_path, target_var, project_dir)

    elif ptype in ("group_comparison", "group_comp"):
        dep = dependent or var1
        grp = factor or var2
        if not dep or not grp:
            raise StatsError(
                "Group comparison plot requires both a dependent and a factor variable."
            )
        return plot_group_comparison(file_path, dep, grp, project_dir)

    elif ptype in ("regression_diagnostics", "reg_diag"):
        if not dependent or not independents:
            raise StatsError(
                "Regression diagnostics plot requires dependent and independent variables."
            )
        return plot_regression_diagnostics(
            file_path, dependent, independents, project_dir
        )

    elif ptype in ("roc_curve", "roc"):
        if not dependent or not independents:
            raise StatsError(
                "ROC curve plot requires dependent and independent variables."
            )
        return plot_roc_curve(
            file_path, dependent, independents, project_dir, cutoff=cutoff
        )

    elif ptype in ("mean_difference", "mean_diff"):
        dep = dependent or var1
        grp = factor or var2
        if not dep or not grp:
            raise StatsError(
                "Mean difference plot requires both a test variable and a group variable."
            )
        return plot_mean_difference_ci(
            file_path, dep, grp, project_dir, alternative=alternative
        )

    elif ptype in ("critical_region", "crit_region"):
        dep = dependent or var1
        grp = factor or var2
        if not dep:
            raise StatsError("Critical region plot requires a test variable.")
        return plot_hypothesis_critical_region(
            file_path,
            dep,
            grp,
            project_dir,
            test_value=test_value,
            alternative=alternative,
        )

    elif ptype in ("paired_slopegraph", "paired_slope"):
        v1 = var1 or (variables[0] if variables and len(variables) > 0 else None)
        v2 = var2 or (variables[1] if variables and len(variables) > 1 else None)
        if not v1 or not v2:
            raise StatsError(
                "Paired slopegraph requires two paired variables (var1, var2)."
            )
        return plot_paired_slopegraph(file_path, v1, v2, project_dir)

    elif ptype in ("two_way_interaction", "interaction"):
        if not dependent or not factor or not factor2:
            raise StatsError(
                "Interaction plot requires dependent, factor, and factor2."
            )
        return plot_two_way_interaction(
            file_path, dependent, factor, factor2, project_dir
        )

    elif ptype in ("ancova_means", "ancova"):
        if not dependent or not factor or not covariates:
            raise StatsError("ANCOVA plot requires dependent, factor, and covariates.")
        return plot_ancova_means(file_path, dependent, factor, covariates, project_dir)

    elif (
        ptype in ("correlation_heatmap", "heatmap")
        or "correlation" in ptype
        or "heatmap" in ptype
    ):
        vars_to_use = (
            variables
            or independents
            or ([dependent, factor] if dependent and factor else [])
        )
        if not vars_to_use or len(vars_to_use) < 2:
            raise StatsError("Correlation heatmap requires at least 2 variables.")
        method = "spearman" if "spearman" in ptype else "pearson"
        return plot_correlation_heatmap(
            file_path, vars_to_use, project_dir, method=method
        )

    elif ptype in ("chisquare_mosaic", "mosaic", "chi2"):
        r_var = factor or var1 or (variables[0] if variables else None)
        c_var = (
            factor2
            or var2
            or (variables[1] if variables and len(variables) > 1 else None)
        )
        if not r_var or not c_var:
            raise StatsError(
                "Chi-square frequency plot requires row and column variables."
            )
        return plot_chisquare_mosaic(file_path, r_var, c_var, project_dir)

    else:
        raise StatsError(f"Unsupported plot type '{plot_type}'.")
