import { useState, useEffect, useRef, useMemo } from 'react'
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels'
import { RibbonTab, PanelType, ChatMessage, FileNode } from './src/types'
import { DEFAULT_CHAT_MESSAGES } from './src/constants'
import { countWords, parseDocumentOutline } from './src/utils'
import { projectService } from './src/services/projects'
import { compilerService } from './src/services/compiler'
import { useDocumentManager, useCompiler, useKeyboardShortcuts } from './src/hooks'
import {
  TitleBar,
  RibbonBar,
  ActivityBar,
  Sidebar,
  Editor,
  CodeEditorHandle,
  PreviewPanel,
  StatusBar,
} from './src/components'

export default function App() {
  const {
    docs,
    activeDoc,
    activeDocIndex,
    openDocIndices,
    openDoc,
    closeDoc,
    updateContent,
    setDocContent,
    insertSnippet,
    openOrCreateDoc,
  } = useDocumentManager()
  const [projectName, setProjectName] = useState('quantum-thesis')
  const { engine, setEngine, compile, pdfBlobUrl, setPdfBlobUrl, isCompiling, compileResult } =
    useCompiler(projectName)

  const [ribbonTab, setRibbonTab] = useState<RibbonTab>('Home')
  const [panel, setPanel] = useState<PanelType>('files')
  const [chat, setChat] = useState<ChatMessage[]>(DEFAULT_CHAT_MESSAGES)
  const [searchQuery, setSearchQuery] = useState('')
  const [isDirty, setIsDirty] = useState(false)
  const [saveStatus, setSaveStatus] = useState('✓ Ready')
  const editorRef = useRef<CodeEditorHandle>(null)

  const outlineTree = useMemo(() => {
    if (!activeDoc?.content) return []
    const isLatex = activeDoc.kind === 'tex'
    return parseDocumentOutline(activeDoc.content, isLatex)
  }, [activeDoc?.content, activeDoc?.kind])

  const words = countWords(activeDoc?.content || '')
  // Sync initial file content on project load / switch
  useEffect(() => {
    let isMounted = true
    const loadInitialFile = async () => {
      if (!activeDoc) return
      try {
        const content = await projectService.readFile(projectName, activeDoc.name)
        if (isMounted) {
          setDocContent(activeDoc.name, content)
          setSaveStatus(`✓ Loaded ${activeDoc.name}`)
          setIsDirty(false)
        }
      } catch {
        // Fallback to local cache
      }
    }
    loadInitialFile()
    return () => {
      isMounted = false
    }
  }, [projectName])

  // Auto-fetch paired PDF when opening or switching to a .tex document
  useEffect(() => {
    let isMounted = true
    const tryFetchPdf = async () => {
      if (!activeDoc || activeDoc.kind !== 'tex') return
      try {
        const resolvedUrl = await compilerService.resolveProjectPdf(projectName, activeDoc.name)
        if (isMounted && resolvedUrl) {
          setPdfBlobUrl(resolvedUrl)
        }
      } catch {
        // Ignore offline check
      }
    }
    tryFetchPdf()
    return () => {
      isMounted = false
    }
  }, [projectName, activeDoc?.name, activeDoc?.kind, setPdfBlobUrl])

  const handleSelectFile = async (file: FileNode) => {
    // Direct opening if a .pdf file is clicked in the file explorer
    if (file.name.toLowerCase().endsWith('.pdf') || (file.kind as string) === 'pdf') {
      const pdfUrl = `${compilerService.getDownloadPdfUrl(projectName, file.name)}?t=${Date.now()}`
      setPdfBlobUrl(pdfUrl)
      setSaveStatus(`✓ Viewing PDF: ${file.name}`)
      return
    }

    const kind = file.kind === 'md' ? 'md' : 'tex'
    openOrCreateDoc(file.name, kind)
    setSaveStatus(`Loading ${file.name}...`)
    try {
      const content = await projectService.readFile(projectName, file.path)
      setDocContent(file.name, content)
      setSaveStatus(`✓ Loaded ${file.name}`)
      setIsDirty(false)
    } catch (err) {
      console.warn(`Could not fetch ${file.name} from backend, keeping local version:`, err)
      setSaveStatus(`⚠️ Offline mode: ${file.name}`)
    }
  }

  const handleContentChange = (content: string) => {
    updateContent(content)
    setIsDirty(true)
    setSaveStatus('● Unsaved changes (Ctrl+S to save)')
  }

  const handleSelectSearchResult = async (filePath: string, lineNumber: number) => {
    const fileName = filePath.split('/').pop() || filePath
    const kind = fileName.endsWith('.md') ? 'md' : 'tex'
    openOrCreateDoc(fileName, kind)

    try {
      const content = await projectService.readFile(projectName, filePath)
      setDocContent(fileName, content)
      setSaveStatus(`✓ Jumped to ${fileName}:${lineNumber}`)
    } catch {
      // ignore load error
    }

    setTimeout(() => {
      editorRef.current?.jumpToLine(lineNumber)
    }, 100)
  }

  const handleSave = async () => {
    if (!activeDoc) return
    setSaveStatus(`Saving ${activeDoc.name}...`)
    try {
      await projectService.saveFile(projectName, activeDoc.name, activeDoc.content)
      setIsDirty(false)
      setSaveStatus(`✓ Saved ${activeDoc.name}`)
      setTimeout(() => {
        setSaveStatus('✓ All files saved')
      }, 3000)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error'
      setSaveStatus(`✗ Save failed: ${msg}`)
    }
  }

  const handleCompile = async () => {
    if (!activeDoc) return
    setSaveStatus(`⚙️ Compiling ${activeDoc.name} with ${engine}...`)
    // Auto-save before compile
    try {
      await projectService.saveFile(projectName, activeDoc.name, activeDoc.content)
      setIsDirty(false)
    } catch {
      // ignore save failure
    }

    const res = await compile(activeDoc.name)
    if (res.success) {
      setSaveStatus(`✓ Compiled in ${res.durationMs || 0}ms · PDF Ready`)
    } else {
      const errDetail = res.errors?.[0]?.message || 'Compilation error'
      setSaveStatus(`✗ Compile failed: ${errDetail}`)
    }
  }

  const handleRibbonSnippet = async (label: string) => {
    if (label === 'Save') {
      await handleSave()
      return
    }
    if (label === 'Copy') {
      if (activeDoc?.content) {
        await navigator.clipboard.writeText(activeDoc.content)
        setSaveStatus('✓ Copied document to clipboard')
      }
      return
    }
    if (label === 'Paste') {
      try {
        const text = await navigator.clipboard.readText()
        if (text && activeDoc) {
          handleContentChange(`${activeDoc.content}\n${text}`)
          setSaveStatus('✓ Pasted from clipboard')
        }
      } catch {
        // Fallback if clipboard permission denied
      }
    }
    insertSnippet(label)
  }

  // Ribbon Home Action Handlers
  const handleClipboardAction = async (action: 'copy' | 'cut' | 'paste') => {
    if (action === 'copy') {
      const sel = editorRef.current?.getSelectedText() || activeDoc?.content || ''
      if (sel) {
        await navigator.clipboard.writeText(sel)
        setSaveStatus('✓ Copied to clipboard')
      }
    } else if (action === 'cut') {
      const sel = editorRef.current?.getSelectedText() || ''
      if (sel) {
        await navigator.clipboard.writeText(sel)
        editorRef.current?.wrapSelection('', '', '')
        setSaveStatus('✓ Cut to clipboard')
      }
    } else if (action === 'paste') {
      try {
        const text = await navigator.clipboard.readText()
        if (text) {
          editorRef.current?.wrapSelection('', '', text)
          setSaveStatus('✓ Pasted from clipboard')
        }
      } catch {
        // Fallback
      }
    }
  }

  const handleFormatAction = (type: 'bold' | 'italic' | 'quote' | 'superscript' | 'subscript') => {
    const isLatex = activeDoc?.kind === 'tex'
    if (type === 'bold') {
      isLatex
        ? editorRef.current?.wrapSelection('\\textbf{', '}', 'teks tebal')
        : editorRef.current?.wrapSelection('**', '**', 'teks tebal')
    } else if (type === 'italic') {
      isLatex
        ? editorRef.current?.wrapSelection('\\textit{', '}', 'teks miring')
        : editorRef.current?.wrapSelection('*', '*', 'teks miring')
    } else if (type === 'quote') {
      isLatex
        ? editorRef.current?.wrapSelection('\\textquotedblleft{}', '\\textquotedblright{}', 'kutipan')
        : editorRef.current?.wrapSelection('"', '"', 'kutipan')
    } else if (type === 'superscript') {
      isLatex
        ? editorRef.current?.wrapSelection('^{', '}', '2')
        : editorRef.current?.wrapSelection('^', '^', '2')
    } else if (type === 'subscript') {
      isLatex
        ? editorRef.current?.wrapSelection('_{', '}', '1')
        : editorRef.current?.wrapSelection('~', '~', '1')
    }
  }

  const handleAlignAction = (type: 'left' | 'center' | 'right' | 'justify') => {
    const isLatex = activeDoc?.kind === 'tex'
    if (isLatex) {
      if (type === 'center') {
        editorRef.current?.wrapSelection('\\begin{center}\n', '\n\\end{center}', 'Teks Rata Tengah')
      } else if (type === 'left') {
        editorRef.current?.wrapSelection('\\begin{flushleft}\n', '\n\\end{flushleft}', 'Teks Rata Kiri')
      } else if (type === 'right') {
        editorRef.current?.wrapSelection('\\begin{flushright}\n', '\n\\end{flushright}', 'Teks Rata Kanan')
      }
    }
  }

  const handleStructureAction = (type: 'heading1' | 'heading2' | 'numbering' | 'bullet' | 'line') => {
    const isLatex = activeDoc?.kind === 'tex'
    if (type === 'heading1') {
      isLatex
        ? editorRef.current?.wrapSelection('\\section{', '}\n', 'Judul Bagian')
        : editorRef.current?.wrapSelection('# ', '\n', 'Judul Bagian')
    } else if (type === 'heading2') {
      isLatex
        ? editorRef.current?.wrapSelection('\\subsection{', '}\n', 'Subjudul')
        : editorRef.current?.wrapSelection('## ', '\n', 'Subjudul')
    } else if (type === 'numbering') {
      isLatex
        ? editorRef.current?.wrapSelection('\\begin{enumerate}\n  \\item ', '\n\\end{enumerate}', 'Poin nomor')
        : editorRef.current?.wrapSelection('1. ', '\n', 'Poin nomor')
    } else if (type === 'bullet') {
      isLatex
        ? editorRef.current?.wrapSelection('\\begin{itemize}\n  \\item ', '\n\\end{itemize}', 'Poin daftar')
        : editorRef.current?.wrapSelection('- ', '\n', 'Poin daftar')
    } else if (type === 'line') {
      isLatex
        ? editorRef.current?.wrapSelection('\n\\hrule\n', '', '')
        : editorRef.current?.wrapSelection('\n---\n', '', '')
    }
  }

  const handlePageAction = (type: 'break' | 'next' | 'preview') => {
    const isLatex = activeDoc?.kind === 'tex'
    if (type === 'break') {
      isLatex
        ? editorRef.current?.wrapSelection('\n\\newpage\n', '', '')
        : editorRef.current?.wrapSelection('\n\n<div style="page-break-after: always;"></div>\n\n', '', '')
    } else if (type === 'next') {
      isLatex
        ? editorRef.current?.wrapSelection('\n\\clearpage\n', '', '')
        : editorRef.current?.wrapSelection('\n\n---\n\n', '', '')
    } else if (type === 'preview') {
      setSaveStatus('Preview refreshed')
    }
  }

  const handleAskAI = (text: string) => {
    if (!text.trim()) return
    const t = text.toLowerCase()
    const response =
      t.includes('rumus') || t.includes('equation')
        ? {
            text: 'Berikut rumus master equation Lindblad:',
            code:
              activeDoc?.kind === 'tex'
                ? '$\\dot{\\rho} = -i[H,\\rho] + \\sum_k \\gamma_k L_k \\rho L_k^\\dagger$'
                : '$\\dot{\\rho} = -i[H,\\rho]$',
          }
        : t.includes('sitasi') || t.includes('cite')
        ? {
            text: 'Referensi relevan: Engel et al. (2007), Nature 446.',
            code: activeDoc?.kind === 'tex' ? '\\cite{engel2007}' : '[@engel2007]',
          }
        : t.includes('ringkas') || t.includes('summar')
        ? {
            text: `Ringkasan: dokumen "${activeDoc?.name || 'Dokumen'}" berisi ${outlineTree.length} bagian utama dengan ${words} kata, membahas koherensi kuantum pada sistem biologis.`,
          }
        : {
            text: 'Saran perbaikan kalimat akademik:',
            code: 'Recent evidence indicates that quantum coherence persists in photosynthetic complexes.',
          }

    setChat((prev) => [...prev, { role: 'user', text }, { role: 'ai', ...response }])
  }

  useKeyboardShortcuts({
    onSave: handleSave,
    onCompile: () => {
      compile()
    },
  })

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {/* Title bar */}
      <TitleBar />

      {/* Ribbon */}
      <RibbonBar
        currentTab={ribbonTab}
        isLatex={activeDoc?.kind === 'tex'}
        onSelectTab={setRibbonTab}
        onInsertSnippet={handleRibbonSnippet}
        engine={engine}
        onChangeEngine={setEngine}
        onCompile={handleCompile}
        onInsertCodeSnippet={(code) => editorRef.current?.wrapSelection('', '', code)}
        onClipboardAction={handleClipboardAction}
        onFormatAction={handleFormatAction}
        onAlignAction={handleAlignAction}
        onStructureAction={handleStructureAction}
        onPageAction={handlePageAction}
      />

      <div className="flex flex-1 min-h-0">
        {/* Activity bar */}
        <ActivityBar activePanel={panel} onSelectPanel={setPanel} />

        {/* Resizable 3-panel layout */}
        <PanelGroup direction="horizontal" className="flex-1 h-full min-h-0">
          {/* Column 1: Sidebar */}
          <Panel id="sidebar-panel" defaultSize={20} minSize={15} maxSize={40} className="min-w-0 h-full">
            <Sidebar
              panel={panel}
              docs={docs}
              activeDocIndex={activeDocIndex}
              outlineTree={outlineTree}
              onNavigateOutline={(line) => editorRef.current?.jumpToLine(line)}
              chat={chat}
              searchQuery={searchQuery}
              projectName={projectName}
              onSelectProject={setProjectName}
              onSelectFile={handleSelectFile}
              onSelectDoc={openDoc}
              onSendMessage={handleAskAI}
              onInsertCodeSnippet={(code) => updateContent(`${activeDoc?.content || ''}\n${code}`)}
              onChangeSearch={setSearchQuery}
              onSelectSearchResult={handleSelectSearchResult}
            />
          </Panel>

          <PanelResizeHandle className="w-1 bg-stone-200 hover:bg-indigo-500 transition-colors cursor-col-resize active:bg-indigo-600 focus:outline-none" />

          {/* Column 2: Editor Teks */}
          <Panel id="editor-panel" defaultSize={48} minSize={30} className="min-w-0 h-full">
            <Editor
              ref={editorRef}
              docs={docs}
              openDocIndices={openDocIndices}
              activeDocIndex={activeDocIndex}
              onSelectTab={openDoc}
              onCloseTab={closeDoc}
              isDirty={isDirty}
              onSave={handleSave}
              onChangeContent={handleContentChange}
            />
          </Panel>

          <PanelResizeHandle className="w-1 bg-stone-200 hover:bg-indigo-500 transition-colors cursor-col-resize active:bg-indigo-600 focus:outline-none" />

          {/* Column 3: Preview PDF */}
          <Panel id="preview-panel" defaultSize={32} minSize={20} className="min-w-0 h-full">
            {activeDoc ? (
              <PreviewPanel
                doc={activeDoc}
                pdfBlobUrl={pdfBlobUrl}
                usePdfViewer={Boolean(pdfBlobUrl && activeDoc.kind === 'tex')}
                onCompile={handleCompile}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-[#525659] text-stone-300 text-xs font-mono">
                Tidak ada dokumen aktif
              </div>
            )}
          </Panel>
        </PanelGroup>
      </div>

      {/* Status bar */}
      <StatusBar wordCount={words} docKind={activeDoc?.kind || 'tex'} statusMessage={saveStatus} />
    </div>
  )
}
