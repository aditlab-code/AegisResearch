"""interaction_plots.py — Interaction, paired, ANCOVA, and mean difference plots."""

from __future__ import annotations

import logging
import math
from pathlib import Path
from typing import Any

import matplotlib.pyplot as plt
import numpy as np
from scipy import stats

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

logger = logging.getLogger(__name__)


def plot_paired_slopegraph(
    file_path: Path,
    var1: str,
    var2: str,
    project_dir: Path,
) -> dict[str, Any]:
    """Generates a Before-After Paired Slopegraph connecting matched observations."""
    df_raw = _load_selected_columns(file_path, [var1, var2])
    df, _ = sanitize_analysis_data(df_raw, [var1, var2], missing_strategy="listwise")

    s1, s2 = df[var1].astype(float).values, df[var2].astype(float).values
    n = len(s1)
    if n < 3:
        raise StatsError("Paired slopegraph requires at least 3 paired observations")

    safe_v1, safe_v2 = _sanitize_filename(var1), _sanitize_filename(var2)
    fig, ax = plt.subplots(figsize=(6.0, 4.5), dpi=300)

    max_lines = min(n, 500)
    indices = (
        np.random.choice(n, size=max_lines, replace=False)
        if n > max_lines
        else range(n)
    )

    for idx in indices:
        line_color = "#93c5fd" if (s2[idx] - s1[idx]) >= 0 else "#fca5a5"
        ax.plot([1, 2], [s1[idx], s2[idx]], color=line_color, alpha=0.35, linewidth=0.9)

    m1, m2 = float(np.mean(s1)), float(np.mean(s2))
    ax.plot(
        [1, 2],
        [m1, m2],
        color="#1d4ed8",
        linewidth=2.8,
        marker="o",
        markersize=8,
        label=f"Mean Trend ({m1:.2f} → {m2:.2f}, Δ = {m2 - m1:+.2f})",
        zorder=5,
    )

    ax.set_xticks([1, 2])
    ax.set_xticklabels([var1, var2], fontsize=10.5, fontweight="bold")
    ax.set_ylabel("Measured Value", fontsize=10)
    ax.set_title(
        f"Paired Observations: {var1} vs. {var2}",
        fontsize=11,
        fontweight="bold",
        pad=10,
    )
    ax.legend(loc="upper left", frameon=True, fontsize=8.5)
    ax.grid(True, linestyle="--", alpha=0.35, axis="y")

    out_path, rel_path, data_url = _save_and_encode_fig(
        fig, project_dir, f"paired_slope_{safe_v1}_{safe_v2}.png"
    )
    caption = f"Paired observations slopegraph comparing \\textit{{{var1}}} and \\textit{{{var2}}} with overall mean trajectory."
    label = f"fig:paired_slope_{safe_v1}_{safe_v2}"

    return {
        "plot_type": "paired_slopegraph",
        "var1": var1,
        "var2": var2,
        "mean1": m1,
        "mean2": m2,
        "mean_diff": m2 - m1,
        "image_path": rel_path,
        "image_data_url": data_url,
        "absolute_path": str(out_path),
        "latex_snippet": generate_figure_latex_snippet(rel_path, caption, label),
        "caption": caption,
        "label": label,
    }


def plot_two_way_interaction(
    file_path: Path,
    dependent: str,
    factor1: str,
    factor2: str,
    project_dir: Path,
) -> dict[str, Any]:
    """Generates an Interaction Line Plot for Two-Way ANOVA displaying cell means."""
    cols = [dependent, factor1, factor2]
    df_raw = _load_selected_columns(file_path, cols)
    df, _ = sanitize_analysis_data(df_raw, cols, missing_strategy="listwise")
    df[dependent] = df[dependent].astype(float)
    df[factor1] = df[factor1].astype(str)
    df[factor2] = df[factor2].astype(str)

    f1_levels = sorted(df[factor1].unique().tolist())
    f2_levels = sorted(df[factor2].unique().tolist())
    if len(f1_levels) < 2 or len(f2_levels) < 2:
        raise StatsError(
            "Two-way interaction plot requires at least 2 levels in each factor"
        )

    safe_dep = _sanitize_filename(dependent)
    safe_f1, safe_f2 = _sanitize_filename(factor1), _sanitize_filename(factor2)
    fig, ax = plt.subplots(figsize=(6.8, 4.5), dpi=300)
    palette = ["#2563eb", "#dc2626", "#059669", "#7c3aed", "#d97706", "#0891b2"]
    markers = ["o", "s", "^", "D", "v", "<"]
    x_indices = np.arange(len(f1_levels))

    for idx, f2_val in enumerate(f2_levels):
        means, sems = [], []
        for f1_val in f1_levels:
            sub = df[(df[factor1] == f1_val) & (df[factor2] == f2_val)][dependent]
            if len(sub) > 0:
                means.append(float(sub.mean()))
                sems.append(
                    float(sub.std() / math.sqrt(len(sub))) if len(sub) > 1 else 0.0
                )
            else:
                means.append(float("nan"))
                sems.append(0.0)

        ax.errorbar(
            x_indices,
            means,
            yerr=sems,
            color=palette[idx % len(palette)],
            marker=markers[idx % len(markers)],
            markersize=6.5,
            linewidth=1.8,
            capsize=4,
            label=f"{factor2} = {f2_val}",
        )

    ax.set_xticks(x_indices)
    ax.set_xticklabels(f1_levels, fontsize=10)
    ax.set_xlabel(factor1, fontsize=10, fontweight="bold")
    ax.set_ylabel(f"Mean {dependent}", fontsize=10, fontweight="bold")
    ax.set_title(
        f"Interaction Plot: {factor1} × {factor2} on {dependent}",
        fontsize=11,
        fontweight="bold",
        pad=10,
    )
    ax.legend(title=factor2, loc="best", frameon=True, fontsize=8.5)
    ax.grid(True, linestyle="--", alpha=0.35)

    out_path, rel_path, data_url = _save_and_encode_fig(
        fig, project_dir, f"inter_{safe_dep}_{safe_f1}_{safe_f2}.png"
    )
    caption = f"Two-way interaction plot for \\textit{{{dependent}}} across levels of \\textit{{{factor1}}} and \\textit{{{factor2}}} (cell means with standard error bars)."
    label = f"fig:inter_{safe_dep}_{safe_f1}_{safe_f2}"

    return {
        "plot_type": "two_way_interaction",
        "dependent": dependent,
        "factor1": factor1,
        "factor2": factor2,
        "image_path": rel_path,
        "image_data_url": data_url,
        "absolute_path": str(out_path),
        "latex_snippet": generate_figure_latex_snippet(rel_path, caption, label),
        "caption": caption,
        "label": label,
    }


def plot_ancova_means(
    file_path: Path,
    dependent: str,
    factor: str,
    covariates: list[str],
    project_dir: Path,
) -> dict[str, Any]:
    """Generates a Bar Chart comparing unadjusted group means vs. ANCOVA adjusted means."""
    cols = [dependent, factor] + covariates
    df_raw = _load_selected_columns(file_path, cols)
    df, _ = sanitize_analysis_data(df_raw, cols, missing_strategy="listwise")
    df[dependent] = df[dependent].astype(float)
    df[factor] = df[factor].astype(str)
    for cov in covariates:
        df[cov] = df[cov].astype(float)

    groups = sorted(df[factor].unique().tolist())
    if len(groups) < 2:
        raise StatsError("ANCOVA plot requires at least 2 distinct factor levels")

    cov_means = {cov: df[cov].mean() for cov in covariates}
    unadj_means = [float(df[df[factor] == g][dependent].mean()) for g in groups]

    try:
        import pandas as pd
        import statsmodels.formula.api as smf

        formula = f"{dependent} ~ C({factor}) + " + " + ".join(covariates)
        model = smf.ols(formula, data=df).fit()
        adj_means = []
        for g in groups:
            pred_row = {factor: g}
            pred_row.update(cov_means)
            pred_df = pd.DataFrame([pred_row])
            adj_means.append(float(model.predict(pred_df).iloc[0]))
    except (ValueError, TypeError, ImportError, RuntimeError, KeyError) as exc:
        logger.warning(
            "Failed to fit ANCOVA model for adjusted means, using unadjusted: %s", exc
        )
        adj_means = list(unadj_means)

    safe_dep, safe_fac = _sanitize_filename(dependent), _sanitize_filename(factor)
    fig, ax = plt.subplots(figsize=(6.5, 4.5), dpi=300)
    x = np.arange(len(groups))
    width = 0.35

    ax.bar(
        x - width / 2,
        unadj_means,
        width,
        label="Unadjusted Mean",
        color="#93c5fd",
        edgecolor="#1e40af",
    )
    ax.bar(
        x + width / 2,
        adj_means,
        width,
        label="Covariate-Adjusted Mean",
        color="#a7f3d0",
        edgecolor="#065f46",
    )

    ax.set_xticks(x)
    ax.set_xticklabels(groups, fontsize=10)
    ax.set_xlabel(factor, fontsize=10, fontweight="bold")
    ax.set_ylabel(dependent, fontsize=10, fontweight="bold")
    ax.set_title(
        f"ANCOVA: Unadjusted vs. Adjusted Means ({dependent})",
        fontsize=11,
        fontweight="bold",
        pad=10,
    )
    ax.legend(loc="upper right", frameon=True, fontsize=8.5)
    ax.grid(True, linestyle="--", alpha=0.35, axis="y")

    out_path, rel_path, data_url = _save_and_encode_fig(
        fig, project_dir, f"ancova_means_{safe_dep}_{safe_fac}.png"
    )
    caption = f"Comparison of unadjusted and covariate-adjusted marginal means for \\textit{{{dependent}}} across \\textit{{{factor}}} levels."
    label = f"fig:ancova_means_{safe_dep}_{safe_fac}"

    return {
        "plot_type": "ancova_means",
        "dependent": dependent,
        "factor": factor,
        "groups": groups,
        "unadjusted_means": unadj_means,
        "adjusted_means": adj_means,
        "image_path": rel_path,
        "image_data_url": data_url,
        "absolute_path": str(out_path),
        "latex_snippet": generate_figure_latex_snippet(rel_path, caption, label),
        "caption": caption,
        "label": label,
    }


def plot_mean_difference_ci(
    file_path: Path,
    test_variable: str,
    group_variable: str,
    project_dir: Path,
    alternative: str = "two-sided",
) -> dict[str, Any]:
    """Plots Mean Difference between 2 groups with 95% Confidence Interval error bar."""
    all_cols = [test_variable, group_variable]
    df_raw = _load_selected_columns(file_path, all_cols)
    df, _ = sanitize_analysis_data(df_raw, all_cols, missing_strategy="listwise")
    df[test_variable] = df[test_variable].astype(float)
    df[group_variable] = df[group_variable].astype(str).str.strip()

    groups = sorted(df[group_variable].unique().tolist())
    if len(groups) < 2:
        raise StatsError(
            f"Mean Difference plot requires at least 2 distinct groups in '{group_variable}', found {len(groups)}"
        )

    g1_val, g2_val = groups[0], groups[1]
    g1_data = (
        df[df[group_variable] == g1_val][test_variable].dropna().astype(float).values
    )
    g2_data = (
        df[df[group_variable] == g2_val][test_variable].dropna().astype(float).values
    )

    n1, n2 = len(g1_data), len(g2_data)
    if n1 < 2 or n2 < 2:
        raise StatsError(
            "Each group must have at least 2 observations for difference testing"
        )

    m1, m2 = float(np.mean(g1_data)), float(np.mean(g2_data))
    v1, v2 = float(np.var(g1_data, ddof=1)), float(np.var(g2_data, ddof=1))
    diff = m1 - m2
    se_diff = math.sqrt(v1 / n1 + v2 / n2)

    # Welch df
    num = (v1 / n1 + v2 / n2) ** 2
    denom = ((v1 / n1) ** 2 / (n1 - 1)) + ((v2 / n2) ** 2 / (n2 - 1))
    df_welch = (num / denom) if denom > 0 else (n1 + n2 - 2)

    t_crit = stats.t.ppf(0.975, df_welch)
    ci_lower = diff - t_crit * se_diff
    ci_upper = diff + t_crit * se_diff
    is_significant = (ci_lower > 0 and ci_upper > 0) or (ci_lower < 0 and ci_upper < 0)

    safe_test, safe_grp = (
        _sanitize_filename(test_variable),
        _sanitize_filename(group_variable),
    )
    fig, ax = plt.subplots(figsize=(6.0, 4.0), dpi=300)

    ax.axhline(
        0, color="#94a3b8", linestyle="--", linewidth=1.5, label="H₀: No Difference (0)"
    )

    point_color = "#059669" if is_significant else "#4f46e5"
    err_color = "#10b981" if is_significant else "#6366f1"

    y_err = [[diff - ci_lower], [ci_upper - diff]]
    ax.errorbar(
        [1],
        [diff],
        yerr=y_err,
        fmt="o",
        color=point_color,
        ecolor=err_color,
        elinewidth=2.2,
        capsize=7,
        capthick=2,
        markersize=9,
        label=f"Mean Diff: {diff:.2f}",
    )

    sig_label = (
        "Statistically Significant (p < .05)"
        if is_significant
        else "Not Significant (p ≥ .05)"
    )
    ax.text(
        1.08,
        diff,
        f"Δ = {diff:.2f}\n95% CI [{ci_lower:.2f}, {ci_upper:.2f}]\n({sig_label})",
        fontsize=9,
        verticalalignment="center",
        bbox={
            "boxstyle": "round,pad=0.4",
            "facecolor": "#f8fafc",
            "edgecolor": "#cbd5e1",
            "alpha": 0.9,
        },
    )

    ax.set_xlim([0.6, 1.5])
    padding = max(abs(diff) * 0.4, (ci_upper - ci_lower) * 0.25, 0.5)
    ax.set_ylim([min(0, ci_lower) - padding, max(0, ci_upper) + padding])
    ax.set_xticks([1])
    ax.set_xticklabels([f"{g1_val} vs. {g2_val}"], fontsize=10, fontweight="bold")
    ax.set_ylabel(f"Difference in {test_variable}", fontsize=10)
    ax.set_title(
        f"Hypothesis Test: Mean Difference & 95% CI ({test_variable})",
        fontsize=11,
        fontweight="bold",
        pad=10,
    )
    ax.legend(loc="upper left", frameon=True, fontsize=8.5)
    ax.grid(True, linestyle="--", alpha=0.35, axis="y")

    out_path, rel_path, data_url = _save_and_encode_fig(
        fig, project_dir, f"mean_diff_{safe_test}_{safe_grp}.png"
    )
    caption = f"Hypothesis testing plot showing mean difference and 95\\% confidence interval for \\textit{{{test_variable}}} across \\textit{{{group_variable}}} ({g1_val} vs. {g2_val})."
    label = f"fig:mean_diff_{safe_test}_{safe_grp}"

    return {
        "plot_type": "mean_difference_ci",
        "test_variable": test_variable,
        "group_variable": group_variable,
        "difference": float(diff),
        "ci_lower": float(ci_lower),
        "ci_upper": float(ci_upper),
        "significant": bool(is_significant),
        "image_path": rel_path,
        "image_data_url": data_url,
        "absolute_path": str(out_path),
        "latex_snippet": generate_figure_latex_snippet(rel_path, caption, label),
        "caption": caption,
        "label": label,
    }
