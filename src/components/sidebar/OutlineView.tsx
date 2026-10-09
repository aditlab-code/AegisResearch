import React, { useState, useEffect } from 'react'
import { ListTree, ChevronsDownUp, ChevronsUpDown } from 'lucide-react'
import { OutlineNode } from '../../types'
import { OutlineTreeItem } from './OutlineTreeItem'

export interface OutlineViewProps {
  outlineTree: OutlineNode[]
  onNavigate?: (lineNumber: number) => void
}

export const OutlineView: React.FC<OutlineViewProps> = ({ outlineTree, onNavigate }) => {
  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(new Set())

  // Collect all expandable IDs recursively
  const getAllExpandableIds = (nodes: OutlineNode[]): string[] => {
    let ids: string[] = []
    nodes.forEach((n) => {
      if (n.children && n.children.length > 0) {
        ids.push(n.id)
        ids = ids.concat(getAllExpandableIds(n.children))
      }
    })
    return ids
  }

  // By default expand all nodes when outline changes
  useEffect(() => {
    const allIds = getAllExpandableIds(outlineTree)
    setExpandedKeys(new Set(allIds))
  }, [outlineTree])

  const toggleExpand = (id: string) => {
    setExpandedKeys((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const expandAll = () => {
    setExpandedKeys(new Set(getAllExpandableIds(outlineTree)))
  }

  const collapseAll = () => {
    setExpandedKeys(new Set())
  }

  return (
    <div className="flex flex-col gap-2">
      {/* Header toolbar */}
      <div className="flex items-center justify-between pb-1.5 border-b border-stone-200">
        <div className="flex items-center gap-1.5">
          <ListTree className="size-3.5 text-stone-500 shrink-0" />
          <span className="text-xs font-semibold text-stone-700">Hierarki Dokumen</span>
        </div>

        {outlineTree.length > 0 && (
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={expandAll}
              title="Expand Semua"
              className="p-1 text-stone-400 hover:text-stone-700 rounded hover:bg-stone-200 transition-colors"
            >
              <ChevronsUpDown className="size-3" />
            </button>
            <button
              type="button"
              onClick={collapseAll}
              title="Collapse Semua"
              className="p-1 text-stone-400 hover:text-stone-700 rounded hover:bg-stone-200 transition-colors"
            >
              <ChevronsDownUp className="size-3" />
            </button>
          </div>
        )}
      </div>

      {/* Outline content */}
      {outlineTree.length > 0 ? (
        <div className="flex flex-col py-1">
          {outlineTree.map((node) => (
            <OutlineTreeItem
              key={node.id}
              node={node}
              level={0}
              expandedKeys={expandedKeys}
              onToggle={toggleExpand}
              onNavigate={(line) => onNavigate?.(line)}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-6 px-2 text-stone-400 text-xs italic">
          Belum ada struktur bab atau heading pada dokumen ini.
        </div>
      )}
    </div>
  )
}
