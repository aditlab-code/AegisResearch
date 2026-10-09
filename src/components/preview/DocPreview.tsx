import React from 'react'
import { Doc } from '../../types'
import { renderInlineFormatted } from '../../utils'

export interface DocPreviewProps {
  doc: Doc
}

export const DocPreview: React.FC<DocPreviewProps> = ({ doc }) => {
  const lines = doc.content.split('\n')
  let sec = 0
  let sub = 0

  if (doc.kind === 'md') {
    return (
      <div
        className="text-[#111827] text-justify space-y-4"
        style={{
          fontFamily: "'Latin Modern Roman', 'Computer Modern Roman', 'Times New Roman', Times, serif",
          fontSize: '16px', // Standard 12pt (12pt * 1.3333 = 16px at 96 DPI)
          lineHeight: '26px', // 1.625 ratio (proportional academic reading height)
        }}
      >
        {lines.map((l, i) =>
          l.startsWith('# ') ? (
            <h1
              key={i}
              className="font-bold text-center border-b border-stone-300 pb-3 pt-2 text-[#000000]"
              style={{ fontSize: '26px', lineHeight: '34px' }} // ~20pt
            >
              {l.slice(2)}
            </h1>
          ) : l.startsWith('## ') ? (
            <h2
              key={i}
              className="font-bold text-[#1f2937] pt-4"
              style={{ fontSize: '21px', lineHeight: '28px' }} // ~16pt
            >
              {l.slice(3)}
            </h2>
          ) : l.startsWith('### ') ? (
            <h3
              key={i}
              className="font-semibold text-[#374151] pt-2"
              style={{ fontSize: '18px', lineHeight: '24px' }} // ~14pt
            >
              {l.slice(4)}
            </h3>
          ) : l.startsWith('- ') ? (
            <li key={i} className="ml-6 list-disc">
              {renderInlineFormatted(l.slice(2))}
            </li>
          ) : l.startsWith('> ') ? (
            <blockquote
              key={i}
              className="border-l-2 border-stone-400 pl-4 my-2 italic text-stone-700"
            >
              {renderInlineFormatted(l.slice(2), false)}
            </blockquote>
          ) : l.trim() ? (
            <p key={i} className="indent-8 my-1 text-justify">
              {renderInlineFormatted(l, false)}
            </p>
          ) : null,
        )}
      </div>
    )
  }

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
