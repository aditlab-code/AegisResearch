import React from 'react'
import { Doc, PanelType, ChatMessage, FileNode, OutlineNode } from '../../types'
import { FileTree } from './FileTree'
import { OutlineView } from './OutlineView'
import { AIAssistantPanel } from './AIAssistantPanel'
import { SearchPanel } from './SearchPanel'
import { ReviewNotesPanel } from './ReviewNotesPanel'
import { GitTrackPanel } from './GitTrackPanel'

export interface SidebarProps {
  panel: PanelType
  docs: Doc[]
  activeDocIndex: number
  outlineTree?: OutlineNode[]
  onNavigateOutline?: (lineNumber: number) => void
  chat: ChatMessage[]
  projectName?: string
  searchQuery?: string
  onSelectDoc: (index: number) => void
  onSelectFile?: (file: FileNode) => void
  onSelectProject?: (project: string) => void
  onCreateProject?: (name: string) => Promise<void>
  onSendMessage: (text: string) => void
  onInsertCodeSnippet: (code: string) => void
  onChangeSearch?: (val: string) => void
  onSelectSearchResult?: (filePath: string, lineNumber: number) => void
  activeDocContent?: string
  onJumpToNoteLine?: (line: number) => void
}

export const Sidebar: React.FC<SidebarProps> = ({
  panel,
  docs,
  activeDocIndex,
  outlineTree = [],
  onNavigateOutline,
  chat,
  projectName,
  searchQuery,
  onSelectDoc,
  onSelectFile,
  onSelectProject,
  onCreateProject,
  onSendMessage,
  onInsertCodeSnippet,
  onChangeSearch,
  onSelectSearchResult,
  activeDocContent = '',
  onJumpToNoteLine = () => {},
}) => {
  return (
    <aside className="w-full h-full bg-zinc-50 dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 p-3 text-sm overflow-auto text-zinc-800 dark:text-zinc-200">
      <div className="text-[11px] uppercase tracking-wider text-zinc-400 dark:text-zinc-500 font-semibold mb-2">
        {panel === 'ai'
          ? 'AI Assistant'
          : panel === 'git'
          ? 'Track Changes (Git)'
          : panel === 'review'
          ? 'Review Notes & TODOs'
          : panel}
      </div>
      {panel === 'files' && (
        <FileTree
          docs={docs}
          activeDocIndex={activeDocIndex}
          projectName={projectName}
          onSelectDoc={onSelectDoc}
          onSelectFile={onSelectFile}
          onSelectProject={onSelectProject}
          onCreateProject={onCreateProject}
        />
      )}
      {panel === 'outline' && (
        <OutlineView outlineTree={outlineTree} onNavigate={onNavigateOutline} />
      )}
      {panel === 'ai' && (
        <AIAssistantPanel
          chat={chat}
          onSendMessage={onSendMessage}
          onInsertCodeSnippet={onInsertCodeSnippet}
        />
      )}
      {panel === 'search' && (
        <SearchPanel
          value={searchQuery}
          projectName={projectName}
          onChange={onChangeSearch}
          onSelectMatch={onSelectSearchResult}
        />
      )}
      {panel === 'review' && (
        <ReviewNotesPanel content={activeDocContent} onJumpToLine={onJumpToNoteLine} />
      )}
      {panel === 'git' && (
        <GitTrackPanel
          projectName={projectName || 'quantum-thesis'}
          onSelectFile={(fp) => {
            const found = docs.find((d) => d.name === fp || d.name.endsWith(fp))
            if (found && onSelectFile) {
              onSelectFile({ name: found.name, path: fp, kind: found.kind })
            }
          }}
        />
      )}
    </aside>
  )
}
