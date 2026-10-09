import React, { useRef } from 'react'
import Editor, { OnMount, OnChange } from '@monaco-editor/react'
import { Doc } from '../../types'

export interface CodeEditorProps {
  doc: Doc
  onChangeContent: (content: string) => void
  onSave?: () => void
}

export const CodeEditor: React.FC<CodeEditorProps> = ({ doc, onChangeContent, onSave }) => {
  const editorRef = useRef<Parameters<OnMount>[0] | null>(null)

  const language = doc.kind === 'tex' ? 'latex' : doc.kind === 'md' ? 'markdown' : 'plaintext'

  const handleEditorDidMount: OnMount = (editor, monaco) => {
    editorRef.current = editor

    // Add Ctrl/Cmd + S shortcut command inside Monaco
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      onSave?.()
    })

    // Safe layout on next frame
    requestAnimationFrame(() => {
      editor.layout()
    })
  }

  const handleEditorChange: OnChange = (value) => {
    onChangeContent(value ?? '')
  }

  return (
    <div className="flex-1 w-full h-full min-h-0 relative bg-[#1e1e2e]">
      <Editor
        height="100%"
        width="100%"
        language={language}
        theme="vs-dark"
        value={doc.content}
        onChange={handleEditorChange}
        onMount={handleEditorDidMount}
        loading={
          <div className="flex items-center justify-center h-full text-stone-400 text-xs font-mono animate-pulse">
            Memuat editor Monaco...
          </div>
        }
        options={{
          fontSize: 13,
          fontFamily: "'Fira Code', Menlo, Monaco, 'Courier New', monospace",
          lineNumbers: 'on',
          scrollBeyondLastLine: false,
          automaticLayout: true,
          wordWrap: 'on',
          minimap: { enabled: false },
          tabSize: 2,
          padding: { top: 12, bottom: 12 },
          suggestOnTriggerCharacters: true,
          renderLineHighlight: 'all',
          cursorBlinking: 'smooth',
          smoothScrolling: true,
          folding: true,
        }}
      />
    </div>
  )
}
