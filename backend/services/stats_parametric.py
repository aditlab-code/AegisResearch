"""Legacy facade for backend.services.stats_parametric.

Re-exports parametric routines from backend.services.stats.
"""

from backend.services.stats import (
    StatsError,
    _load_selected_columns,
    _normalize_alternative,
    run_ancova,
    run_anova_oneway,
    run_anova_twoway,
    run_correlation_pearson,
    run_ttest_independent,
    run_ttest_one_sample,
    run_ttest_paired,
    sanitize_analysis_data,
)

__all__ = [
    "StatsError",
    "_load_selected_columns",
    "_normalize_alternative",
    "run_ancova",
    "run_anova_oneway",
    "run_anova_twoway",
    "run_correlation_pearson",
    "run_ttest_independent",
    "run_ttest_one_sample",
    "run_ttest_paired",
    "sanitize_analysis_data",
]
