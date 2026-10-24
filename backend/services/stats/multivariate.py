"""Multivariate statistical routines: Multiple Linear Regression, MANOVA, and PCA."""

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


def run_regression_analysis(
    file_path: Path,
    dependent: str,
    independents: list[str],
    check_vif: bool = True,
    check_durbin_watson: bool = True,
    baseline_independents: list[str] | None = None,
    missing_strategy: str = "listwise",
) -> dict[str, Any]:
    """Runs Multiple Linear Regression with OLS, VIF, Durbin-Watson, Collinearity Diagnostics, and optional F-Change."""
    if not independents:
        raise StatsError("At least one independent variable is required")
    if dependent in independents:
        raise StatsError(
            "Dependent variable cannot also be in independent variables list"
        )

    all_cols = [dependent] + independents
    if baseline_independents:
        all_cols = list(dict.fromkeys(all_cols + baseline_independents))

    df_raw = _load_selected_columns(file_path, all_cols)
    df, audit = sanitize_analysis_data(df_raw, all_cols, missing_strategy)

    n_samples = len(df)
    if n_samples <= len(independents) + 1:
        raise StatsError(
            f"Sample size ({n_samples}) is too small for {len(independents)} predictors"
        )

    try:
        import numpy as np
        import statsmodels.api as sm
        from scipy import stats
        from statsmodels.stats.outliers_influence import (
            variance_inflation_factor,
        )
        from statsmodels.stats.stattools import durbin_watson
    except ImportError as e:
        raise StatsError(
            "Statsmodels, SciPy, and NumPy are required for regression"
        ) from e

    y = df[dependent].astype(float)
    X = df[independents].astype(float)
    X_const = sm.add_constant(X)

    try:
        model = sm.OLS(y, X_const).fit()
    except Exception as e:
        raise StatsError(f"OLS model estimation failed: {e}") from e

    sy = y.std(ddof=1)
    betas = {}
    for col in independents:
        sx = X[col].std(ddof=1)
        betas[col] = float(model.params[col] * (sx / sy)) if sy > 0 else 0.0

    vif_dict: dict[str, float | None] = {}
    if check_vif and len(independents) > 1:
        for i, col in enumerate(independents):
            try:
                val = float(variance_inflation_factor(X_const.values, i + 1))
                vif_dict[col] = val
            except Exception as e:  # noqa: BLE001
                logger.debug("VIF calculation failed for %s: %s", col, e)
                vif_dict[col] = None

    dw_val = None
    if check_durbin_watson:
        try:
            dw_val = float(durbin_watson(model.resid))
        except Exception as e:  # noqa: BLE001
            logger.debug("Durbin-Watson test failed: %s", e)

    coeffs = [
        {
            "variable": "(Constant)",
            "b": float(model.params["const"]),
            "std_err": float(model.bse["const"]),
            "beta": 0.0,
            "t": float(model.tvalues["const"]),
            "p_value": float(model.pvalues["const"]),
            "vif": None,
            "tolerance": None,
        }
    ]

    for col in independents:
        vif_val = vif_dict.get(col)
        tol_val = (1.0 / vif_val) if (vif_val and vif_val > 0) else None
        coeffs.append(
            {
                "variable": col,
                "b": float(model.params[col]),
                "std_err": float(model.bse[col]),
                "beta": betas.get(col, 0.0),
                "t": float(model.tvalues[col]),
                "p_value": float(model.pvalues[col]),
                "vif": vif_val,
                "tolerance": tol_val,
            }
        )

    collinearity_diag = []
    try:
        X_mat = X_const.values
        col_norms = np.linalg.norm(X_mat, axis=0)
        col_norms[col_norms == 0] = 1.0
        X_scaled = X_mat / col_norms
        xtx = np.dot(X_scaled.T, X_scaled)
        eigvals = np.linalg.eigvalsh(xtx)
        eigvals = np.sort(eigvals)[::-1]
        lambda_max = max(float(eigvals[0]), 1e-12)
        for i, val in enumerate(eigvals):
            c_idx = math.sqrt(lambda_max / max(float(val), 1e-12))
            collinearity_diag.append(
                {
                    "dimension": i + 1,
                    "eigenvalue": float(val),
                    "condition_index": float(c_idx),
                }
            )
    except Exception as e:  # noqa: BLE001
        logger.debug("Collinearity diagnostics failed: %s", e)
        collinearity_diag = []

    f_change = None
    if baseline_independents and len(baseline_independents) > 0:
        base_cols = [c for c in baseline_independents if c in df.columns]
        if base_cols and len(base_cols) < len(independents):
            try:
                X_base = sm.add_constant(df[base_cols].astype(float))
                base_model = sm.OLS(y, X_base).fit()
                r2_base = float(base_model.rsquared)
                r2_full = float(model.rsquared)
                df1 = len(independents) - len(base_cols)
                df2 = n_samples - len(independents) - 1
                r2_change = max(0.0, r2_full - r2_base)
                if df1 > 0 and df2 > 0:
                    denom = max(1e-12, (1.0 - r2_full) / df2)
                    f_val = (r2_change / df1) / denom
                    p_val = float(stats.f.sf(f_val, df1, df2))
                    f_change = {
                        "r2_change": r2_change,
                        "f_change": float(f_val),
                        "df1": int(df1),
                        "df2": int(df2),
                        "p_change": p_val,
                    }
            except Exception as e:  # noqa: BLE001
                logger.debug("F-change calculation failed: %s", e)
                f_change = None

    return {
        "dependent": dependent,
        "sample_size": n_samples,
        "sample_audit": audit,
        "r": float(math.sqrt(max(0.0, float(model.rsquared)))),
        "r_squared": float(model.rsquared),
        "adj_r_squared": float(model.rsquared_adj),
        "f_statistic": float(model.fvalue),
        "f_p_value": float(model.f_pvalue),
        "durbin_watson": dw_val,
        "coefficients": coeffs,
        "collinearity_diagnostics": collinearity_diag,
        "f_change": f_change,
    }


def run_manova_analysis(
    file_path: Path, dependents: list[str], factor: str
) -> dict[str, Any]:
    """Runs Multivariate Analysis of Variance (MANOVA)."""
    if len(dependents) < 2:
        raise StatsError("MANOVA requires at least 2 dependent variables")

    all_cols = dependents + [factor]
    df = _load_selected_columns(file_path, all_cols).dropna()
    n_samples = len(df)
    if n_samples < 5:
        raise StatsError("Sample size is too small for MANOVA")

    try:
        from statsmodels.multivariate.manova import MANOVA
    except ImportError as e:
        raise StatsError("Statsmodels is required for MANOVA") from e

    formula = f"{' + '.join(dependents)} ~ C({factor})"
    try:
        ma = MANOVA.from_formula(formula, data=df)
        mv_res = ma.mv_test()
    except Exception as e:
        raise StatsError(f"MANOVA model fitting failed: {e}") from e

    factor_key = f"C({factor})"
    if factor_key not in mv_res.results:
        factor_key = next(iter(mv_res.results.keys()))

    stat_df = mv_res.results[factor_key]["stat"]
    test_rows = []
    for test_idx, row in stat_df.iterrows():
        test_rows.append(
            {
                "test_name": str(test_idx),
                "value": float(row.get("Value", 0.0)),
                "f_stat": float(row.get("F Value", 0.0)),
                "num_df": float(row.get("Num DF", 0.0)),
                "den_df": float(row.get("Den DF", 0.0)),
                "p_value": float(row.get("Pr > F", 1.0)),
            }
        )

    group_descriptives = []
    unique_levels = df[factor].unique()
    for level in unique_levels:
        sub = df[df[factor] == level]
        stats_by_dep = {}
        for dep in dependents:
            s = sub[dep].astype(float)
            stats_by_dep[dep] = {
                "mean": float(s.mean()),
                "std": float(s.std(ddof=1)) if len(s) > 1 else 0.0,
            }
        group_descriptives.append(
            {
                "group": str(level),
                "n": len(sub),
                "variables": stats_by_dep,
            }
        )

    box_m_result = None
    try:
        import numpy as np
        from scipy import stats

        p = len(dependents)
        k = len(unique_levels)
        cov_list = []
        df_list = []
        for level in unique_levels:
            sub_mat = df[df[factor] == level][dependents].astype(float).values
            n_i = len(sub_mat)
            if n_i > p:
                c_i = np.cov(sub_mat, rowvar=False)
                cov_list.append((n_i - 1, c_i))
                df_list.append(n_i - 1)

        if len(cov_list) == k and all(d > 0 for d in df_list):
            total_df = sum(df_list)
            pooled_cov = sum(d * c for d, c in cov_list) / total_df

            sign_p, logdet_pooled = np.linalg.slogdet(pooled_cov)
            if sign_p > 0:
                logdet_sum = 0.0
                valid_det = True
                for d, c in cov_list:
                    s_i, ld_i = np.linalg.slogdet(c)
                    if s_i <= 0:
                        valid_det = False
                        break
                    logdet_sum += d * ld_i

                if valid_det:
                    M = total_df * logdet_pooled - logdet_sum
                    sum_inv = sum(1.0 / d for d in df_list)
                    c1 = (
                        (2.0 * p**2 + 3.0 * p - 1.0) / (6.0 * (p + 1.0) * (k - 1.0))
                    ) * (sum_inv - (1.0 / total_df))
                    chi2 = M * (1.0 - c1)
                    deg_free = (p * (p + 1) * (k - 1)) / 2.0
                    if chi2 > 0 and deg_free > 0:
                        p_val = float(stats.chi2.sf(chi2, deg_free))
                        box_m_result = {
                            "m_stat": float(M),
                            "chi2": float(chi2),
                            "df": float(deg_free),
                            "p_value": p_val,
                            "assumption_met": bool(p_val >= 0.001),
                        }
    except Exception as e:  # noqa: BLE001
        logger.debug("Box's M test failed: %s", e)
        box_m_result = None

    return {
        "factor": factor,
        "dependents": dependents,
        "sample_size": n_samples,
        "tests": test_rows,
        "group_descriptives": group_descriptives,
        "box_m": box_m_result,
    }


def run_pca_analysis(
    file_path: Path, variables: list[str], n_components: int | None = None
) -> dict[str, Any]:
    """Runs Principal Component Analysis (PCA) with explained variance and component loadings."""
    if len(variables) < 2:
        raise StatsError("PCA requires at least 2 variables")

    df = _load_selected_columns(file_path, variables).dropna()
    n_samples, n_vars = df.shape
    if n_samples < 3:
        raise StatsError("Sample size is too small for PCA")

    k = min(n_components or min(n_vars, 3), n_vars)

    try:
        import numpy as np
        from scipy import stats
    except ImportError as e:
        raise StatsError("NumPy and SciPy are required for PCA") from e

    X = df[variables].astype(float).values
    mean = np.mean(X, axis=0)
    std = np.std(X, axis=0, ddof=1)
    std[std == 0] = 1.0
    Z = (X - mean) / std

    R = np.corrcoef(Z, rowvar=False)

    eigenvalues, eigenvectors = np.linalg.eigh(R)
    idx = np.argsort(eigenvalues)[::-1]
    eigenvalues = eigenvalues[idx]
    eigenvectors = eigenvectors[:, idx]

    total_var = np.sum(eigenvalues)
    exp_var_ratio = [(float(ev) / total_var) for ev in eigenvalues[:k]]

    loadings = []
    for var_idx, var_name in enumerate(variables):
        comps = []
        for comp_idx in range(k):
            load = float(
                eigenvectors[var_idx, comp_idx]
                * math.sqrt(max(0.0, eigenvalues[comp_idx]))
            )
            comps.append(load)
        loadings.append({"variable": var_name, "components": comps})

    bartlett_p = None
    try:
        sign, logdet = np.linalg.slogdet(R)
        if sign > 0:
            p = n_vars
            deg_free = p * (p - 1) / 2
            chi2 = -(n_samples - 1 - (2 * p + 5) / 6.0) * logdet
            if chi2 > 0 and deg_free > 0:
                bartlett_p = float(stats.chi2.sf(chi2, deg_free))
    except Exception as e:  # noqa: BLE001
        logger.debug("Bartlett test of sphericity failed: %s", e)

    return {
        "n_components": k,
        "explained_variance_ratio": exp_var_ratio,
        "eigenvalues": [float(ev) for ev in eigenvalues[:k]],
        "loadings": loadings,
        "bartlett_p": bartlett_p,
    }
