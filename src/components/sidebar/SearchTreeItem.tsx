import React from 'react'
import { ChevronRight, ChevronDown, FileText, FileCode } from 'lucide-react'
import { SearchFileResult, SearchMatch } from '../../types'

export interface SearchTreeItemProps {
  fileResult: SearchFileResult
  isExpanded: boolean
  query: string
  onToggle: () => void
  onSelectMatch: (filePath: string, match: SearchMatch) => void
}

function highlightMatchText(text: string, query: string) {
  if (!query) return text
  try {
    const parts = text.split(new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'))
    return parts.map((part, i) =>
      part.toLowerCase() === query.toLowerCase() ? (
        <span key={i} className="bg-amber-200 text-stone-900 font-bold px-0.5 rounded">
          {part}
        </span>
      ) : (
        part
      ),
    )
  } catch {
    return text
  }
}

export const SearchTreeItem: React.FC<SearchTreeItemProps> = ({
  fileResult,
  isExpanded,
  query,
  onToggle,
  onSelectMatch,
}) => {
  const isTex = fileResult.kind === 'tex'

  return (
    <div className="flex flex-col select-none mb-1">
      {/* File Header */}
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between py-1 px-1.5 rounded hover:bg-stone-200/70 transition-colors text-left group"
      >
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="text-stone-400 group-hover:text-stone-600 shrink-0">
            {isExpanded ? <ChevronDown className="size-3.5" /> : <ChevronRight className="size-3.5" />}
          </span>
          {isTex ? (
            <FileCode className="size-3.5 text-indigo-500 shrink-0" />
          ) : (
            <FileText className="size-3.5 text-emerald-600 shrink-0" />
          )}
          <span className="text-xs font-medium text-stone-800 truncate" title={fileResult.filePath}>
            {fileResult.fileName}
          </span>
        </div>

        <span className="text-[10px] font-mono bg-stone-200 text-stone-600 px-1.5 py-0.2 rounded-full shrink-0">
          {fileResult.matchCount}
        </span>
      </button>

      {/* Matches List */}
      {isExpanded && (
        <div className="flex flex-col pl-6 pr-1 py-0.5 space-y-0.5">
          {fileResult.matches.map((m, idx) => (
            <button
              key={`${fileResult.filePath}-${m.lineNumber}-${idx}`}
              type="button"
              onClick={() => onSelectMatch(fileResult.filePath, m)}
              className="w-full flex items-center gap-2 py-0.5 px-1.5 rounded text-left text-xs hover:bg-indigo-50 text-stone-600 hover:text-stone-900 transition-colors group"
            >
              <span className="text-[10px] font-mono text-stone-400 group-hover:text-indigo-600 shrink-0 w-6 text-right">
                {m.lineNumber}:
              </span>
              <span className="truncate text-[11px] font-mono leading-tight flex-1">
                {highlightMatchText(m.lineText, query)}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
