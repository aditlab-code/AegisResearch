import React from 'react'
import { Doc } from '../../types'

export interface EditorTabsProps {
  docs: Doc[]
  openDocIndices: number[]
  activeDocIndex: number
  onSelectTab: (index: number) => void
  onCloseTab: (index: number) => void
}

export const EditorTabs: React.FC<EditorTabsProps> = ({
  docs,
  openDocIndices,
  activeDocIndex,
  onSelectTab,
  onCloseTab,
}) => {
  return (
    <div className="flex bg-[#181825] text-xs">
      {openDocIndices.map((docIdx) => {
        const isActive = docIdx === activeDocIndex
        const doc = docs[docIdx]
        if (!doc) return null

        return (
          <div
            key={docIdx}
            onClick={() => onSelectTab(docIdx)}
            className={`px-4 py-2 cursor-pointer flex gap-2 border-r border-black/30 items-center ${
              isActive
                ? 'bg-[#1e1e2e] text-white border-t-2 border-t-amber-400'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            {doc.name}
            <button
              onClick={(e) => {
                e.stopPropagation()
                onCloseTab(docIdx)
              }}
              className="text-stone-500 hover:text-white"
            >
              ×
            </button>
          </div>
        )
      })}
    </div>
  )
}
