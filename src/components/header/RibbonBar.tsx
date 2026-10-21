import React from "react";
import { Play } from "lucide-react";
import { RibbonTab, EngineType } from "../../types";
import type { OutlineNode } from "../../types";
import { RIBBONS } from "../../constants";
import { HomeRibbonGroup } from "./HomeRibbonGroup";
import { InsertRibbonGroup } from "./InsertRibbonGroup";
import { ReferencesRibbonGroup } from "./ReferencesRibbonGroup";
import { ReviewRibbonGroup } from "./ReviewRibbonGroup";
import { DataRibbonGroup } from "./DataRibbonGroup";
import { AnalysisType, TableStyle } from "../../types/stats";
import { BibEntry, ScannedLabel, BibliographyStyleChoice } from "../../utils";

export interface RibbonBarProps {
  currentTab: RibbonTab;
  isLatex?: boolean;
  onSelectTab: (tab: RibbonTab) => void;
  onInsertSnippet: (label: string) => void;
  onCompile?: () => void;
  onSyncToPdf?: () => void;
  engine?: EngineType;
  onChangeEngine?: (engine: EngineType) => void;
  onInsertCodeSnippet?: (code: string) => void;

  // Home Ribbon sub-panel action handlers
  onClipboardAction?: (action: "copy" | "cut" | "paste") => void;
  onFormatAction?: (
    type: "bold" | "italic" | "quote" | "superscript" | "subscript",
  ) => void;
  onAlignAction?: (type: "left" | "center" | "right" | "justify") => void;
  onStructureAction?: (
    type: "heading1" | "heading2" | "numbering" | "bullet" | "line",
  ) => void;
  onSelectHeadingStyle?: (styleCode: string) => void;
  onPageAction?: (type: "break" | "next" | "preview") => void;

  // References Ribbon props
  bibEntries?: BibEntry[];
  outline?: OutlineNode[];
  scannedLabels?: ScannedLabel[];
  onInsertCite?: (key: string) => void;
  onInsertStyle?: (style: BibliographyStyleChoice) => void;
  onSaveBibEntries?: (entries: BibEntry[]) => void;
  onInsertRef?: (refCode: string) => void;
  onInsertTocCode?: (code: string) => void;
  onOpenBibliometrics?: () => void;
  onInsertComment?: (code: string) => void;
  onOpenReviewPanel?: () => void;
  onOpenGitPanel?: () => void;

  // Data Ribbon props
  onOpenAnalysis?: (type: AnalysisType) => void;
  onOpenDataset?: () => void;
  onOpenGuide?: () => void;
  onOpenLatexOutputModal?: () => void;
  selectedTableStyle?: TableStyle;
  hasResults?: boolean;
}
export const RibbonBar: React.FC<RibbonBarProps> = ({
  currentTab,
  isLatex = true,
  onSelectTab,
  onInsertSnippet,
  onCompile,
  onSyncToPdf,
  engine = "pdfLaTeX",
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
  outline = [],
  onInsertCite = () => {},
  onInsertStyle = () => {},
  onSaveBibEntries = () => {},
  onInsertRef = () => {},
  onInsertTocCode = () => {},
  onOpenBibliometrics = () => {},
  onInsertComment = () => {},
  onOpenReviewPanel = () => {},
  onOpenGitPanel = () => {},
  onOpenAnalysis = () => {},
  onOpenDataset = () => {},
  onOpenGuide = () => {},
  onOpenLatexOutputModal = () => {},
  selectedTableStyle = "apa",
  hasResults = false,
}) => {
  const tabs = Object.keys(RIBBONS) as RibbonTab[];

  return (
    <div className="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 shrink-0 relative z-30">
      {/* Ribbon Tabs Header */}
      <div className="flex gap-1 px-4 pt-1 text-sm bg-zinc-100/70 dark:bg-zinc-950/60 border-b border-zinc-200 dark:border-zinc-800">
        {tabs.map((tab) => {
          const isActive = currentTab === tab;
          return (
            <button
              key={tab}
              onClick={() => onSelectTab(tab)}
              className={`px-3 py-1.5 border-b-2 text-xs transition-colors ${
                isActive
                  ? "border-[#4078f2] dark:border-[#61afef] text-[#4078f2] dark:text-[#61afef] font-semibold bg-white dark:bg-zinc-900"
                  : "border-transparent text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
              }`}
            >
              {tab}
            </button>
          );
        })}
      </div>

      {/* Ribbon Tab Content Toolbar */}
      <div className="flex items-center gap-1 px-4 bg-white dark:bg-zinc-900 overflow-visible h-[68px] shrink-0 text-zinc-700 dark:text-zinc-200">
        {currentTab === "Home" ? (
          <HomeRibbonGroup
            isLatex={isLatex}
            onClipboardAction={onClipboardAction}
            onFormatAction={onFormatAction}
            onAlignAction={onAlignAction}
            onStructureAction={onStructureAction}
            onSelectHeadingStyle={onSelectHeadingStyle}
            onPageAction={onPageAction}
          />
        ) : currentTab === "Insert" ? (
          <InsertRibbonGroup
            isLatex={isLatex}
            onInsertCodeSnippet={onInsertCodeSnippet}
          />
        ) : currentTab === "References" ? (
          <ReferencesRibbonGroup
            isLatex={isLatex}
            outline={outline}
            entries={bibEntries}
            scannedLabels={scannedLabels}
            onInsertCite={onInsertCite}
            onInsertStyle={onInsertStyle}
            onSaveBibEntries={onSaveBibEntries}
            onInsertRef={onInsertRef}
            onInsertTocCode={onInsertTocCode}
            onOpenBibliometrics={onOpenBibliometrics}
          />
        ) : currentTab === "Data" ? (
          <DataRibbonGroup
            onOpenAnalysis={onOpenAnalysis}
            onOpenDataset={onOpenDataset}
            onOpenGuide={onOpenGuide}
            onOpenLatexOutputModal={onOpenLatexOutputModal}
            selectedTableStyle={selectedTableStyle}
            hasResults={hasResults}
          />
        ) : (
          <ReviewRibbonGroup
            onInsertComment={onInsertComment}
            onOpenReviewPanel={onOpenReviewPanel}
            onOpenGitPanel={onOpenGitPanel}
          />
        )}

        {/* Standardized Compiler Action Group on Right */}
        <div className="ml-auto h-full flex flex-col items-center justify-between py-1 px-3 border-l border-zinc-200 dark:border-zinc-800 shrink-0">
          <div className="flex items-center gap-1.5 pt-0.5">
            <select
              value={engine}
              onChange={(e) => onChangeEngine?.(e.target.value as EngineType)}
              title="LaTeX / Markdown Compiler Engine"
              aria-label="Compiler Engine"
              className="text-xs border border-zinc-300 dark:border-zinc-700 rounded px-2 py-1 bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 focus:outline-none focus:border-[#4078f2] dark:focus:border-[#61afef] cursor-pointer"
            >
              <option value="pdfLaTeX">pdfLaTeX</option>
              <option value="XeLaTeX">XeLaTeX</option>
              <option value="Pandoc">Pandoc</option>
            </select>
            <button
              type="button"
              onClick={onCompile}
              title="Compile document (Ctrl+Enter)"
              className="bg-[#4078f2] hover:bg-[#3362c4] dark:bg-[#61afef] dark:hover:bg-[#528bff] text-white dark:text-zinc-950 text-xs px-3 py-1 rounded font-semibold flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
            >
              <Play className="size-3.5 fill-current" />
              <span>Compile</span>
            </button>
          </div>
          <span className="text-[9px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mt-1">
            Compiler
          </span>
        </div>
      </div>
    </div>
  );
};
