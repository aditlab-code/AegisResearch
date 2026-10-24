"""Core formatting and utility functions for LaTeX table generators."""


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
        return formatted.removeprefix("0")
    else:
        if p < 0.001:
            return "< 0.001"
        return f"{p:.3f}"


def format_num(val: float | None, decimals: int = 2) -> str:
    """Formats a floating point number or returns '-' if None."""
    if val is None:
        return "-"
    return f"{val:.{decimals}f}"


def _get_table_rules(style: str, align: str) -> dict[str, str]:
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


def _format_caption_lines(caption: str, label: str, style: str) -> list[str]:
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
