import React, { useRef, useImperativeHandle, forwardRef } from 'react'
import Editor, { OnMount, OnChange } from '@monaco-editor/react'
import { Doc } from '../../types'
import {
  LATEX_LANGUAGE_ID,
  latexMonarchTokens,
  LATEX_THEME_RULES,
} from '../../utils'

export interface CodeEditorProps {
  doc: Doc
  onChangeContent: (content: string) => void
  onSave?: () => void
}

export interface CodeEditorHandle {
  jumpToLine: (lineNumber: number) => void
  wrapSelection: (prefix: string, suffix: string, placeholder?: string) => void
  getSelectedText: () => string
}

export const CodeEditor = forwardRef<CodeEditorHandle, CodeEditorProps>(
  ({ doc, onChangeContent, onSave }, ref) => {
    const editorRef = useRef<Parameters<OnMount>[0] | null>(null)

    useImperativeHandle(ref, () => ({
      jumpToLine: (lineNumber: number) => {
        const editor = editorRef.current
        if (editor) {
          editor.revealLineInCenter(lineNumber)
          editor.setPosition({ lineNumber, column: 1 })
          editor.focus()
        }
      },
      wrapSelection: (prefix: string, suffix: string, placeholder = 'teks') => {
        const editor = editorRef.current
        if (!editor) return

        const selection = editor.getSelection()
        const model = editor.getModel()
        if (!selection || !model) return

        const selectedText = model.getValueInRange(selection)
        const textToWrap = selectedText || placeholder
        const newText = `${prefix}${textToWrap}${suffix}`

        editor.executeEdits('ribbon-wrap', [
          {
            range: selection,
            text: newText,
            forceMoveMarkers: true,
          },
        ])
        editor.focus()
      },
      getSelectedText: () => {
        const editor = editorRef.current
        if (!editor) return ''
        const selection = editor.getSelection()
        const model = editor.getModel()
        if (!selection || !model) return ''
        return model.getValueInRange(selection)
      },
    }))

    const language = doc.kind === 'tex' ? 'latex' : doc.kind === 'md' ? 'markdown' : 'plaintext'

    const handleEditorDidMount: OnMount = (editor, monaco) => {
      editorRef.current = editor

      // Register / update LaTeX language tokenizer & theme once
      if (!monaco.languages.getLanguages().some((l: { id: string }) => l.id === LATEX_LANGUAGE_ID)) {
        monaco.languages.register({ id: LATEX_LANGUAGE_ID })
      }
      monaco.languages.setMonarchTokensProvider(LATEX_LANGUAGE_ID, latexMonarchTokens as any)

      // Define Scholarly Light Theme
      monaco.editor.defineTheme('scholarly-light', {
        base: 'vs',
        inherit: true,
        rules: LATEX_THEME_RULES as any,
        colors: {
          'editor.background': '#ffffff',
          'editor.foreground': '#1f2937',
          'editorLineNumber.foreground': '#9ca3af',
          'editorLineNumber.activeForeground': '#4f46e5',
          'editor.lineHighlightBackground': '#f8fafc',
          'editorCursor.foreground': '#4f46e5',
          'editorWhitespace.foreground': '#e2e8f0',
          'editorIndentGuide.background': '#f1f5f9',
          'editorIndentGuide.activeBackground': '#cbd5e1',
        },
      })

      monaco.editor.setTheme('scholarly-light')

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
      <div className="flex-1 w-full h-full min-h-0 relative bg-white">
        <Editor
          height="100%"
          width="100%"
          language={language}
          theme="vs"
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
  },
)

CodeEditor.displayName = 'CodeEditor'
