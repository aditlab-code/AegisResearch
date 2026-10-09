import { useState } from 'react'
import { RibbonTab, PanelType, ChatMessage } from './src/types'
import { DEFAULT_CHAT_MESSAGES } from './src/constants'
import { countWords, extractOutline } from './src/utils'
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
    insertSnippet,
  } = useDocumentManager()

  const { engine, setEngine, compile, pdfBlobUrl } = useCompiler('quantum-thesis')

  const [ribbonTab, setRibbonTab] = useState<RibbonTab>('Home')
  const [panel, setPanel] = useState<PanelType>('files')
  const [chat, setChat] = useState<ChatMessage[]>(DEFAULT_CHAT_MESSAGES)
  const [searchQuery, setSearchQuery] = useState('')

  const outline = extractOutline(activeDoc.content)
  const words = countWords(activeDoc.content)

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
    onSave: () => {
      // Auto-save stub for Tahap 3
    },
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
        onInsertSnippet={insertSnippet}
        engine={engine}
        onChangeEngine={setEngine}
        onCompile={() => compile()}
      />

      <div className="flex flex-1 min-h-0">
        {/* Activity bar */}
        <ActivityBar activePanel={panel} onSelectPanel={setPanel} />

        {/* Sidebar */}
        <Sidebar
          panel={panel}
          docs={docs}
          activeDocIndex={activeDocIndex}
          outlineItems={outline}
          chat={chat}
          searchQuery={searchQuery}
          onSelectDoc={openDoc}
          onSendMessage={handleAskAI}
          onInsertCodeSnippet={(code) => updateContent(`${activeDoc.content}\n${code}`)}
          onChangeSearch={setSearchQuery}
        />

        {/* Editor */}
        <Editor
          docs={docs}
          openDocIndices={openDocIndices}
          activeDocIndex={activeDocIndex}
          onSelectTab={openDoc}
          onCloseTab={closeDoc}
          onChangeContent={updateContent}
        />

        {/* Preview page */}
        <PreviewPanel doc={activeDoc} pdfBlobUrl={pdfBlobUrl} />
      </div>

      {/* Status bar */}
      <StatusBar wordCount={words} docKind={activeDoc.kind} />
    </div>
  )
}
