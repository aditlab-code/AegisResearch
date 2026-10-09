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
    <div className="bg-white border-b border-stone-200 shrink-0 relative z-30">
      {/* Ribbon Tabs Header */}
      <div className="flex gap-1 px-4 pt-1 text-sm bg-stone-50/50">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => onSelectTab(tab)}
            className={`px-3 py-1.5 border-b-2 text-xs transition-colors ${
              currentTab === tab
                ? 'border-indigo-600 text-indigo-700 font-semibold bg-white'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Ribbon Tab Content Toolbar */}
      <div className="flex items-center gap-1 px-4 bg-white border-t border-stone-100 overflow-visible h-[68px] shrink-0">
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
        ) : currentTab === 'Review' ? (
          <ReviewRibbonGroup
            isLatex={isLatex}
            onInsertComment={onInsertComment}
            onOpenReviewPanel={onOpenReviewPanel}
            onOpenGitPanel={onOpenGitPanel}
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
        <div className="ml-auto flex items-center gap-2 pl-4 border-l border-stone-200 h-full shrink-0">
          <span className="text-xs text-stone-500">Compiler</span>
          <select
            value={engine}
            onChange={(e) => onChangeEngine?.(e.target.value as EngineType)}
            className="text-xs border border-stone-300 rounded px-2 py-1 bg-white focus:outline-none focus:border-indigo-500 cursor-pointer"
          >
            <option value="pdfLaTeX">pdfLaTeX</option>
            <option value="XeLaTeX">XeLaTeX</option>
            <option value="Pandoc">Pandoc</option>
          </select>
          <button
            type="button"
            onClick={onCompile}
            className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs px-3.5 py-1.5 rounded-md font-medium flex items-center gap-1.5 shadow-sm transition-colors"
          >
            <Play className="size-3.5 fill-current" />
            Compile
          </button>
        </div>
      </div>
    </div>
  )
}
