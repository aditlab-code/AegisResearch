import React, { useRef, useEffect, useImperativeHandle, forwardRef } from 'react'
import Editor, { OnMount, OnChange } from '@monaco-editor/react'
import { Doc } from '../../types'
import {
  LATEX_LANGUAGE_ID,
  latexMonarchTokens,
  LATEX_THEME_RULES,
  LATEX_DARK_THEME_RULES,
} from '../../utils'

export interface CodeEditorProps {
  doc: Doc
  onChangeContent: (content: string) => void
  onSave?: () => void
  theme?: 'dark' | 'light'
}

export interface CodeEditorHandle {
  jumpToLine: (lineNumber: number) => void
  wrapSelection: (prefix: string, suffix: string, placeholder?: string) => void
  getSelectedText: () => string
}

export const CodeEditor = forwardRef<CodeEditorHandle, CodeEditorProps>(
  ({ doc, onChangeContent, onSave, theme = 'dark' }, ref) => {
    const editorRef = useRef<Parameters<OnMount>[0] | null>(null)
    const monacoRef = useRef<Parameters<OnMount>[1] | null>(null)

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

    // Update Monaco theme whenever theme prop changes
    useEffect(() => {
      if (monacoRef.current) {
        monacoRef.current.editor.setTheme(theme === 'dark' ? 'aegis-dark' : 'aegis-light')
      }
    }, [theme])

    const handleEditorDidMount: OnMount = (editor, monaco) => {
      editorRef.current = editor
      monacoRef.current = monaco

      // Register / update LaTeX language tokenizer & theme once
      if (!monaco.languages.getLanguages().some((l: { id: string }) => l.id === LATEX_LANGUAGE_ID)) {
        monaco.languages.register({ id: LATEX_LANGUAGE_ID })
      }
      monaco.languages.setMonarchTokensProvider(LATEX_LANGUAGE_ID, latexMonarchTokens as any)

      // Define Aegis Light Theme
      monaco.editor.defineTheme('aegis-light', {
        base: 'vs',
        inherit: true,
        rules: LATEX_THEME_RULES as any,
        colors: {
          'editor.background': '#ffffff',
          'editor.foreground': '#18181b',
          'editorLineNumber.foreground': '#a1a1aa',
          'editorLineNumber.activeForeground': '#2563eb',
          'editor.lineHighlightBackground': '#f4f4f580',
          'editorCursor.foreground': '#2563eb',
          'editorWhitespace.foreground': '#e4e4e7',
          'editorIndentGuide.background': '#f4f4f5',
          'editorIndentGuide.activeBackground': '#d4d4d8',
        },
      })

      // Define Aegis Dark Theme (eye-friendly Zinc charcoal)
      monaco.editor.defineTheme('aegis-dark', {
        base: 'vs-dark',
        inherit: true,
        rules: LATEX_DARK_THEME_RULES as any,
        colors: {
          'editor.background': '#18181b',
          'editor.foreground': '#f4f4f5',
          'editorLineNumber.foreground': '#52525b',
          'editorLineNumber.activeForeground': '#3b82f6',
          'editor.lineHighlightBackground': '#27272a50',
          'editorCursor.foreground': '#3b82f6',
          'editorWhitespace.foreground': '#3f3f46',
          'editorIndentGuide.background': '#27272a',
          'editorIndentGuide.activeBackground': '#3f3f46',
        },
      })

      monaco.editor.setTheme(theme === 'dark' ? 'aegis-dark' : 'aegis-light')

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
      <div className="flex-1 w-full h-full min-h-0 relative bg-white dark:bg-zinc-900">
        <Editor
          height="100%"
          width="100%"
          language={language}
          theme={theme === 'dark' ? 'aegis-dark' : 'aegis-light'}
          value={doc.content}
          onChange={handleEditorChange}
          onMount={handleEditorDidMount}
          loading={
            <div className="flex items-center justify-center h-full text-zinc-400 text-xs font-mono animate-pulse">
              Memuat editor Aegis Research...
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
