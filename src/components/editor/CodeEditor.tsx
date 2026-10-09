import React from 'react'
import { Doc } from '../../types'
import { highlightCodeLine } from '../../utils'

export interface CodeEditorProps {
  doc: Doc
  onChangeContent: (content: string) => void
}

export const CodeEditor: React.FC<CodeEditorProps> = ({ doc, onChangeContent }) => {
  const lines = doc.content.split('\n')

  return (
    <div className="flex-1 relative overflow-auto font-mono text-[13px] leading-6">
      <div className="absolute inset-0 flex">
        <div className="text-right pr-3 pl-3 text-stone-600 select-none py-3">
          {lines.map((_, i) => (
            <div key={i}>{i + 1}</div>
          ))}
        </div>
        <div className="relative flex-1 py-3">
          <pre className="text-stone-200 whitespace-pre-wrap pointer-events-none">
            {lines.map((l, i) => (
              <div key={i}>
                {highlightCodeLine(l, doc.kind)}
                {'\u200b'}
              </div>
            ))}
          </pre>
          <textarea
            value={doc.content}
            onChange={(e) => onChangeContent(e.target.value)}
            spellCheck={false}
            className="absolute inset-0 py-3 bg-transparent text-transparent caret-amber-300 resize-none outline-none whitespace-pre-wrap font-mono text-[13px] leading-6"
          />
        </div>
      </div>
    </div>
  )
}
