import { DocKind } from "../types";

export const SNIPPETS: Partial<Record<DocKind, Record<string, string>>> = {
  tex: {
    Bold: "\\textbf{text}",
    Italic: "\\textit{text}",
    Heading: "\\section{New Section}",
    List: "\\begin{itemize}\n\\item \n\\end{itemize}",
    Quote: "\\begin{quote}\n\\end{quote}",
    Equation: "$\\int_0^1 f(x)dx$",
    Figure: "\\includegraphics{fig.png}",
    Table: "\\begin{tabular}{cc}\n\\end{tabular}",
    Citation: "\\cite{engel2007}",
    Footnote: "\\footnote{note}",
  },
  md: {
    Bold: "**bold**",
    Italic: "*italic*",
    Heading: "## Heading",
    List: "- item",
    Quote: "> quote",
    Equation: "$x^2$",
    Figure: "![fig](img.png)",
    Table: "| a | b |\n|---|---|",
    Citation: "[@engel2007]",
    Footnote: "[^1]",
  },
};
