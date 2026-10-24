"""diagnostic_plots.py — Diagnostic & inferential hypothesis plotting functions."""

from __future__ import annotations

import logging
from pathlib import Path
from typing import Any

import matplotlib.pyplot as plt
import numpy as np
import statsmodels.api as sm
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


def plot_distribution_qq(
    file_path: Path, variable: str, project_dir: Path
) -> dict[str, Any]:
    """Generates a 2-panel Distribution & Q-Q Plot for continuous variable."""
    df_raw = _load_selected_columns(file_path, [variable])
    df, _ = sanitize_analysis_data(df_raw, [variable], missing_strategy="listwise")
    data = df[variable].dropna().astype(float).values

    if len(data) < 3:
        raise StatsError(
            f"Insufficient data ({len(data)} observations) to plot distribution for '{variable}'"
        )

    safe_var = _sanitize_filename(variable)
    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(9.5, 4.2), dpi=300)

    # Left: Histogram & Normal PDF
    n_bins = min(30, max(8, int(np.sqrt(len(data)))))
    ax1.hist(
        data,
        bins=n_bins,
        density=True,
        alpha=0.65,
        color="#3b82f6",
        edgecolor="#1d4ed8",
        linewidth=0.8,
        label="Observed",
    )
    mu, sigma = float(np.mean(data)), float(np.std(data, ddof=1))
    if sigma > 1e-12:
        x_grid = np.linspace(min(data), max(data), 200)
        ax1.plot(
            x_grid,
            stats.norm.pdf(x_grid, mu, sigma),
            color="#dc2626",
            linewidth=1.8,
            label="Normal PDF",
        )
    ax1.set_title(f"Distribution of {variable}", fontsize=11, fontweight="bold", pad=8)
    ax1.set_xlabel(variable, fontsize=9.5)
    ax1.set_ylabel("Density", fontsize=9.5)
    ax1.legend(loc="upper right", frameon=True, fontsize=8.5)
    ax1.grid(True, linestyle="--", alpha=0.35)

    # Right: Q-Q Plot
    (osm, osr), (slope, intercept, r_val) = stats.probplot(data, dist="norm")
    ax2.plot(
        osm,
        osr,
        "o",
        color="#4f46e5",
        alpha=0.75,
        markersize=4.5,
        label="Sample Quantiles",
    )
    ax2.plot(
        osm,
        slope * np.array(osm) + intercept,
        color="#dc2626",
        linewidth=1.8,
        label=f"Ref Line (R²={r_val**2:.3f})",
    )
    ax2.set_title("Normal Q-Q Plot", fontsize=11, fontweight="bold", pad=8)
    ax2.set_xlabel("Theoretical Quantiles", fontsize=9.5)
    ax2.set_ylabel("Ordered Sample Values", fontsize=9.5)
    ax2.legend(loc="upper left", frameon=True, fontsize=8.5)
    ax2.grid(True, linestyle="--", alpha=0.35)

    out_path, rel_path, data_url = _save_and_encode_fig(
        fig, project_dir, f"dist_qq_{safe_var}.png"
    )
    caption = f"Distribution and Normal Q-Q Plot for \\textit{{{variable}}}."
    label = f"fig:dist_{safe_var}"
    return {
        "plot_type": "distribution_qq",
        "variable": variable,
        "image_path": rel_path,
        "image_data_url": data_url,
        "absolute_path": str(out_path),
        "latex_snippet": generate_figure_latex_snippet(rel_path, caption, label),
        "caption": caption,
        "label": label,
    }


def plot_group_comparison(
    file_path: Path, dependent: str, factor: str, project_dir: Path
) -> dict[str, Any]:
    """Generates Box + Jittered Strip Plot comparing dependent across groups."""
    all_cols = [dependent, factor]
    df_raw = _load_selected_columns(file_path, all_cols)
    df, _ = sanitize_analysis_data(df_raw, all_cols, missing_strategy="listwise")
    df[dependent] = df[dependent].astype(float)
    df[factor] = df[factor].astype(str)

    groups = sorted(df[factor].unique().tolist())
    if len(groups) < 2:
        raise StatsError(
            f"Group comparison requires at least 2 distinct groups in '{factor}'"
        )

    group_data = [df[df[factor] == g][dependent].values for g in groups]
    safe_dep, safe_fac = _sanitize_filename(dependent), _sanitize_filename(factor)
    fig, ax = plt.subplots(figsize=(6.5, 4.5), dpi=300)

    bp = ax.boxplot(
        group_data,
        tick_labels=groups,
        patch_artist=True,
        showmeans=True,
        meanline=True,
        widths=0.45,
        medianprops={"color": "#1e293b", "linewidth": 1.5},
        meanprops={"color": "#dc2626", "linewidth": 1.6, "linestyle": "--"},
        flierprops={"marker": "", "color": "none"},
    )
    palette = ["#93c5fd", "#a7f3d0", "#fde68a", "#fbcfe8", "#c4b5fd", "#fed7aa"]
    for i, patch in enumerate(bp["boxes"]):
        patch.set_facecolor(palette[i % len(palette)])
        patch.set_edgecolor("#334155")
        patch.set_alpha(0.7)

    np.random.seed(42)
    for i, data_pts in enumerate(group_data):
        jitter = np.random.normal(0, 0.04, size=len(data_pts))
        ax.scatter(
            i + 1 + jitter, data_pts, color="#1e293b", alpha=0.55, s=16, zorder=3
        )

    ax.set_title(f"{dependent} by {factor}", fontsize=11.5, fontweight="bold", pad=10)
    ax.set_xlabel(factor, fontsize=10)
    ax.set_ylabel(dependent, fontsize=10)
    ax.grid(True, linestyle="--", alpha=0.35, axis="y")

    out_path, rel_path, data_url = _save_and_encode_fig(
        fig, project_dir, f"group_comp_{safe_dep}_{safe_fac}.png"
    )
    caption = f"Comparison of \\textit{{{dependent}}} across categories of \\textit{{{factor}}}."
    label = f"fig:group_{safe_dep}_{safe_fac}"
    return {
        "plot_type": "group_comparison",
        "dependent": dependent,
        "factor": factor,
        "image_path": rel_path,
        "image_data_url": data_url,
        "absolute_path": str(out_path),
        "latex_snippet": generate_figure_latex_snippet(rel_path, caption, label),
        "caption": caption,
        "label": label,
    }


def plot_regression_diagnostics(
    file_path: Path, dependent: str, independents: list[str], project_dir: Path
) -> dict[str, Any]:
    """Generates 2-panel Regression Diagnostics: Residuals vs Fitted & Residuals Q-Q Plot."""
    all_cols = [dependent] + independents
    df_raw = _load_selected_columns(file_path, all_cols)
    df, _ = sanitize_analysis_data(df_raw, all_cols, missing_strategy="listwise")

    y = df[dependent].astype(float)
    X = df[independents].astype(float)
    X_const = sm.add_constant(X)

    model = sm.OLS(y, X_const).fit()
    fitted, residuals = model.fittedvalues, model.resid
    std_residuals = model.get_influence().resid_studentized_internal

    safe_dep = _sanitize_filename(dependent)
    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(9.5, 4.2), dpi=300)

    # Panel 1: Residuals vs Fitted
    ax1.scatter(fitted, residuals, color="#2563eb", alpha=0.7, s=20)
    ax1.axhline(0, color="#dc2626", linestyle="--", linewidth=1.5)
    try:
        from statsmodels.nonparametric.smoothers_lowess import lowess

        smoothed = lowess(residuals, fitted)
        ax1.plot(
            smoothed[:, 0],
            smoothed[:, 1],
            color="#059669",
            linewidth=1.5,
            label="Loess Trend",
        )
        ax1.legend(loc="best", fontsize=8.5)
    except (ValueError, TypeError, ImportError, RuntimeError) as exc:
        logger.debug("Failed to compute lowess smoother: %s", exc)

    ax1.set_title("Residuals vs. Fitted", fontsize=11, fontweight="bold", pad=8)
    ax1.set_xlabel("Fitted Values", fontsize=9.5)
    ax1.set_ylabel("Residuals", fontsize=9.5)
    ax1.grid(True, linestyle="--", alpha=0.35)

    # Panel 2: Normal Q-Q of Studentized Residuals
    (osm, osr), (slope, intercept, r_val) = stats.probplot(std_residuals, dist="norm")
    ax2.plot(
        osm,
        osr,
        "o",
        color="#7c3aed",
        alpha=0.75,
        markersize=4.5,
        label="Studentized Residuals",
    )
    ax2.plot(
        osm,
        slope * np.array(osm) + intercept,
        color="#dc2626",
        linewidth=1.8,
        label=f"Ref Line (R²={r_val**2:.3f})",
    )
    ax2.set_title("Normal Q-Q of Residuals", fontsize=11, fontweight="bold", pad=8)
    ax2.set_xlabel("Theoretical Quantiles", fontsize=9.5)
    ax2.set_ylabel("Studentized Residuals", fontsize=9.5)
    ax2.legend(loc="upper left", frameon=True, fontsize=8.5)
    ax2.grid(True, linestyle="--", alpha=0.35)

    out_path, rel_path, data_url = _save_and_encode_fig(
        fig, project_dir, f"regr_diag_{safe_dep}.png"
    )
    caption = f"Multiple linear regression diagnostic plots predicting \\textit{{{dependent}}}."
    label = f"fig:regr_diag_{safe_dep}"
    return {
        "plot_type": "regression_diagnostics",
        "dependent": dependent,
        "independents": independents,
        "image_path": rel_path,
        "image_data_url": data_url,
        "absolute_path": str(out_path),
        "latex_snippet": generate_figure_latex_snippet(rel_path, caption, label),
        "caption": caption,
        "label": label,
    }


def plot_roc_curve(
    file_path: Path,
    dependent: str,
    independents: list[str],
    project_dir: Path,
    cutoff: float = 0.5,
) -> dict[str, Any]:
    """Generates ROC Curve with Area Under Curve (AUC) for Binary Logistic Regression."""
    from backend.services.stats_logistic import run_logistic_regression

    res = run_logistic_regression(
        file_path, dependent=dependent, independents=independents, cutoff=cutoff
    )
    roc_points = res["roc_curve"]
    auc, event_cat = res["classification"]["auc"], res["event_category"]
    fprs = [p["fpr"] for p in roc_points]
    tprs = [p["tpr"] for p in roc_points]

    safe_dep = _sanitize_filename(dependent)
    fig, ax = plt.subplots(figsize=(5.5, 5.0), dpi=300)

    ax.plot(
        fprs, tprs, color="#7c3aed", linewidth=2.2, label=f"ROC Curve (AUC = {auc:.3f})"
    )
    ax.fill_between(fprs, tprs, color="#ede9fe", alpha=0.5)
    ax.plot(
        [0, 1],
        [0, 1],
        color="#94a3b8",
        linestyle="--",
        linewidth=1.2,
        label="Chance Line",
    )

    sens = res["classification"]["sensitivity"]
    spec = res["classification"]["specificity"]
    ax.plot(
        1.0 - spec,
        sens,
        marker="o",
        markersize=7,
        color="#dc2626",
        label=f"Cutoff {cutoff:.2f} (Sens={sens:.2f}, Spec={spec:.2f})",
    )

    ax.set_title(
        f"ROC Curve: Predicting {dependent} ({event_cat})",
        fontsize=11,
        fontweight="bold",
        pad=8,
    )
    ax.set_xlabel("False Positive Rate (1 - Specificity)", fontsize=9.5)
    ax.set_ylabel("True Positive Rate (Sensitivity)", fontsize=9.5)
    ax.set_xlim([-0.02, 1.02])
    ax.set_ylim([-0.02, 1.02])
    ax.legend(loc="lower right", frameon=True, fontsize=8.5)
    ax.grid(True, linestyle="--", alpha=0.35)

    out_path, rel_path, data_url = _save_and_encode_fig(
        fig, project_dir, f"roc_{safe_dep}.png"
    )
    caption = f"Receiver Operating Characteristic (ROC) curve for \\textit{{{dependent}}} (AUC = {auc:.3f})."
    label = f"fig:roc_{safe_dep}"
    return {
        "plot_type": "roc_curve",
        "dependent": dependent,
        "auc": auc,
        "image_path": rel_path,
        "image_data_url": data_url,
        "absolute_path": str(out_path),
        "latex_snippet": generate_figure_latex_snippet(rel_path, caption, label),
        "caption": caption,
        "label": label,
    }


def plot_hypothesis_critical_region(
    file_path: Path,
    test_variable: str,
    group_variable: str | None,
    project_dir: Path,
    test_value: float = 0.0,
    alternative: str = "two-sided",
) -> dict[str, Any]:
    """Plots Null Hypothesis distribution (t-distribution) with rejection regions and observed test statistic."""
    if group_variable:
        all_cols = [test_variable, group_variable]
        df_raw = _load_selected_columns(file_path, all_cols)
        df, _ = sanitize_analysis_data(df_raw, all_cols, missing_strategy="listwise")
        df[test_variable] = df[test_variable].astype(float)
        df[group_variable] = df[group_variable].astype(str).str.strip()
        groups = sorted(df[group_variable].unique().tolist())
        if len(groups) < 2:
            raise StatsError(
                "Two-group hypothesis plot requires at least 2 distinct levels"
            )
        g1_val, g2_val = groups[0], groups[1]
        g1 = (
            df[df[group_variable] == g1_val][test_variable]
            .dropna()
            .astype(float)
            .values
        )
        g2 = (
            df[df[group_variable] == g2_val][test_variable]
            .dropna()
            .astype(float)
            .values
        )
        tt_res = stats.ttest_ind(g1, g2, alternative=alternative)
        df_deg = len(g1) + len(g2) - 2
        t_obs = float(tt_res.statistic)
        p_val = float(tt_res.pvalue)
        test_title = f"Two-Sample T-Test ({g1_val} vs {g2_val})"
    else:
        df_raw = _load_selected_columns(file_path, [test_variable])
        df, _ = sanitize_analysis_data(
            df_raw, [test_variable], missing_strategy="listwise"
        )
        vals = df[test_variable].dropna().astype(float).values
        tt_res = stats.ttest_1samp(vals, popmean=test_value, alternative=alternative)
        df_deg = len(vals) - 1
        t_obs = float(tt_res.statistic)
        p_val = float(tt_res.pvalue)
        test_title = f"One-Sample T-Test (Test Value = {test_value})"

    safe_test = _sanitize_filename(test_variable)
    x_max = max(4.5, abs(t_obs) + 1.5)
    x = np.linspace(-x_max, x_max, 500)
    y_curve = stats.t.pdf(x, df_deg)

    fig, ax = plt.subplots(figsize=(6.5, 4.2), dpi=300)
    ax.plot(
        x, y_curve, color="#1e293b", linewidth=1.8, label=f"t(df = {df_deg}) under H₀"
    )

    alpha = 0.05
    if alternative == "two-sided":
        t_crit = stats.t.ppf(1 - alpha / 2, df_deg)
        regions = [(x >= t_crit, t_crit), (x <= -t_crit, -t_crit)]
    elif alternative == "greater":
        t_crit = stats.t.ppf(1 - alpha, df_deg)
        regions = [(x >= t_crit, t_crit)]
    else:  # less
        t_crit = stats.t.ppf(alpha, df_deg)
        regions = [(x <= t_crit, t_crit)]

    labeled = False
    for mask, crit_line in regions:
        lbl = "Rejection Region (α = .05)" if not labeled else None
        ax.fill_between(x[mask], y_curve[mask], color="#ef4444", alpha=0.45, label=lbl)
        ax.axvline(crit_line, color="#b91c1c", linestyle=":", linewidth=1.2)
        labeled = True

    ax.axvline(
        t_obs,
        color="#2563eb",
        linewidth=2.0,
        linestyle="-",
        label=f"Observed t = {t_obs:.2f} (p = {p_val:.3e})",
    )

    p_str = "< .001" if p_val < 0.001 else f"= {p_val:.3f}"
    status_str = "H₀ REJECTED" if p_val < alpha else "FAIL TO REJECT H₀"
    status_bg = "#fef2f2" if p_val < alpha else "#f0fdf4"
    status_border = "#fca5a5" if p_val < alpha else "#86efac"

    ax.text(
        0.03,
        0.95,
        f"Hypothesis Decision: {status_str}\nt = {t_obs:.2f}, df = {df_deg}, p {p_str}",
        transform=ax.transAxes,
        fontsize=8.5,
        verticalalignment="top",
        bbox={
            "boxstyle": "round,pad=0.4",
            "facecolor": status_bg,
            "edgecolor": status_border,
            "alpha": 0.9,
        },
    )

    ax.set_title(
        f"Critical Rejection Region: {test_title}",
        fontsize=11,
        fontweight="bold",
        pad=8,
    )
    ax.set_xlabel("t-Statistic", fontsize=9.5)
    ax.set_ylabel("Probability Density", fontsize=9.5)
    ax.legend(loc="upper right", frameon=True, fontsize=8)
    ax.grid(True, linestyle="--", alpha=0.35)

    out_path, rel_path, data_url = _save_and_encode_fig(
        fig, project_dir, f"crit_region_{safe_test}.png"
    )
    caption = f"Null hypothesis test distribution showing critical rejection regions and observed test statistic for \\textit{{{test_variable}}}."
    label = f"fig:crit_region_{safe_test}"
    return {
        "plot_type": "hypothesis_critical_region",
        "test_variable": test_variable,
        "t_obs": float(t_obs),
        "df": float(df_deg),
        "p_value": float(p_val),
        "image_path": rel_path,
        "image_data_url": data_url,
        "absolute_path": str(out_path),
        "latex_snippet": generate_figure_latex_snippet(rel_path, caption, label),
        "caption": caption,
        "label": label,
    }
