"""Parametric ANOVA and ANCOVA statistical routines."""

from __future__ import annotations

import logging
import math
from pathlib import Path
from typing import Any

from backend.services.stats.descriptive import StatsError, _load_selected_columns
from backend.services.stats.parametric_basic import _calc_shapiro

logger = logging.getLogger(__name__)


def run_anova_oneway(
    file_path: Path, dependent: str, factor: str, post_hoc: bool = True
) -> dict[str, Any]:
    """Computes One-Way ANOVA with group statistics and Tukey HSD post-hoc."""
    df = _load_selected_columns(file_path, [dependent, factor]).dropna()
    df[dependent] = df[dependent].astype(float)

    try:
        import numpy as np
        from scipy import stats
        from statsmodels.stats.multicomp import pairwise_tukeyhsd
    except ImportError as e:
        raise StatsError("SciPy and Statsmodels are required for ANOVA") from e

    unique_factors = df[factor].unique()
    if len(unique_factors) < 2:
        raise StatsError(
            f"ANOVA requires at least 2 groups in Factor '{factor}', found {len(unique_factors)}"
        )

    grouped_data = [
        df[df[factor] == f_val][dependent].values for f_val in unique_factors
    ]
    total_n = len(df)
    k = len(unique_factors)

    f_res = stats.f_oneway(*grouped_data)
    f_stat = float(f_res.statistic)
    p_val = float(f_res.pvalue)

    grand_mean = float(df[dependent].mean())
    ss_total = float(np.sum((df[dependent].values - grand_mean) ** 2))
    ss_between = float(
        np.sum(
            [
                len(g) * (np.mean(g) - grand_mean) ** 2
                for g in grouped_data
                if len(g) > 0
            ]
        )
    )
    ss_within = max(0.0, ss_total - ss_between)

    df_between = k - 1
    df_within = total_n - k
    ms_between = (ss_between / df_between) if df_between > 0 else 0.0
    ms_within = (ss_within / df_within) if df_within > 0 else 0.0
    eta_sq = (ss_between / ss_total) if ss_total > 0 else 0.0

    group_stats = []
    for f_val in unique_factors:
        sub = df[df[factor] == f_val][dependent]
        group_stats.append(
            {
                "group": str(f_val),
                "n": len(sub),
                "mean": float(sub.mean()),
                "std": float(sub.std(ddof=1)) if len(sub) > 1 else 0.0,
            }
        )

    pairwise_comps = []
    if post_hoc and k >= 3:
        try:
            tukey = pairwise_tukeyhsd(
                endog=df[dependent], groups=df[factor], alpha=0.05
            )
            for row in tukey._results_table.data[1:]:
                pairwise_comps.append(
                    {
                        "group1": str(row[0]),
                        "group2": str(row[1]),
                        "mean_diff": float(row[2]),
                        "p_adj": float(row[3]),
                        "ci_lower": float(row[4]),
                        "ci_upper": float(row[5]),
                        "reject": bool(row[6]),
                    }
                )
        except Exception as e:  # noqa: BLE001
            logger.debug("Tukey HSD post-hoc calculation failed: %s", e)

    residuals_list = [
        np.asarray(g_data) - np.mean(g_data)
        for g_data in grouped_data
        if len(g_data) > 0
    ]
    residuals = np.concatenate(residuals_list) if residuals_list else np.array([])
    residuals_normality = _calc_shapiro(residuals)

    levene_test = None
    try:
        valid_groups = [g for g in grouped_data if len(g) > 1]
        if len(valid_groups) >= 2:
            lev_res = stats.levene(*valid_groups, center="mean")
            levene_test = {
                "statistic": float(lev_res.statistic),
                "p_value": float(lev_res.pvalue),
                "assumption_met": bool(lev_res.pvalue >= 0.05),
            }
    except Exception as e:  # noqa: BLE001
        logger.debug("Levene test in one-way ANOVA failed: %s", e)

    return {
        "analysis_type": "anova_oneway",
        "dependent": dependent,
        "factor": factor,
        "total_n": total_n,
        "k_groups": k,
        "ss_between": ss_between,
        "df_between": df_between,
        "ms_between": ms_between,
        "ss_within": ss_within,
        "df_within": df_within,
        "ms_within": ms_within,
        "ss_total": ss_total,
        "f_statistic": f_stat,
        "p_value": p_val,
        "eta_squared": eta_sq,
        "residuals_normality": residuals_normality,
        "levene_test": levene_test,
        "groups": group_stats,
        "pairwise": pairwise_comps,
    }


def run_anova_twoway(
    file_path: Path, dependent: str, factor1: str, factor2: str
) -> dict[str, Any]:
    """Computes Two-Way Factorial ANOVA with interaction effects (Factor1 x Factor2)."""
    df = _load_selected_columns(file_path, [dependent, factor1, factor2]).dropna()
    df[dependent] = df[dependent].astype(float)
    df[factor1] = df[factor1].astype(str)
    df[factor2] = df[factor2].astype(str)

    try:
        import statsmodels.api as sm
        from statsmodels.formula.api import ols
    except ImportError as e:
        raise StatsError("Statsmodels is required for Two-Way ANOVA") from e

    formula = f"Q('{dependent}') ~ C(Q('{factor1}')) + C(Q('{factor2}')) + C(Q('{factor1}')):C(Q('{factor2}'))"
    try:
        model = ols(formula, data=df).fit()
        aov_table = sm.stats.anova_lm(model, typ=2)
    except Exception as e:
        raise StatsError(f"Two-Way ANOVA estimation failed: {e}") from e

    effects = []
    for idx, row in aov_table.iterrows():
        source_name = str(idx)
        if "Residual" in source_name:
            source_label = "Residual (Error)"
        elif ":" in source_name:
            source_label = f"{factor1} * {factor2}"
        elif factor1 in source_name:
            source_label = factor1
        elif factor2 in source_name:
            source_label = factor2
        else:
            source_label = source_name

        ss = float(row.get("sum_sq", 0.0))
        df_val = float(row.get("df", 0.0))
        f_val = (
            float(row.get("F", 0.0))
            if not math.isnan(row.get("F", float("nan")))
            else None
        )
        p_val = (
            float(row.get("PR(>F)", 1.0))
            if not math.isnan(row.get("PR(>F)", float("nan")))
            else None
        )
        partial_eta = (
            (ss / (ss + aov_table.loc["Residual", "sum_sq"]))
            if ("Residual" in aov_table.index and f_val is not None)
            else None
        )

        effects.append(
            {
                "source": source_label,
                "sum_sq": ss,
                "df": df_val,
                "f_stat": f_val,
                "p_value": p_val,
                "partial_eta_squared": partial_eta,
            }
        )

    residuals_normality = _calc_shapiro(model.resid.values)

    levene_test = None
    try:
        from scipy import stats

        cell_groups = [
            sub[dependent].values
            for _, sub in df.groupby([factor1, factor2])
            if len(sub) > 1
        ]
        if len(cell_groups) >= 2:
            lev_res = stats.levene(*cell_groups, center="mean")
            levene_test = {
                "statistic": float(lev_res.statistic),
                "p_value": float(lev_res.pvalue),
                "assumption_met": bool(lev_res.pvalue >= 0.05),
            }
    except Exception as e:  # noqa: BLE001
        logger.debug("Levene test in two-way ANOVA failed: %s", e)

    return {
        "analysis_type": "anova_twoway",
        "dependent": dependent,
        "factor1": factor1,
        "factor2": factor2,
        "sample_size": len(df),
        "effects": effects,
        "residuals_normality": residuals_normality,
        "levene_test": levene_test,
    }


def run_ancova(
    file_path: Path, dependent: str, factor: str, covariates: list[str]
) -> dict[str, Any]:
    """Computes Analysis of Covariance (ANCOVA) with Type II SS and adjusted means."""
    if not covariates:
        raise StatsError("ANCOVA requires at least one covariate variable")

    cols = [dependent, factor] + covariates
    df = _load_selected_columns(file_path, cols).dropna()
    df[dependent] = df[dependent].astype(float)
    df[factor] = df[factor].astype(str)
    for c in covariates:
        df[c] = df[c].astype(float)

    n = len(df)
    unique_factors = sorted(df[factor].unique())
    if len(unique_factors) < 2:
        raise StatsError(
            f"ANCOVA requires at least 2 groups in Factor '{factor}', found {len(unique_factors)}"
        )
    if n < len(unique_factors) + len(covariates) + 1:
        raise StatsError("Sample size is too small for ANCOVA")

    try:
        import pandas as pd
        import statsmodels.api as sm
        from statsmodels.formula.api import ols
    except ImportError as e:
        raise StatsError("SciPy and Statsmodels are required for ANCOVA") from e

    covar_terms = " + ".join([f"Q('{c}')" for c in covariates])
    formula = f"Q('{dependent}') ~ C(Q('{factor}')) + {covar_terms}"

    try:
        model = ols(formula, data=df).fit()
        aov_table = sm.stats.anova_lm(model, typ=2)
    except Exception as e:
        raise StatsError(f"ANCOVA model fitting failed: {e}") from e

    residual_ss = (
        float(aov_table.loc["Residual", "sum_sq"])
        if "Residual" in aov_table.index
        else 0.0
    )

    effects = []
    for idx, row in aov_table.iterrows():
        source_name = str(idx)
        if "Residual" in source_name:
            source_label = "Residual"
        elif f"C(Q('{factor}'))" in source_name:
            source_label = factor
        else:
            matched_cov = None
            for c in covariates:
                if f"Q('{c}')" in source_name or c == source_name:
                    matched_cov = c
                    break
            source_label = matched_cov if matched_cov else source_name

        ss = float(row.get("sum_sq", 0.0))
        df_val = float(row.get("df", 0.0))
        f_val = (
            float(row.get("F", 0.0))
            if not math.isnan(row.get("F", float("nan")))
            else None
        )
        p_val = (
            float(row.get("PR(>F)", 1.0))
            if not math.isnan(row.get("PR(>F)", float("nan")))
            else None
        )
        ms_val = (ss / df_val) if df_val > 0 else 0.0
        partial_eta = (
            (ss / (ss + residual_ss))
            if (residual_ss > 0 and f_val is not None)
            else None
        )

        effects.append(
            {
                "source": source_label,
                "sum_sq": ss,
                "df": df_val,
                "mean_sq": ms_val,
                "f_statistic": f_val,
                "p_value": p_val,
                "partial_eta_squared": partial_eta,
            }
        )

    covar_means = {c: float(df[c].mean()) for c in covariates}
    adjusted_means = []
    for f_val in unique_factors:
        sub_group = df[df[factor] == f_val]
        raw_m = float(sub_group[dependent].mean()) if len(sub_group) > 0 else 0.0
        n_group = len(sub_group)

        pred_dict = {factor: [f_val]}
        for c in covariates:
            pred_dict[c] = [covar_means[c]]
        pred_df = pd.DataFrame(pred_dict)
        pred_val = float(model.predict(pred_df).iloc[0])

        adjusted_means.append(
            {
                "group": str(f_val),
                "n": n_group,
                "raw_mean": raw_m,
                "adjusted_mean": pred_val,
            }
        )

    residuals_normality = _calc_shapiro(model.resid.values)

    homogeneity_of_slopes = None
    try:
        int_terms = " + ".join([f"C(Q('{factor}')):Q('{c}')" for c in covariates])
        int_formula = f"{formula} + {int_terms}"
        int_model = ols(int_formula, data=df).fit()
        int_aov = sm.stats.anova_lm(int_model, typ=2)

        for idx, row in int_aov.iterrows():
            if ":" in str(idx):
                f_int = (
                    float(row.get("F", 0.0))
                    if not math.isnan(row.get("F", float("nan")))
                    else None
                )
                p_int = (
                    float(row.get("PR(>F)", 1.0))
                    if not math.isnan(row.get("PR(>F)", float("nan")))
                    else None
                )
                if f_int is not None and p_int is not None:
                    homogeneity_of_slopes = {
                        "interaction": f"{factor} × {covariates[0]}",
                        "f_statistic": f_int,
                        "p_value": p_int,
                        "assumption_met": p_int >= 0.05,
                    }
                    break
    except Exception as e:  # noqa: BLE001
        logger.debug("Homogeneity of slopes test failed in ANCOVA: %s", e)

    return {
        "analysis_type": "ancova",
        "dependent": dependent,
        "factor": factor,
        "covariates": covariates,
        "total_n": n,
        "effects": effects,
        "adjusted_means": adjusted_means,
        "residuals_normality": residuals_normality,
        "homogeneity_of_slopes": homogeneity_of_slopes,
    }
