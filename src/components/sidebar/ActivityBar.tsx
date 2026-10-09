import React from 'react'
import { Files, ListTree, Search, Sparkles, MessageSquare, GitCompare, type LucideIcon } from 'lucide-react'
import { PanelType } from '../../types'

export interface ActivityBarProps {
  activePanel: PanelType
  onSelectPanel: (panel: PanelType) => void
}

const PANELS: [PanelType, LucideIcon, string][] = [
  ['files', Files, 'Explorer'],
  ['outline', ListTree, 'Outline'],
  ['search', Search, 'Search'],
  ['review', MessageSquare, 'Review Notes & TODOs'],
  ['git', GitCompare, 'Track Changes (Git)'],
  ['ai', Sparkles, 'AI Assistant'],
]

export const ActivityBar: React.FC<ActivityBarProps> = ({ activePanel, onSelectPanel }) => {
  return (
    <aside className="w-12 bg-zinc-900 border-r border-zinc-800 flex flex-col items-center py-2 gap-1 shrink-0 select-none">
      {PANELS.map(([panel, Icon, title]) => {
        const isActive = activePanel === panel
        return (
          <button
            key={panel}
            title={title}
            onClick={() => onSelectPanel(panel)}
            className={`relative size-10 rounded flex items-center justify-center transition-colors ${
              isActive
                ? 'bg-zinc-800 text-white'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
            }`}
          >
            {isActive && (
              <span className="absolute left-0 top-2 bottom-2 w-0.5 bg-blue-500 rounded-r-full" />
            )}
            <Icon className="size-5" />
          </button>
        )
      })}
    </aside>
  )
}
