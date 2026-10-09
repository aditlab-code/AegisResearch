import React from 'react'
import { Doc, PanelType, ChatMessage } from '../../types'
import { FileTree } from './FileTree'
import { OutlineView } from './OutlineView'
import { AIAssistantPanel } from './AIAssistantPanel'
import { SearchPanel } from './SearchPanel'

export interface SidebarProps {
  panel: PanelType
  docs: Doc[]
  activeDocIndex: number
  outlineItems: string[]
  chat: ChatMessage[]
  projectName?: string
  searchQuery?: string
  onSelectDoc: (index: number) => void
  onSendMessage: (text: string) => void
  onInsertCodeSnippet: (code: string) => void
  onChangeSearch?: (val: string) => void
}

export const Sidebar: React.FC<SidebarProps> = ({
  panel,
  docs,
  activeDocIndex,
  outlineItems,
  chat,
  projectName,
  searchQuery,
  onSelectDoc,
  onSendMessage,
  onInsertCodeSnippet,
  onChangeSearch,
}) => {
  return (
    <aside className="w-72 bg-stone-50 border-r border-stone-200 p-3 text-sm shrink-0 overflow-auto">
      <div className="text-[11px] uppercase tracking-wider text-stone-400 font-semibold mb-2">
        {panel === 'ai' ? 'AI Assistant' : panel}
      </div>
      {panel === 'files' && (
        <FileTree
          docs={docs}
          activeDocIndex={activeDocIndex}
          projectName={projectName}
          onSelectDoc={onSelectDoc}
        />
      )}
      {panel === 'outline' && <OutlineView outlineItems={outlineItems} />}
      {panel === 'ai' && (
        <AIAssistantPanel
          chat={chat}
          onSendMessage={onSendMessage}
          onInsertCodeSnippet={onInsertCodeSnippet}
        />
      )}
      {panel === 'search' && (
        <SearchPanel value={searchQuery} onChange={onChangeSearch} />
      )}
    </aside>
  )
}
