import React from 'react'
import { Circle, X, FileText, FileCode } from 'lucide-react'
import { Doc } from '../../types'

export interface EditorTabsProps {
  docs: Doc[]
  openDocIndices: number[]
  activeDocIndex: number
  isDirty?: boolean
  onSelectTab: (index: number) => void
  onCloseTab: (index: number) => void
}

export const EditorTabs: React.FC<EditorTabsProps> = ({
  docs,
  openDocIndices,
  activeDocIndex,
  isDirty = false,
  onSelectTab,
  onCloseTab,
}) => {
  if (openDocIndices.length === 0) {
    return (
      <div className="flex items-center h-9 bg-stone-100 border-b border-stone-200 text-xs px-3 text-stone-400 select-none">
        Belum ada tab terbuka
      </div>
    )
  }

  return (
    <div className="flex bg-stone-100 border-b border-stone-200 text-xs select-none overflow-x-auto">
      {openDocIndices.map((docIdx) => {
        const isActive = docIdx === activeDocIndex
        const doc = docs[docIdx]
        if (!doc) return null

        const isTex = doc.kind === 'tex'

        return (
          <div
            key={docIdx}
            onClick={() => onSelectTab(docIdx)}
            className={`group px-3 py-2 cursor-pointer flex gap-2 border-r border-stone-200 items-center transition-colors min-w-0 max-w-[180px] ${
              isActive
                ? 'bg-white text-stone-900 font-medium border-t-2 border-t-indigo-600 shadow-sm'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/60'
            }`}
          >
            {isTex ? (
              <FileCode className="size-3.5 text-indigo-500 shrink-0" />
            ) : (
              <FileText className="size-3.5 text-emerald-600 shrink-0" />
            )}

            <span className="truncate flex-1 text-xs">{doc.name}</span>

            {isActive && isDirty && (
              <Circle className="size-2 fill-amber-500 text-amber-500 shrink-0" />
            )}

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                onCloseTab(docIdx)
              }}
              title="Tutup tab"
              className="text-stone-400 hover:text-stone-700 hover:bg-stone-200 rounded p-0.5 transition-colors shrink-0"
            >
              <X className="size-3" />
            </button>
          </div>
        )
      })}
    </div>
  )
}
