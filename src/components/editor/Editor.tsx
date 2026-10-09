import React from 'react'
import { Doc } from '../../types'
import { EditorTabs } from './EditorTabs'
import { CodeEditor } from './CodeEditor'

export interface EditorProps {
  docs: Doc[]
  openDocIndices: number[]
  activeDocIndex: number
  onSelectTab: (index: number) => void
  onCloseTab: (index: number) => void
  onChangeContent: (content: string) => void
  isDirty?: boolean
  onSave?: () => void
}

export const Editor: React.FC<EditorProps> = ({
  docs,
  openDocIndices,
  activeDocIndex,
  onSelectTab,
  onCloseTab,
  onChangeContent,
  isDirty = false,
  onSave,
}) => {
  const activeDoc = docs[activeDocIndex]

  return (
    <main className="w-full h-full flex flex-col min-w-0 bg-[#1e1e2e]">
      <EditorTabs
        docs={docs}
        openDocIndices={openDocIndices}
        activeDocIndex={activeDocIndex}
        onSelectTab={onSelectTab}
        onCloseTab={onCloseTab}
        isDirty={isDirty}
      />
      {activeDoc ? (
        <CodeEditor doc={activeDoc} onChangeContent={onChangeContent} onSave={onSave} />
      ) : (
        <div className="flex-1 grid place-items-center text-stone-500 text-sm">
          No document open
        </div>
      )}
    </main>
  )
}
