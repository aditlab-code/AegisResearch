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
  onSyncToPdf?: () => void
  theme?: 'dark' | 'light'
}

export interface CodeEditorHandle {
  jumpToLine: (lineNumber: number) => void
  jumpToLineAndHighlight: (lineNumber: number, column?: number) => void
  getCursorPosition: () => { line: number; column: number }
  wrapSelection: (prefix: string, suffix: string, placeholder?: string) => void
  getSelectedText: () => string
}

export const CodeEditor = forwardRef<CodeEditorHandle, CodeEditorProps>(
  ({ doc, onChangeContent, onSave, onSyncToPdf, theme = 'dark' }, ref) => {
    const editorRef = useRef<Parameters<OnMount>[0] | null>(null)
    const monacoRef = useRef<Parameters<OnMount>[1] | null>(null)
    const decorationsCollectionRef = useRef<any>(null)
    const highlightTimeoutRef = useRef<number | null>(null)

    useEffect(() => {
      return () => {
        if (highlightTimeoutRef.current) {
          window.clearTimeout(highlightTimeoutRef.current)
        }
      }
    }, [])

    useImperativeHandle(ref, () => ({
      jumpToLine: (lineNumber: number) => {
        const editor = editorRef.current
        if (editor) {
          editor.revealLineInCenter(lineNumber)
          editor.setPosition({ lineNumber, column: 1 })
          editor.focus()
        }
      },
      jumpToLineAndHighlight: (lineNumber: number, column = 1) => {
        const editor = editorRef.current
        const monaco = monacoRef.current
        if (editor) {
          editor.revealLineInCenter(lineNumber)
          editor.setPosition({ lineNumber, column })
          editor.focus()

          if (monaco) {
            if (highlightTimeoutRef.current) {
              window.clearTimeout(highlightTimeoutRef.current)
              highlightTimeoutRef.current = null
            }
            if (decorationsCollectionRef.current) {
              decorationsCollectionRef.current.clear()
            }

            decorationsCollectionRef.current = editor.createDecorationsCollection([
              {
                range: new monaco.Range(lineNumber, 1, lineNumber, 1),
                options: {
                  isWholeLine: true,
                  className: 'synctex-line-pulse',
                  overviewRuler: {
                    color: '#4078f2',
                    position: monaco.editor.OverviewRulerLane.Full,
                  },
                },
              },
            ])

            highlightTimeoutRef.current = window.setTimeout(() => {
              if (decorationsCollectionRef.current) {
                decorationsCollectionRef.current.clear()
                decorationsCollectionRef.current = null
              }
            }, 1600)
          }
        }
      },
      getCursorPosition: () => {
        const editor = editorRef.current
        if (!editor) return { line: 1, column: 1 }
        const pos = editor.getPosition()
        return { line: pos?.lineNumber || 1, column: pos?.column || 1 }
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

      // Define Aegis Light Theme (Atom One Light)
      monaco.editor.defineTheme('aegis-light', {
        base: 'vs',
        inherit: true,
        rules: LATEX_THEME_RULES as any,
        colors: {
          'editor.background': '#fafafa',
          'editor.foreground': '#383a42',
          'editorLineNumber.foreground': '#9d9d9f',
          'editorLineNumber.activeForeground': '#4078f2',
          'editor.lineHighlightBackground': '#f2f2f2',
          'editor.selectionBackground': '#e5e5e6',
          'editorCursor.foreground': '#4078f2',
          'editorWhitespace.foreground': '#dbdfe4',
          'editorIndentGuide.background': '#eceff1',
          'editorIndentGuide.activeBackground': '#d0d0d0',
        },
      })

      // Define Aegis Dark Theme (Classic Atom One Dark)
      monaco.editor.defineTheme('aegis-dark', {
        base: 'vs-dark',
        inherit: true,
        rules: LATEX_DARK_THEME_RULES as any,
        colors: {
          'editor.background': '#282c34',
          'editor.foreground': '#abb2bf',
          'editorLineNumber.foreground': '#4b5263',
          'editorLineNumber.activeForeground': '#61afef',
          'editor.lineHighlightBackground': '#2c313a70',
          'editor.selectionBackground': '#3e445180',
          'editorCursor.foreground': '#61afef',
          'editorWhitespace.foreground': '#3b4048',
          'editorIndentGuide.background': '#3b4048',
          'editorIndentGuide.activeBackground': '#5c6370',
        },
      })

      monaco.editor.setTheme(theme === 'dark' ? 'aegis-dark' : 'aegis-light')

      // Add Ctrl/Cmd + S shortcut command inside Monaco
      editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
        onSave?.()
      })

      // Add Ctrl/Cmd + Alt + J shortcut command inside Monaco for SyncTeX forward search
      editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyMod.Alt | monaco.KeyCode.KeyJ, () => {
        onSyncToPdf?.()
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
      <div className="flex-1 w-full h-full min-h-0 relative bg-[#fafafa] dark:bg-[#282c34]">
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
              Loading Aegis Research editor...
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
