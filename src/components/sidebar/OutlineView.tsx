import React from 'react'

export interface OutlineViewProps {
  outlineItems: string[]
}

export const OutlineView: React.FC<OutlineViewProps> = ({ outlineItems }) => {
  return (
    <div className="space-y-1">
      {outlineItems.map((item, index) => {
        const isSub = /^(##|\\subsection)/.test(item)
        const label = item.replace(/^#+\s|\\(sub)?section\{|\}/g, '')
        return (
          <div
            key={index}
            className={`py-1 text-stone-700 ${isSub ? 'pl-4 text-stone-500' : ''}`}
          >
            {label}
          </div>
        )
      })}
    </div>
  )
}
