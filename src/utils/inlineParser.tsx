import React from "react";
import katex from "katex";
import { BibEntry } from "./bibtexParser";
import { formatPandocCitation } from "./citeproc";
function renderMath(formula: string, displayMode: boolean): React.ReactNode {
  const clean = formula.trim();
  if (!clean) return null;
  try {
    const html = katex.renderToString(clean, {
      displayMode,
      throwOnError: false,
    });
    return (
      <span
        dangerouslySetInnerHTML={{ __html: html }}
        className={
          displayMode
            ? "block my-3 text-center overflow-x-auto py-1"
            : "inline-block align-baseline mx-0.5"
        }
      />
    );
  } catch {
    return (
      <code className="text-rose-600 bg-rose-50 px-1 py-0.5 rounded font-mono text-xs">
        {displayMode ? `\\[${clean}\\]` : `\\(${clean}\\)`}
      </code>
    );
  }
}

export function renderInlineFormatted(
  text: string,
  isLatex = false,
  bibEntries: BibEntry[] = [],
  csl: "apa" | "ieee" = "apa",
): React.ReactNode {
  if (isLatex) {
    // LaTeX mode:
    // Display: \[...\] or $$...$$
    // Inline: \(...\) or $...$
    // Text formatting: \textbf{...}, \textit{...}, \emph{...}
    const latexRegex =
      /(\\\[[\s\S]*?\\\]|\$\$(?:[^\$\\]|\\.)*\$\$|\\\([\s\S]*?\\\)|(?:\$(?:[^\$\\]|\\.)*\$)|\\textbf\{[^\}]*\}|\\textit\{[^\}]*\}|\\emph\{[^\}]*\})/g;

    const parts = text.split(latexRegex);

    return parts.map((part, index) => {
      if (!part) return null;

      // Display math: \[...\]
      if (part.startsWith("\\[") && part.endsWith("\\]")) {
        return (
          <React.Fragment key={index}>
            {renderMath(part.slice(2, -2), true)}
          </React.Fragment>
        );
      }

      // Display math: $$...$$
      if (part.startsWith("$$") && part.endsWith("$$")) {
        return (
          <React.Fragment key={index}>
            {renderMath(part.slice(2, -2), true)}
          </React.Fragment>
        );
      }

      // Inline math: \(...\)
      if (part.startsWith("\\(") && part.endsWith("\\)")) {
        return (
          <React.Fragment key={index}>
            {renderMath(part.slice(2, -2), false)}
          </React.Fragment>
        );
      }

      // Inline math: $...$
      if (part.startsWith("$") && part.endsWith("$")) {
        return (
          <React.Fragment key={index}>
            {renderMath(part.slice(1, -1), false)}
          </React.Fragment>
        );
      }

      // \textbf{...}
      if (part.startsWith("\\textbf{") && part.endsWith("}")) {
        return <strong key={index}>{part.slice(8, -1)}</strong>;
      }

      // \textit{...}
      if (part.startsWith("\\textit{") && part.endsWith("}")) {
        return <em key={index}>{part.slice(8, -1)}</em>;
      }

      // \emph{...}
      if (part.startsWith("\\emph{") && part.endsWith("}")) {
        return <em key={index}>{part.slice(6, -1)}</em>;
      }

      return part;
    });
  }

  // Markdown mode:
  // Display math: $$...$$
  // Inline math: $...$
  // Bold: **...**
  // Italic: *...*
  // Citations: [@citekey]
  // Cross-ref: (@eq:key) or Table @tbl:key or Figure @fig:key
  // Links: [text](href)
  // Inline code: `code`
  const mdRegex =
    /(\$\$(?:[^\$\\]|\\.)*\$\$|(?:\$(?:[^\$\\]|\\.)*\$)|\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`|\[@[^\]]+\]|(?<!\w)@[a-zA-Z0-9_\-:]+|\(@eq:[^)]+\)|(?:(?:Table|Figure)\s+@(?:tbl|fig|sec):[a-zA-Z0-9_\-]+)|\[[^\]]+\]\([^)]+\))/g;
  const parts = text.split(mdRegex);

  return parts.map((part, index) => {
    if (!part) return null;

    if (part.startsWith("$$") && part.endsWith("$$")) {
      return (
        <React.Fragment key={index}>
          {renderMath(part.slice(2, -2), true)}
        </React.Fragment>
      );
    }

    if (part.startsWith("$") && part.endsWith("$")) {
      return (
        <React.Fragment key={index}>
          {renderMath(part.slice(1, -1), false)}
        </React.Fragment>
      );
    }

    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={index}>{part.slice(2, -2)}</strong>;
    }

    if (part.startsWith("*") && part.endsWith("*")) {
      return <em key={index}>{part.slice(1, -1)}</em>;
    }

    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code
          key={index}
          className="px-1 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 font-mono text-[13px] text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700"
        >
          {part.slice(1, -1)}
        </code>
      );
    }

    // Pandoc citation: [@citekey] or [@citekey, p. 10] or in-text @citekey
    if (
      (part.startsWith("[@") && part.endsWith("]")) ||
      /^@[a-zA-Z0-9_\-:]+$/.test(part)
    ) {
      const res = formatPandocCitation(part, bibEntries, csl);
      return (
        <span
          key={index}
          className={`inline-flex items-center px-1.5 py-0.5 mx-0.5 text-xs rounded transition-colors ${
            res.isFound
              ? "bg-blue-50 dark:bg-zinc-800 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-zinc-700 font-sans font-medium"
              : "bg-amber-50 dark:bg-zinc-800 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-700 font-mono text-[11px]"
          }`}
          title={
            res.tooltip ||
            (res.isFound
              ? "Citation"
              : `Key '${part}' not found in references.bib`)
          }
        >
          {res.formattedText}
        </span>
      );
    }

    // Equation cross reference: (@eq:key)
    if (part.startsWith("(@eq:") && part.endsWith(")")) {
      return (
        <span
          key={index}
          className="inline-flex items-center px-1 text-xs font-mono font-semibold text-emerald-700 dark:text-emerald-400"
          title="Equation Reference"
        >
          {part}
        </span>
      );
    }

    // Cross reference prefix: Table @tbl:... or Figure @fig:...
    if (/^(Table|Figure)\s+@/.test(part)) {
      return (
        <span
          key={index}
          className="font-medium text-[#4078f2] dark:text-[#61afef]"
          title="Cross Reference"
        >
          {part}
        </span>
      );
    }

    // Markdown link: [text](href)
    const linkMatch = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (linkMatch) {
      return (
        <a
          key={index}
          href={linkMatch[2]}
          className="text-[#4078f2] dark:text-[#61afef] underline hover:opacity-80 font-medium"
        >
          {linkMatch[1]}
        </a>
      );
    }

    return part;
  });
}
