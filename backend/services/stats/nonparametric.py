"""Non-parametric statistical routines: Mann-Whitney U, Wilcoxon, Kruskal-Wallis, Spearman, Chi-Square."""

from __future__ import annotations

import logging
import math
from pathlib import Path
from typing import Any

from backend.services.stats.descriptive import StatsError, _load_selected_columns

logger = logging.getLogger(__name__)


def run_mann_whitney_u(
    file_path: Path, test_variable: str, group_variable: str
) -> dict[str, Any]:
    """Computes Mann-Whitney U Test comparing ranks between two independent groups."""
    df = _load_selected_columns(file_path, [test_variable, group_variable]).dropna()
    try:
        import numpy as np
        from scipy import stats
    except ImportError as e:
        raise StatsError("SciPy and NumPy are required for non-parametric tests") from e

    groups = df[group_variable].unique()
    if len(groups) != 2:
        raise StatsError(
            f"Grouping variable must have exactly 2 distinct categories, found {len(groups)}"
        )

    g1_val, g2_val = groups[0], groups[1]
    g1 = df[df[group_variable] == g1_val][test_variable].astype(float).values
    g2 = df[df[group_variable] == g2_val][test_variable].astype(float).values

    n1, n2 = len(g1), len(g2)
    if n1 < 2 or n2 < 2:
        raise StatsError("Each group must contain at least 2 valid observations")

    all_vals = np.concatenate([g1, g2])
    ranks = stats.rankdata(all_vals)
    r1 = ranks[:n1]
    r2 = ranks[n1:]

    r1_sum = float(np.sum(r1))
    r2_sum = float(np.sum(r2))
    r1_mean = float(np.mean(r1))
    r2_mean = float(np.mean(r2))

    res = stats.mannwhitneyu(g1, g2, alternative="two-sided")
    u_stat = float(res.statistic)
    p_val = float(res.pvalue)

    mean_u = (n1 * n2) / 2.0
    var_u = (n1 * n2 * (n1 + n2 + 1)) / 12.0
    z_score = float((u_stat - mean_u) / math.sqrt(var_u)) if var_u > 0 else 0.0

    return {
        "analysis_type": "mann_whitney_u",
        "test_variable": test_variable,
        "group_variable": group_variable,
        "group1": {
            "name": str(g1_val),
            "n": n1,
            "median": float(np.median(g1)),
            "mean_rank": r1_mean,
            "sum_ranks": r1_sum,
        },
        "group2": {
            "name": str(g2_val),
            "n": n2,
            "median": float(np.median(g2)),
            "mean_rank": r2_mean,
            "sum_ranks": r2_sum,
        },
        "u_statistic": u_stat,
        "w_statistic": min(r1_sum, r2_sum),
        "z_score": z_score,
        "p_value": p_val,
    }


def run_wilcoxon_signed_rank(file_path: Path, var1: str, var2: str) -> dict[str, Any]:
    """Computes Wilcoxon Signed-Rank Test for paired observations."""
    df = _load_selected_columns(file_path, [var1, var2]).dropna()
    s1 = df[var1].astype(float).values
    s2 = df[var2].astype(float).values
    n = len(s1)
    if n < 3:
        raise StatsError("Wilcoxon signed-rank requires at least 3 matched pairs")

    try:
        import numpy as np
        from scipy import stats
    except ImportError as e:
        raise StatsError("SciPy and NumPy are required for non-parametric tests") from e

    diffs = s1 - s2
    non_zero = diffs[diffs != 0]
    n_nonzero = len(non_zero)
    if n_nonzero < 2:
        raise StatsError(
            "Too many identical pairs (zero differences) for Wilcoxon test"
        )

    pos_diffs = diffs[diffs > 0]
    neg_diffs = diffs[diffs < 0]

    res = stats.wilcoxon(s1, s2, zero_method="wilcox", alternative="two-sided")
    w_stat = float(res.statistic)
    p_val = float(res.pvalue)

    mean_w = n_nonzero * (n_nonzero + 1) / 4.0
    var_w = n_nonzero * (n_nonzero + 1) * (2 * n_nonzero + 1) / 24.0
    z_score = float((w_stat - mean_w) / math.sqrt(var_w)) if var_w > 0 else 0.0

    return {
        "analysis_type": "wilcoxon_signed_rank",
        "var1": var1,
        "var2": var2,
        "n_total": n,
        "n_effective": n_nonzero,
        "positive_pairs": len(pos_diffs),
        "negative_pairs": len(neg_diffs),
        "median1": float(np.median(s1)),
        "median2": float(np.median(s2)),
        "w_statistic": w_stat,
        "z_score": z_score,
        "p_value": p_val,
    }


def run_kruskal_wallis(
    file_path: Path, test_variable: str, group_variable: str
) -> dict[str, Any]:
    """Computes Kruskal-Wallis H Test across 3+ independent groups."""
    df = _load_selected_columns(file_path, [test_variable, group_variable]).dropna()
    df[test_variable] = df[test_variable].astype(float)

    try:
        from scipy import stats
    except ImportError as e:
        raise StatsError("SciPy and NumPy are required for non-parametric tests") from e

    unique_groups = df[group_variable].unique()
    if len(unique_groups) < 2:
        raise StatsError(
            f"Kruskal-Wallis requires at least 2 distinct groups in '{group_variable}', found {len(unique_groups)}"
        )

    grouped_data = [
        df[df[group_variable] == g_val][test_variable].values for g_val in unique_groups
    ]

    res = stats.kruskal(*grouped_data)
    h_stat = float(res.statistic)
    p_val = float(res.pvalue)
    df_val = len(unique_groups) - 1

    all_vals = df[test_variable].values
    all_ranks = stats.rankdata(all_vals)
    df["_rank"] = all_ranks

    group_stats = []
    for g_val in unique_groups:
        sub = df[df[group_variable] == g_val]
        group_stats.append(
            {
                "group": str(g_val),
                "n": len(sub),
                "median": float(sub[test_variable].median()),
                "mean_rank": float(sub["_rank"].mean()),
            }
        )

    return {
        "analysis_type": "kruskal_wallis",
        "test_variable": test_variable,
        "group_variable": group_variable,
        "sample_size": len(df),
        "k_groups": len(unique_groups),
        "h_statistic": h_stat,
        "df": df_val,
        "p_value": p_val,
        "groups": group_stats,
    }


def run_correlation_spearman(file_path: Path, variables: list[str]) -> dict[str, Any]:
    """Computes Spearman Rank Correlation Matrix with two-tailed p-values."""
    if len(variables) < 2:
        raise StatsError("Correlation analysis requires at least 2 variables")

    df = _load_selected_columns(file_path, variables).dropna()
    for v in variables:
        df[v] = df[v].astype(float)

    try:
        from scipy import stats
    except ImportError as e:
        raise StatsError("SciPy is required for Spearman correlation") from e

    matrix = []
    for v1 in variables:
        row_cells = []
        for v2 in variables:
            if v1 == v2:
                row_cells.append({"rho": 1.0, "p_value": 0.0, "n": len(df)})
            else:
                rho_val, p_val = stats.spearmanr(df[v1], df[v2])
                row_cells.append(
                    {
                        "rho": float(rho_val),
                        "p_value": float(p_val),
                        "n": len(df),
                    }
                )
        matrix.append({"variable": v1, "correlations": row_cells})

    return {
        "analysis_type": "correlation_spearman",
        "variables": variables,
        "sample_size": len(df),
        "matrix": matrix,
    }


def run_chisquare_independence(
    file_path: Path, row_variable: str, col_variable: str
) -> dict[str, Any]:
    """Computes Chi-Square Test of Independence with Cross-Tabulation & Cramér's V."""
    df = _load_selected_columns(file_path, [row_variable, col_variable]).dropna()
    try:
        import pandas as pd
        from scipy import stats
    except ImportError as e:
        raise StatsError("SciPy and Pandas are required for Chi-Square test") from e

    ct = pd.crosstab(df[row_variable], df[col_variable], margins=True)
    ct_raw = pd.crosstab(df[row_variable], df[col_variable], margins=False)

    chi2, p, dof, expected = stats.chi2_contingency(ct_raw)

    n_total = len(df)
    r_dim, c_dim = ct_raw.shape
    min_dim = min(r_dim - 1, c_dim - 1)
    cramers_v = (
        math.sqrt(chi2 / (n_total * min_dim)) if (min_dim > 0 and n_total > 0) else 0.0
    )

    row_labels = [str(x) for x in ct_raw.index]
    col_labels = [str(x) for x in ct_raw.columns]

    table_rows = []
    for i, r_val in enumerate(row_labels):
        cells = []
        for j, c_val in enumerate(col_labels):
            obs = int(ct_raw.iloc[i, j])
            exp = float(expected[i, j])
            cells.append({"col": c_val, "observed": obs, "expected": round(exp, 1)})
        table_rows.append(
            {"row": r_val, "cells": cells, "total": int(ct.loc[ct_raw.index[i], "All"])}
        )

    return {
        "analysis_type": "chisquare_independence",
        "row_variable": row_variable,
        "col_variable": col_variable,
        "sample_size": n_total,
        "chi2_statistic": float(chi2),
        "df": int(dof),
        "p_value": float(p),
        "cramers_v": float(cramers_v),
        "row_labels": row_labels,
        "col_labels": col_labels,
        "crosstab": table_rows,
    }
