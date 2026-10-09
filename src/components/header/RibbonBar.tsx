import React from 'react'
import { Play } from 'lucide-react'
import { RibbonTab, EngineType } from '../../types'
import { RIBBONS } from '../../constants'
import { HomeRibbonGroup } from './HomeRibbonGroup'
import { InsertRibbonGroup } from './InsertRibbonGroup'
import { ReferencesRibbonGroup } from './ReferencesRibbonGroup'
import { ReviewRibbonGroup } from './ReviewRibbonGroup'
import { BibEntry, ScannedLabel } from '../../utils'

export interface RibbonBarProps {
  currentTab: RibbonTab
  isLatex?: boolean
  onSelectTab: (tab: RibbonTab) => void
  onInsertSnippet: (label: string) => void
  onCompile?: () => void
  engine?: EngineType
  onChangeEngine?: (engine: EngineType) => void
  onInsertCodeSnippet?: (code: string) => void

  // Home Ribbon sub-panel action handlers
  onClipboardAction?: (action: 'copy' | 'cut' | 'paste') => void
  onFormatAction?: (type: 'bold' | 'italic' | 'quote' | 'superscript' | 'subscript') => void
  onAlignAction?: (type: 'left' | 'center' | 'right' | 'justify') => void
  onStructureAction?: (type: 'heading1' | 'heading2' | 'numbering' | 'bullet' | 'line') => void
  onSelectHeadingStyle?: (styleCode: string) => void
  onPageAction?: (type: 'break' | 'next' | 'preview') => void

  // References Ribbon props
  bibEntries?: BibEntry[]
  scannedLabels?: ScannedLabel[]
  onInsertCite?: (key: string) => void
  onInsertStyle?: (style: 'apa' | 'ieee') => void
  onSaveBibEntries?: (entries: BibEntry[]) => void
  onInsertRef?: (refCode: string) => void
  onInsertTocCode?: (code: string) => void
  onInsertComment?: (code: string) => void
  onOpenReviewPanel?: () => void
  onOpenGitPanel?: () => void
}

export const RibbonBar: React.FC<RibbonBarProps> = ({
  currentTab,
  isLatex = true,
  onSelectTab,
  onInsertSnippet,
  onCompile,
  engine = 'pdfLaTeX',
  onChangeEngine,
  onInsertCodeSnippet = () => {},
  onClipboardAction = () => {},
  onFormatAction = () => {},
  onAlignAction = () => {},
  onStructureAction = () => {},
  onSelectHeadingStyle = () => {},
  onPageAction = () => {},
  bibEntries = [],
  scannedLabels = [],
  onInsertCite = () => {},
  onInsertStyle = () => {},
  onSaveBibEntries = () => {},
  onInsertRef = () => {},
  onInsertTocCode = () => {},
  onInsertComment = () => {},
  onOpenReviewPanel = () => {},
  onOpenGitPanel = () => {},
}) => {
  const tabs = Object.keys(RIBBONS) as RibbonTab[]

  return (
    <div className="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 shrink-0 relative z-30">
      {/* Ribbon Tabs Header */}
      <div className="flex gap-1 px-4 pt-1 text-sm bg-zinc-100/70 dark:bg-zinc-950/60 border-b border-zinc-200 dark:border-zinc-800">
        {tabs.map((tab) => {
          const isActive = currentTab === tab
          return (
            <button
              key={tab}
              onClick={() => onSelectTab(tab)}
              className={`px-3 py-1.5 border-b-2 text-xs transition-colors ${
                isActive
                  ? 'border-[#4078f2] dark:border-[#61afef] text-[#4078f2] dark:text-[#61afef] font-semibold bg-white dark:bg-zinc-900'
                  : 'border-transparent text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
              }`}
            >
              {tab}
            </button>
          )
        })}
      </div>

      {/* Ribbon Tab Content Toolbar */}
      <div className="flex items-center gap-1 px-4 bg-white dark:bg-zinc-900 overflow-visible h-[68px] shrink-0 text-zinc-700 dark:text-zinc-200">
        {currentTab === 'Home' ? (
          <HomeRibbonGroup
            isLatex={isLatex}
            onClipboardAction={onClipboardAction}
            onFormatAction={onFormatAction}
            onAlignAction={onAlignAction}
            onStructureAction={onStructureAction}
            onSelectHeadingStyle={onSelectHeadingStyle}
            onPageAction={onPageAction}
          />
        ) : currentTab === 'Insert' ? (
          <InsertRibbonGroup isLatex={isLatex} onInsertCodeSnippet={onInsertCodeSnippet} />
        ) : currentTab === 'References' ? (
          <ReferencesRibbonGroup
            entries={bibEntries}
            scannedLabels={scannedLabels}
            onInsertCite={onInsertCite}
            onInsertStyle={onInsertStyle}
            onSaveBibEntries={onSaveBibEntries}
            onInsertRef={onInsertRef}
            onInsertTocCode={onInsertTocCode}
          />
        ) : (
          <ReviewRibbonGroup
            isLatex={isLatex}
            onInsertComment={onInsertComment}
            onOpenReviewPanel={onOpenReviewPanel}
            onOpenGitPanel={onOpenGitPanel}
          />
        )}

        {/* Compiler Action Group on Right */}
        <div className="ml-auto flex items-center gap-2 pl-4 border-l border-zinc-200 dark:border-zinc-800 h-full shrink-0">
          <span className="text-xs text-zinc-500 dark:text-zinc-400">Compiler</span>
          <select
            value={engine}
            onChange={(e) => onChangeEngine?.(e.target.value as EngineType)}
            className="text-xs border border-zinc-300 dark:border-zinc-700 rounded px-2 py-1 bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 focus:outline-none focus:border-[#4078f2] dark:focus:border-[#61afef] cursor-pointer"
          >
            <option value="pdfLaTeX">pdfLaTeX</option>
            <option value="XeLaTeX">XeLaTeX</option>
            <option value="Pandoc">Pandoc</option>
          </select>
          <button
            type="button"
            onClick={onCompile}
            className="bg-[#4078f2] hover:bg-[#3362c4] dark:bg-[#61afef] dark:hover:bg-[#528bff] text-white dark:text-zinc-950 text-xs px-3.5 py-1.5 rounded font-semibold flex items-center gap-1.5 shadow-sm transition-colors"
          >
            <Play className="size-3.5 fill-current" />
            Compile
          </button>
        </div>
      </div>
    </div>
  )
}
