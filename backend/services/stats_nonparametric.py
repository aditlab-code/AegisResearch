"""Legacy facade for backend.services.stats_nonparametric.

Re-exports non-parametric routines from backend.services.stats.
"""

from backend.services.stats import (
    StatsError,
    _load_selected_columns,
    run_chisquare_independence,
    run_correlation_spearman,
    run_kruskal_wallis,
    run_mann_whitney_u,
    run_wilcoxon_signed_rank,
)

__all__ = [
    "StatsError",
    "_load_selected_columns",
    "run_chisquare_independence",
    "run_correlation_spearman",
    "run_kruskal_wallis",
    "run_mann_whitney_u",
    "run_wilcoxon_signed_rank",
]
