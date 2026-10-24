"""Parametric basic statistical routines: t-tests and Pearson correlation."""

from __future__ import annotations

import logging
import math
from pathlib import Path
from typing import Any

from backend.services.stats.descriptive import (
    StatsError,
    _load_selected_columns,
    sanitize_analysis_data,
)

logger = logging.getLogger(__name__)


def _normalize_alternative(alt: str | None) -> str:
    """Normalizes hypothesis alternative direction string."""
    cleaned = (alt or "two-sided").lower().strip().replace("-", "_")
    if cleaned in {"greater", "greater_than", ">"}:
        return "greater"
    if cleaned in {"less", "less_than", "<"}:
        return "less"
    return "two-sided"


def _calc_shapiro(arr: Any) -> dict[str, float] | None:
    """Calculates Shapiro-Wilk test for normality on arrays with 3..5000 elements."""
    if 3 <= len(arr) <= 5000:
        try:
            from scipy import stats

            sw = stats.shapiro(arr)
            return {"w": float(sw.statistic), "p": float(sw.pvalue)}
        except Exception as e:  # noqa: BLE001
            logger.debug("Shapiro-Wilk test failed: %s", e)
    return None


def run_ttest_one_sample(
    file_path: Path,
    variable: str,
    test_value: float = 0.0,
    tests: list[str] | None = None,
    alternative: str = "two-sided",
    missing_strategy: str = "pairwise",
) -> dict[str, Any]:
    """Computes One-Sample t-Test comparing variable mean against test_value."""
    raw_df = _load_selected_columns(file_path, [variable])
    df, _audit = sanitize_analysis_data(
        raw_df, [variable], missing_strategy=missing_strategy
    )
    series = df[variable].dropna().astype(float)
    n = len(series)
    if n < 3:
        raise StatsError(f"Insufficient observations (N={n}) for One-Sample t-Test")

    try:
        from scipy import stats
    except ImportError as e:
        raise StatsError("SciPy and NumPy are required for parametric tests") from e

    alt = _normalize_alternative(alternative)
    mean_val = float(series.mean())
    std_val = float(series.std(ddof=1)) if n > 1 else 0.0
    std_err = float(std_val / math.sqrt(n)) if n > 0 else 0.0
    mean_diff = mean_val - test_value
    cohens_d = float(mean_diff / std_val) if std_val > 0 else 0.0

    res = stats.ttest_1samp(series, popmean=test_value, alternative=alt)
    t_stat = float(res.statistic)
    p_val = float(res.pvalue)
    df_val = n - 1

    try:
        ci = res.confidence_interval(confidence_level=0.95)
        low_val = float(ci.low)
        high_val = float(ci.high)
        ci_lower = (
            low_val - test_value
            if not (math.isinf(low_val) or math.isnan(low_val))
            else None
        )
        ci_upper = (
            high_val - test_value
            if not (math.isinf(high_val) or math.isnan(high_val))
            else None
        )
    except Exception as e:  # noqa: BLE001
        logger.debug(
            "t-interval extraction failed, falling back to normal approx: %s", e
        )
        ci_lower = mean_diff - 1.96 * std_err
        ci_upper = mean_diff + 1.96 * std_err

    diffs = series - test_value
    nonzero_diffs = diffs[diffs != 0]
    wilcoxon_stat = None
    wilcoxon_p = None
    if len(nonzero_diffs) >= 2:
        try:
            w_res = stats.wilcoxon(nonzero_diffs, alternative=alt)
            wilcoxon_stat = float(w_res.statistic)
            wilcoxon_p = float(w_res.pvalue)
        except Exception as e:  # noqa: BLE001
            logger.debug("Wilcoxon one-sample test failed: %s", e)

    z_stat = (mean_diff / std_err) if std_err > 0 else 0.0
    if alt == "greater":
        z_p = float(stats.norm.sf(z_stat))
    elif alt == "less":
        z_p = float(stats.norm.cdf(z_stat))
    else:
        z_p = float(2 * stats.norm.sf(abs(z_stat)))

    normality_res = _calc_shapiro(series)

    comparative_tests = [
        {
            "test_name": "Student's t",
            "statistic": t_stat,
            "df": df_val,
            "p_value": p_val,
            "mean_diff": mean_diff,
            "effect_size_name": "Cohen's d",
            "effect_size": cohens_d,
        }
    ]
    if wilcoxon_stat is not None and wilcoxon_p is not None:
        comparative_tests.append(
            {
                "test_name": "Wilcoxon Signed-Rank",
                "statistic": wilcoxon_stat,
                "df": None,
                "p_value": wilcoxon_p,
                "mean_diff": float(series.median() - test_value),
                "effect_size_name": "Rank-biserial",
                "effect_size": None,
            }
        )
    comparative_tests.append(
        {
            "test_name": "Z-Test",
            "statistic": float(z_stat),
            "df": None,
            "p_value": z_p,
            "mean_diff": mean_diff,
            "effect_size_name": "Cohen's d",
            "effect_size": cohens_d,
        }
    )

    return {
        "analysis_type": "ttest_one_sample",
        "variable": variable,
        "test_value": test_value,
        "alternative": alt,
        "n": n,
        "mean": mean_val,
        "std": std_val,
        "std_err": std_err,
        "mean_diff": mean_diff,
        "t_statistic": t_stat,
        "df": df_val,
        "p_value": p_val,
        "ci_lower": ci_lower,
        "ci_upper": ci_upper,
        "cohens_d": cohens_d,
        "residuals_normality": normality_res,
        "comparative_tests": comparative_tests,
    }


def run_ttest_independent(
    file_path: Path,
    test_variable: str,
    group_variable: str,
    tests: list[str] | None = None,
    alternative: str = "two-sided",
    missing_strategy: str = "pairwise",
) -> dict[str, Any]:
    """Computes Independent Samples t-Test between two groups with Student, Welch, and Mann-Whitney."""
    raw_df = _load_selected_columns(file_path, [test_variable, group_variable])
    df, _audit = sanitize_analysis_data(
        raw_df, [test_variable, group_variable], missing_strategy=missing_strategy
    )
    df = df.dropna()

    try:
        import numpy as np
        from scipy import stats
    except ImportError as e:
        raise StatsError("SciPy and NumPy are required for parametric tests") from e

    groups = df[group_variable].unique()
    if len(groups) != 2:
        raise StatsError(
            f"Grouping variable '{group_variable}' must have exactly 2 distinct groups, found {len(groups)}"
        )

    alt = _normalize_alternative(alternative)
    g1_val, g2_val = groups[0], groups[1]
    g1 = df[df[group_variable] == g1_val][test_variable].astype(float)
    g2 = df[df[group_variable] == g2_val][test_variable].astype(float)

    n1, n2 = len(g1), len(g2)
    if n1 < 2 or n2 < 2:
        raise StatsError("Each group must contain at least 2 valid observations")

    m1, m2 = float(g1.mean()), float(g2.mean())
    s1 = float(g1.std(ddof=1)) if n1 > 1 else 0.0
    s2 = float(g2.std(ddof=1)) if n2 > 1 else 0.0
    mean_diff = m1 - m2

    lev_res = stats.levene(g1, g2, center="mean")
    levene_f = float(lev_res.statistic)
    levene_p = float(lev_res.pvalue)

    t_eq = stats.ttest_ind(g1, g2, equal_var=True, alternative=alt)
    t_welch = stats.ttest_ind(g1, g2, equal_var=False, alternative=alt)

    mw_res = stats.mannwhitneyu(g1, g2, alternative=alt)
    mw_u = float(mw_res.statistic)
    mw_p = float(mw_res.pvalue)
    rank_biserial = 1.0 - (2.0 * mw_u) / (n1 * n2) if (n1 * n2 > 0) else 0.0

    s_pooled = (
        math.sqrt(((n1 - 1) * s1**2 + (n2 - 1) * s2**2) / (n1 + n2 - 2))
        if (n1 + n2 > 2)
        else 1.0
    )
    cohens_d = (mean_diff / s_pooled) if s_pooled > 0 else 0.0

    residuals = np.concatenate([np.asarray(g1) - m1, np.asarray(g2) - m2])
    residuals_normality = _calc_shapiro(residuals)

    comparative_tests = [
        {
            "test_name": "Student's t",
            "statistic": float(t_eq.statistic),
            "df": float(n1 + n2 - 2),
            "p_value": float(t_eq.pvalue),
            "mean_diff": mean_diff,
            "effect_size_name": "Cohen's d",
            "effect_size": float(cohens_d),
        },
        {
            "test_name": "Welch's t",
            "statistic": float(t_welch.statistic),
            "df": float(t_welch.df) if hasattr(t_welch, "df") else float(n1 + n2 - 2),
            "p_value": float(t_welch.pvalue),
            "mean_diff": mean_diff,
            "effect_size_name": "Cohen's d",
            "effect_size": float(cohens_d),
        },
        {
            "test_name": "Mann-Whitney U",
            "statistic": mw_u,
            "df": None,
            "p_value": mw_p,
            "mean_diff": float(np.median(g1) - np.median(g2)),
            "effect_size_name": "Rank-biserial r",
            "effect_size": float(rank_biserial),
        },
    ]

    return {
        "analysis_type": "ttest_independent",
        "test_variable": test_variable,
        "group_variable": group_variable,
        "alternative": alt,
        "group1": {
            "name": str(g1_val),
            "n": n1,
            "mean": m1,
            "std": s1,
            "median": float(np.median(g1)),
        },
        "group2": {
            "name": str(g2_val),
            "n": n2,
            "mean": m2,
            "std": s2,
            "median": float(np.median(g2)),
        },
        "mean_diff": mean_diff,
        "cohens_d": float(cohens_d),
        "levene_f": levene_f,
        "levene_p": levene_p,
        "residuals_normality": residuals_normality,
        "equal_var": {
            "t_statistic": float(t_eq.statistic),
            "df": float(n1 + n2 - 2),
            "p_value": float(t_eq.pvalue),
        },
        "welch_var": {
            "t_statistic": float(t_welch.statistic),
            "df": float(t_welch.df) if hasattr(t_welch, "df") else float(n1 + n2 - 2),
            "p_value": float(t_welch.pvalue),
        },
        "comparative_tests": comparative_tests,
    }


def run_ttest_paired(
    file_path: Path,
    var1: str,
    var2: str,
    tests: list[str] | None = None,
    alternative: str = "two-sided",
    missing_strategy: str = "pairwise",
) -> dict[str, Any]:
    """Computes Paired Samples t-Test for matched conditions with Student and Wilcoxon signed-rank."""
    raw_df = _load_selected_columns(file_path, [var1, var2])
    df, _audit = sanitize_analysis_data(
        raw_df, [var1, var2], missing_strategy=missing_strategy
    )
    df = df.dropna()
    s1 = df[var1].astype(float)
    s2 = df[var2].astype(float)
    n = len(s1)
    if n < 3:
        raise StatsError("Paired t-Test requires at least 3 matched pairs")

    try:
        import numpy as np
        from scipy import stats
    except ImportError as e:
        raise StatsError("SciPy and NumPy are required for parametric tests") from e

    alt = _normalize_alternative(alternative)
    diffs = s1 - s2
    m1, m2 = float(s1.mean()), float(s2.mean())
    std1, std2 = float(s1.std(ddof=1)), float(s2.std(ddof=1))
    mean_diff = float(diffs.mean())
    std_diff = float(diffs.std(ddof=1))

    r_corr, r_p = stats.pearsonr(s1, s2)
    res = stats.ttest_rel(s1, s2, alternative=alt)
    t_stat = float(res.statistic)
    p_val = float(res.pvalue)
    df_val = n - 1
    cohens_d = (mean_diff / std_diff) if std_diff > 0 else 0.0

    nonzero = diffs[diffs != 0]
    w_stat = None
    w_p = None
    rank_biserial = None
    if len(nonzero) >= 2:
        try:
            w_res = stats.wilcoxon(s1, s2, alternative=alt, zero_method="wilcox")
            w_stat = float(w_res.statistic)
            w_p = float(w_res.pvalue)
            pos_sum = float(np.sum(stats.rankdata(np.abs(nonzero))[nonzero > 0]))
            neg_sum = float(np.sum(stats.rankdata(np.abs(nonzero))[nonzero < 0]))
            total_w = pos_sum + neg_sum
            rank_biserial = float((pos_sum - neg_sum) / total_w) if total_w > 0 else 0.0
        except Exception as e:  # noqa: BLE001
            logger.debug("Wilcoxon paired test failed: %s", e)

    diffs_normality = _calc_shapiro(diffs)

    comparative_tests = [
        {
            "test_name": "Student's Paired t",
            "statistic": t_stat,
            "df": df_val,
            "p_value": p_val,
            "mean_diff": mean_diff,
            "effect_size_name": "Cohen's d",
            "effect_size": float(cohens_d),
        }
    ]
    if w_stat is not None and w_p is not None:
        comparative_tests.append(
            {
                "test_name": "Wilcoxon Signed-Rank",
                "statistic": w_stat,
                "df": None,
                "p_value": w_p,
                "mean_diff": float(np.median(diffs)),
                "effect_size_name": "Rank-biserial r",
                "effect_size": rank_biserial,
            }
        )

    return {
        "analysis_type": "ttest_paired",
        "var1": var1,
        "var2": var2,
        "alternative": alt,
        "n": n,
        "mean1": m1,
        "std1": std1,
        "mean2": m2,
        "std2": std2,
        "mean_diff": mean_diff,
        "std_diff": std_diff,
        "correlation": float(r_corr),
        "corr_p_value": float(r_p),
        "t_statistic": t_stat,
        "df": df_val,
        "p_value": p_val,
        "cohens_d": float(cohens_d),
        "residuals_normality": diffs_normality,
        "comparative_tests": comparative_tests,
    }


def run_correlation_pearson(file_path: Path, variables: list[str]) -> dict[str, Any]:
    """Computes Pearson Bivariate Correlation Matrix with two-tailed p-values."""
    if len(variables) < 2:
        raise StatsError("Correlation analysis requires at least 2 variables")

    df = _load_selected_columns(file_path, variables).dropna()
    for v in variables:
        df[v] = df[v].astype(float)

    try:
        from scipy import stats
    except ImportError as e:
        raise StatsError("SciPy is required for Pearson correlation") from e

    matrix = []
    for v1 in variables:
        row_cells = []
        for v2 in variables:
            if v1 == v2:
                row_cells.append({"r": 1.0, "p_value": 0.0, "n": len(df)})
            else:
                r_val, p_val = stats.pearsonr(df[v1], df[v2])
                row_cells.append(
                    {
                        "r": float(r_val),
                        "p_value": float(p_val),
                        "n": len(df),
                    }
                )
        matrix.append({"variable": v1, "correlations": row_cells})

    return {
        "analysis_type": "correlation_pearson",
        "variables": variables,
        "sample_size": len(df),
        "matrix": matrix,
    }
