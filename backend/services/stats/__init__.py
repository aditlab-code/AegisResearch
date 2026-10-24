"""Unified statistical analysis package for Aegis Research."""

from __future__ import annotations

from backend.services.stats.descriptive import (
    StatsError,
    _load_selected_columns,
    audit_sample_completeness,
    run_descriptive_analysis,
    run_reliability_analysis,
    sanitize_analysis_data,
)
from backend.services.stats.logistic import run_logistic_regression
from backend.services.stats.multivariate import (
    run_manova_analysis,
    run_pca_analysis,
    run_regression_analysis,
)
from backend.services.stats.nonparametric import (
    run_chisquare_independence,
    run_correlation_spearman,
    run_kruskal_wallis,
    run_mann_whitney_u,
    run_wilcoxon_signed_rank,
)
from backend.services.stats.parametric_anova import (
    run_ancova,
    run_anova_oneway,
    run_anova_twoway,
)
from backend.services.stats.parametric_basic import (
    _normalize_alternative,
    run_correlation_pearson,
    run_ttest_independent,
    run_ttest_one_sample,
    run_ttest_paired,
)

__all__ = [
    "StatsError",
    "_load_selected_columns",
    "_normalize_alternative",
    "audit_sample_completeness",
    "run_ancova",
    "run_anova_oneway",
    "run_anova_twoway",
    "run_chisquare_independence",
    "run_correlation_pearson",
    "run_correlation_spearman",
    "run_descriptive_analysis",
    "run_kruskal_wallis",
    "run_logistic_regression",
    "run_mann_whitney_u",
    "run_manova_analysis",
    "run_pca_analysis",
    "run_regression_analysis",
    "run_reliability_analysis",
    "run_ttest_independent",
    "run_ttest_one_sample",
    "run_ttest_paired",
    "run_wilcoxon_signed_rank",
    "sanitize_analysis_data",
]
