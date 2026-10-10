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
  onSyncToPdf?: () => void
  theme?: 'dark' | 'light'
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
      onSyncToPdf,
      theme = 'light',
    },
    ref,
  ) => {
    const activeDoc = activeDocIndex >= 0 && activeDocIndex < docs.length ? docs[activeDocIndex] : undefined

    return (
      <main className="w-full h-full flex flex-col min-w-0 bg-white dark:bg-zinc-900">
        <EditorTabs
          docs={docs}
          openDocIndices={openDocIndices}
          activeDocIndex={activeDocIndex}
          onSelectTab={onSelectTab}
          onCloseTab={onCloseTab}
          isDirty={isDirty}
        />
        {activeDoc ? (
          <CodeEditor
            ref={ref}
            doc={activeDoc}
            onChangeContent={onChangeContent}
            onSave={onSave}
            onSyncToPdf={onSyncToPdf}
            theme={theme}
          />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-zinc-400 p-6 select-none bg-zinc-50 dark:bg-zinc-950">
            <div className="size-12 rounded-full bg-zinc-200/60 dark:bg-zinc-800 flex items-center justify-center text-zinc-400 mb-3">
              <FileEdit className="size-6" />
            </div>
            <p className="text-sm font-medium text-zinc-600 dark:text-zinc-300 mb-1">No documents open</p>
            <p className="text-xs text-zinc-400">Select a file from the explorer on the left to start editing.</p>
          </div>
        )}
      </main>
    )
  },
)

Editor.displayName = 'Editor'
