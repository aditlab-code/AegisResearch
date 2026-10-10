import React from 'react'
import katex from 'katex'
import { Doc } from '../../types'
import { renderInlineFormatted, formatBibReference, BibEntry } from '../../utils'

export interface DocPreviewProps {
  doc: Doc
  bibEntries?: BibEntry[]
}

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

interface YamlMetadata {
  title?: string
  author?: string
  date?: string
  abstract?: string
  bibliography?: string
  csl?: string
}

type MarkdownBlock =
  | { type: 'yaml'; data: YamlMetadata }
  | { type: 'heading'; level: number; text: string; slug: string }
  | { type: 'toc' }
  | { type: 'math'; formula: string }
  | {
      type: 'table'
      headers: string[]
      aligns: Array<'left' | 'center' | 'right'>
      rows: string[][]
      caption?: string
      id?: string
    }
  | { type: 'figure'; caption: string; src: string; id?: string; width?: string }
  | { type: 'quote'; text: string }
  | { type: 'list-item'; text: string; ordered: boolean; num?: string }
  | { type: 'hr' }
  | { type: 'paragraph'; text: string }

function parseMarkdownBlocks(content: string): MarkdownBlock[] {
  const lines = content.split('\n')
  const blocks: MarkdownBlock[] = []
  let i = 0

  // 1. YAML frontmatter check
  if (lines[0]?.trim() === '---') {
    let j = 1
    const yamlLines: string[] = []
    while (j < lines.length && lines[j].trim() !== '---') {
      yamlLines.push(lines[j])
      j++
    }
    if (j < lines.length && lines[j].trim() === '---') {
      const data: YamlMetadata = {}
      yamlLines.forEach((y) => {
        const colon = y.indexOf(':')
        if (colon > -1) {
          const k = y.slice(0, colon).trim().toLowerCase() as keyof YamlMetadata
          const v = y.slice(colon + 1).trim().replace(/^['"]|['"]$/g, '')
          data[k] = v
        }
      })
      blocks.push({ type: 'yaml', data })
      i = j + 1
    }
  }

  while (i < lines.length) {
    const line = lines[i]
    const trimmed = line.trim()

    if (!trimmed) {
      i++
      continue
    }

    // 2. Math display block $$
    if (trimmed.startsWith('$$')) {
      if (trimmed === '$$') {
        let j = i + 1
        const mathLines: string[] = []
        while (j < lines.length && lines[j].trim() !== '$$') {
          mathLines.push(lines[j])
          j++
        }
        blocks.push({ type: 'math', formula: mathLines.join('\n') })
        i = j < lines.length ? j + 1 : j
        continue
      } else if (trimmed.endsWith('$$') && trimmed.length > 4) {
        blocks.push({ type: 'math', formula: trimmed.slice(2, -2) })
        i++
        continue
      }
    }

    // 3. Headings # to ######
    const headingMatch = trimmed.match(/^(#{1,6})\s+(.+)$/)
    if (headingMatch) {
      const level = headingMatch[1].length
      const text = headingMatch[2].trim()
      blocks.push({ type: 'heading', level, text, slug: slugify(text) })
      i++
      continue
    }

    // 4. TOC Directive
    if (trimmed === '[TOC]' || trimmed === '{:toc}' || trimmed === '<!-- TOC -->') {
      blocks.push({ type: 'toc' })
      i++
      continue
    }

    // 5. Pipe Table
    if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
      const tableLines: string[] = []
      while (i < lines.length && lines[i].trim().startsWith('|') && lines[i].trim().endsWith('|')) {
        tableLines.push(lines[i].trim())
        i++
      }
      if (tableLines.length >= 2) {
        const rawHeaders = tableLines[0].split('|').slice(1, -1).map((c) => c.trim())
        const sepCols = tableLines[1].split('|').slice(1, -1).map((c) => c.trim())
        const aligns: Array<'left' | 'center' | 'right'> = sepCols.map((c) => {
          if (c.startsWith(':') && c.endsWith(':')) return 'center'
          if (c.endsWith(':')) return 'right'
          return 'left'
        })
        const rows = tableLines.slice(2).map((rowStr) => rowStr.split('|').slice(1, -1).map((c) => c.trim()))

        let caption: string | undefined
        let id: string | undefined

        // Check for caption row: : Caption {#tbl:id} or Table: Caption
        if (i < lines.length) {
          const nextTrimmed = lines[i].trim()
          const capMatch = nextTrimmed.match(/^[:|Table:]\s*(.+?)(?:\{#([a-zA-Z0-9_\-:]+)\})?$/)
          if (capMatch) {
            caption = capMatch[1].trim()
            id = capMatch[2]?.trim()
            i++
          }
        }

        blocks.push({ type: 'table', headers: rawHeaders, aligns, rows, caption, id })
        continue
      }
    }

    // 6. Figure: ![Caption](path){#fig:id width=80%}
    const figMatch = trimmed.match(/^!\[([^\]]*)\]\(([^)]+)\)(?:\{#([a-zA-Z0-9_\-:]+)(?:\s+width=([^\s}]+))?|\s*\{([^}]+)\})?$/)
    if (figMatch) {
      const caption = figMatch[1]
      const src = figMatch[2]
      const id = figMatch[3]
      const width = figMatch[4]
      blocks.push({ type: 'figure', caption, src, id, width })
      i++
      continue
    }

    // 7. Horizontal rule / page break
    if (trimmed === '---' || trimmed === '***' || trimmed === '___' || trimmed.includes('page-break')) {
      blocks.push({ type: 'hr' })
      i++
      continue
    }

    // 8. Blockquote
    if (trimmed.startsWith('>')) {
      const quoteLines: string[] = []
      while (i < lines.length && lines[i].trim().startsWith('>')) {
        quoteLines.push(lines[i].trim().replace(/^>\s?/, ''))
        i++
      }
      blocks.push({ type: 'quote', text: quoteLines.join(' ') })
      continue
    }

    // 9. List item
    const listMatch = trimmed.match(/^([-*]|\d+\.)\s+(.+)$/)
    if (listMatch) {
      const isOrdered = /^\d+\./.test(listMatch[1])
      blocks.push({ type: 'list-item', text: listMatch[2], ordered: isOrdered, num: listMatch[1] })
      i++
      continue
    }

    // 10. Paragraph
    blocks.push({ type: 'paragraph', text: trimmed })
    i++
  }

  return blocks
}

export const DocPreview: React.FC<DocPreviewProps> = ({ doc, bibEntries = [] }) => {
  if (doc.kind === 'md') {
    const blocks = parseMarkdownBlocks(doc.content)
    const allHeadings = blocks.filter((b): b is Extract<MarkdownBlock, { type: 'heading' }> => b.type === 'heading')
    const yamlBlock = blocks.find((b): b is Extract<MarkdownBlock, { type: 'yaml' }> => b.type === 'yaml')
    const cslStyle: 'apa' | 'ieee' = yamlBlock?.data.csl?.toLowerCase().includes('ieee') ? 'ieee' : 'apa'

    const citedKeys = new Set<string>()
    const citeMatches = doc.content.matchAll(/@([a-zA-Z0-9_\-:]+)/g)
    for (const m of citeMatches) {
      citedKeys.add(m[1].toLowerCase())
    }
    const relevantEntries = bibEntries.filter((e) => citedKeys.has(e.key.toLowerCase()))
    const entriesToRender = relevantEntries.length > 0 ? relevantEntries : (yamlBlock?.data.bibliography ? bibEntries : [])

    let tableCounter = 0
    let figureCounter = 0

    return (
      <div
        className="text-[#111827] text-justify space-y-4"
        style={{
          fontFamily: "'Latin Modern Roman', 'Computer Modern Roman', 'Times New Roman', Times, serif",
          fontSize: '16px', // Standard 12pt (12pt * 1.3333 = 16px at 96 DPI)
          lineHeight: '26px', // 1.625 ratio (proportional academic reading height)
        }}
      >
        {blocks.map((block, idx) => {
          if (block.type === 'yaml') {
            return (
              <header key={idx} className="border-b border-stone-300 pb-4 mb-6 text-center">
                {block.data.title && (
                  <h1 className="font-bold text-center text-[#000000] text-2xl leading-tight mb-2">
                    {block.data.title}
                  </h1>
                )}
                {block.data.author && (
                  <p className="text-stone-700 italic text-sm mb-1">{block.data.author}</p>
                )}
                {block.data.date && (
                  <p className="text-stone-500 font-sans text-xs mb-3">{block.data.date}</p>
                )}
                {block.data.abstract && (
                  <div className="bg-stone-50/70 border-l-2 border-stone-400 p-3 my-3 text-left max-w-xl mx-auto rounded-r">
                    <span className="font-bold text-xs uppercase tracking-wider block mb-1 text-stone-700">Abstract</span>
                    <p className="text-xs text-stone-800 italic leading-relaxed">{block.data.abstract}</p>
                  </div>
                )}
              </header>
            )
          }

          if (block.type === 'heading') {
            if (block.level === 1) {
              return (
                <h1
                  key={idx}
                  id={block.slug}
                  className="font-bold text-center border-b border-stone-300 pb-3 pt-3 text-[#000000] scroll-mt-6"
                  style={{ fontSize: '26px', lineHeight: '34px' }}
                >
                  {block.text}
                </h1>
              )
            }
            if (block.level === 2) {
              return (
                <h2
                  key={idx}
                  id={block.slug}
                  className="font-bold text-[#1f2937] pt-4 border-b border-stone-200 pb-1 scroll-mt-6"
                  style={{ fontSize: '21px', lineHeight: '28px' }}
                >
                  {block.text}
                </h2>
              )
            }
            if (block.level === 3) {
              return (
                <h3
                  key={idx}
                  id={block.slug}
                  className="font-semibold text-[#374151] pt-2 scroll-mt-6"
                  style={{ fontSize: '18px', lineHeight: '24px' }}
                >
                  {block.text}
                </h3>
              )
            }
            return (
              <h4 key={idx} id={block.slug} className="font-semibold text-stone-700 pt-1 scroll-mt-6 text-base">
                {block.text}
              </h4>
            )
          }

          if (block.type === 'toc') {
            return (
              <div
                key={idx}
                className="my-5 p-4 rounded bg-stone-50 border border-stone-200 font-sans text-xs shadow-xs"
              >
                <div className="font-bold text-stone-800 uppercase tracking-wider text-[11px] mb-2 border-b border-stone-200 pb-1 flex items-center justify-between">
                  <span>Table of Contents</span>
                  <span className="text-[10px] text-stone-400 font-mono">Pandoc [TOC]</span>
                </div>
                {allHeadings.length > 0 ? (
                  <ul className="space-y-1">
                    {allHeadings.map((h, hIdx) => (
                      <li key={hIdx} style={{ marginLeft: `${Math.max(0, h.level - 1) * 16}px` }}>
                        <a href={`#${h.slug}`} className="text-[#4078f2] hover:underline font-medium">
                          {h.text}
                        </a>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="italic text-stone-400 text-xs">No headings found in document yet.</div>
                )}
              </div>
            )
          }

          if (block.type === 'math') {
            let mathHtml = ''
            try {
              mathHtml = katex.renderToString(block.formula.trim(), {
                displayMode: true,
                throwOnError: false,
              })
            } catch {
              mathHtml = `<code class="text-rose-600">\\[${block.formula}\\]</code>`
            }
            return (
              <div
                key={idx}
                dangerouslySetInnerHTML={{ __html: mathHtml }}
                className="my-4 text-center overflow-x-auto py-1"
              />
            )
          }

          if (block.type === 'table') {
            tableCounter++
            return (
              <div key={idx} id={block.id} className="my-6 overflow-x-auto text-center scroll-mt-6">
                <table className="mx-auto border-collapse border-y-2 border-stone-800 text-xs">
                  <thead>
                    <tr className="border-b border-stone-800 bg-stone-100/70">
                      {block.headers.map((h, hIdx) => (
                        <th
                          key={hIdx}
                          style={{ textAlign: block.aligns[hIdx] || 'left' }}
                          className="px-4 py-2 font-semibold text-stone-900 border-x border-stone-200"
                        >
                          {renderInlineFormatted(h, false, bibEntries, cslStyle)}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {block.rows.map((row, rIdx) => (
                      <tr key={rIdx} className="border-b border-stone-200 hover:bg-stone-50/50">
                        {row.map((cell, cIdx) => (
                          <td
                            key={cIdx}
                            style={{ textAlign: block.aligns[cIdx] || 'left' }}
                            className="px-4 py-1.5 border-x border-stone-200 text-stone-800"
                          >
                            {renderInlineFormatted(cell, false, bibEntries, cslStyle)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
                {block.caption && (
                  <div className="mt-2 text-xs font-serif italic text-stone-600 text-center">
                    Table {tableCounter}: {renderInlineFormatted(block.caption, false, bibEntries, cslStyle)}
                  </div>
                )}
              </div>
            )
          }

          if (block.type === 'figure') {
            figureCounter++
            return (
              <figure key={idx} id={block.id} className="my-6 text-center scroll-mt-6">
                <img
                  src={block.src}
                  alt={block.caption}
                  className="mx-auto rounded border border-stone-200 shadow-xs max-h-96 object-contain"
                  style={{ width: block.width || '80%' }}
                  onError={(e) => {
                    // Placeholder fallback if image file not on disk yet
                    ;(e.target as HTMLImageElement).src =
                      'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="200" viewBox="0 0 400 200"><rect width="400" height="200" fill="%23f3f4f6"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="%239ca3af" font-family="sans-serif" font-size="14">Image: ' +
                      encodeURIComponent(block.src) +
                      '</text></svg>'
                  }}
                />
                {block.caption && (
                  <figcaption className="mt-2 text-xs font-serif italic text-stone-600">
                    Figure {figureCounter}: {renderInlineFormatted(block.caption, false, bibEntries, cslStyle)}
                  </figcaption>
                )}
              </figure>
            )
          }

          if (block.type === 'quote') {
            return (
              <blockquote
                key={idx}
                className="border-l-3 border-[#4078f2] bg-blue-50/30 pl-4 py-1.5 my-3 italic text-stone-700 rounded-r text-sm"
              >
                {renderInlineFormatted(block.text, false, bibEntries, cslStyle)}
              </blockquote>
            )
          }

          if (block.type === 'list-item') {
            return (
              <li key={idx} className={`ml-6 my-0.5 ${block.ordered ? 'list-decimal' : 'list-disc'}`}>
                {renderInlineFormatted(block.text, false, bibEntries, cslStyle)}
              </li>
            )
          }

          if (block.type === 'hr') {
            return <hr key={idx} className="border-t border-stone-300 my-6" />
          }

          return (
            <p key={idx} className="indent-8 my-1 text-justify leading-relaxed">
              {renderInlineFormatted(block.text, false, bibEntries, cslStyle)}
            </p>
          )
        })}

        {entriesToRender.length > 0 && (
          <section className="mt-10 pt-4 border-t border-stone-300 font-sans">
            <h2 className="text-xl font-bold text-stone-900 mb-3 border-b border-stone-200 pb-1">
              References
            </h2>
            <div className="space-y-2 text-xs leading-relaxed text-stone-800">
              {entriesToRender.map((entry, eIdx) => (
                <div key={entry.key} id={`ref-${entry.key}`} className="pl-6 -indent-6">
                  {formatBibReference(entry, cslStyle, eIdx + 1)}
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    )
  }

  const lines = doc.content.split('\n')
  let sec = 0
  let sub = 0

  // Fallback draft LaTeX rendering when not yet compiled
  const get = (k: string) => doc.content.match(new RegExp(`\\\\${k}\\{([^}]*)\\}`))?.[1]
  const title = get('title')
  const author = get('author')

  return (
    <div
      className="text-[#111827] text-justify space-y-4"
      style={{
        fontFamily: "'Latin Modern Roman', 'Computer Modern Roman', 'Times New Roman', Times, serif",
        fontSize: '16px', // Standard 12pt
        lineHeight: '26px',
      }}
    >
      <div className="bg-amber-50 border border-amber-200 text-amber-800 text-[11px] p-2.5 rounded font-sans mb-4 text-center">
        ⚠️ <strong>Pratinjau Draf:</strong> Klik tombol <strong>Compile</strong> di toolbar atas untuk menghasilkan PDF riil dengan font 12pt presisi, formula matematika, dan tata letak TeX asli.
      </div>

      {title && (
        <h1
          className="text-center font-bold text-[#000000]"
          style={{ fontSize: '24px', lineHeight: '32px' }}
        >
          {title}
        </h1>
      )}
      {author && <p className="text-center text-stone-700 italic">{author}</p>}
      {title && (
        <p className="text-center text-xs text-stone-500 mb-6 font-sans">
          {new Date().toLocaleDateString('en-GB', { dateStyle: 'long' })}
        </p>
      )}
      {lines.map((l, i) => {
        if (/^\\(documentclass|title|author|begin|end|maketitle)/.test(l)) return null
        const s = l.match(/^\\section\{(.*)\}/)
        if (s) {
          sec++
          sub = 0
          return (
            <h2
              key={i}
              className="font-bold text-[#1f2937] pt-4"
              style={{ fontSize: '20px', lineHeight: '26px' }}
            >
              {sec}&nbsp;&nbsp;{s[1]}
            </h2>
          )
        }
        const ss = l.match(/^\\subsection\{(.*)\}/)
        if (ss) {
          sub++
          return (
            <h3
              key={i}
              className="font-semibold text-[#374151] pt-2"
              style={{ fontSize: '17px', lineHeight: '22px' }}
            >
              {sec}.{sub}&nbsp;&nbsp;{ss[1]}
            </h3>
          )
        }
        if (/^\\begin\{equation\}/.test(l)) {
          const eqContent = l.replace(/^\\begin\{equation\}\s*/, '').replace(/\s*\\end\{equation\}$/, '')
          return (
            <div key={i} className="my-2">
              {renderInlineFormatted(`\\[${eqContent}\\]`, true)}
            </div>
          )
        }
        return l.trim() ? (
          <p key={i} className="indent-8 my-1 text-justify">
            {renderInlineFormatted(l, true)}
          </p>
        ) : null
      })}
    </div>
  )
}
