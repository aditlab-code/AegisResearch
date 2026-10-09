import React from 'react'
import {
  ChevronRight,
  ChevronDown,
  Folder,
  FolderOpen,
  FileText,
  FileCode,
  File,
} from 'lucide-react'
import { FileTreeNode } from '../../types'

export interface TreeItemProps {
  node: FileTreeNode
  level: number
  activePath?: string
  expandedKeys: Set<string>
  onToggleFolder: (path: string) => void
  onSelectFile: (file: FileTreeNode) => void
}

function formatBytes(bytes?: number): string {
  if (bytes === undefined || bytes === null) return ''
  if (bytes < 1024) return `${bytes} B`
  const kb = bytes / 1024
  if (kb < 1024) return `${kb.toFixed(1)} KB`
  return `${(kb / 1024).toFixed(1)} MB`
}

export const TreeItem: React.FC<TreeItemProps> = ({
  node,
  level,
  activePath,
  expandedKeys,
  onToggleFolder,
  onSelectFile,
}) => {
  const isFolder = node.type === 'folder'
  const isExpanded = expandedKeys.has(node.path)
  const isActive = !isFolder && (activePath === node.path || activePath === node.name)

  const paddingLeft = `${level * 14 + 6}px`

  if (isFolder) {
    return (
      <div className="flex flex-col select-none">
        <button
          type="button"
          onClick={() => onToggleFolder(node.path)}
          style={{ paddingLeft }}
          className="group w-full flex items-center gap-1.5 py-1 pr-2 rounded text-left transition-colors hover:bg-stone-200/70 text-stone-700"
        >
          <span className="text-stone-400 group-hover:text-stone-600 shrink-0">
            {isExpanded ? (
              <ChevronDown className="size-3.5" />
            ) : (
              <ChevronRight className="size-3.5" />
            )}
          </span>
          {isExpanded ? (
            <FolderOpen className="size-3.5 text-amber-600 shrink-0" />
          ) : (
            <Folder className="size-3.5 text-amber-500 shrink-0" />
          )}
          <span className="truncate text-xs font-medium text-stone-800">{node.name}</span>
        </button>

        {isExpanded && node.children && node.children.length > 0 && (
          <div className="flex flex-col">
            {node.children.map((child) => (
              <TreeItem
                key={child.id || child.path}
                node={child}
                level={level + 1}
                activePath={activePath}
                expandedKeys={expandedKeys}
                onToggleFolder={onToggleFolder}
                onSelectFile={onSelectFile}
              />
            ))}
          </div>
        )}

        {isExpanded && (!node.children || node.children.length === 0) && (
          <div
            style={{ paddingLeft: `${(level + 1) * 14 + 18}px` }}
            className="py-1 text-[11px] text-stone-400 italic"
          >
            Kosong
          </div>
        )}
      </div>
    )
  }

  // File rendering
  const ext = node.name.split('.').pop()?.toLowerCase() || ''
  let fileIcon = <File className="size-3.5 text-stone-400 shrink-0" />

  if (ext === 'tex' || node.kind === 'tex') {
    fileIcon = <FileCode className="size-3.5 text-indigo-500 shrink-0" />
  } else if (ext === 'md' || node.kind === 'md') {
    fileIcon = <FileText className="size-3.5 text-emerald-600 shrink-0" />
  }

  return (
    <button
      type="button"
      onClick={() => onSelectFile(node)}
      style={{ paddingLeft }}
      className={`group w-full flex items-center justify-between py-1 pr-2 rounded text-left transition-colors ${
        isActive
          ? 'bg-indigo-100 text-indigo-900 font-medium'
          : 'hover:bg-stone-200/70 text-stone-700'
      }`}
    >
      <div className="flex items-center gap-1.5 min-w-0">
        <span className="shrink-0 ml-1">{fileIcon}</span>
        <span className="truncate text-xs">{node.name}</span>
      </div>
      {node.size !== undefined && node.size > 0 && (
        <span className="text-[10px] text-stone-400 font-mono ml-2 shrink-0">
          {formatBytes(node.size)}
        </span>
      )}
    </button>
  )
}
