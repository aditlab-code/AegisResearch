"""plots subpackage — Publication-quality diagnostic and inferential plotting engines."""

from __future__ import annotations

from backend.services.plots.diagnostic_plots import (
    plot_distribution_qq,
    plot_group_comparison,
    plot_hypothesis_critical_region,
    plot_regression_diagnostics,
    plot_roc_curve,
)
from backend.services.plots.interaction_plots import (
    plot_ancova_means,
    plot_mean_difference_ci,
    plot_paired_slopegraph,
    plot_two_way_interaction,
)
from backend.services.plots.multivariate_plots import (
    generate_standardized_plot,
    plot_chisquare_mosaic,
    plot_correlation_heatmap,
)
from backend.services.plots.plot_core import (
    _ensure_plot_dir,
    _fig_to_base64,
    _sanitize_filename,
    _save_and_encode_fig,
    generate_figure_latex_snippet,
)

__all__ = [
    "_ensure_plot_dir",
    "_fig_to_base64",
    "_sanitize_filename",
    "_save_and_encode_fig",
    "generate_figure_latex_snippet",
    "generate_standardized_plot",
    "plot_ancova_means",
    "plot_chisquare_mosaic",
    "plot_correlation_heatmap",
    "plot_distribution_qq",
    "plot_group_comparison",
    "plot_hypothesis_critical_region",
    "plot_mean_difference_ci",
    "plot_paired_slopegraph",
    "plot_regression_diagnostics",
    "plot_roc_curve",
    "plot_two_way_interaction",
]
