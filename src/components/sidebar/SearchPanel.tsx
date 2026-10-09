import React, { useState, useEffect, useCallback } from 'react'
import { Search, X, CaseSensitive, Loader2, ChevronsUpDown, ChevronsDownUp } from 'lucide-react'
import { SearchFileResult, SearchMatch } from '../../types'
import { searchService } from '../../services'
import { SearchTreeItem } from './SearchTreeItem'

export interface SearchPanelProps {
  value?: string
  projectName?: string
  onChange?: (val: string) => void
  onSelectMatch?: (filePath: string, lineNumber: number) => void
}

export const SearchPanel: React.FC<SearchPanelProps> = ({
  value = '',
  projectName = 'quantum-thesis',
  onChange,
  onSelectMatch,
}) => {
  const [query, setQuery] = useState(value)
  const [caseSensitive, setCaseSensitive] = useState(false)
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<SearchFileResult[]>([])
  const [totalMatches, setTotalMatches] = useState(0)
  const [expandedFiles, setExpandedFiles] = useState<Set<string>>(new Set())

  const handleSearch = useCallback(
    async (q: string, cs: boolean) => {
      const stripped = q.trim()
      if (stripped.length < 5) {
        setResults([])
        setTotalMatches(0)
        setExpandedFiles(new Set())
        return
      }

      setLoading(true)
      try {
        const data = await searchService.searchProject(projectName, stripped, cs)
        setResults(data.results || [])
        setTotalMatches(data.totalMatches || 0)
        // Auto-expand all result files
        const allPaths = new Set<string>((data.results || []).map((r) => r.filePath))
        setExpandedFiles(allPaths)
      } catch (err) {
        console.warn('Search error:', err)
        setResults([])
        setTotalMatches(0)
      } finally {
        setLoading(false)
      }
    },
    [projectName],
  )

  // Debounced search on query or caseSensitive change
  useEffect(() => {
    const timer = setTimeout(() => {
      handleSearch(query, caseSensitive)
    }, 300)
    return () => clearTimeout(timer)
  }, [query, caseSensitive, handleSearch])

  const handleInputChange = (newVal: string) => {
    setQuery(newVal)
    onChange?.(newVal)
  }

  const toggleFile = (path: string) => {
    setExpandedFiles((prev) => {
      const next = new Set(prev)
      if (next.has(path)) {
        next.delete(path)
      } else {
        next.add(path)
      }
      return next
    })
  }

  const expandAll = () => {
    setExpandedFiles(new Set(results.map((r) => r.filePath)))
  }

  const collapseAll = () => {
    setExpandedFiles(new Set())
  }

  return (
    <div className="flex flex-col gap-2.5">
      {/* Search Input Box */}
      <div className="flex flex-col gap-1.5">
        <div className="relative flex items-center">
          <Search className="size-3.5 text-stone-400 absolute left-2.5 pointer-events-none" />
          <input
            type="text"
            value={query}
            onChange={(e) => handleInputChange(e.target.value)}
            placeholder="Cari kata (min. 5 huruf)..."
            className="w-full border border-stone-300 rounded pl-8 pr-14 py-1.5 bg-white text-xs text-stone-800 placeholder-stone-400 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-mono"
          />

          <div className="absolute right-1.5 flex items-center gap-0.5">
            <button
              type="button"
              onClick={() => setCaseSensitive(!caseSensitive)}
              title={caseSensitive ? 'Match Case (Aktif)' : 'Match Case (Nonaktif)'}
              className={`p-1 rounded text-xs transition-colors ${
                caseSensitive
                  ? 'bg-indigo-100 text-indigo-700'
                  : 'text-stone-400 hover:text-stone-700 hover:bg-stone-100'
              }`}
            >
              <CaseSensitive className="size-3.5" />
            </button>

            {query && (
              <button
                type="button"
                onClick={() => handleInputChange('')}
                title="Hapus pencarian"
                className="p-1 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Validation hint if query < 5 chars */}
        {query.trim().length > 0 && query.trim().length < 5 && (
          <div className="text-[10px] text-amber-600 bg-amber-50 border border-amber-200 px-2 py-1 rounded">
            Ketik minimal {5 - query.trim().length} karakter lagi untuk mencari...
          </div>
        )}
      </div>

      {/* Results Header Toolbar */}
      {query.trim().length >= 5 && (
        <div className="flex items-center justify-between text-xs pb-1 border-b border-stone-200 text-stone-500">
          <span>
            {loading ? (
              <span className="flex items-center gap-1.5">
                <Loader2 className="size-3 animate-spin text-indigo-600" />
                Mencari...
              </span>
            ) : (
              <span>
                <strong>{totalMatches}</strong> hasil di <strong>{results.length}</strong> file
              </span>
            )}
          </span>

          {results.length > 0 && (
            <div className="flex items-center gap-0.5">
              <button
                type="button"
                onClick={expandAll}
                title="Expand Semua"
                className="p-0.5 text-stone-400 hover:text-stone-700 rounded hover:bg-stone-200"
              >
                <ChevronsUpDown className="size-3" />
              </button>
              <button
                type="button"
                onClick={collapseAll}
                title="Collapse Semua"
                className="p-0.5 text-stone-400 hover:text-stone-700 rounded hover:bg-stone-200"
              >
                <ChevronsDownUp className="size-3" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Hierarchical Results Tree */}
      {results.length > 0 ? (
        <div className="flex flex-col py-0.5 overflow-y-auto max-h-[calc(100vh-220px)]">
          {results.map((fileRes) => (
            <SearchTreeItem
              key={fileRes.filePath}
              fileResult={fileRes}
              isExpanded={expandedFiles.has(fileRes.filePath)}
              query={query}
              onToggle={() => toggleFile(fileRes.filePath)}
              onSelectMatch={(filePath, match) => {
                onSelectMatch?.(filePath, match.lineNumber)
              }}
            />
          ))}
        </div>
      ) : (
        query.trim().length >= 5 &&
        !loading && (
          <div className="text-center py-6 text-stone-400 text-xs italic">
            Tidak ditemukan kecocokan untuk "{query}".
          </div>
        )
      )}
    </div>
  )
}
