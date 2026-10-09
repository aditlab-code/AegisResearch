import React from 'react'
import { ChevronRight, ChevronDown, FileText, FileCode, Replace } from 'lucide-react'
import { SearchFileResult, SearchMatch } from '../../types'

export interface SearchTreeItemProps {
  fileResult: SearchFileResult
  isExpanded: boolean
  query: string
  canReplace?: boolean
  onToggle: () => void
  onSelectMatch: (filePath: string, match: SearchMatch) => void
  onReplaceMatch?: (filePath: string, match: SearchMatch) => void
}

function highlightMatchText(text: string, query: string) {
  if (!query) return text
  try {
    const parts = text.split(new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'))
    return parts.map((part, i) =>
      part.toLowerCase() === query.toLowerCase() ? (
        <span key={i} className="bg-amber-200 dark:bg-amber-900/60 text-stone-900 dark:text-amber-200 font-bold px-0.5 rounded">
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
  canReplace = false,
  onToggle,
  onSelectMatch,
  onReplaceMatch,
}) => {
  const isTex = fileResult.kind === 'tex'

  return (
    <div className="flex flex-col select-none mb-1">
      {/* File Header */}
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between py-1 px-1.5 rounded hover:bg-stone-200/70 dark:hover:bg-zinc-800 transition-colors text-left group"
      >
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="text-stone-400 group-hover:text-stone-600 dark:group-hover:text-zinc-300 shrink-0">
            {isExpanded ? <ChevronDown className="size-3.5" /> : <ChevronRight className="size-3.5" />}
          </span>
          {isTex ? (
            <FileCode className="size-3.5 text-indigo-500 shrink-0" />
          ) : (
            <FileText className="size-3.5 text-emerald-600 shrink-0" />
          )}
          <span className="text-xs font-medium text-stone-800 dark:text-zinc-200 truncate" title={fileResult.filePath}>
            {fileResult.fileName}
          </span>
        </div>

        <span className="text-[10px] font-mono bg-stone-200 dark:bg-zinc-800 text-stone-600 dark:text-zinc-400 px-1.5 py-0.2 rounded-full shrink-0">
          {fileResult.matchCount}
        </span>
      </button>

      {/* Matches List */}
      {isExpanded && (
        <div className="flex flex-col pl-6 pr-1 py-0.5 space-y-0.5">
          {fileResult.matches.map((m, idx) => (
            <div
              key={`${fileResult.filePath}-${m.lineNumber}-${idx}`}
              onClick={() => onSelectMatch(fileResult.filePath, m)}
              className="w-full flex items-center justify-between py-0.5 px-1.5 rounded text-left text-xs hover:bg-indigo-50 dark:hover:bg-zinc-800/80 text-stone-600 dark:text-zinc-300 hover:text-stone-900 dark:hover:text-white transition-colors group cursor-pointer"
            >
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <span className="text-[10px] font-mono text-stone-400 group-hover:text-indigo-600 dark:group-hover:text-blue-400 shrink-0 w-6 text-right">
                  {m.lineNumber}:
                </span>
                <span className="truncate text-[11px] font-mono leading-tight flex-1">
                  {highlightMatchText(m.lineText, query)}
                </span>
              </div>

              {canReplace && onReplaceMatch && (
                <button
                  type="button"
                  title="Replace this match"
                  onClick={(e) => {
                    e.stopPropagation()
                    onReplaceMatch(fileResult.filePath, m)
                  }}
                  className="opacity-0 group-hover:opacity-100 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400 p-0.5 rounded transition-opacity shrink-0 ml-1"
                >
                  <Replace className="size-3" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
