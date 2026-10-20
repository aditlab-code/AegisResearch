import React, { useState, useEffect, useCallback } from "react";
import {
  Search,
  X,
  CaseSensitive,
  Loader2,
  ChevronsUpDown,
  ChevronsDownUp,
  ChevronDown,
  ChevronRight,
  Replace,
  ReplaceAll,
} from "lucide-react";
import { SearchFileResult, SearchMatch } from "../../types";
import { searchService } from "../../services";
import { SearchTreeItem } from "./SearchTreeItem";

export interface SearchPanelProps {
  value?: string;
  projectName?: string;
  onChange?: (val: string) => void;
  onSelectMatch?: (filePath: string, lineNumber: number) => void;
  onRefreshDocs?: () => void;
}

export const SearchPanel: React.FC<SearchPanelProps> = ({
  value = "",
  projectName = "template-thesis",
  onChange,
  onSelectMatch,
  onRefreshDocs,
}) => {
  const [query, setQuery] = useState(value);
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SearchFileResult[]>([]);
  const [totalMatches, setTotalMatches] = useState(0);
  const [expandedFiles, setExpandedFiles] = useState<Set<string>>(new Set());

  // Replace state
  const [isReplaceOpen, setIsReplaceOpen] = useState(false);
  const [replaceQuery, setReplaceQuery] = useState("");
  const [isReplacing, setIsReplacing] = useState(false);
  const [replaceNotice, setReplaceNotice] = useState<string | null>(null);

  const handleSearch = useCallback(
    async (q: string, cs: boolean) => {
      const stripped = q.trim();
      if (stripped.length < 5) {
        setResults([]);
        setTotalMatches(0);
        setExpandedFiles(new Set());
        return;
      }

      setLoading(true);
      try {
        const data = await searchService.searchProject(
          projectName,
          stripped,
          cs,
        );
        setResults(data.results || []);
        setTotalMatches(data.totalMatches || 0);
        // Auto-expand all result files
        const allPaths = new Set<string>(
          (data.results || []).map((r) => r.filePath),
        );
        setExpandedFiles(allPaths);
      } catch (err) {
        console.warn("Search error:", err);
        setResults([]);
        setTotalMatches(0);
      } finally {
        setLoading(false);
      }
    },
    [projectName],
  );

  // Debounced search on query or caseSensitive change
  useEffect(() => {
    const timer = setTimeout(() => {
      handleSearch(query, caseSensitive);
    }, 300);
    return () => clearTimeout(timer);
  }, [query, caseSensitive, handleSearch]);

  const handleInputChange = (newVal: string) => {
    setQuery(newVal);
    onChange?.(newVal);
  };

  const toggleFile = (path: string) => {
    setExpandedFiles((prev) => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  };

  const expandAll = () => {
    setExpandedFiles(new Set(results.map((r) => r.filePath)));
  };

  const collapseAll = () => {
    setExpandedFiles(new Set());
  };

  const handleReplaceSingle = async (filePath: string, match: SearchMatch) => {
    if (!query.trim()) return;
    setIsReplacing(true);
    setReplaceNotice(null);
    try {
      const res = await searchService.replaceMatches(projectName, {
        query: query.trim(),
        replaceWith: replaceQuery,
        caseSensitive,
        filePath,
        lineNumber: match.lineNumber,
      });
      onRefreshDocs?.();
      setReplaceNotice(`Replaced match in ${filePath}`);
      await handleSearch(query, caseSensitive);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error";
      setReplaceNotice(`Replace failed: ${msg}`);
    } finally {
      setIsReplacing(false);
    }
  };

  const handleReplaceAll = async () => {
    if (!query.trim() || totalMatches === 0) return;
    setIsReplacing(true);
    setReplaceNotice(null);
    try {
      const res = await searchService.replaceMatches(projectName, {
        query: query.trim(),
        replaceWith: replaceQuery,
        caseSensitive,
      });
      onRefreshDocs?.();
      setReplaceNotice(res.message);
      await handleSearch(query, caseSensitive);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error";
      setReplaceNotice(`Replace all failed: ${msg}`);
    } finally {
      setIsReplacing(false);
    }
  };

  return (
    <div className="flex flex-col gap-2.5">
      {/* Search & Replace Input Box */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setIsReplaceOpen(!isReplaceOpen)}
            title={isReplaceOpen ? "Hide Replace" : "Toggle Replace"}
            className="p-1 rounded text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            {isReplaceOpen ? (
              <ChevronDown className="size-3.5" />
            ) : (
              <ChevronRight className="size-3.5" />
            )}
          </button>
          <div className="relative flex-1 flex items-center">
            <Search className="size-3.5 text-stone-400 absolute left-2.5 pointer-events-none" />
            <input
              type="text"
              value={query}
              onChange={(e) => handleInputChange(e.target.value)}
              placeholder="Search text (min. 5 characters)..."
              className="w-full border border-zinc-300 dark:border-zinc-700 rounded pl-8 pr-14 py-1.5 bg-white dark:bg-zinc-800 text-xs text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 outline-none focus:border-blue-500 transition-all font-mono"
            />

            <div className="absolute right-1.5 flex items-center gap-0.5">
              <button
                type="button"
                onClick={() => setCaseSensitive(!caseSensitive)}
                title={
                  caseSensitive
                    ? "Match Case (Active)"
                    : "Match Case (Inactive)"
                }
                className={`p-1 rounded text-xs transition-colors ${
                  caseSensitive
                    ? "bg-blue-50 dark:bg-zinc-700 text-blue-600 dark:text-blue-400"
                    : "text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-700"
                }`}
              >
                <CaseSensitive className="size-3.5" />
              </button>

              {query && (
                <button
                  type="button"
                  onClick={() => handleInputChange("")}
                  title="Clear search"
                  className="p-1 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded"
                >
                  <X className="size-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Expandable Replace Row */}
        {isReplaceOpen && (
          <div className="flex items-center gap-1.5 pl-6">
            <div className="relative flex-1 flex items-center">
              <Replace className="size-3.5 text-stone-400 absolute left-2.5 pointer-events-none" />
              <input
                type="text"
                value={replaceQuery}
                onChange={(e) => setReplaceQuery(e.target.value)}
                placeholder="Replace with..."
                className="w-full border border-zinc-300 dark:border-zinc-700 rounded pl-8 pr-16 py-1.5 bg-white dark:bg-zinc-800 text-xs text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 outline-none focus:border-blue-500 transition-all font-mono"
              />
              <div className="absolute right-1.5 flex items-center">
                <button
                  type="button"
                  disabled={isReplacing || !query.trim() || totalMatches === 0}
                  onClick={handleReplaceAll}
                  title="Replace All Occurrences"
                  className="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-40 transition-colors flex items-center gap-1 shadow-xs"
                >
                  <ReplaceAll className="size-3" />
                  <span>All</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {replaceNotice && (
          <div className="text-[10px] text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 px-2 py-1 rounded">
            {replaceNotice}
          </div>
        )}

        {/* Validation hint if query < 5 chars */}
        {query.trim().length > 0 && query.trim().length < 5 && (
          <div className="text-[10px] text-amber-600 bg-amber-50 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200 dark:border-amber-800 px-2 py-1 rounded">
            Type at least {5 - query.trim().length} more character
            {5 - query.trim().length > 1 ? "s" : ""} to search...
          </div>
        )}
      </div>

      {/* Results Header Toolbar */}
      {query.trim().length >= 5 && (
        <div className="flex items-center justify-between text-xs pb-1 border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400">
          <span>
            {loading ? (
              <span className="flex items-center gap-1.5">
                <Loader2 className="size-3 animate-spin text-blue-600 dark:text-blue-400" />
                Searching...
              </span>
            ) : (
              <span>
                <strong>{totalMatches}</strong> results in{" "}
                <strong>{results.length}</strong> files
              </span>
            )}
          </span>

          {results.length > 0 && (
            <div className="flex items-center gap-0.5">
              <button
                type="button"
                onClick={expandAll}
                title="Expand All"
                className="p-0.5 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 rounded hover:bg-zinc-200/70 dark:hover:bg-zinc-800"
              >
                <ChevronsUpDown className="size-3" />
              </button>
              <button
                type="button"
                onClick={collapseAll}
                title="Collapse All"
                className="p-0.5 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 rounded hover:bg-zinc-200/70 dark:hover:bg-zinc-800"
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
              canReplace={isReplaceOpen}
              onToggle={() => toggleFile(fileRes.filePath)}
              onSelectMatch={(filePath, match) => {
                onSelectMatch?.(filePath, match.lineNumber);
              }}
              onReplaceMatch={handleReplaceSingle}
            />
          ))}
        </div>
      ) : (
        query.trim().length >= 5 &&
        !loading && (
          <div className="text-center py-6 text-stone-400 text-xs italic">
            No matches found for "{query}".
          </div>
        )
      )}
    </div>
  );
};
