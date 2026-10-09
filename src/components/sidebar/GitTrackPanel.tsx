import React, { useEffect, useState, useCallback } from 'react'
import {
  GitBranch,
  GitCompare,
  RefreshCw,
  FileText,
  ChevronDown,
  ChevronRight,
  PlusCircle,
  FolderGit2,
  Check,
} from 'lucide-react'
import { apiClient } from '../../services/api'

interface GitFileChange {
  status: string
  path: string
}

interface GitStatusData {
  isGitRepo: boolean
  branch: string | null
  modifiedCount: number
  files: GitFileChange[]
}

export interface GitTrackPanelProps {
  projectName: string
  onSelectFile?: (filePath: string) => void
}

export const GitTrackPanel: React.FC<GitTrackPanelProps> = ({ projectName, onSelectFile }) => {
  const [data, setData] = useState<GitStatusData | null>(null)
  const [loading, setLoading] = useState(false)
  const [isInitializing, setIsInitializing] = useState(false)
  const [selectedFileDiff, setSelectedFileDiff] = useState<string | null>(null)
  const [activeDiffFile, setActiveDiffFile] = useState<string | null>(null)

  const fetchStatus = useCallback(async () => {
    setLoading(true)
    try {
      const res = await apiClient.get<GitStatusData>(
        `/api/projects/${encodeURIComponent(projectName)}/git/status`,
      )
      setData(res)
    } catch {
      setData({ isGitRepo: false, branch: null, modifiedCount: 0, files: [] })
    } finally {
      setLoading(false)
    }
  }, [projectName])

  const handleInitGit = async () => {
    setIsInitializing(true)
    try {
      await apiClient.post<{ success: boolean }>(
        `/api/projects/${encodeURIComponent(projectName)}/git/init`,
      )
      await fetchStatus()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to initialize Git repository.'
      alert(msg)
    } finally {
      setIsInitializing(false)
    }
  }

  const fetchDiff = async (file: string) => {
    if (activeDiffFile === file) {
      setActiveDiffFile(null)
      setSelectedFileDiff(null)
      return
    }

    try {
      const res = await apiClient.get<{ diff: string }>(
        `/api/projects/${encodeURIComponent(projectName)}/git/diff?file=${encodeURIComponent(file)}`,
      )
      setActiveDiffFile(file)
      setSelectedFileDiff(res.diff || 'No text differences.')
    } catch {
      setActiveDiffFile(file)
      setSelectedFileDiff('Failed to fetch diff.')
    }
  }

  useEffect(() => {
    fetchStatus()
  }, [fetchStatus])

  // CASE 1: NOT A GIT REPOSITORY -> VS CODE STYLE INITIALIZE UI
  if (data && !data.isGitRepo) {
    return (
      <div className="flex flex-col items-center justify-center py-10 px-4 text-center select-none">
        <div className="size-12 rounded-full bg-stone-200/70 flex items-center justify-center text-stone-500 mb-3">
          <FolderGit2 className="size-6 text-indigo-600" />
        </div>
        <h4 className="text-xs font-semibold text-stone-800 mb-1">
          No Git Repository Found
        </h4>
        <p className="text-[11px] text-stone-500 mb-4 leading-relaxed">
          The workspace "{projectName}" is not tracked by Git yet. Initialize it to track document revisions and differences.
        </p>

        <button
          type="button"
          onClick={handleInitGit}
          disabled={isInitializing}
          className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-md text-xs font-semibold shadow-sm flex items-center justify-center gap-1.5 transition-colors"
        >
          {isInitializing ? (
            <>
              <RefreshCw className="size-3.5 animate-spin" />
              Initializing...
            </>
          ) : (
            <>
              <PlusCircle className="size-3.5" />
              Initialize Repository
            </>
          )}
        </button>
      </div>
    )
  }

  // CASE 2: GIT REPO ACTIVE -> TRACK CHANGES STATUS & DIFF
  return (
    <div className="flex flex-col gap-2.5 select-none text-xs">
      {/* Branch & Refresh Toolbar */}
      <div className="flex items-center justify-between pb-1.5 border-b border-stone-200">
        <div className="flex items-center gap-1.5 font-semibold text-stone-700">
          <GitBranch className="size-3.5 text-indigo-600" />
          <span className="font-mono text-xs">{data?.branch || 'main'}</span>
        </div>

        <button
          type="button"
          onClick={fetchStatus}
          disabled={loading}
          title="Refresh Git Status"
          className="p-1 text-stone-400 hover:text-stone-700 rounded hover:bg-stone-200"
        >
          <RefreshCw className={`size-3 ${loading ? 'animate-spin text-indigo-600' : ''}`} />
        </button>
      </div>

      {/* Changes Counter */}
      <div className="flex items-center justify-between text-stone-500 text-[11px] px-0.5">
        <span>TRACK CHANGES (GIT)</span>
        <span className="font-mono bg-stone-200 text-stone-700 px-1.5 rounded-full font-bold text-[10px]">
          {data?.files.length || 0}
        </span>
      </div>

      {/* Changed Files List */}
      {data && data.files.length > 0 ? (
        <div className="space-y-1">
          {data.files.map((f) => {
            const isM = f.status.includes('M')
            const isA = f.status.includes('A') || f.status.includes('?')
            const isD = f.status.includes('D')
            const isExpanded = activeDiffFile === f.path

            return (
              <div
                key={f.path}
                className="flex flex-col border border-stone-200 rounded-md overflow-hidden bg-white"
              >
                <div className="flex items-center justify-between p-1.5 hover:bg-stone-50 transition-colors">
                  <button
                    type="button"
                    onClick={() => onSelectFile?.(f.path)}
                    className="flex items-center gap-1.5 min-w-0 text-left flex-1"
                    title={f.path}
                  >
                    <FileText className="size-3.5 text-stone-400 shrink-0" />
                    <span className="truncate text-xs text-stone-800">{f.path}</span>
                  </button>

                  <div className="flex items-center gap-1">
                    <span
                      className={`text-[9px] font-mono font-bold px-1 rounded ${
                        isM
                          ? 'text-amber-700 bg-amber-50'
                          : isA
                          ? 'text-emerald-700 bg-emerald-50'
                          : isD
                          ? 'text-rose-700 bg-rose-50'
                          : 'text-stone-600 bg-stone-100'
                      }`}
                    >
                      {f.status}
                    </span>

                    <button
                      type="button"
                      onClick={() => fetchDiff(f.path)}
                      title="Toggle Diff"
                      className="p-0.5 text-stone-400 hover:text-indigo-600"
                    >
                      {isExpanded ? (
                        <ChevronDown className="size-3.5" />
                      ) : (
                        <ChevronRight className="size-3.5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Diff Viewer Accordion */}
                {isExpanded && selectedFileDiff && (
                  <div className="p-2 bg-stone-900 text-stone-100 font-mono text-[10px] overflow-x-auto max-h-48 border-t border-stone-700">
                    <pre className="whitespace-pre">{selectedFileDiff}</pre>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      ) : (
        <div className="text-center py-8 text-stone-400 text-xs italic">
          No modified changes in workspace.
        </div>
      )}
    </div>
  )
}
