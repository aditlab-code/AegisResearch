import React from 'react'
import { PanelType } from '../../types'

export interface ActivityBarProps {
  activePanel: PanelType
  onSelectPanel: (panel: PanelType) => void
}

const PANELS: [PanelType, string][] = [
  ['files', '❐'],
  ['outline', '☰'],
  ['search', '⌕'],
  ['ai', '✦'],
]

export const ActivityBar: React.FC<ActivityBarProps> = ({ activePanel, onSelectPanel }) => {
  return (
    <aside className="w-12 bg-indigo-950 flex flex-col items-center py-2 gap-1 shrink-0">
      {PANELS.map(([panel, icon]) => (
        <button
          key={panel}
          onClick={() => onSelectPanel(panel)}
          className={`size-10 rounded-md text-lg ${
            activePanel === panel ? 'bg-indigo-800 text-white' : 'text-indigo-400 hover:text-white'
          }`}
        >
          {icon}
        </button>
      ))}
    </aside>
  )
}
