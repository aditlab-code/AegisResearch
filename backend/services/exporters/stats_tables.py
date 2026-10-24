"""LaTeX table generators for descriptive statistics, reliability, and regression models."""

from typing import Any

from backend.services.exporters.table_core import (
    _format_caption_lines,
    _get_table_rules,
    escape_latex,
    format_num,
    format_p_value,
)


def generate_descriptive_latex_table(
    results: list[dict[str, Any]],
    caption: str = "Descriptive Statistics",
    label: str = "tab:descriptive",
    style: str = "apa",
) -> str:
    rules = _get_table_rules(style, "lrrrrrrr")
    caption_lines = _format_caption_lines(caption, label, style)

    if style == "ieee":
        col_headers = (
            "Variable & Sample Size & Mean & Std. Dev. & Median & Min & Max & Skew \\\\"
        )
    elif style == "classic":
        col_headers = "Variable & N & Mean & SD & Median & Min & Max & Skewness \\\\"
    else:  # apa
        col_headers = "Variable & $N$ & $M$ & $SD$ & $Mdn$ & Min & Max & Skew \\\\"

    lines = [
        r"\begin{table}[htbp]",
        r"  \centering",
        *caption_lines,
        f"  \\begin{{tabular}}{{{rules['align']}}}",
        rules["top"],
        f"    {col_headers}",
        rules["mid"],
    ]
    for row in results:
        v_name = escape_latex(row.get("variable", ""))
        n = row.get("n_valid", row.get("n", 0))
        if row.get("scale") == "nominal":
            mode_val = escape_latex(row.get("mode", "-"))
            lines.append(
                f"    {v_name} & {n} & \\multicolumn{{6}}{{l}}{{\\textit{{Nominal (Mode: {mode_val})}}}} \\\\"
            )
        else:
            mean = format_num(row.get("mean"))
            std = format_num(row.get("std"))
            median = format_num(row.get("median"))
            min_val = format_num(row.get("min"))
            max_val = format_num(row.get("max"))
            skew = format_num(row.get("skewness"))
            lines.append(
                f"    {v_name} & {n} & {mean} & {std} & {median} & {min_val} & {max_val} & {skew} \\\\"
            )
    lines.extend(
        [
            rules["bottom"],
            r"  \end{tabular}",
            r"\end{table}",
        ]
    )
    return "\n".join(lines)


def generate_reliability_latex_table(
    alpha: float,
    items_count: int,
    sample_size: int,
    item_stats: list[dict[str, Any]],
    caption: str = "Reliability Analysis and Item-Total Statistics",
    label: str = "tab:reliability",
    style: str = "apa",
) -> str:
    rules = _get_table_rules(style, "lrrrr")
    stat_caption = (
        f"{caption} (Overall $\\alpha = {format_num(alpha, 3)}$, $N = {sample_size}$)"
    )
    caption_lines = _format_caption_lines(stat_caption, label, style)

    if style == "ieee":
        col_headers = "Item & Mean & Std. Dev. & Corrected Item-Total Corr. & Alpha if Deleted \\\\"
    elif style == "classic":
        col_headers = (
            "Item & Mean & SD & Item-Total Correlation & Alpha if Deleted \\\\"
        )
    else:  # apa
        col_headers = r"Item & $M$ & $SD$ & Corrected $r_{it}$ & $\alpha$ if Deleted \\"

    lines = [
        r"\begin{table}[htbp]",
        r"  \centering",
        *caption_lines,
        f"  \\begin{{tabular}}{{{rules['align']}}}",
        rules["top"],
        f"    {col_headers}",
        rules["mid"],
    ]
    for row in item_stats:
        item = escape_latex(row.get("item", ""))
        mean = format_num(row.get("mean"))
        std = format_num(row.get("std"))
        corr = format_num(row.get("corrected_item_total_corr"), 3)
        del_alpha = format_num(row.get("alpha_if_deleted"), 3)
        lines.append(f"    {item} & {mean} & {std} & {corr} & {del_alpha} \\\\")
    lines.extend(
        [
            rules["bottom"],
            r"  \end{tabular}",
            r"\end{table}",
        ]
    )
    return "\n".join(lines)


def generate_regression_latex_table(
    dependent: str,
    r: float,
    r_squared: float,
    adj_r_squared: float,
    f_stat: float,
    f_p: float,
    coeffs: list[dict[str, Any]],
    caption: str = "Summary of Multiple Linear Regression Analysis",
    label: str = "tab:regression",
    style: str = "apa",
) -> str:
    rules = _get_table_rules(style, "lrrrrrrr")
    full_caption = f"{caption} Predicting {escape_latex(dependent)}"
    caption_lines = _format_caption_lines(full_caption, label, style)

    if style == "ieee":
        col_headers = (
            "Predictor & B & Std. Error & Beta & t-Stat & p-Value & Tol. & VIF \\\\"
        )
    elif style == "classic":
        col_headers = "Predictor & B & Std. Error & Beta & t-Value & p-Value & Tolerance & VIF \\\\"
    else:  # apa
        col_headers = r"Predictor & $B$ & $SE_B$ & $\beta$ & $t$ & $p$ & Tol. & VIF \\"

    lines = [
        r"\begin{table}[htbp]",
        r"  \centering",
        *caption_lines,
        f"  \\begin{{tabular}}{{{rules['align']}}}",
        rules["top"],
        f"    {col_headers}",
        rules["mid"],
    ]
    for c in coeffs:
        var = escape_latex(c.get("variable", ""))
        b = format_num(c.get("b"), 3)
        se = format_num(c.get("std_err"), 3)
        beta = (
            format_num(c.get("beta"), 3) if c.get("variable") != "(Constant)" else "-"
        )
        t = format_num(c.get("t"), 3)
        p = format_p_value(c.get("p_value", 1.0), style)
        tol = (
            format_num(c.get("tolerance"), 3) if c.get("tolerance") is not None else "-"
        )
        vif = format_num(c.get("vif"), 3) if c.get("vif") is not None else "-"
        lines.append(
            f"    {var} & {b} & {se} & {beta} & {t} & {p} & {tol} & {vif} \\\\"
        )

    f_p_str = format_p_value(f_p, style)
    p_prefix = "p " if f_p_str.startswith("<") else "p = "
    lines.extend(
        [
            rules["mid"],
            (
                f"    \\multicolumn{{8}}{{l}}{{$R = {format_num(r, 3)}$, $R^2 = {format_num(r_squared, 3)}$, "
                f"Adj. $R^2 = {format_num(adj_r_squared, 3)}$, $F = {format_num(f_stat, 2)}$, {p_prefix}{f_p_str}}} \\\\"
            ),
            rules["bottom"],
            r"  \end{tabular}",
            r"\end{table}",
        ]
    )
    return "\n".join(lines)


def generate_logistic_regression_latex_table(
    dependent: str,
    coeffs: list[dict[str, Any]],
    fit: dict[str, Any],
    classification: dict[str, Any] | None = None,
    caption: str = "Binary Logistic Regression Analysis",
    label: str = "tab:logistic_regression",
    style: str = "apa",
) -> str:
    """Generates LaTeX table for binary logistic regression."""
    rules = _get_table_rules(style, "lrrrrrcc")
    full_caption = f"{caption} Predicting {escape_latex(dependent)}"
    caption_lines = _format_caption_lines(full_caption, label, style)

    if style == "ieee":
        col_headers = "Predictor & B & Std. Error & Wald & df & p-Value & Odds Ratio & 95% CI \\\\"
    elif style == "classic":
        col_headers = "Predictor & B & Std. Error & Wald Chi2 & df & p-Value & Exp(B) & 95% CI \\\\"
    else:  # apa
        col_headers = (
            r"Predictor & $B$ & $SE_B$ & Wald & $df$ & $p$ & $e^B$ & 95\% CI \\"
        )

    lines = [
        r"\begin{table}[htbp]",
        r"  \centering",
        *caption_lines,
        f"  \\begin{{tabular}}{{{rules['align']}}}",
        rules["top"],
        f"    {col_headers}",
        rules["mid"],
    ]

    for c in coeffs:
        var = escape_latex(c["variable"])
        b = format_num(c["b"], 3)
        se = format_num(c["std_err"], 3)
        wald = format_num(c.get("wald", 0.0), 3)
        df_v = str(c.get("df", 1))
        p_val = format_p_value(c["p_value"], style)
        odds = format_num(c.get("odds_ratio", 1.0), 3)
        ci_l = format_num(c.get("or_ci_lower", 0.0), 2)
        ci_u = format_num(c.get("or_ci_upper", 0.0), 2)
        ci_str = f"[{ci_l}, {ci_u}]"
        lines.append(
            f"    {var} & {b} & {se} & {wald} & {df_v} & {p_val} & {odds} & {ci_str} \\\\"
        )

    chi2_val = format_num(fit.get("model_chi2", 0.0), 2)
    chi2_df = fit.get("model_chi2_df", 1)
    chi2_p = format_p_value(fit.get("model_chi2_p", 1.0), style)
    p_pref = "p " if chi2_p.startswith("<") else "p = "

    pseudo = fit.get("pseudo_r2", {})
    nagel = format_num(pseudo.get("nagelkerke", 0.0), 3)
    mcfadden = format_num(pseudo.get("mcfadden", 0.0), 3)

    acc_str = (
        f", Overall Accuracy = {classification.get('accuracy', 0.0) * 100:.1f}\\%"
        if classification
        else ""
    )

    lines.extend(
        [
            rules["mid"],
            f"    \\multicolumn{{8}}{{l}}{{{{\\chi^2({chi2_df}) = {chi2_val}$, {p_pref}{chi2_p}, McFadden's $R^2 = {mcfadden}$, Nagelkerke $R^2 = {nagel}${acc_str}}}}} \\\\",
            rules["bottom"],
            r"  \end{tabular}",
            r"\end{table}",
        ]
    )
    return "\n".join(lines)
