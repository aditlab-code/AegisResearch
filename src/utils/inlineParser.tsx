import React from 'react'
import katex from 'katex'

function renderMath(formula: string, displayMode: boolean): React.ReactNode {
  const clean = formula.trim()
  if (!clean) return null
  try {
    const html = katex.renderToString(clean, {
      displayMode,
      throwOnError: false,
    })
    return (
      <span
        dangerouslySetInnerHTML={{ __html: html }}
        className={
          displayMode
            ? 'block my-3 text-center overflow-x-auto py-1'
            : 'inline-block align-baseline mx-0.5'
        }
      />
    )
  } catch {
    return (
      <code className="text-rose-600 bg-rose-50 px-1 py-0.5 rounded font-mono text-xs">
        {displayMode ? `\\[${clean}\\]` : `\\(${clean}\\)`}
      </code>
    )
  }
}

export function renderInlineFormatted(text: string, isLatex = false): React.ReactNode {
  if (!text) return null

  if (isLatex) {
    // LaTeX mode:
    // Display: \[...\] or $$...$$
    // Inline: \(...\) or $...$
    // Text formatting: \textbf{...}, \textit{...}, \emph{...}
    const latexRegex =
      /(\\\[[\s\S]*?\\\]|\$\$(?:[^\$\\]|\\.)*\$\$|\\\([\s\S]*?\\\)|(?:\$(?:[^\$\\]|\\.)*\$)|\\textbf\{[^\}]*\}|\\textit\{[^\}]*\}|\\emph\{[^\}]*\})/g

    const parts = text.split(latexRegex)

    return parts.map((part, index) => {
      if (!part) return null

      // Display math: \[...\]
      if (part.startsWith('\\[') && part.endsWith('\\]')) {
        return (
          <React.Fragment key={index}>
            {renderMath(part.slice(2, -2), true)}
          </React.Fragment>
        )
      }

      // Display math: $$...$$
      if (part.startsWith('$$') && part.endsWith('$$')) {
        return (
          <React.Fragment key={index}>
            {renderMath(part.slice(2, -2), true)}
          </React.Fragment>
        )
      }

      // Inline math: \(...\)
      if (part.startsWith('\\(') && part.endsWith('\\)')) {
        return (
          <React.Fragment key={index}>
            {renderMath(part.slice(2, -2), false)}
          </React.Fragment>
        )
      }

      // Inline math: $...$
      if (part.startsWith('$') && part.endsWith('$')) {
        return (
          <React.Fragment key={index}>
            {renderMath(part.slice(1, -1), false)}
          </React.Fragment>
        )
      }

      // \textbf{...}
      if (part.startsWith('\\textbf{') && part.endsWith('}')) {
        return <strong key={index}>{part.slice(8, -1)}</strong>
      }

      // \textit{...}
      if (part.startsWith('\\textit{') && part.endsWith('}')) {
        return <em key={index}>{part.slice(8, -1)}</em>
      }

      // \emph{...}
      if (part.startsWith('\\emph{') && part.endsWith('}')) {
        return <em key={index}>{part.slice(6, -1)}</em>
      }

      return part
    })
  }

  // Markdown mode:
  // Display math: $$...$$
  // Inline math: $...$
  // Bold: **...**
  // Italic: *...*
  const mdRegex =
    /(\$\$(?:[^\$\\]|\\.)*\$\$|(?:\$(?:[^\$\\]|\\.)*\$)|\*\*[^*]+\*\*|\*[^*]+\*)/g

  const parts = text.split(mdRegex)

  return parts.map((part, index) => {
    if (!part) return null

    if (part.startsWith('$$') && part.endsWith('$$')) {
      return (
        <React.Fragment key={index}>
          {renderMath(part.slice(2, -2), true)}
        </React.Fragment>
      )
    }

    if (part.startsWith('$') && part.endsWith('$')) {
      return (
        <React.Fragment key={index}>
          {renderMath(part.slice(1, -1), false)}
        </React.Fragment>
      )
    }

    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={index}>{part.slice(2, -2)}</strong>
    }

    if (part.startsWith('*') && part.endsWith('*')) {
      return <em key={index}>{part.slice(1, -1)}</em>
    }

    return part
  })
}
