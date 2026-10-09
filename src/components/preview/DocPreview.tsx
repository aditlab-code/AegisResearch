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
      <div className="space-y-3">
        {lines.map((l, i) =>
          l.startsWith('# ') ? (
            <h1 key={i} className="text-3xl font-semibold font-serif border-b border-stone-200 pb-2">
              {l.slice(2)}
            </h1>
          ) : l.startsWith('## ') ? (
            <h2 key={i} className="text-xl font-semibold font-serif mt-5">
              {l.slice(3)}
            </h2>
          ) : l.startsWith('- ') ? (
            <li key={i} className="ml-5 list-disc">
              {renderInlineFormatted(l.slice(2))}
            </li>
          ) : l.startsWith('> ') ? (
            <blockquote key={i} className="border-l-4 border-indigo-300 pl-4 italic text-stone-600">
              {renderInlineFormatted(l.slice(2))}
            </blockquote>
          ) : l.trim() ? (
            <p key={i}>{renderInlineFormatted(l)}</p>
          ) : null,
        )}
      </div>
    )
  }

  const get = (k: string) => doc.content.match(new RegExp(`\\\\${k}\\{([^}]*)\\}`))?.[1]
  const title = get('title')
  const author = get('author')

  return (
    <div className="space-y-3 text-justify">
      {title && <h1 className="text-center text-2xl font-semibold">{title}</h1>}
      {author && <p className="text-center text-stone-600">{author}</p>}
      {title && (
        <p className="text-center text-sm text-stone-500 mb-6">
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
            <h2 key={i} className="text-lg font-semibold mt-5">
              {sec}&nbsp;&nbsp;{s[1]}
            </h2>
          )
        }
        const ss = l.match(/^\\subsection\{(.*)\}/)
        if (ss) {
          sub++
          return (
            <h3 key={i} className="font-semibold mt-3">
              {sec}.{sub}&nbsp;&nbsp;{ss[1]}
            </h3>
          )
        }
        return l.trim() ? (
          <p key={i} className="indent-6">
            {renderInlineFormatted(l)}
          </p>
        ) : null
      })}
    </div>
  )
}
