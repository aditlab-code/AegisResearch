"""Publication-ready LaTeX TikZ / PGFPlots export generator for bibliometric charts."""

from typing import Any


def generate_bibliometric_tikz(graph_type: str, data: dict[str, Any]) -> str:
    """Generates pure LaTeX TikZ or PGFPlots vector code to embed directly into the manuscript."""
    if graph_type == "thematic_map":
        clusters = data.get("clusters", [])
        med_c = data.get("median_centrality", 0.0)
        med_d = data.get("median_density", 0.0)

        lines = [
            r"\begin{figure}[htbp]",
            r"\centering",
            r"\begin{tikzpicture}",
            r"  \begin{axis}[",
            r"    title={Thematic Map (Callon's Centrality vs. Density)},",
            r"    xlabel={Centrality (Relevance Degree)},",
            r"    ylabel={Density (Development Degree)},",
            r"    grid=major,",
            r"    width=11cm, height=8.5cm,",
            r"    scatter/classes={",
            r"      motor={mark=*,draw=blue!80!black,fill=blue!40},",
            r"      niche={mark=*,draw=purple!80!black,fill=purple!40},",
            r"      emerging={mark=*,draw=red!80!black,fill=red!40},",
            r"      basic={mark=*,draw=green!60!black,fill=green!40}",
            r"    }",
            r"  ]",
            "  % Median threshold lines",
            f"  \\draw[dashed, red!70, thick] (axis cs:{med_c},\\pgfkeysvalueof{{/pgfplots/ymin}}) -- (axis cs:{med_c},\\pgfkeysvalueof{{/pgfplots/ymax}});",
            f"  \\draw[dashed, red!70, thick] (\\pgfkeysvalueof{{/pgfplots/xmin}}, axis cs:{med_d}) -- (\\pgfkeysvalueof{{/pgfplots/xmax}}, axis cs:{med_d});",
            r"  \addplot[scatter, only marks, scatter src=explicit symbolic, mark size=4pt]",
            r"    coordinates {",
        ]

        class_map = {
            "Motor Themes": "motor",
            "Niche Themes": "niche",
            "Emerging or Declining": "emerging",
            "Basic & Transversal": "basic",
        }

        for c in clusters:
            c_type = class_map.get(c.get("quadrant", ""), "basic")
            x = c.get("centrality", 0.0)
            y = c.get("density", 0.0)
            lines.append(f"      ({x}, {y}) [{c_type}]")

        lines.extend(
            [
                r"    };",
                r"  \end{axis}",
                r"\end{tikzpicture}",
                r"\caption{Strategic Thematic Map of Explainable AI (XAI) literature.}",
                r"\label{fig:xai_thematic_map}",
                r"\end{figure}",
            ]
        )
        return "\n".join(lines)

    elif graph_type == "bradford":
        curve = data.get("bradford", {}).get("curve", [])
        lines = [
            r"\begin{figure}[htbp]",
            r"\centering",
            r"\begin{tikzpicture}",
            r"  \begin{axis}[",
            r"    title={Bradford's Law of Scattering Curve},",
            r"    xlabel={$\ln(\text{Rank of Journals})$},",
            r"    ylabel={Cumulative Articles},",
            r"    grid=major,",
            r"    width=11cm, height=7.5cm",
            r"  ]",
            r"  \addplot[thick, color=blue!80!black, mark=*] coordinates {",
        ]
        for pt in curve:
            lines.append(f"    ({pt['ln_rank']}, {pt['cum_articles']})")
        lines.extend(
            [
                r"  };",
                r"  \end{axis}",
                r"\end{tikzpicture}",
                r"\caption{Bradford's Law cumulative source productivity distribution.}",
                r"\label{fig:bradford_law}",
                r"\end{figure}",
            ]
        )
        return "\n".join(lines)

    # Fallback
    return "% TikZ code not available for this graph type"
