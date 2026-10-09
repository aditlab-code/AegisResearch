import { useState, useEffect } from 'react'
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels'
import { RibbonTab, PanelType, ChatMessage, FileNode } from './src/types'
import { DEFAULT_CHAT_MESSAGES } from './src/constants'
import { countWords, extractOutline } from './src/utils'
import { projectService } from './src/services/projects'
import { useDocumentManager, useCompiler, useKeyboardShortcuts } from './src/hooks'
import {
  TitleBar,
  RibbonBar,
  ActivityBar,
  Sidebar,
  Editor,
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
  const { engine, setEngine, compile, pdfBlobUrl } = useCompiler(projectName)

  const [ribbonTab, setRibbonTab] = useState<RibbonTab>('Home')
  const [panel, setPanel] = useState<PanelType>('files')
  const [chat, setChat] = useState<ChatMessage[]>(DEFAULT_CHAT_MESSAGES)
  const [searchQuery, setSearchQuery] = useState('')
  const [isDirty, setIsDirty] = useState(false)
  const [saveStatus, setSaveStatus] = useState('✓ Ready')
  const outline = extractOutline(activeDoc.content)
  const words = countWords(activeDoc.content)
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

  const handleSelectFile = async (file: FileNode) => {
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
        if (text) {
          handleContentChange(`${activeDoc.content}\n${text}`)
          setSaveStatus('✓ Pasted from clipboard')
        }
      } catch {
        // Fallback if clipboard permission denied
      }
      return
    }
    insertSnippet(label)
  }

  const handleAskAI = (text: string) => {
    if (!text.trim()) return
    const t = text.toLowerCase()
    const response =
      t.includes('rumus') || t.includes('equation')
        ? {
            text: 'Berikut rumus master equation Lindblad:',
            code:
              activeDoc.kind === 'tex'
                ? '$\\dot{\\rho} = -i[H,\\rho] + \\sum_k \\gamma_k L_k \\rho L_k^\\dagger$'
                : '$\\dot{\\rho} = -i[H,\\rho]$',
          }
        : t.includes('sitasi') || t.includes('cite')
        ? {
            text: 'Referensi relevan: Engel et al. (2007), Nature 446.',
            code: activeDoc.kind === 'tex' ? '\\cite{engel2007}' : '[@engel2007]',
          }
        : t.includes('ringkas') || t.includes('summar')
        ? {
            text: `Ringkasan: dokumen "${activeDoc.name}" berisi ${outline.length} bagian dengan ${words} kata, membahas koherensi kuantum pada sistem biologis.`,
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
        onSelectTab={setRibbonTab}
        onInsertSnippet={handleRibbonSnippet}
        engine={engine}
        onChangeEngine={setEngine}
        onCompile={() => compile()}
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
              outlineItems={outline}
              chat={chat}
              searchQuery={searchQuery}
              projectName={projectName}
              onSelectProject={setProjectName}
              onSelectFile={handleSelectFile}
              onSelectDoc={openDoc}
              onSendMessage={handleAskAI}
              onInsertCodeSnippet={(code) => updateContent(`${activeDoc.content}\n${code}`)}
              onChangeSearch={setSearchQuery}
            />
          </Panel>

          <PanelResizeHandle className="w-1 bg-stone-200 hover:bg-indigo-500 transition-colors cursor-col-resize active:bg-indigo-600 focus:outline-none" />

          {/* Column 2: Editor Teks */}
          <Panel id="editor-panel" defaultSize={48} minSize={30} className="min-w-0 h-full">
            <Editor
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
            <PreviewPanel doc={activeDoc} pdfBlobUrl={pdfBlobUrl} />
          </Panel>
        </PanelGroup>
      </div>

      {/* Status bar */}
      <StatusBar wordCount={words} docKind={activeDoc.kind} statusMessage={saveStatus} />
    </div>
  )
}
