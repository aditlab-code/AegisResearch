"""LaTeX table generator for APA 7th, IEEE Style, and Classic scientific tables."""

from typing import List, Dict, Any, Optional, Callable


def escape_latex(text: str) -> str:
    """Escapes special LaTeX characters in strings."""
    special = {
        "&": r"\&",
        "%": r"\%",
        "$": r"\$",
        "#": r"\#",
        "_": r"\_",
        "{": r"\{",
        "}": r"\}",
        "~": r"\textasciitilde{}",
        "^": r"\textasciicircum{}",
    }
    res = str(text)
    for char, replacement in special.items():
        res = res.replace(char, replacement)
    return res


def format_p_value(p: float, style: str = "apa") -> str:
    """Formats p-value according to chosen style (APA: no leading zero, IEEE/Classic: leading zero)."""
    if style == "apa":
        if p < 0.001:
            return "< .001"
        formatted = f"{p:.3f}"
        return formatted[1:] if formatted.startswith("0") else formatted
    else:
        if p < 0.001:
            return "< 0.001"
        return f"{p:.3f}"


def format_num(val: Optional[float], decimals: int = 2) -> str:
    if val is None:
        return "-"
    return f"{val:.{decimals}f}"


def _get_table_rules(style: str, align: str) -> Dict[str, str]:
    """Helper to return top, mid, bottom rules and column alignment string."""
    clean_align = align.replace("|", "")
    if style == "classic":
        bordered = "|" + "|".join(list(clean_align)) + "|"
        return {
            "top": r"    \hline",
            "mid": r"    \hline",
            "bottom": r"    \hline",
            "align": bordered,
        }
    elif style == "ieee":
        return {
            "top": r"    \toprule",
            "mid": r"    \midrule",
            "bottom": r"    \bottomrule",
            "align": clean_align,
        }
    else:  # apa
        return {
            "top": r"    \toprule",
            "mid": r"    \midrule",
            "bottom": r"    \bottomrule",
            "align": clean_align,
        }


def _format_caption_lines(caption: str, label: str, style: str) -> List[str]:
    """Formats caption and label lines based on citation/table style."""
    if style == "ieee":
        return [
            f"  \\caption{{\\textsc{{{escape_latex(caption)}}}}}",
            f"  \\label{{{label}}}",
        ]
    else:
        return [
            f"  \\caption{{{escape_latex(caption)}}}",
            f"  \\label{{{label}}}",
        ]


def generate_descriptive_latex_table(
    results: List[Dict[str, Any]],
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
        n = row.get("n", 0)
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
    item_stats: List[Dict[str, Any]],
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
    coeffs: List[Dict[str, Any]],
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
            f"    \\multicolumn{{8}}{{l}}{{$R = {format_num(r, 3)}$, $R^2 = {format_num(r_squared, 3)}$, "
            f"Adj. $R^2 = {format_num(adj_r_squared, 3)}$, $F = {format_num(f_stat, 2)}$, {p_prefix}{f_p_str}}} \\\\",
            rules["bottom"],
            r"  \end{tabular}",
            r"\end{table}",
        ]
    )
    return "\n".join(lines)


def generate_manova_latex_table(
    factor: str,
    dependents: List[str],
    tests: List[Dict[str, Any]],
    caption: str = "Multivariate Analysis of Variance (MANOVA)",
    label: str = "tab:manova",
    style: str = "apa",
) -> str:
    dep_str = ", ".join(escape_latex(d) for d in dependents)
    rules = _get_table_rules(style, "lrrrrr")
    full_caption = f"{caption} for Factor '{escape_latex(factor)}' on ({dep_str})"
    caption_lines = _format_caption_lines(full_caption, label, style)

    if style == "ieee":
        col_headers = (
            "Multivariate Test & Value & F-Stat & Num df & Den df & p-Value \\\\"
        )
    elif style == "classic":
        col_headers = (
            "Multivariate Test & Value & F-Statistic & Num df & Den df & p-Value \\\\"
        )
    else:  # apa
        col_headers = r"Multivariate Test & Value & $F$ & Num $df$ & Den $df$ & $p$ \\"

    lines = [
        r"\begin{table}[htbp]",
        r"  \centering",
        *caption_lines,
        f"  \\begin{{tabular}}{{{rules['align']}}}",
        rules["top"],
        f"    {col_headers}",
        rules["mid"],
    ]
    for t in tests:
        name = escape_latex(t.get("test_name", ""))
        val = format_num(t.get("value"), 3)
        f_val = format_num(t.get("f_stat"), 3)
        num_df = int(t.get("num_df", 0))
        den_df = int(t.get("den_df", 0))
        p = format_p_value(t.get("p_value", 1.0), style)
        lines.append(f"    {name} & {val} & {f_val} & {num_df} & {den_df} & {p} \\\\")
    lines.extend(
        [
            rules["bottom"],
            r"  \end{tabular}",
            r"\end{table}",
        ]
    )
    return "\n".join(lines)


def generate_pca_latex_table(
    loadings: List[Dict[str, Any]],
    exp_var: List[float],
    eigenvalues: List[float],
    caption: str = "Principal Component Loadings and Explained Variance",
    label: str = "tab:pca",
    style: str = "apa",
) -> str:
    n_comp = len(exp_var)
    comp_headers = " & ".join(f"PC{i + 1}" for i in range(n_comp))
    raw_align = "l" + "r" * n_comp
    rules = _get_table_rules(style, raw_align)
    caption_lines = _format_caption_lines(caption, label, style)

    lines = [
        r"\begin{table}[htbp]",
        r"  \centering",
        *caption_lines,
        f"  \\begin{{tabular}}{{{rules['align']}}}",
        rules["top"],
        f"    Variable & {comp_headers} \\\\",
        rules["mid"],
    ]
    for row in loadings:
        var = escape_latex(row.get("variable", ""))
        comps = " & ".join(format_num(c, 3) for c in row.get("components", []))
        lines.append(f"    {var} & {comps} \\\\")
    lines.append(rules["mid"])
    eig_str = " & ".join(format_num(ev, 3) for ev in eigenvalues)
    lines.append(f"    Eigenvalue & {eig_str} \\\\")
    var_str = " & ".join(f"{format_num(ev * 100, 1)}\\%" for ev in exp_var)
    lines.append(f"    \\% Variance & {var_str} \\\\")
    lines.extend(
        [
            rules["bottom"],
            r"  \end{tabular}",
            r"\end{table}",
        ]
    )
    return "\n".join(lines)


def generate_ttest_latex_table(
    data: Dict[str, Any],
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
        mean = format_num(data.get("mean"))
        sd = format_num(data.get("std"))
        t_val = format_num(data.get("t_statistic"), 3)
        df_val = data.get("df", 0)
        p_val = format_p_value(data.get("p_value", 1.0), style)
        diff = format_num(data.get("mean_diff"))
        ci_low = format_num(data.get("ci_95_lower"))
        ci_high = format_num(data.get("ci_95_upper"))
        d_val = format_num(data.get("cohen_d"))

        if style == "ieee":
            col_headers = "Variable & N & Mean & Std. Dev. & Mean Diff. & 95\\% CI & t-Stat & df & p-Value & Cohen's d \\\\"
        elif style == "classic":
            col_headers = "Variable & N & Mean & SD & Mean Diff. & 95\\% CI & t-Value & df & p-Value & Cohen's d \\\\"
        else:  # apa
            col_headers = r"Variable & $N$ & $M$ & $SD$ & Mean Diff. & 95\% CI & $t$ & $df$ & $p$ & Cohen's $d$ \\"

        lines = [
            r"\begin{table}[htbp]",
            r"  \centering",
            *caption_lines,
            f"  \\begin{{tabular}}{{{rules['align']}}}",
            rules["top"],
            f"    {col_headers}",
            rules["mid"],
            f"    {var} & {n} & {mean} & {sd} & {diff} & [{ci_low}, {ci_high}] & {t_val} & {df_val} & {p_val} & {d_val} \\\\",
            rules["bottom"],
            r"  \end{tabular}",
            r"\end{table}",
        ]
        return "\n".join(lines)

    elif analysis_type == "ttest_independent":
        rules = _get_table_rules(style, "lrrrrrrrr")
        full_caption = f"{caption} for {escape_latex(data.get('test_variable', ''))} by {escape_latex(data.get('group_variable', ''))}"
        caption_lines = _format_caption_lines(full_caption, label, style)

        g1 = data.get("group1", {})
        g2 = data.get("group2", {})
        eq = data.get("equal_var", {})
        welch = data.get("welch_var", {})

        if style == "ieee":
            col_headers = "Group & N & Mean & Std. Dev. & t-Stat & df & p-Value & Mean Diff. & Cohen's d \\\\"
        elif style == "classic":
            col_headers = "Group & N & Mean & SD & t-Value & df & p-Value & Mean Diff. & Cohen's d \\\\"
        else:  # apa
            col_headers = r"Group & $N$ & $M$ & $SD$ & $t$ & $df$ & $p$ & Mean Diff. & Cohen's $d$ \\"

        lines = [
            r"\begin{table}[htbp]",
            r"  \centering",
            *caption_lines,
            f"  \\begin{{tabular}}{{{rules['align']}}}",
            rules["top"],
            f"    {col_headers}",
            rules["mid"],
            f"    {escape_latex(g1.get('name', 'G1'))} & {g1.get('n', 0)} & {format_num(g1.get('mean'))} & {format_num(g1.get('std'))} & - & - & - & - & - \\\\",
            f"    {escape_latex(g2.get('name', 'G2'))} & {g2.get('n', 0)} & {format_num(g2.get('mean'))} & {format_num(g2.get('std'))} & - & - & - & - & - \\\\",
            rules["mid"],
            f"    Equal Var. & \\multicolumn{{3}}{{l}}{{Levene's $F = {format_num(data.get('levene_f'))}, p = {format_p_value(data.get('levene_p', 1.0), style)}$}} & {format_num(eq.get('t_statistic'), 3)} & {eq.get('df', 0)} & {format_p_value(eq.get('p_value', 1.0), style)} & {format_num(eq.get('mean_diff'))} & {format_num(eq.get('cohen_d'))} \\\\",
            f"    Welch & \\multicolumn{{3}}{{l}}{{Unequal variance assumed}} & {format_num(welch.get('t_statistic'), 3)} & {format_num(welch.get('df'), 1)} & {format_p_value(welch.get('p_value', 1.0), style)} & {format_num(welch.get('mean_diff'))} & {format_num(welch.get('cohen_d'))} \\\\",
            rules["bottom"],
            r"  \end{tabular}",
            r"\end{table}",
        ]
        return "\n".join(lines)

    elif analysis_type == "ttest_paired":
        rules = _get_table_rules(style, "lrrrrrrrrr")
        var1 = escape_latex(data.get("var1", ""))
        var2 = escape_latex(data.get("var2", ""))
        full_caption = f"{caption} Comparing {var1} and {var2}"
        caption_lines = _format_caption_lines(full_caption, label, style)

        if style == "ieee":
            col_headers = "Measure & N & Mean & Std. Dev. & Mean Diff. & r & t-Stat & df & p-Value & Cohen's dz \\\\"
        elif style == "classic":
            col_headers = "Measure & N & Mean & SD & Mean Diff. & Correlation & t-Value & df & p-Value & Cohen's dz \\\\"
        else:  # apa
            col_headers = r"Measure & $N$ & $M$ & $SD$ & Mean Diff. & $r$ & $t$ & $df$ & $p$ & Cohen's $d_z$ \\"

        lines = [
            r"\begin{table}[htbp]",
            r"  \centering",
            *caption_lines,
            f"  \\begin{{tabular}}{{{rules['align']}}}",
            rules["top"],
            f"    {col_headers}",
            rules["mid"],
            f"    {var1} & {data.get('n', 0)} & {format_num(data.get('mean1'))} & {format_num(data.get('std1'))} & \\multirow{{2}}{{*}}{{{format_num(data.get('mean_diff'))}}} & \\multirow{{2}}{{*}}{{{format_num(data.get('correlation'), 3)}}} & \\multirow{{2}}{{*}}{{{format_num(data.get('t_statistic'), 3)}}} & \\multirow{{2}}{{*}}{{{data.get('df', 0)}}} & \\multirow{{2}}{{*}}{{{format_p_value(data.get('p_value', 1.0), style)}}} & \\multirow{{2}}{{*}}{{{format_num(data.get('cohen_d'))}}} \\\\",
            f"    {var2} & {data.get('n', 0)} & {format_num(data.get('mean2'))} & {format_num(data.get('std2'))} & & & & & & \\\\",
            rules["bottom"],
            r"  \end{tabular}",
            r"\end{table}",
        ]
        return "\n".join(lines)

    return ""


def generate_anova_latex_table(
    data: Dict[str, Any],
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

        ss_b = format_num(data.get("ss_between"))
        df_b = data.get("df_between", 0)
        ms_b = format_num(data.get("ms_between"))
        f_stat = format_num(data.get("f_statistic"), 3)
        p_val = format_p_value(data.get("p_value", 1.0), style)
        eta = format_num(data.get("eta_squared"), 3)
        ss_w = format_num(data.get("ss_within"))
        df_w = data.get("df_within", 0)
        ms_w = format_num(data.get("ms_within"))
        ss_t = format_num(data.get("ss_total"))
        df_t = data.get("df_total", 0)

        if style == "ieee":
            col_headers = (
                "Source of Variation & SS & df & MS & F-Stat & p-Value & Eta-Sq \\\\"
            )
        elif style == "classic":
            col_headers = (
                "Source of Variation & SS & df & MS & F & p-Value & Eta-Squared \\\\"
            )
        else:  # apa
            col_headers = (
                r"Source of Variation & $SS$ & $df$ & $MS$ & $F$ & $p$ & $\eta^2$ \\"
            )

        lines = [
            r"\begin{table}[htbp]",
            r"  \centering",
            *caption_lines,
            f"  \\begin{{tabular}}{{{rules['align']}}}",
            rules["top"],
            f"    {col_headers}",
            rules["mid"],
            f"    Between Groups & {ss_b} & {df_b} & {ms_b} & {f_stat} & {p_val} & {eta} \\\\",
            f"    Within Groups (Error) & {ss_w} & {df_w} & {ms_w} & - & - & - \\\\",
            f"    Total & {ss_t} & {df_t} & - & - & - & - \\\\",
            rules["bottom"],
            r"  \end{tabular}",
            r"\end{table}",
        ]
        return "\n".join(lines)

    elif analysis_type == "anova_twoway":
        rules = _get_table_rules(style, "lrrrrr")
        dep = escape_latex(data.get("dependent", ""))
        caption_lines = _format_caption_lines(f"{caption} for {dep}", label, style)
        effects = data.get("effects", [])

        if style == "ieee":
            col_headers = "Source & SS & df & MS & F-Stat & p-Value \\\\"
        elif style == "classic":
            col_headers = "Source & SS & df & MS & F-Statistic & p-Value \\\\"
        else:  # apa
            col_headers = r"Source & $SS$ & $df$ & $MS$ & $F$ & $p$ \\"

        lines = [
            r"\begin{table}[htbp]",
            r"  \centering",
            *caption_lines,
            f"  \\begin{{tabular}}{{{rules['align']}}}",
            rules["top"],
            f"    {col_headers}",
            rules["mid"],
        ]
        for eff in effects:
            source = escape_latex(eff.get("source", ""))
            ss = format_num(eff.get("sum_sq"))
            df_val = format_num(eff.get("df"), 0)
            ms = format_num(eff.get("mean_sq"))
            f_val = (
                format_num(eff.get("f_stat"), 3)
                if eff.get("f_stat") is not None
                else "-"
            )
            p_val = (
                format_p_value(eff.get("p_value"), style)
                if eff.get("p_value") is not None
                else "-"
            )
            lines.append(
                f"    {source} & {ss} & {df_val} & {ms} & {f_val} & {p_val} \\\\"
            )
        lines.extend(
            [
                rules["bottom"],
                r"  \end{tabular}",
                r"\end{table}",
            ]
        )
        return "\n".join(lines)

    return ""


def generate_correlation_latex_table(
    data: Dict[str, Any],
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


def generate_nonparametric_latex_table(
    data: Dict[str, Any],
    caption: str = "Non-Parametric Test Summary",
    label: str = "tab:nonparametric",
    style: str = "apa",
) -> str:
    analysis_type = data.get("analysis_type", "")
    if analysis_type == "mann_whitney_u":
        rules = _get_table_rules(style, "lrrrrrrr")
        test_var = escape_latex(data.get("test_variable", ""))
        caption_lines = _format_caption_lines(
            f"{caption}: Mann-Whitney U for {test_var}", label, style
        )

        g1 = data.get("group1", {})
        g2 = data.get("group2", {})
        u = format_num(data.get("u_statistic"), 1)
        w = format_num(data.get("w_statistic"), 1)
        z = format_num(data.get("z_score"), 3)
        p = format_p_value(data.get("p_value", 1.0), style)

        if style == "ieee":
            col_headers = "Group & N & Median & Mean Rank & U & W & Z & p-Value \\\\"
        elif style == "classic":
            col_headers = (
                "Group & N & Median & Mean Rank & U & W & Z-Score & p-Value \\\\"
            )
        else:  # apa
            col_headers = r"Group & $N$ & $Mdn$ & Mean Rank & $U$ & $W$ & $Z$ & $p$ \\"

        lines = [
            r"\begin{table}[htbp]",
            r"  \centering",
            *caption_lines,
            f"  \\begin{{tabular}}{{{rules['align']}}}",
            rules["top"],
            f"    {col_headers}",
            rules["mid"],
            f"    {escape_latex(g1.get('name', 'G1'))} & {g1.get('n', 0)} & {format_num(g1.get('median'))} & {format_num(g1.get('mean_rank'), 2)} & \\multirow{{2}}{{*}}{{{u}}} & \\multirow{{2}}{{*}}{{{w}}} & \\multirow{{2}}{{*}}{{{z}}} & \\multirow{{2}}{{*}}{{{p}}} \\\\",
            f"    {escape_latex(g2.get('name', 'G2'))} & {g2.get('n', 0)} & {format_num(g2.get('median'))} & {format_num(g2.get('mean_rank'), 2)} & & & & \\\\",
            rules["bottom"],
            r"  \end{tabular}",
            r"\end{table}",
        ]
        return "\n".join(lines)

    elif analysis_type == "wilcoxon_signed_rank":
        rules = _get_table_rules(style, "lrrrrrr")
        v1 = escape_latex(data.get("var1", ""))
        v2 = escape_latex(data.get("var2", ""))
        caption_lines = _format_caption_lines(
            f"{caption}: Wilcoxon Signed-Rank Test between {v1} and {v2}",
            label,
            style,
        )

        n_eff = data.get("n_effective", 0)
        pos = data.get("positive_pairs", 0)
        neg = data.get("negative_pairs", 0)
        w = format_num(data.get("w_statistic"), 1)
        z = format_num(data.get("z_score"), 3)
        p = format_p_value(data.get("p_value", 1.0), style)

        if style == "ieee":
            col_headers = (
                "Comparison & Pairs (N) & Pos / Neg Pairs & W & Z & p-Value \\\\"
            )
        elif style == "classic":
            col_headers = "Comparison & Pairs (N) & Positive / Negative & W & Z-Score & p-Value \\\\"
        else:  # apa
            col_headers = (
                r"Comparison & Pairs ($N$) & Pos / Neg Pairs & $W$ & $Z$ & $p$ \\"
            )

        lines = [
            r"\begin{table}[htbp]",
            r"  \centering",
            *caption_lines,
            f"  \\begin{{tabular}}{{{rules['align']}}}",
            rules["top"],
            f"    {col_headers}",
            rules["mid"],
            f"    {v1} vs. {v2} & {n_eff} & {pos} / {neg} & {w} & {z} & {p} \\\\",
            rules["bottom"],
            r"  \end{tabular}",
            r"\end{table}",
        ]
        return "\n".join(lines)

    elif analysis_type == "kruskal_wallis":
        rules = _get_table_rules(style, "lrrrr")
        test_var = escape_latex(data.get("test_variable", ""))
        group_var = escape_latex(data.get("group_variable", ""))
        caption_lines = _format_caption_lines(
            f"{caption}: Kruskal-Wallis H for {test_var} across {group_var}",
            label,
            style,
        )

        h = format_num(data.get("h_statistic"), 3)
        df_val = data.get("df", 0)
        p = format_p_value(data.get("p_value", 1.0), style)
        groups = data.get("groups", [])

        if style == "ieee":
            col_headers = "Group & N & Median & Mean Rank & Test Statistics \\\\"
        elif style == "classic":
            col_headers = "Group & N & Median & Mean Rank & Test Statistics \\\\"
        else:  # apa
            col_headers = r"Group & $N$ & $Mdn$ & Mean Rank & Test Statistics \\"

        lines = [
            r"\begin{table}[htbp]",
            r"  \centering",
            *caption_lines,
            f"  \\begin{{tabular}}{{{rules['align']}}}",
            rules["top"],
            f"    {col_headers}",
            rules["mid"],
        ]
        for i, g in enumerate(groups):
            g_name = escape_latex(g.get("group", ""))
            n = g.get("n", 0)
            mdn = format_num(g.get("median"))
            mr = format_num(g.get("mean_rank"), 2)
            if i == 0:
                stat_str = f"\\multirow{{{len(groups)}}}{{*}}{{$H({df_val}) = {h}$, $p = {p}$}}"
            else:
                stat_str = ""
            lines.append(f"    {g_name} & {n} & {mdn} & {mr} & {stat_str} \\\\")
        lines.extend(
            [
                rules["bottom"],
                r"  \end{tabular}",
                r"\end{table}",
            ]
        )
        return "\n".join(lines)

    return ""


def generate_chisquare_latex_table(
    data: Dict[str, Any],
    caption: str = "Contingency Table and Chi-Square Test of Independence",
    label: str = "tab:chisquare",
    style: str = "apa",
) -> str:
    r_var = escape_latex(data.get("row_variable", "Row"))
    c_var = escape_latex(data.get("col_variable", "Column"))
    col_labels = [escape_latex(c) for c in data.get("col_labels", [])]
    n_cols = len(col_labels)
    raw_align = "l" + "r" * (n_cols + 1)
    rules = _get_table_rules(style, raw_align)
    caption_lines = _format_caption_lines(
        f"{caption}: {r_var} $\\times$ {c_var}", label, style
    )
    col_header = " & ".join(col_labels)

    chi2 = format_num(data.get("chi2_statistic"), 3)
    df_val = data.get("df", 0)
    p = format_p_value(data.get("p_value", 1.0), style)
    v = format_num(data.get("cramers_v"), 3)
    n_total = data.get("sample_size", 0)

    lines = [
        r"\begin{table}[htbp]",
        r"  \centering",
        *caption_lines,
        f"  \\begin{{tabular}}{{{rules['align']}}}",
        rules["top"],
        f"    {r_var} & {col_header} & Total \\\\",
        rules["mid"],
    ]

    for row in data.get("crosstab", []):
        r_name = escape_latex(row.get("row", ""))
        cells_str = " & ".join(
            f"{c.get('observed', 0)} ({format_num(c.get('expected', 0.0), 1)})"
            for c in row.get("cells", [])
        )
        total = row.get("total", 0)
        lines.append(f"    {r_name} & {cells_str} & {total} \\\\")

    note_text = (
        r"\textit{Note.} Observed counts (expected frequencies in parentheses)."
        if style == "apa"
        else "Note: Observed counts (expected frequencies in parentheses)."
    )
    lines.extend(
        [
            rules["mid"],
            f"    \\multicolumn{{{n_cols + 2}}}{{l}}{{{note_text}}} \\\\",
            f"    \\multicolumn{{{n_cols + 2}}}{{l}}{{{{\\chi^2({df_val}) = {chi2}$, $p = {p}$, Cram\\'er's $V = {v}$, $N = {n_total}$}}}} \\\\",
            rules["bottom"],
            r"  \end{tabular}",
            r"\end{table}",
        ]
    )
    return "\n".join(lines)


def generate_multi_style_table(
    generator_func: Callable[..., str], *args: Any, **kwargs: Any
) -> Dict[str, str]:
    """Generates table code in all supported styles (APA, IEEE, Classic)."""
    return {
        "apa": generator_func(*args, **kwargs, style="apa"),
        "ieee": generator_func(*args, **kwargs, style="ieee"),
        "classic": generator_func(*args, **kwargs, style="classic"),
    }
