import React from 'react'
import { RibbonTab, EngineType } from '../../types'
import { RIBBONS } from '../../constants'

export interface RibbonBarProps {
  currentTab: RibbonTab
  onSelectTab: (tab: RibbonTab) => void
  onInsertSnippet: (label: string) => void
  onCompile?: () => void
  engine?: EngineType
  onChangeEngine?: (engine: EngineType) => void
}

export const RibbonBar: React.FC<RibbonBarProps> = ({
  currentTab,
  onSelectTab,
  onInsertSnippet,
  onCompile,
  engine = 'pdfLaTeX',
  onChangeEngine,
}) => {
  const tabs = Object.keys(RIBBONS) as RibbonTab[]

  return (
    <div className="bg-white border-b border-stone-200 shrink-0">
      <div className="flex gap-1 px-4 pt-1 text-sm">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => onSelectTab(tab)}
            className={`px-3 py-1.5 border-b-2 ${
              currentTab === tab
                ? 'border-indigo-600 text-indigo-700 font-medium'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-1 px-4 py-2 bg-stone-50 border-t border-stone-100">
        {RIBBONS[currentTab].map(([label, icon]) => (
          <button
            key={label}
            onClick={() => onInsertSnippet(label)}
            className="flex flex-col items-center w-16 py-1 rounded hover:bg-indigo-50 text-stone-700"
          >
            <span className="font-serif text-lg leading-6">{icon}</span>
            <span className="text-[10px] text-stone-500">{label}</span>
          </button>
        ))}
        <div className="ml-auto flex items-center gap-2">
          <span className="text-xs text-stone-500">Compiler</span>
          <select
            value={engine}
            onChange={(e) => onChangeEngine?.(e.target.value as EngineType)}
            className="text-xs border border-stone-300 rounded px-2 py-1 bg-white"
          >
            <option value="pdfLaTeX">pdfLaTeX</option>
            <option value="XeLaTeX">XeLaTeX</option>
            <option value="Pandoc">Pandoc</option>
          </select>
          <button
            onClick={onCompile}
            className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm px-4 py-1.5 rounded-md font-medium"
          >
            ▶ Compile
          </button>
        </div>
      </div>
    </div>
  )
}
