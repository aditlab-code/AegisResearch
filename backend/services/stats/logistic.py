"""Binary Logistic Regression Service for AegisResearch."""

from __future__ import annotations

import logging
import math
from pathlib import Path
from typing import Any

import numpy as np
import statsmodels.api as sm
from scipy import stats

from backend.services.stats.descriptive import (
    StatsError,
    _load_selected_columns,
    sanitize_analysis_data,
)

logger = logging.getLogger(__name__)


def run_logistic_regression(
    file_path: Path,
    dependent: str,
    independents: list[str],
    cutoff: float = 0.5,
    missing_strategy: str = "listwise",
) -> dict[str, Any]:
    """Runs Binary Logistic Regression analysis."""
    if not independents:
        raise StatsError(
            "At least one independent variable is required for Logistic Regression"
        )
    if dependent in independents:
        raise StatsError(
            "Dependent variable cannot also be in independent variables list"
        )

    all_cols = [dependent] + independents
    df_raw = _load_selected_columns(file_path, all_cols)
    df, audit = sanitize_analysis_data(df_raw, all_cols, missing_strategy)

    n_samples = len(df)
    if n_samples <= len(independents) + 1:
        raise StatsError(
            f"Sample size ({n_samples}) is too small for {len(independents)} predictors in Logistic Regression"
        )

    unique_vals = sorted(df[dependent].dropna().unique().tolist())
    if len(unique_vals) != 2:
        raise StatsError(
            f"Binary Logistic Regression requires dependent variable '{dependent}' to have exactly 2 distinct classes (found {len(unique_vals)}: {unique_vals})"
        )

    ref_val = unique_vals[0]
    event_val = unique_vals[1]

    y = (df[dependent] == event_val).astype(int).values

    n_event = int(np.sum(y == 1))
    n_ref = int(np.sum(y == 0))
    if n_event < 2 or n_ref < 2:
        raise StatsError(
            f"Both binary classes must have at least 2 observations (found reference '{ref_val}': {n_ref}, event '{event_val}': {n_event})"
        )

    X = df[independents].astype(float)
    X_const = sm.add_constant(X)

    try:
        model = sm.Logit(y, X_const).fit(disp=False)
        null_const = np.ones((n_samples, 1))
        null_model = sm.Logit(y, null_const).fit(disp=False)
    except Exception as e:
        raise StatsError(f"Logistic regression estimation failed: {e}") from e

    ll_full = float(model.llf)
    ll_null = float(null_model.llf)
    chi2_val = float(max(0.0, 2.0 * (ll_full - ll_null)))
    chi2_df = len(independents)
    chi2_p = float(stats.chi2.sf(chi2_val, chi2_df)) if chi2_df > 0 else 1.0

    mcfadden_r2 = (
        float(max(0.0, min(1.0, 1.0 - (ll_full / ll_null))))
        if abs(ll_null) > 1e-12
        else 0.0
    )
    cox_snell_r2 = float(max(0.0, min(1.0, 1.0 - math.exp(-chi2_val / n_samples))))
    max_cox_snell = 1.0 - math.exp(2.0 * ll_null / n_samples)
    nagelkerke_r2 = (
        float(max(0.0, min(1.0, cox_snell_r2 / max_cox_snell)))
        if max_cox_snell > 1e-12
        else 0.0
    )

    coeffs = []
    b_const = float(model.params.iloc[0])
    se_const = float(model.bse.iloc[0])
    wald_const = (b_const / se_const) ** 2 if se_const > 0 else 0.0
    p_const = float(model.pvalues.iloc[0])
    or_const = math.exp(min(max(b_const, -100.0), 100.0))
    coeffs.append(
        {
            "variable": "(Constant)",
            "b": b_const,
            "std_err": se_const,
            "wald": wald_const,
            "df": 1,
            "p_value": p_const,
            "odds_ratio": or_const,
            "or_ci_lower": math.exp(min(max(b_const - 1.96 * se_const, -100.0), 100.0)),
            "or_ci_upper": math.exp(min(max(b_const + 1.96 * se_const, -100.0), 100.0)),
        }
    )

    for col in independents:
        b_val = float(model.params[col])
        se_val = float(model.bse[col])
        wald_val = (b_val / se_val) ** 2 if se_val > 0 else 0.0
        p_val = float(model.pvalues[col])
        or_val = math.exp(min(max(b_val, -100.0), 100.0))
        coeffs.append(
            {
                "variable": col,
                "b": b_val,
                "std_err": se_val,
                "wald": wald_val,
                "df": 1,
                "p_value": p_val,
                "odds_ratio": or_val,
                "or_ci_lower": math.exp(min(max(b_val - 1.96 * se_val, -100.0), 100.0)),
                "or_ci_upper": math.exp(min(max(b_val + 1.96 * se_val, -100.0), 100.0)),
            }
        )

    p_pred = np.asarray(model.predict(X_const), dtype=float)
    y_pred = (p_pred >= cutoff).astype(int)

    tp = int(np.sum((y == 1) & (y_pred == 1)))
    tn = int(np.sum((y == 0) & (y_pred == 0)))
    fp = int(np.sum((y == 0) & (y_pred == 1)))
    fn = int(np.sum((y == 1) & (y_pred == 0)))

    accuracy = float((tp + tn) / n_samples)
    sensitivity = float(tp / (tp + fn)) if (tp + fn) > 0 else 0.0
    specificity = float(tn / (tn + fp)) if (tn + fp) > 0 else 0.0
    precision = float(tp / (tp + fp)) if (tp + fp) > 0 else 0.0
    f1_score = (
        float(2.0 * (precision * sensitivity) / (precision + sensitivity))
        if (precision + sensitivity) > 0
        else 0.0
    )

    ranks = stats.rankdata(p_pred)
    rank_sum_pos = float(np.sum(ranks[y == 1]))
    auc = float((rank_sum_pos - n_event * (n_event + 1) / 2.0) / (n_event * n_ref))
    auc = max(0.0, min(1.0, auc))

    roc_points = []
    thresholds = np.linspace(1.0, 0.0, 51)
    for t in thresholds:
        yp = (p_pred >= t).astype(int)
        cur_tp = np.sum((y == 1) & (yp == 1))
        cur_fp = np.sum((y == 0) & (yp == 1))
        cur_tpr = float(cur_tp / n_event) if n_event > 0 else 0.0
        cur_fpr = float(cur_fp / n_ref) if n_ref > 0 else 0.0
        roc_points.append({"threshold": float(t), "fpr": cur_fpr, "tpr": cur_tpr})

    resid_dev = np.asarray(model.resid_dev, dtype=float)
    resid_pearson = np.asarray(model.resid_pearson, dtype=float)
    f_dev = resid_dev[np.isfinite(resid_dev)]
    f_pear = resid_pearson[np.isfinite(resid_pearson)]

    return {
        "dependent": dependent,
        "independents": independents,
        "sample_size": n_samples,
        "sample_audit": audit,
        "reference_category": str(ref_val),
        "event_category": str(event_val),
        "cutoff": float(cutoff),
        "log_likelihood": ll_full,
        "null_log_likelihood": ll_null,
        "deviance": float(-2.0 * ll_full),
        "aic": float(model.aic),
        "bic": float(model.bic),
        "model_chi2": chi2_val,
        "model_chi2_df": chi2_df,
        "model_chi2_p": chi2_p,
        "pseudo_r2": {
            "mcfadden": mcfadden_r2,
            "cox_snell": cox_snell_r2,
            "nagelkerke": nagelkerke_r2,
        },
        "coefficients": coeffs,
        "classification": {
            "cutoff": cutoff,
            "tp": tp,
            "tn": tn,
            "fp": fp,
            "fn": fn,
            "accuracy": accuracy,
            "sensitivity": sensitivity,
            "specificity": specificity,
            "precision": precision,
            "f1_score": f1_score,
            "auc": auc,
        },
        "roc_curve": roc_points,
        "residuals_summary": {
            "deviance": {
                "min": float(np.min(f_dev)) if len(f_dev) > 0 else 0.0,
                "max": float(np.max(f_dev)) if len(f_dev) > 0 else 0.0,
                "mean": float(np.mean(f_dev)) if len(f_dev) > 0 else 0.0,
                "std": float(np.std(f_dev, ddof=1)) if len(f_dev) > 1 else 0.0,
            },
            "pearson": {
                "min": float(np.min(f_pear)) if len(f_pear) > 0 else 0.0,
                "max": float(np.max(f_pear)) if len(f_pear) > 0 else 0.0,
                "mean": float(np.mean(f_pear)) if len(f_pear) > 0 else 0.0,
                "std": float(np.std(f_pear, ddof=1)) if len(f_pear) > 1 else 0.0,
            },
        },
    }
