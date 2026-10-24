"""Descriptive statistics, sample audit, and reliability analysis for Aegis Research."""

from __future__ import annotations

import logging
from pathlib import Path
from typing import Any

logger = logging.getLogger(__name__)


class StatsError(Exception):
    """Raised when statistical computation fails or input data is invalid."""


def _load_selected_columns(file_path: Path, columns: list[str]):
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

        return lf.select(columns).collect().to_pandas()
    except StatsError:
        raise
    except Exception as e:
        raise StatsError(f"Failed to load dataset columns: {e}") from e


def audit_sample_completeness(
    df: Any, variables: list[str]
) -> dict[str, dict[str, Any]]:
    """Calculates sample completeness metrics (total, valid, missing, percentage) per variable."""
    n_total = len(df)
    audit: dict[str, dict[str, Any]] = {}
    for var in variables:
        series = df[var]
        n_missing = int(series.isna().sum())
        n_valid = n_total - n_missing
        missing_pct = (
            round(float((n_missing / n_total) * 100), 2) if n_total > 0 else 0.0
        )
        audit[var] = {
            "n_total": n_total,
            "n_valid": n_valid,
            "n_missing": n_missing,
            "missing_pct": missing_pct,
        }
    return audit


def sanitize_analysis_data(
    df: Any,
    variables: list[str],
    missing_strategy: str = "listwise",
) -> tuple[Any, dict[str, Any]]:
    """Filters data based on missing strategy and returns sanitized DataFrame + audit summary."""
    audit = audit_sample_completeness(df, variables)
    if missing_strategy == "listwise":
        clean_df = df[variables].dropna()
    else:
        clean_df = df[variables]
    return clean_df, audit


def run_descriptive_analysis(
    file_path: Path,
    variables: list[str],
    include_normality: bool = True,
    missing_strategy: str = "pairwise",
) -> list[dict[str, Any]]:
    """Calculates summary statistics, missing data audit, and normality test for each selected variable."""
    if not variables:
        raise StatsError("At least one variable must be selected")

    raw_df = _load_selected_columns(file_path, variables)
    df, audit = sanitize_analysis_data(
        raw_df, variables, missing_strategy=missing_strategy
    )

    try:
        import numpy as np
        from scipy import stats
    except ImportError as e:
        raise StatsError("NumPy and SciPy are required for statistics") from e

    results = []
    for var in variables:
        series = df[var].dropna()
        n = len(series)
        var_audit = audit.get(
            var,
            {
                "n_total": len(raw_df),
                "n_valid": n,
                "n_missing": len(raw_df) - n,
                "missing_pct": round(float(((len(raw_df) - n) / len(raw_df)) * 100), 2)
                if len(raw_df) > 0
                else 0.0,
            },
        )
        if n < 1:
            raise StatsError(f"Variable '{var}' has no valid observations")

        try:
            num_series = series.astype(float)
            is_numeric = True
        except (ValueError, TypeError):
            num_series = None
            is_numeric = False

        if not is_numeric:
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
                    "n_total": var_audit["n_total"],
                    "n_valid": var_audit["n_valid"],
                    "n_missing": var_audit["n_missing"],
                    "missing_pct": var_audit["missing_pct"],
                    "mean": None,
                    "variance": None,
                    "std": None,
                    "median": None,
                    "min": None,
                    "max": None,
                    "iqr": None,
                    "coeff_variation": None,
                    "skewness": None,
                    "kurtosis": None,
                    "shapiro_w": None,
                    "shapiro_p": None,
                    "mode": mode_val,
                    "frequencies": freqs,
                }
            )
            continue

        mean_val = float(num_series.mean())
        var_val = float(num_series.var(ddof=1)) if n > 1 else 0.0
        std_val = float(num_series.std(ddof=1)) if n > 1 else 0.0
        median_val = float(num_series.median())
        mode_val = (
            float(num_series.mode().iloc[0]) if not num_series.mode().empty else None
        )
        min_val = float(num_series.min())
        max_val = float(num_series.max())
        skew_val = float(stats.skew(num_series, bias=False)) if n > 2 else 0.0
        kurt_val = float(stats.kurtosis(num_series, bias=False)) if n > 3 else 0.0
        iqr_val = (
            float(np.percentile(num_series, 75) - np.percentile(num_series, 25))
            if n > 1
            else 0.0
        )
        cv_val = float(std_val / mean_val) if mean_val != 0.0 else None

        shapiro_w = None
        shapiro_p = None
        if include_normality and 3 <= n <= 5000:
            try:
                res = stats.shapiro(num_series)
                shapiro_w = float(res.statistic)
                shapiro_p = float(res.pvalue)
            except Exception as e:  # noqa: BLE001
                logger.debug("Shapiro test failed for %s: %s", var, e)

        results.append(
            {
                "variable": var,
                "scale": "scale",
                "n": n,
                "n_total": var_audit["n_total"],
                "n_valid": var_audit["n_valid"],
                "n_missing": var_audit["n_missing"],
                "missing_pct": var_audit["missing_pct"],
                "mean": mean_val,
                "variance": var_val,
                "std": std_val,
                "median": median_val,
                "min": min_val,
                "max": max_val,
                "iqr": iqr_val,
                "coeff_variation": cv_val,
                "skewness": skew_val,
                "kurtosis": kurt_val,
                "shapiro_w": shapiro_w,
                "shapiro_p": shapiro_p,
                "mode": mode_val,
                "frequencies": None,
            }
        )

    return results


def run_reliability_analysis(file_path: Path, items: list[str]) -> dict[str, Any]:
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

    item_vars = np.var(data, axis=0, ddof=1)
    total_scores = np.sum(data, axis=1)
    total_var = np.var(total_scores, ddof=1)

    if total_var == 0:
        alpha = 0.0
    else:
        alpha = (n_items / (n_items - 1)) * (1 - (np.sum(item_vars) / total_var))

    item_stats = []
    for i, item_name in enumerate(items):
        item_col = data[:, i]
        rest_total = total_scores - item_col
        if np.std(item_col) > 0 and np.std(rest_total) > 0:
            corr = float(np.corrcoef(item_col, rest_total)[0, 1])
        else:
            corr = 0.0

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
