"""Parametric statistical routines for Aegis Research.

Implements standard parametric tests:
- One-Sample t-Test
- Independent Samples t-Test (with Levene's Test and Welch's correction)
- Paired Samples t-Test
- One-Way ANOVA (with Tukey HSD post-hoc)
- Two-Way ANOVA (Factorial ANOVA with interaction)
- Pearson Bivariate Correlation
"""

from pathlib import Path
from typing import Any, Dict, List, Optional
import math

from backend.services.stats import _load_selected_columns, StatsError


def run_ttest_one_sample(
    file_path: Path, variable: str, test_value: float = 0.0
) -> Dict[str, Any]:
    """Computes One-Sample t-Test comparing variable mean against test_value."""
    df = _load_selected_columns(file_path, [variable]).dropna()
    series = df[variable].astype(float)
    n = len(series)
    if n < 3:
        raise StatsError(f"Insufficient observations (N={n}) for One-Sample t-Test")

    try:
        from scipy import stats
        import numpy as np
    except ImportError as e:
        raise StatsError("SciPy and NumPy are required for parametric tests") from e

    mean_val = float(series.mean())
    std_val = float(series.std(ddof=1)) if n > 1 else 0.0
    std_err = float(std_val / math.sqrt(n)) if n > 0 else 0.0
    mean_diff = mean_val - test_value

    res = stats.ttest_1samp(series, popmean=test_value)
    t_stat = float(res.statistic)
    p_val = float(res.pvalue)
    df_val = n - 1

    # 95% Confidence Interval for mean difference
    ci = res.confidence_interval(confidence_level=0.95)
    ci_lower = float(ci.low) - test_value
    ci_upper = float(ci.high) - test_value

    # Cohen's d: (mean - mu0) / std
    cohens_d = float(mean_diff / std_val) if std_val > 0 else 0.0

    return {
        "analysis_type": "ttest_one_sample",
        "variable": variable,
        "test_value": test_value,
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
    }


def run_ttest_independent(
    file_path: Path, test_variable: str, group_variable: str
) -> Dict[str, Any]:
    """Computes Independent Samples t-Test between two groups with Levene's test."""
    df = _load_selected_columns(file_path, [test_variable, group_variable]).dropna()
    try:
        from scipy import stats
        import numpy as np
    except ImportError as e:
        raise StatsError("SciPy and NumPy are required for parametric tests") from e

    groups = df[group_variable].unique()
    if len(groups) != 2:
        raise StatsError(
            f"Grouping variable '{group_variable}' must have exactly 2 distinct groups, found {len(groups)}"
        )

    g1_val, g2_val = groups[0], groups[1]
    g1 = df[df[group_variable] == g1_val][test_variable].astype(float)
    g2 = df[df[group_variable] == g2_val][test_variable].astype(float)

    n1, n2 = len(g1), len(g2)
    if n1 < 2 or n2 < 2:
        raise StatsError("Each group must contain at least 2 valid observations")

    m1, m2 = float(g1.mean()), float(g2.mean())
    s1, s2 = (
        float(g1.std(ddof=1)) if n1 > 1 else 0.0,
        float(g2.std(ddof=1)) if n2 > 1 else 0.0,
    )
    mean_diff = m1 - m2

    # Levene's Test for Homogeneity of Variance
    lev_res = stats.levene(g1, g2, center="mean")
    levene_f = float(lev_res.statistic)
    levene_p = float(lev_res.pvalue)

    # Student's t (Equal variances assumed)
    t_eq = stats.ttest_ind(g1, g2, equal_var=True)
    # Welch's t (Equal variances not assumed)
    t_welch = stats.ttest_ind(g1, g2, equal_var=False)

    # Pooled standard deviation & Cohen's d
    s_pooled = (
        math.sqrt(((n1 - 1) * s1**2 + (n2 - 1) * s2**2) / (n1 + n2 - 2))
        if (n1 + n2 > 2)
        else 1.0
    )
    cohens_d = (mean_diff / s_pooled) if s_pooled > 0 else 0.0

    return {
        "analysis_type": "ttest_independent",
        "test_variable": test_variable,
        "group_variable": group_variable,
        "group1": {
            "name": str(g1_val),
            "n": n1,
            "mean": m1,
            "std": s1,
        },
        "group2": {
            "name": str(g2_val),
            "n": n2,
            "mean": m2,
            "std": s2,
        },
        "mean_diff": mean_diff,
        "cohens_d": float(cohens_d),
        "levene_f": levene_f,
        "levene_p": levene_p,
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
    }


def run_ttest_paired(file_path: Path, var1: str, var2: str) -> Dict[str, Any]:
    """Computes Paired Samples t-Test for matched conditions."""
    df = _load_selected_columns(file_path, [var1, var2]).dropna()
    s1 = df[var1].astype(float)
    s2 = df[var2].astype(float)
    n = len(s1)
    if n < 3:
        raise StatsError("Paired t-Test requires at least 3 matched pairs")

    try:
        from scipy import stats
        import numpy as np
    except ImportError as e:
        raise StatsError("SciPy and NumPy are required for parametric tests") from e

    diffs = s1 - s2
    m1, m2 = float(s1.mean()), float(s2.mean())
    std1, std2 = float(s1.std(ddof=1)), float(s2.std(ddof=1))
    mean_diff = float(diffs.mean())
    std_diff = float(diffs.std(ddof=1))

    # Pearson correlation between pairs
    r_corr, r_p = stats.pearsonr(s1, s2)

    res = stats.ttest_rel(s1, s2)
    t_stat = float(res.statistic)
    p_val = float(res.pvalue)
    df_val = n - 1

    cohens_d = (mean_diff / std_diff) if std_diff > 0 else 0.0

    return {
        "analysis_type": "ttest_paired",
        "var1": var1,
        "var2": var2,
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
    }


def run_anova_oneway(
    file_path: Path, dependent: str, factor: str, post_hoc: bool = True
) -> Dict[str, Any]:
    """Computes One-Way ANOVA with group statistics and Tukey HSD post-hoc."""
    df = _load_selected_columns(file_path, [dependent, factor]).dropna()
    df[dependent] = df[dependent].astype(float)

    try:
        from scipy import stats
        import numpy as np
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

    # One-Way ANOVA via scipy
    f_res = stats.f_oneway(*grouped_data)
    f_stat = float(f_res.statistic)
    p_val = float(f_res.pvalue)

    # Sum of Squares calculations
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

    # Group descriptive statistics
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

    # Tukey HSD pairwise
    pairwise_comps = []
    if post_hoc and k >= 3:
        try:
            tukey = pairwise_tukeyhsd(
                endog=df[dependent], groups=df[factor], alpha=0.05
            )
            for g1, g2, md, p_adj, low, upp, rej in zip(
                tukey.groupsunique[tukey._results_table.data[1:][0][0] :],  # type: ignore
                tukey._results_table.data[1:],
            ):
                pass
            # Parse table rows directly
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
        except Exception:
            pass

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
        "groups": group_stats,
        "pairwise": pairwise_comps,
    }


def run_anova_twoway(
    file_path: Path, dependent: str, factor1: str, factor2: str
) -> Dict[str, Any]:
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

    ss_total = float(aov_table["sum_sq"].sum())
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

    return {
        "analysis_type": "anova_twoway",
        "dependent": dependent,
        "factor1": factor1,
        "factor2": factor2,
        "sample_size": len(df),
        "effects": effects,
    }


def run_correlation_pearson(file_path: Path, variables: List[str]) -> Dict[str, Any]:
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
