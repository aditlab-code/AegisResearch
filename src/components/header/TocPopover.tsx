import React, { useState } from 'react'
import { ListTree, FileText, Table, Image, PlusCircle, Bookmark } from 'lucide-react'
import { PopoverShell } from './PopoverShell'

export interface TocPopoverProps {
  onInsertCode: (code: string) => void
  onClose: () => void
}

export const TocPopover: React.FC<TocPopoverProps> = ({ onInsertCode, onClose }) => {
  const [customTitle, setCustomTitle] = useState('')
  const [level, setLevel] = useState<'section' | 'chapter'>('section')

  const handleInsert = (code: string) => {
    onInsertCode(code)
    onClose()
  }

  const handleAddCustomEntry = (e: React.FormEvent) => {
    e.preventDefault()
    const clean = customTitle.trim()
    if (!clean) return

    const code = `\\addcontentsline{toc}{${level}}{${clean}}\n`
    onInsertCode(code)
    onClose()
  }

  return (
    <PopoverShell
      title="Table of Contents & Lists"
      icon={ListTree}
      onClose={onClose}
      widthClass="w-80"
    >
      <div className="space-y-3 text-xs">
        {/* 1. Standard Document Lists */}
        <div>
          <span className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider block mb-1.5">
            Standard Document Lists
          </span>
          <div className="space-y-1">
            <button
              type="button"
              onClick={() => handleInsert('\n\\tableofcontents\n\\newpage\n')}
              className="w-full p-2 border border-stone-200 rounded-md hover:bg-indigo-50/70 hover:border-indigo-300 transition-colors text-left flex items-center gap-2 group"
            >
              <FileText className="size-4 text-indigo-600 shrink-0" />
              <div className="flex flex-col min-w-0">
                <span className="font-semibold text-stone-800 group-hover:text-indigo-900 truncate">
                  Table of Contents
                </span>
                <span className="text-[10px] font-mono text-stone-400">\tableofcontents</span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => handleInsert('\n\\listoffigures\n\\newpage\n')}
              className="w-full p-2 border border-stone-200 rounded-md hover:bg-emerald-50/70 hover:border-emerald-300 transition-colors text-left flex items-center gap-2 group"
            >
              <Image className="size-4 text-emerald-600 shrink-0" />
              <div className="flex flex-col min-w-0">
                <span className="font-semibold text-stone-800 group-hover:text-emerald-900 truncate">
                  List of Figures
                </span>
                <span className="text-[10px] font-mono text-stone-400">\listoffigures</span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => handleInsert('\n\\listoftables\n\\newpage\n')}
              className="w-full p-2 border border-stone-200 rounded-md hover:bg-amber-50/70 hover:border-amber-300 transition-colors text-left flex items-center gap-2 group"
            >
              <Table className="size-4 text-amber-600 shrink-0" />
              <div className="flex flex-col min-w-0">
                <span className="font-semibold text-stone-800 group-hover:text-amber-900 truncate">
                  List of Tables
                </span>
                <span className="text-[10px] font-mono text-stone-400">\listoftables</span>
              </div>
            </button>
          </div>
        </div>

        {/* 2. Register Custom Section / Appendix to TOC */}
        <div className="border-t border-stone-200 pt-2.5">
          <span className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider block mb-1.5">
            Add Custom Entry to TOC (e.g. Appendix)
          </span>

          <form onSubmit={handleAddCustomEntry} className="space-y-2">
            <div className="flex gap-1">
              <button
                type="button"
                onClick={() => setLevel('section')}
                className={`flex-1 py-1 rounded border text-[11px] font-medium transition-colors ${
                  level === 'section'
                    ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                    : 'border-stone-200 text-stone-600 hover:bg-stone-50'
                }`}
              >
                Section Level
              </button>
              <button
                type="button"
                onClick={() => setLevel('chapter')}
                className={`flex-1 py-1 rounded border text-[11px] font-medium transition-colors ${
                  level === 'chapter'
                    ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                    : 'border-stone-200 text-stone-600 hover:bg-stone-50'
                }`}
              >
                Chapter Level
              </button>
            </div>

            <div className="relative">
              <input
                type="text"
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
                placeholder="Title (e.g. Appendices, Glossary)"
                required
                className="w-full px-2.5 py-1.5 border border-stone-300 rounded text-xs focus:outline-none focus:border-indigo-500"
              />
            </div>

            <button
              type="submit"
              disabled={!customTitle.trim()}
              className="w-full py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded font-medium text-xs shadow-sm flex items-center justify-center gap-1.5 transition-colors"
            >
              <PlusCircle className="size-3.5" />
              Register Entry to TOC
            </button>
          </form>
        </div>
      </div>
    </PopoverShell>
  )
}
