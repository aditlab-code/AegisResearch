"""LaTeX table generator facade.

Backward-compatible facade re-exporting all table generator functions from
the modular `backend.services.exporters` package.
"""

from backend.services.exporters import (
    _format_caption_lines,
    _get_table_rules,
    escape_latex,
    format_num,
    format_p_value,
    generate_ancova_latex_table,
    generate_anova_latex_table,
    generate_chisquare_latex_table,
    generate_correlation_latex_table,
    generate_descriptive_latex_table,
    generate_logistic_regression_latex_table,
    generate_manova_latex_table,
    generate_multi_style_table,
    generate_nonparametric_latex_table,
    generate_pca_latex_table,
    generate_regression_latex_table,
    generate_reliability_latex_table,
    generate_ttest_latex_table,
)

__all__ = [
    "_format_caption_lines",
    "_get_table_rules",
    "escape_latex",
    "format_num",
    "format_p_value",
    "generate_ancova_latex_table",
    "generate_anova_latex_table",
    "generate_chisquare_latex_table",
    "generate_correlation_latex_table",
    "generate_descriptive_latex_table",
    "generate_logistic_regression_latex_table",
    "generate_manova_latex_table",
    "generate_multi_style_table",
    "generate_nonparametric_latex_table",
    "generate_pca_latex_table",
    "generate_regression_latex_table",
    "generate_reliability_latex_table",
    "generate_ttest_latex_table",
]
