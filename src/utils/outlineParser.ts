import { OutlineNode } from '../types'

interface RawHeading {
  label: string
  level: number
  lineNumber: number
  kind: OutlineNode['kind']
}

const LATEX_PATTERNS: Array<{
  regex: RegExp
  level: number
  kind: OutlineNode['kind']
}> = [
  { regex: /^\\part\*?\{([^}]+)\}/, level: 1, kind: 'part' },
  { regex: /^\\chapter\*?\{([^}]+)\}/, level: 2, kind: 'chapter' },
  { regex: /^\\section\*?\{([^}]+)\}/, level: 3, kind: 'section' },
  { regex: /^\\subsection\*?\{([^}]+)\}/, level: 4, kind: 'subsection' },
  { regex: /^\\subsubsection\*?\{([^}]+)\}/, level: 5, kind: 'subsubsection' },
  { regex: /^\\paragraph\*?\{([^}]+)\}/, level: 6, kind: 'paragraph' },
]

export function parseDocumentOutline(content: string, isLatex = true): OutlineNode[] {
  if (!content) return []

  const lines = content.split('\n')
  const headings: RawHeading[] = []

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i]
    const trimmed = rawLine.trim()
    if (!trimmed) continue

    const lineNumber = i + 1

    if (isLatex) {
      // Check LaTeX patterns
      for (const pattern of LATEX_PATTERNS) {
        const match = trimmed.match(pattern.regex)
        if (match) {
          headings.push({
            label: match[1].trim(),
            level: pattern.level,
            lineNumber,
            kind: pattern.kind,
          })
          break
        }
      }
    } else {
      // Markdown headings # to ######
      const mdMatch = trimmed.match(/^(#{1,6})\s+(.+)$/)
      if (mdMatch) {
        const level = mdMatch[1].length
        const kind = `h${level}` as OutlineNode['kind']
        headings.push({
          label: mdMatch[2].trim(),
          level,
          lineNumber,
          kind,
        })
      }
    }
  }

  // If no headings found, return empty array
  if (headings.length === 0) return []

  // Build recursive tree from flat headings list using a stack
  const rootNodes: OutlineNode[] = []
  const stack: { node: OutlineNode; level: number }[] = []

  headings.forEach((h, index) => {
    const currentNode: OutlineNode = {
      id: `outline-${index}-${h.lineNumber}`,
      label: h.label,
      level: h.level,
      lineNumber: h.lineNumber,
      kind: h.kind,
      children: [],
    }

    // Pop stack while top has level >= current level
    while (stack.length > 0 && stack[stack.length - 1].level >= h.level) {
      stack.pop()
    }

    if (stack.length === 0) {
      rootNodes.push(currentNode)
    } else {
      stack[stack.length - 1].node.children.push(currentNode)
    }

    stack.push({ node: currentNode, level: h.level })
  })

  return rootNodes
}
