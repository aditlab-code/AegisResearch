import React, { forwardRef } from 'react'
import { FileEdit } from 'lucide-react'
import { Doc } from '../../types'
import { EditorTabs } from './EditorTabs'
import { CodeEditor, CodeEditorHandle } from './CodeEditor'

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

export const Editor = forwardRef<CodeEditorHandle, EditorProps>(
  (
    {
      docs,
      openDocIndices,
      activeDocIndex,
      onSelectTab,
      onCloseTab,
      onChangeContent,
      isDirty = false,
      onSave,
    },
    ref,
  ) => {
    const activeDoc = activeDocIndex >= 0 && activeDocIndex < docs.length ? docs[activeDocIndex] : undefined

    return (
      <main className="w-full h-full flex flex-col min-w-0 bg-white">
        <EditorTabs
          docs={docs}
          openDocIndices={openDocIndices}
          activeDocIndex={activeDocIndex}
          onSelectTab={onSelectTab}
          onCloseTab={onCloseTab}
          isDirty={isDirty}
        />
        {activeDoc ? (
          <CodeEditor ref={ref} doc={activeDoc} onChangeContent={onChangeContent} onSave={onSave} />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-stone-400 p-6 select-none bg-stone-50">
            <div className="size-12 rounded-full bg-stone-200/60 flex items-center justify-center text-stone-400 mb-3">
              <FileEdit className="size-6" />
            </div>
            <p className="text-sm font-medium text-stone-600 mb-1">Tidak ada dokumen yang terbuka</p>
            <p className="text-xs text-stone-400">Pilih file dari sidebar di sebelah kiri untuk mulai mengedit.</p>
          </div>
        )}
      </main>
    )
  },
)

Editor.displayName = 'Editor'
