import React from 'react'
import { Doc } from '../../types'
import { Badge } from '../ui'

export interface FileTreeProps {
  docs: Doc[]
  activeDocIndex: number
  projectName?: string
  onSelectDoc: (index: number) => void
}

export const FileTree: React.FC<FileTreeProps> = ({
  docs,
  activeDocIndex,
  projectName = 'quantum-thesis',
  onSelectDoc,
}) => {
  return (
    <>
      <div className="text-xs text-stone-500 mb-1">▾ {projectName}</div>
      {docs.map((doc, index) => {
        const ext = doc.name.split('.').pop()?.toUpperCase() || ''
        const isActive = index === activeDocIndex
        return (
          <button
            key={doc.name}
            onClick={() => onSelectDoc(index)}
            className={`w-full flex items-center gap-2 px-2 py-1 rounded text-left ${
              isActive ? 'bg-indigo-100 text-indigo-800' : 'hover:bg-stone-200'
            }`}
          >
            <Badge kind={doc.kind}>{ext}</Badge>
            {doc.name}
          </button>
        )
      })}
    </>
  )
}
