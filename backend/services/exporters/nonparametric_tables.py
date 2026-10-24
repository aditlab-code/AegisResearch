"""LaTeX table generators for non-parametric tests, contingency tables, MANOVA, PCA, and multi-style tables."""

from collections.abc import Callable
from typing import Any

from backend.services.exporters.table_core import (
    _format_caption_lines,
    _get_table_rules,
    escape_latex,
    format_num,
    format_p_value,
)


def generate_manova_latex_table(
    factor: str,
    dependents: list[str],
    tests: list[dict[str, Any]],
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
    loadings: list[dict[str, Any]],
    exp_var: list[float],
    eigenvalues: list[float],
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


def generate_nonparametric_latex_table(
    data: dict[str, Any],
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

        if style == "ieee" or style == "classic":
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
    data: dict[str, Any],
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
) -> dict[str, str]:
    """Generates table code in all supported styles (APA, IEEE, Classic)."""
    return {
        "apa": generator_func(*args, **kwargs, style="apa"),
        "ieee": generator_func(*args, **kwargs, style="ieee"),
        "classic": generator_func(*args, **kwargs, style="classic"),
    }
