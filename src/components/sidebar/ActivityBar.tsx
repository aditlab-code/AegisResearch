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
    <aside className="w-12 bg-indigo-950 flex flex-col items-center py-2 gap-1 shrink-0">
      {PANELS.map(([panel, Icon, title]) => (
        <button
          key={panel}
          title={title}
          onClick={() => onSelectPanel(panel)}
          className={`size-10 rounded-md flex items-center justify-center transition-colors ${
            activePanel === panel ? 'bg-indigo-800 text-white' : 'text-indigo-400 hover:text-white'
          }`}
        >
          <Icon className="size-5" />
        </button>
      ))}
    </aside>
  )
}
