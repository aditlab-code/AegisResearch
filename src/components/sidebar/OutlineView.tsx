import React, { useState, useEffect } from "react";
import { ListTree, ChevronsDownUp, ChevronsUpDown } from "lucide-react";
import { OutlineNode } from "../../types";
import { OutlineTreeItem } from "./OutlineTreeItem";

export interface OutlineViewProps {
  outlineTree: OutlineNode[];
  onNavigate?: (lineNumber: number) => void;
  activeDocName?: string;
}

export const OutlineView: React.FC<OutlineViewProps> = ({
  outlineTree,
  onNavigate,
  activeDocName,
}) => {
  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(new Set());

  // Collect all expandable IDs recursively
  const getAllExpandableIds = (nodes: OutlineNode[]): string[] => {
    let ids: string[] = [];
    nodes.forEach((n) => {
      if (n.children && n.children.length > 0) {
        ids.push(n.id);
        ids = ids.concat(getAllExpandableIds(n.children));
      }
    });
    return ids;
  };

  // By default expand all nodes when outline changes
  useEffect(() => {
    const allIds = getAllExpandableIds(outlineTree);
    setExpandedKeys(new Set(allIds));
  }, [outlineTree]);

  const toggleExpand = (id: string) => {
    setExpandedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const expandAll = () => {
    setExpandedKeys(new Set(getAllExpandableIds(outlineTree)));
  };

  const collapseAll = () => {
    setExpandedKeys(new Set());
  };

  return (
    <div className="flex flex-col gap-2">
      {/* Header toolbar */}
      <div className="flex items-center justify-between pb-1.5 border-b border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center gap-1.5 min-w-0">
          <ListTree className="size-3.5 text-zinc-400 shrink-0" />
          <span
            className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 truncate"
            title={activeDocName || "Outline"}
          >
            {activeDocName || "Outline"}
          </span>
        </div>

        {outlineTree.length > 0 && (
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={expandAll}
              title="Expand All"
              className="p-1 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 rounded hover:bg-zinc-200/60 dark:hover:bg-zinc-800 transition-colors"
            >
              <ChevronsUpDown className="size-3" />
            </button>
            <button
              type="button"
              onClick={collapseAll}
              title="Collapse All"
              className="p-1 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 rounded hover:bg-zinc-200/60 dark:hover:bg-zinc-800 transition-colors"
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
        <div className="text-center py-6 px-2 text-zinc-400 text-xs italic">
          No outline or headings found in this document.
        </div>
      )}
    </div>
  );
};
