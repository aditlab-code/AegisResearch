import React from 'react'
import { Heading } from 'lucide-react'
import { PopoverShell } from './PopoverShell'

export interface HeadingStylePopoverProps {
  isLatex: boolean
  onSelectStyle: (styleCode: string) => void
  onClose: () => void
}

interface HeadingItem {
  id: string
  name: string
  description: string
  latexCode: string
  mdCode: string
  previewClass: string
}

const HEADING_STYLES: HeadingItem[] = [
  {
    id: 'title',
    name: 'Document Title',
    description: 'Main paper title',
    latexCode: '\\title{Document Title}\n',
    mdCode: '# Document Title\n',
    previewClass: 'text-base font-bold text-stone-900',
  },
  {
    id: 'chapter',
    name: 'Chapter',
    description: 'Top-level chapter division',
    latexCode: '\\chapter{Chapter Title}\n',
    mdCode: '# Chapter Title\n',
    previewClass: 'text-sm font-bold text-indigo-900 uppercase tracking-wide',
  },
  {
    id: 'section',
    name: 'Heading 1 (Section)',
    description: 'Major section heading',
    latexCode: '\\section{Section Title}\n',
    mdCode: '# Section Title\n',
    previewClass: 'text-sm font-bold text-stone-800',
  },
  {
    id: 'subsection',
    name: 'Heading 2 (Subsection)',
    description: 'Sub-section division',
    latexCode: '\\subsection{Subsection Title}\n',
    mdCode: '## Subsection Title\n',
    previewClass: 'text-xs font-semibold text-stone-700',
  },
  {
    id: 'subsubsection',
    name: 'Heading 3 (Subsubsection)',
    description: 'Tertiary section block',
    latexCode: '\\subsubsection{Subsubsection Title}\n',
    mdCode: '### Subsubsection Title\n',
    previewClass: 'text-xs font-medium text-stone-600',
  },
  {
    id: 'paragraph',
    name: 'Paragraph Header',
    description: 'Inline labeled paragraph',
    latexCode: '\\paragraph{Paragraph Title}\n',
    mdCode: '#### Paragraph Title\n',
    previewClass: 'text-[11px] font-bold text-stone-700 italic',
  },
]

export const HeadingStylePopover: React.FC<HeadingStylePopoverProps> = ({
  isLatex,
  onSelectStyle,
  onClose,
}) => {
  const handleSelect = (item: HeadingItem) => {
    const code = isLatex ? item.latexCode : item.mdCode
    onSelectStyle(code)
    onClose()
  }

  return (
    <PopoverShell title="Heading Styles" icon={Heading} onClose={onClose} widthClass="w-80">
      <div className="space-y-1.5 max-h-72 overflow-y-auto pr-0.5">
        {HEADING_STYLES.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => handleSelect(item)}
            className="w-full p-2 border border-stone-200 rounded-md hover:bg-indigo-50/70 hover:border-indigo-300 transition-colors text-left flex flex-col gap-0.5 group"
          >
            <div className="flex items-center justify-between w-full">
              <span className={item.previewClass}>{item.name}</span>
              <code className="text-[10px] font-mono text-stone-400 group-hover:text-indigo-600">
                {isLatex ? item.latexCode.trim() : item.mdCode.trim()}
              </code>
            </div>
            <span className="text-[10px] text-stone-500">{item.description}</span>
          </button>
        ))}
      </div>
    </PopoverShell>
  )
}
