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
    previewClass: 'text-base font-bold text-zinc-900 dark:text-white',
  },
  {
    id: 'chapter',
    name: 'Chapter',
    description: 'Top-level chapter division',
    latexCode: '\\chapter{Chapter Title}\n',
    mdCode: '# Chapter Title\n',
    previewClass: 'text-sm font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wide',
  },
  {
    id: 'section',
    name: 'Heading 1 (Section)',
    description: 'Major section heading',
    latexCode: '\\section{Section Title}\n',
    mdCode: '# Section Title\n',
    previewClass: 'text-sm font-bold text-zinc-900 dark:text-white',
  },
  {
    id: 'subsection',
    name: 'Heading 2 (Subsection)',
    description: 'Sub-section division',
    latexCode: '\\subsection{Subsection Title}\n',
    mdCode: '## Subsection Title\n',
    previewClass: 'text-xs font-semibold text-zinc-800 dark:text-zinc-200',
  },
  {
    id: 'subsubsection',
    name: 'Heading 3 (Subsubsection)',
    description: 'Tertiary section block',
    latexCode: '\\subsubsection{Subsubsection Title}\n',
    mdCode: '### Subsubsection Title\n',
    previewClass: 'text-xs font-medium text-zinc-700 dark:text-zinc-300',
  },
  {
    id: 'paragraph',
    name: 'Paragraph Header',
    description: 'Inline labeled paragraph',
    latexCode: '\\paragraph{Paragraph Title}\n',
    mdCode: '#### Paragraph Title\n',
    previewClass: 'text-[11px] font-bold text-zinc-600 dark:text-zinc-400 italic',
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
            className="w-full p-2 border border-zinc-200 dark:border-zinc-800 rounded-md hover:bg-zinc-50 dark:hover:bg-zinc-800/70 hover:border-blue-400 transition-colors text-left flex flex-col gap-0.5 group"
          >
            <div className="flex items-center justify-between w-full">
              <span className={item.previewClass}>{item.name}</span>
              <code className="text-[10px] font-mono text-zinc-400 group-hover:text-blue-600 dark:group-hover:text-blue-400">
                {isLatex ? item.latexCode.trim() : item.mdCode.trim()}
              </code>
            </div>
            <span className="text-[10px] text-zinc-500 dark:text-zinc-400">{item.description}</span>
          </button>
        ))}
      </div>
    </PopoverShell>
  )
}
