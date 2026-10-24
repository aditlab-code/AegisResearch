"""Legacy facade for backend.services.stats_logistic.

Re-exports logistic regression routine from backend.services.stats.
"""

from backend.services.stats import (
    StatsError,
    _load_selected_columns,
    audit_sample_completeness,
    run_logistic_regression,
    sanitize_analysis_data,
)

__all__ = [
    "StatsError",
    "_load_selected_columns",
    "audit_sample_completeness",
    "run_logistic_regression",
    "sanitize_analysis_data",
]
