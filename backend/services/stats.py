"""Statistical computation engine for Aegis Research.

Provides lazy-imported, non-blocking statistical routines matching standard academic publication benchmarks:
- Descriptive Statistics & Normality (Shapiro-Wilk)
- Reliability Analysis (Cronbach's Alpha, Item-Total Correlation)
- Multiple Linear Regression (OLS, VIF, Durbin-Watson)
- Multivariate Analysis of Variance (MANOVA)
- Principal Component Analysis (PCA)
"""

from pathlib import Path
from typing import Any, Dict, List, Optional
import math


class StatsError(Exception):
    """Raised when statistical computation fails or input data is invalid."""

    pass


def _load_selected_columns(file_path: Path, columns: List[str]):
    """Loads specific columns from a dataset using Polars and converts to Pandas DataFrame."""
    if not file_path.exists() or not file_path.is_file():
        raise FileNotFoundError(f"Dataset file not found: {file_path.name}")

    try:
        import polars as pl
    except ImportError as e:
        raise StatsError("Polars is required to load tabular data") from e

    suffix = file_path.suffix.lower()
    try:
        if suffix in {".parquet", ".pqt"}:
            lf = pl.scan_parquet(file_path)
        else:
            sep = "\t" if suffix == ".tsv" else ","
            lf = pl.scan_csv(file_path, separator=sep)

        available_cols = lf.collect_schema().names()
        missing = [c for c in columns if c not in available_cols]
        if missing:
            raise StatsError(f"Variables not found in dataset: {', '.join(missing)}")

        # Select only requested columns and drop nulls
        df = lf.select(columns).collect().to_pandas()
        return df
    except StatsError:
        raise
    except Exception as e:
        raise StatsError(f"Failed to load dataset columns: {e}") from e


def run_descriptive_analysis(
    file_path: Path, variables: List[str], include_normality: bool = True
) -> List[Dict[str, Any]]:
    """Calculates summary statistics and normality test for each selected variable."""
    if not variables:
        raise StatsError("At least one variable must be selected")

    df = _load_selected_columns(file_path, variables)

    try:
        import numpy as np
        from scipy import stats
    except ImportError as e:
        raise StatsError("NumPy and SciPy are required for statistics") from e

    results = []
    for var in variables:
        series = df[var].dropna()
        n = len(series)
        if n < 1:
            raise StatsError(f"Variable '{var}' has no valid observations")

        # Check if series is numeric or categorical/nominal
        is_numeric = False
        try:
            num_series = series.astype(float)
            is_numeric = True
        except (ValueError, TypeError):
            num_series = None

        if not is_numeric:
            # Nominal categorical handling (Frequencies & Mode)
            mode_val = str(series.mode().iloc[0]) if not series.empty else "-"
            vc = series.value_counts()
            vp = series.value_counts(normalize=True) * 100
            freqs = [
                {"value": str(val), "count": int(c), "percentage": round(float(p), 1)}
                for val, c, p in zip(vc.index, vc.values, vp.values)
            ][:8]

            results.append(
                {
                    "variable": var,
                    "scale": "nominal",
                    "n": n,
                    "mean": None,
                    "std": None,
                    "median": None,
                    "min": None,
                    "max": None,
                    "skewness": None,
                    "kurtosis": None,
                    "shapiro_w": None,
                    "shapiro_p": None,
                    "mode": mode_val,
                    "frequencies": freqs,
                }
            )
            continue

        # Scale / Interval-Ratio quantitative handling
        mean_val = float(num_series.mean())
        std_val = float(num_series.std(ddof=1)) if n > 1 else 0.0
        median_val = float(num_series.median())
        min_val = float(num_series.min())
        max_val = float(num_series.max())
        skew_val = float(stats.skew(num_series, bias=False)) if n > 2 else 0.0
        kurt_val = float(stats.kurtosis(num_series, bias=False)) if n > 3 else 0.0

        shapiro_w = None
        shapiro_p = None
        if include_normality and 3 <= n <= 5000:
            try:
                res = stats.shapiro(num_series)
                shapiro_w = float(res.statistic)
                shapiro_p = float(res.pvalue)
            except Exception:
                pass

        results.append(
            {
                "variable": var,
                "scale": "scale",
                "n": n,
                "mean": mean_val,
                "std": std_val,
                "median": median_val,
                "min": min_val,
                "max": max_val,
                "skewness": skew_val,
                "kurtosis": kurt_val,
                "shapiro_w": shapiro_w,
                "shapiro_p": shapiro_p,
                "mode": None,
                "frequencies": None,
            }
        )

    return results


def run_reliability_analysis(file_path: Path, items: List[str]) -> Dict[str, Any]:
    """Calculates Cronbach's Alpha and Item-Total statistics."""
    if len(items) < 2:
        raise StatsError("Reliability analysis requires at least 2 items/variables")

    df = _load_selected_columns(file_path, items).dropna()
    try:
        import numpy as np
    except ImportError as e:
        raise StatsError("NumPy is required for reliability analysis") from e

    data = df[items].astype(float).values
    n_samples, n_items = data.shape
    if n_samples < 3:
        raise StatsError(
            "Reliability analysis requires at least 3 valid complete observations"
        )

    # Item variances
    item_vars = np.var(data, axis=0, ddof=1)
    # Total score variance
    total_scores = np.sum(data, axis=1)
    total_var = np.var(total_scores, ddof=1)

    if total_var == 0:
        alpha = 0.0
    else:
        alpha = (n_items / (n_items - 1)) * (1 - (np.sum(item_vars) / total_var))

    # Item-total stats
    item_stats = []
    for i, item_name in enumerate(items):
        item_col = data[:, i]
        rest_total = total_scores - item_col
        # Corrected item-total correlation
        if np.std(item_col) > 0 and np.std(rest_total) > 0:
            corr = float(np.corrcoef(item_col, rest_total)[0, 1])
        else:
            corr = 0.0

        # Alpha if deleted
        remaining_data = np.delete(data, i, axis=1)
        rem_items = n_items - 1
        rem_item_vars = np.var(remaining_data, axis=0, ddof=1)
        rem_total = np.sum(remaining_data, axis=1)
        rem_total_var = np.var(rem_total, ddof=1)

        if rem_total_var == 0 or rem_items < 2:
            del_alpha = 0.0
        else:
            del_alpha = (rem_items / (rem_items - 1)) * (
                1 - (np.sum(rem_item_vars) / rem_total_var)
            )

        item_stats.append(
            {
                "item": item_name,
                "mean": float(np.mean(item_col)),
                "std": float(np.std(item_col, ddof=1)),
                "corrected_item_total_corr": corr,
                "alpha_if_deleted": float(del_alpha),
            }
        )

    return {
        "cronbach_alpha": float(alpha),
        "items_count": n_items,
        "sample_size": n_samples,
        "item_stats": item_stats,
    }


def run_regression_analysis(
    file_path: Path,
    dependent: str,
    independents: List[str],
    check_vif: bool = True,
    check_durbin_watson: bool = True,
) -> Dict[str, Any]:
    """Runs Multiple Linear Regression with OLS, VIF diagnostics, and Durbin-Watson."""
    if not independents:
        raise StatsError("At least one independent variable is required")
    if dependent in independents:
        raise StatsError(
            "Dependent variable cannot also be in independent variables list"
        )

    all_cols = [dependent] + independents
    df = _load_selected_columns(file_path, all_cols).dropna()
    n_samples = len(df)
    if n_samples <= len(independents) + 1:
        raise StatsError(
            f"Sample size ({n_samples}) is too small for {len(independents)} predictors"
        )

    try:
        import numpy as np
        import statsmodels.api as sm
        from statsmodels.stats.outliers_influence import (
            variance_inflation_factor,
        )
        from statsmodels.stats.stattools import durbin_watson
    except ImportError as e:
        raise StatsError("Statsmodels and NumPy are required for regression") from e

    y = df[dependent].astype(float)
    X = df[independents].astype(float)
    X_const = sm.add_constant(X)

    try:
        model = sm.OLS(y, X_const).fit()
    except Exception as e:
        raise StatsError(f"OLS model estimation failed: {e}") from e

    # Calculate standardized beta coefficients: beta_i = b_i * (sd(X_i) / sd(Y))
    sy = y.std(ddof=1)
    betas = {}
    for col in independents:
        sx = X[col].std(ddof=1)
        betas[col] = float(model.params[col] * (sx / sy)) if sy > 0 else 0.0

    # VIF calculations
    vif_dict: Dict[str, float] = {}
    if check_vif and len(independents) > 1:
        for i, col in enumerate(independents):
            try:
                # Add 1 to index because of constant at index 0
                val = float(variance_inflation_factor(X_const.values, i + 1))
                vif_dict[col] = val
            except Exception:
                vif_dict[col] = None

    # Durbin-Watson
    dw_val = None
    if check_durbin_watson:
        try:
            dw_val = float(durbin_watson(model.resid))
        except Exception:
            pass

    coeffs = []
    # Constant row
    coeffs.append(
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
    )

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

    return {
        "dependent": dependent,
        "r": float(math.sqrt(max(0.0, float(model.rsquared)))),
        "r_squared": float(model.rsquared),
        "adj_r_squared": float(model.rsquared_adj),
        "f_statistic": float(model.fvalue),
        "f_p_value": float(model.f_pvalue),
        "durbin_watson": dw_val,
        "coefficients": coeffs,
    }


def run_manova_analysis(
    file_path: Path, dependents: List[str], factor: str
) -> Dict[str, Any]:
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
        # Fallback to first available result key
        factor_key = list(mv_res.results.keys())[0]

    stat_df = mv_res.results[factor_key]["stat"]
    test_rows = []
    # Expected tests: Wilks' lambda, Pillai's trace, Hotelling-Lawley trace, Roy's greatest root
    for test_idx, row in stat_df.iterrows():
        test_name = str(test_idx)
        val = float(row.get("Value", 0.0))
        f_val = float(row.get("F Value", 0.0))
        num_df = float(row.get("Num DF", 0.0))
        den_df = float(row.get("Den DF", 0.0))
        p_val = float(row.get("Pr > F", 1.0))
        test_rows.append(
            {
                "test_name": test_name,
                "value": val,
                "f_stat": f_val,
                "num_df": num_df,
                "den_df": den_df,
                "p_value": p_val,
            }
        )

    return {
        "factor": factor,
        "dependents": dependents,
        "sample_size": n_samples,
        "tests": test_rows,
    }


def run_pca_analysis(
    file_path: Path, variables: List[str], n_components: Optional[int] = None
) -> Dict[str, Any]:
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
    # Standardize data (z-score)
    mean = np.mean(X, axis=0)
    std = np.std(X, axis=0, ddof=1)
    std[std == 0] = 1.0  # avoid division by zero
    Z = (X - mean) / std

    # Covariance / correlation matrix
    R = np.corrcoef(Z, rowvar=False)

    # Eigen decomposition
    eigenvalues, eigenvectors = np.linalg.eigh(R)
    # Sort descending
    idx = np.argsort(eigenvalues)[::-1]
    eigenvalues = eigenvalues[idx]
    eigenvectors = eigenvectors[:, idx]

    total_var = np.sum(eigenvalues)
    exp_var_ratio = [(float(ev) / total_var) for ev in eigenvalues[:k]]

    # Component loadings = eigenvector * sqrt(eigenvalue)
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

    # Bartlett's test of sphericity approximation
    # chi2 = - (n - 1 - (2p + 5)/6) * ln(det(R))
    bartlett_p = None
    try:
        sign, logdet = np.linalg.slogdet(R)
        if sign > 0:
            p = n_vars
            deg_free = p * (p - 1) / 2
            chi2 = -(n_samples - 1 - (2 * p + 5) / 6.0) * logdet
            if chi2 > 0 and deg_free > 0:
                bartlett_p = float(stats.chi2.sf(chi2, deg_free))
    except Exception:
        pass

    return {
        "n_components": k,
        "explained_variance_ratio": exp_var_ratio,
        "eigenvalues": [float(ev) for ev in eigenvalues[:k]],
        "loadings": loadings,
        "bartlett_p": bartlett_p,
    }
