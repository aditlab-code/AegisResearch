import React, { useEffect, useState, useCallback } from 'react'
import { Folder, RefreshCw, Plus, FolderPlus, FilePlus, X, Trash2 } from 'lucide-react'
import { Doc, FileNode, FileTreeNode } from '../../types'
import { projectService } from '../../services/projects'
import { TreeItem } from './TreeItem'
import { useWorkspaceSync } from '../../hooks'
import { Badge } from '../ui'

export interface FileTreeProps {
  docs: Doc[]
  activeDocIndex: number
  projectName?: string
  onSelectDoc: (index: number) => void
  onSelectFile?: (file: FileNode) => void
  onSelectProject?: (project: string) => void
  onCreateProject?: (name: string) => Promise<void>
  onDeleteFile?: (filePath: string) => void
}

const CLIENT_TEX_ARTIFACTS = new Set([
  'aux', 'log', 'toc', 'bbl', 'blg', 'fls',
  'fdb_latexmk', 'synctex.gz', 'out', 'lof', 'lot'
])

function filterTreeArtifacts(nodes: FileTreeNode[]): FileTreeNode[] {
  return nodes
    .filter((n) => {
      if (n.type === 'file') {
        const ext = n.name.split('.').pop()?.toLowerCase() || ''
        if (CLIENT_TEX_ARTIFACTS.has(ext)) return false
      }
      return true
    })
    .map((n) => ({
      ...n,
      children: n.children ? filterTreeArtifacts(n.children) : undefined,
    }))
}

export const FileTree: React.FC<FileTreeProps> = ({
  docs,
  activeDocIndex,
  projectName = 'quantum-thesis',
  onSelectDoc,
  onSelectFile,
  onSelectProject,
  onCreateProject,
  onDeleteFile,
}) => {
  const [tree, setTree] = useState<FileTreeNode[]>([])
  const [projects, setProjects] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(new Set())

  // Delete modal state
  const [nodeToDelete, setNodeToDelete] = useState<FileTreeNode | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Creation dialog modes
  const [modalMode, setModalMode] = useState<'project' | 'file' | 'folder' | null>(null)
  const [inputValue, setInputValue] = useState('')

  const activeDoc = docs[activeDocIndex]

  const loadTree = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await projectService.getProjectTree(projectName)
      const cleanData = filterTreeArtifacts(data)
      setTree(cleanData)
      // Auto-expand root folders if empty set initially
      setExpandedKeys((prev) => {
        if (prev.size === 0) {
          const initialFolders = new Set<string>()
          cleanData.forEach((node) => {
            if (node.type === 'folder') {
              initialFolders.add(node.path)
            }
          })
          return initialFolders
        }
        return prev
      })
    } catch (err) {
      console.warn('Backend tree scan failed, using fallback:', err)
      setError('Backend offline · Using local cache')
      setTree([])
    } finally {
      setLoading(false)
    }
  }, [projectName])

  const loadProjects = useCallback(async () => {
    try {
      const list = await projectService.listProjects()
      if (list && list.length > 0) {
        setProjects(list)
      }
    } catch {
      // Silent fallback
    }
  }, [])

  // Hook for real-time WebSocket sync
  useWorkspaceSync(projectName, useCallback(() => {
    loadTree()
  }, [loadTree]))

  useEffect(() => {
    loadTree()
  }, [loadTree])

  useEffect(() => {
    loadProjects()
  }, [loadProjects])

  const toggleFolder = (path: string) => {
    setExpandedKeys((prev) => {
      const next = new Set(prev)
      if (next.has(path)) {
        next.delete(path)
      } else {
        next.add(path)
      }
      return next
    })
  }

  const handleSelectFile = (node: FileTreeNode) => {
    const fileNode: FileNode = {
      name: node.name,
      path: node.path,
      kind: (node.kind as any) || 'other',
      size: node.size,
      updatedAt: node.updatedAt,
    }
    if (onSelectFile) {
      onSelectFile(fileNode)
    } else {
      const existingIndex = docs.findIndex((d) => d.name === node.name)
      if (existingIndex !== -1) {
        onSelectDoc(existingIndex)
      }
    }
  }

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = inputValue.trim()
    if (!trimmed) return

    try {
      setLoading(true)
      if (modalMode === 'project') {
        if (onCreateProject) {
          await onCreateProject(trimmed)
        } else {
          await projectService.createProject(trimmed)
        }
        await loadProjects()
        onSelectProject?.(trimmed)
      } else if (modalMode === 'folder') {
        await projectService.createFolder(projectName, trimmed)
        await loadTree()
      } else if (modalMode === 'file') {
        await projectService.createFile(projectName, trimmed, '')
        await loadTree()
      }
      setInputValue('')
      setModalMode(null)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error'
      alert(`Failed to create item: ${message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleConfirmDelete = async () => {
    if (!nodeToDelete) return
    setIsDeleting(true)
    try {
      await projectService.deleteFile(projectName, nodeToDelete.path)
      onDeleteFile?.(nodeToDelete.path)
      setNodeToDelete(null)
      await loadTree()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error'
      alert(`Failed to delete item: ${msg}`)
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="flex flex-col gap-2">
      {/* Project Header / Actions */}
      <div className="flex items-center justify-between pb-1 border-b border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center gap-1.5 min-w-0">
          <Folder className="size-3.5 text-zinc-500 shrink-0" />
          {projects.length > 1 ? (
            <select
              value={projectName}
              onChange={(e) => onSelectProject?.(e.target.value)}
              aria-label="Select Project"
              className="text-xs font-semibold text-zinc-800 dark:text-zinc-100 bg-transparent border-0 py-0.5 pr-4 pl-0 focus:ring-0 cursor-pointer truncate max-w-[120px]"
            >
              {projects.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          ) : (
            <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-100 truncate" title={projectName}>
              {projectName}
            </span>
          )}
        </div>

        {/* Action icons like VS Code */}
        <div className="flex items-center gap-0.5 shrink-0">
          <button
            type="button"
            onClick={() => {
              setModalMode(modalMode === 'file' ? null : 'file')
              setInputValue('')
            }}
            title="New File (e.g., chapters/intro.tex)"
            className="p-1 text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-100 rounded hover:bg-zinc-200/70 dark:hover:bg-zinc-800 text-xs transition-colors"
          >
            <FilePlus className="size-3.5" />
          </button>
          <button
            type="button"
            onClick={() => {
              setModalMode(modalMode === 'folder' ? null : 'folder')
              setInputValue('')
            }}
            title="New Folder (e.g., chapters)"
            className="p-1 text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-100 rounded hover:bg-zinc-200/70 dark:hover:bg-zinc-800 text-xs transition-colors"
          >
            <FolderPlus className="size-3.5" />
          </button>
          <button
            type="button"
            onClick={() => {
              setModalMode(modalMode === 'project' ? null : 'project')
              setInputValue('')
            }}
            title="New Project"
            className="p-1 text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-100 rounded hover:bg-zinc-200/70 dark:hover:bg-zinc-800 text-xs transition-colors"
          >
            <Plus className="size-3.5" />
          </button>
          <button
            type="button"
            onClick={loadTree}
            title="Refresh Explorer"
            disabled={loading}
            className="p-1 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 rounded hover:bg-zinc-200/70 dark:hover:bg-zinc-800 text-xs transition-colors"
          >
            <RefreshCw className={`size-3.5 ${loading ? 'animate-spin text-blue-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* Creation Modal / Inline Form */}
      {modalMode && (
        <form onSubmit={handleCreateSubmit} className="flex items-center gap-1 py-1 px-1 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={
              modalMode === 'project'
                ? 'New project name...'
                : modalMode === 'folder'
                ? 'Folder name (e.g., images)...'
                : 'File name (e.g., intro.tex)...'
            }
            autoFocus
            className="flex-1 text-xs px-2 py-1 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-blue-500"
          />
          <button
            type="submit"
            disabled={!inputValue.trim()}
            className="px-2 py-1 bg-blue-600 text-white rounded text-xs font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            Create
          </button>
          <button
            type="button"
            onClick={() => setModalMode(null)}
            className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
          >
            <X className="size-3.5" />
          </button>
        </form>
      )}

      {/* Loading & Error Indicators */}
      {loading && !modalMode && (
        <div className="text-[11px] text-zinc-400 animate-pulse px-1">
          Syncing files...
        </div>
      )}
      {error && (
        <div className="text-[10px] text-amber-600 bg-amber-50 dark:bg-amber-950/40 dark:text-amber-400 px-2 py-1 rounded border border-amber-200 dark:border-amber-800">
          {error}
        </div>
      )}

      {/* Hierarchical Tree View */}
      {tree.length > 0 ? (
        <div className="flex flex-col">
          {tree.map((node) => (
            <TreeItem
              key={node.id || node.path}
              node={node}
              level={0}
              activePath={activeDoc?.name}
              expandedKeys={expandedKeys}
              onToggleFolder={toggleFolder}
              onSelectFile={handleSelectFile}
              onDeleteNode={(node) => setNodeToDelete(node)}
            />
          ))}
        </div>
      ) : (
        /* Fallback if tree is empty or offline */
        <div className="flex flex-col gap-0.5">
          {docs.map((doc, index) => {
            const ext = doc.name.split('.').pop()?.toUpperCase() || ''
            const isActive = index === activeDocIndex
            return (
              <button
                key={doc.name}
                onClick={() => onSelectDoc(index)}
                className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-left transition-colors ${
                  isActive
                    ? 'bg-blue-50 dark:bg-zinc-800 text-blue-700 dark:text-blue-400 font-medium'
                    : 'hover:bg-zinc-200/60 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300'
                }`}
              >
                <Badge kind={doc.kind}>{ext}</Badge>
                <span className="truncate text-xs">{doc.name}</span>
              </button>
            )
          })}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {nodeToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-2xl max-w-sm w-full p-4 flex flex-col gap-3">
            <div className="flex items-center gap-2 text-red-600 dark:text-red-400 font-semibold text-sm">
              <Trash2 className="size-4" />
              <span>Delete {nodeToDelete.type === 'folder' ? 'Folder' : 'File'}?</span>
            </div>
            <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed">
              Are you sure you want to permanently delete{' '}
              <strong className="text-zinc-900 dark:text-zinc-100 font-mono font-semibold">{nodeToDelete.name}</strong>?
              This action cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setNodeToDelete(null)}
                className="px-3 py-1.5 rounded text-xs border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleConfirmDelete}
                className="px-3 py-1.5 rounded text-xs bg-red-600 hover:bg-red-700 text-white font-medium transition-colors disabled:opacity-50 flex items-center gap-1.5"
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
