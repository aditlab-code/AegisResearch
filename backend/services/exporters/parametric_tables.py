"""LaTeX table generators for parametric tests (t-tests, ANOVA, ANCOVA, and correlations)."""

from typing import Any

from backend.services.exporters.table_core import (
    _format_caption_lines,
    _get_table_rules,
    escape_latex,
    format_num,
    format_p_value,
)


def _pick_header(style: str, ieee: str, classic: str, apa: str) -> str:
    """Helper to pick table column headers according to style."""
    if style == "ieee":
        return ieee
    if style == "classic":
        return classic
    return apa


def _build_table(
    caption_lines: list[str],
    rules: dict[str, str],
    col_headers: str,
    body: list[str],
) -> str:
    """Helper to assemble a standard LaTeX table environment."""
    return "\n".join(
        [
            r"\begin{table}[htbp]",
            r"  \centering",
            *caption_lines,
            f"  \\begin{{tabular}}{{{rules['align']}}}",
            rules["top"],
            f"    {col_headers}",
            rules["mid"],
            *body,
            rules["bottom"],
            r"  \end{tabular}",
            r"\end{table}",
        ]
    )


def generate_ttest_latex_table(
    data: dict[str, Any],
    caption: str = "Summary of t-Test Analysis",
    label: str = "tab:ttest",
    style: str = "apa",
) -> str:
    analysis_type = data.get("analysis_type", "")
    if analysis_type == "ttest_one_sample":
        rules = _get_table_rules(style, "lrrrrrrrrr")
        full_caption = f"{caption} (Test Value = {data.get('test_value', 0)})"
        caption_lines = _format_caption_lines(full_caption, label, style)

        var = escape_latex(data.get("variable", "Variable"))
        n = data.get("n", 0)
        mean, sd = format_num(data.get("mean")), format_num(data.get("std"))
        t_val = format_num(data.get("t_statistic"), 3)
        df_val = data.get("df", 0)
        p_val = format_p_value(data.get("p_value", 1.0), style)
        diff = format_num(data.get("mean_diff"))
        ci_low = format_num(data.get("ci_95_lower"))
        ci_high = format_num(data.get("ci_95_upper"))
        d_val = format_num(data.get("cohen_d"))

        col_headers = _pick_header(
            style,
            "Variable & N & Mean & Std. Dev. & Mean Diff. & 95\\% CI & t-Stat & df & p-Value & Cohen's d \\\\",
            "Variable & N & Mean & SD & Mean Diff. & 95\\% CI & t-Value & df & p-Value & Cohen's d \\\\",
            r"Variable & $N$ & $M$ & $SD$ & Mean Diff. & 95\% CI & $t$ & $df$ & $p$ & Cohen's $d$ \\",
        )

        body = [
            f"    {var} & {n} & {mean} & {sd} & {diff} & [{ci_low}, {ci_high}] & {t_val} & {df_val} & {p_val} & {d_val} \\\\"
        ]
        return _build_table(caption_lines, rules, col_headers, body)

    elif analysis_type == "ttest_independent":
        rules = _get_table_rules(style, "lrrrrrrrr")
        full_caption = f"{caption} for {escape_latex(data.get('test_variable', ''))} by {escape_latex(data.get('group_variable', ''))}"
        caption_lines = _format_caption_lines(full_caption, label, style)

        g1 = data.get("group1", {})
        g2 = data.get("group2", {})
        eq = data.get("equal_var", {})
        welch = data.get("welch_var", {})

        col_headers = _pick_header(
            style,
            "Group & N & Mean & Std. Dev. & t-Stat & df & p-Value & Mean Diff. & Cohen's d \\\\",
            "Group & N & Mean & SD & t-Value & df & p-Value & Mean Diff. & Cohen's d \\\\",
            r"Group & $N$ & $M$ & $SD$ & $t$ & $df$ & $p$ & Mean Diff. & Cohen's $d$ \\",
        )

        body = [
            f"    {escape_latex(g1.get('name', 'G1'))} & {g1.get('n', 0)} & {format_num(g1.get('mean'))} & {format_num(g1.get('std'))} & - & - & - & - & - \\\\",
            f"    {escape_latex(g2.get('name', 'G2'))} & {g2.get('n', 0)} & {format_num(g2.get('mean'))} & {format_num(g2.get('std'))} & - & - & - & - & - \\\\",
            rules["mid"],
            f"    Equal Var. & \\multicolumn{{3}}{{l}}{{Levene's $F = {format_num(data.get('levene_f'))}, p = {format_p_value(data.get('levene_p', 1.0), style)}$}} & {format_num(eq.get('t_statistic'), 3)} & {eq.get('df', 0)} & {format_p_value(eq.get('p_value', 1.0), style)} & {format_num(eq.get('mean_diff'))} & {format_num(eq.get('cohen_d'))} \\\\",
            f"    Welch & \\multicolumn{{3}}{{l}}{{Unequal variance assumed}} & {format_num(welch.get('t_statistic'), 3)} & {format_num(welch.get('df'), 1)} & {format_p_value(welch.get('p_value', 1.0), style)} & {format_num(welch.get('mean_diff'))} & {format_num(welch.get('cohen_d'))} \\\\",
        ]
        return _build_table(caption_lines, rules, col_headers, body)

    elif analysis_type == "ttest_paired":
        rules = _get_table_rules(style, "lrrrrrrrrr")
        var1 = escape_latex(data.get("var1", ""))
        var2 = escape_latex(data.get("var2", ""))
        full_caption = f"{caption} Comparing {var1} and {var2}"
        caption_lines = _format_caption_lines(full_caption, label, style)

        col_headers = _pick_header(
            style,
            "Measure & N & Mean & Std. Dev. & Mean Diff. & r & t-Stat & df & p-Value & Cohen's dz \\\\",
            "Measure & N & Mean & SD & Mean Diff. & Correlation & t-Value & df & p-Value & Cohen's dz \\\\",
            r"Measure & $N$ & $M$ & $SD$ & Mean Diff. & $r$ & $t$ & $df$ & $p$ & Cohen's $d_z$ \\",
        )

        body = [
            f"    {var1} & {data.get('n', 0)} & {format_num(data.get('mean1'))} & {format_num(data.get('std1'))} & \\multirow{{2}}{{*}}{{{format_num(data.get('mean_diff'))}}} & \\multirow{{2}}{{*}}{{{format_num(data.get('correlation'), 3)}}} & \\multirow{{2}}{{*}}{{{format_num(data.get('t_statistic'), 3)}}} & \\multirow{{2}}{{*}}{{{data.get('df', 0)}}} & \\multirow{{2}}{{*}}{{{format_p_value(data.get('p_value', 1.0), style)}}} & \\multirow{{2}}{{*}}{{{format_num(data.get('cohen_d'))}}} \\\\",
            f"    {var2} & {data.get('n', 0)} & {format_num(data.get('mean2'))} & {format_num(data.get('std2'))} & & & & & & \\\\",
        ]
        return _build_table(caption_lines, rules, col_headers, body)

    return ""


def generate_anova_latex_table(
    data: dict[str, Any],
    caption: str = "ANOVA Summary Table",
    label: str = "tab:anova",
    style: str = "apa",
) -> str:
    analysis_type = data.get("analysis_type", "")
    if analysis_type == "anova_oneway":
        rules = _get_table_rules(style, "lrrrrrr")
        dep = escape_latex(data.get("dependent", ""))
        fac = escape_latex(data.get("factor", ""))
        caption_lines = _format_caption_lines(
            f"{caption} for {dep} by {fac}", label, style
        )

        ss_b, df_b = format_num(data.get("ss_between")), data.get("df_between", 0)
        ms_b = format_num(data.get("ms_between"))
        f_stat = format_num(data.get("f_statistic"), 3)
        p_val = format_p_value(data.get("p_value", 1.0), style)
        eta = format_num(data.get("eta_squared"), 3)
        ss_w, df_w = format_num(data.get("ss_within")), data.get("df_within", 0)
        ms_w = format_num(data.get("ms_within"))
        ss_t, df_t = format_num(data.get("ss_total")), data.get("df_total", 0)

        col_headers = _pick_header(
            style,
            "Source of Variation & SS & df & MS & F-Stat & p-Value & Eta-Sq \\\\",
            "Source of Variation & SS & df & MS & F & p-Value & Eta-Squared \\\\",
            r"Source of Variation & $SS$ & $df$ & $MS$ & $F$ & $p$ & $\eta^2$ \\",
        )

        body = [
            f"    Between Groups & {ss_b} & {df_b} & {ms_b} & {f_stat} & {p_val} & {eta} \\\\",
            f"    Within Groups (Error) & {ss_w} & {df_w} & {ms_w} & - & - & - \\\\",
            f"    Total & {ss_t} & {df_t} & - & - & - & - \\\\",
        ]
        return _build_table(caption_lines, rules, col_headers, body)

    elif analysis_type == "anova_twoway":
        rules = _get_table_rules(style, "lrrrrr")
        dep = escape_latex(data.get("dependent", ""))
        caption_lines = _format_caption_lines(f"{caption} for {dep}", label, style)
        effects = data.get("effects", [])

        col_headers = _pick_header(
            style,
            "Source & SS & df & MS & F-Stat & p-Value \\\\",
            "Source & SS & df & MS & F-Statistic & p-Value \\\\",
            r"Source & $SS$ & $df$ & $MS$ & $F$ & $p$ \\",
        )

        body = [
            f"    {escape_latex(eff.get('source', ''))} & {format_num(eff.get('sum_sq'))} & {format_num(eff.get('df'), 0)} & {format_num(eff.get('mean_sq'))} & {format_num(eff.get('f_stat'), 3) if eff.get('f_stat') is not None else '-'} & {format_p_value(eff.get('p_value'), style) if eff.get('p_value') is not None else '-'} \\\\"
            for eff in effects
        ]
        return _build_table(caption_lines, rules, col_headers, body)

    return ""


def generate_ancova_latex_table(
    data: dict[str, Any],
    caption: str = "ANCOVA Summary Table",
    label: str = "tab:ancova",
    style: str = "apa",
) -> str:
    rules = _get_table_rules(style, "lrrrrrr")
    dep = escape_latex(data.get("dependent", ""))
    fac = escape_latex(data.get("factor", ""))
    caption_lines = _format_caption_lines(f"{caption} for {dep} by {fac}", label, style)
    effects = data.get("effects", [])

    col_headers = _pick_header(
        style,
        r"Source & SS & df & MS & F-Stat & p-Value & Partial Eta-Sq \\",
        r"Source & SS & df & MS & F & p-Value & Partial Eta-Squared \\",
        r"Source & $SS$ & $df$ & $MS$ & $F$ & $p$ & $\eta_p^2$ \\",
    )

    body = [
        f"    {escape_latex(eff.get('source', ''))} & {format_num(eff.get('sum_sq'))} & {eff.get('df', 0)} & {format_num(eff.get('mean_sq'))} & {format_num(eff.get('f_statistic'), 3) if eff.get('f_statistic') is not None else '-'} & {format_p_value(eff.get('p_value'), style) if eff.get('p_value') is not None else '-'} & {format_num(eff.get('partial_eta_squared'), 3) if eff.get('partial_eta_squared') is not None else '-'} \\\\"
        for eff in effects
    ]
    return _build_table(caption_lines, rules, col_headers, body)


def generate_correlation_latex_table(
    data: dict[str, Any],
    caption: str = "Correlation Matrix",
    label: str = "tab:correlation",
    style: str = "apa",
) -> str:
    variables = data.get("variables", [])
    matrix = data.get("matrix", [])
    n_vars = len(variables)
    is_spearman = data.get("analysis_type") == "correlation_spearman"
    coeff_key = "rho" if is_spearman else "r"
    stat_symbol = r"\rho" if is_spearman else "r"

    headers = " & ".join(f"({i + 1})" for i in range(n_vars))
    raw_align = "l" + "r" * n_vars
    rules = _get_table_rules(style, raw_align)
    caption_lines = _format_caption_lines(
        f"{caption} (${stat_symbol}$ values)", label, style
    )

    lines = [
        r"\begin{table}[htbp]",
        r"  \centering",
        *caption_lines,
        f"  \\begin{{tabular}}{{{rules['align']}}}",
        rules["top"],
        f"    Variable & {headers} \\\\",
        rules["mid"],
    ]

    for i, row in enumerate(matrix):
        var_name = f"{i + 1}. {escape_latex(row.get('variable', ''))}"
        cells = []
        for j, cell in enumerate(row.get("correlations", [])):
            if i == j:
                cells.append("1.00")
            elif j > i:
                cells.append("-")
            else:
                val = cell.get(coeff_key, 0.0)
                p = cell.get("p_value", 1.0)
                star = (
                    "***"
                    if p < 0.001
                    else ("**" if p < 0.01 else ("*" if p < 0.05 else ""))
                )
                cells.append(f"{format_num(val, 2)}{star}")
        lines.append(f"    {var_name} & {' & '.join(cells)} \\\\")

    p_legend = (
        r"\par\vspace{2pt}\footnotesize{\textit{Note.} * $p < .05$, ** $p < .01$, *** $p < .001$.}"
        if style == "apa"
        else r"\par\vspace{2pt}\footnotesize{Note: * $p < 0.05$, ** $p < 0.01$, *** $p < 0.001$.}"
    )
    lines.extend(
        [
            rules["bottom"],
            r"  \end{tabular}",
            f"  {p_legend}",
            r"\end{table}",
        ]
    )
    return "\n".join(lines)
