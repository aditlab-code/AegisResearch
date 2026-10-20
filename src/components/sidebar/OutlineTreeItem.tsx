import React from "react";
import { ChevronRight, ChevronDown } from "lucide-react";
import { OutlineNode } from "../../types";

export interface OutlineTreeItemProps {
  node: OutlineNode;
  level: number;
  expandedKeys: Set<string>;
  onToggle: (id: string) => void;
  onNavigate: (lineNumber: number) => void;
}

function getBadge(node: OutlineNode) {
  switch (node.kind) {
    case "part":
      return {
        label: "PART",
        color:
          "bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-800",
      };
    case "chapter":
      return {
        label: "CHAP",
        color:
          "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800",
      };
    case "section":
      return {
        label: "SEC",
        color:
          "bg-sky-100 text-sky-700 border-sky-200 dark:bg-sky-950/60 dark:text-sky-300 dark:border-sky-800",
      };
    case "subsection":
      return {
        label: "SUB",
        color:
          "bg-teal-100 text-teal-700 border-teal-200 dark:bg-teal-950/60 dark:text-teal-300 dark:border-teal-800",
      };
    case "subsubsection":
      return {
        label: "SSUB",
        color:
          "bg-zinc-100 text-zinc-600 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700",
      };
    case "h1":
      return {
        label: "H1",
        color:
          "bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800",
      };
    case "h2":
      return {
        label: "H2",
        color:
          "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800",
      };
    case "h3":
      return {
        label: "H3",
        color:
          "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800",
      };
    default:
      return {
        label: `L${node.level}`,
        color:
          "bg-zinc-100 text-zinc-600 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700",
      };
  }
}

export const OutlineTreeItem: React.FC<OutlineTreeItemProps> = ({
  node,
  level,
  expandedKeys,
  onToggle,
  onNavigate,
}) => {
  const hasChildren = node.children && node.children.length > 0;
  const isExpanded = expandedKeys.has(node.id);
  const badge = getBadge(node);

  const paddingLeft = `${level * 14 + 4}px`;

  return (
    <div className="flex flex-col select-none">
      <div
        style={{ paddingLeft }}
        className="group w-full flex items-center justify-between py-1 pr-1.5 rounded hover:bg-zinc-200/60 dark:hover:bg-zinc-800 transition-colors"
      >
        <div className="flex items-center gap-1.5 min-w-0 flex-1">
          {hasChildren ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggle(node.id);
              }}
              className="p-0.5 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 rounded transition-colors"
            >
              {isExpanded ? (
                <ChevronDown className="size-3.5" />
              ) : (
                <ChevronRight className="size-3.5" />
              )}
            </button>
          ) : (
            <span className="w-4 shrink-0" />
          )}

          <button
            type="button"
            onClick={() => onNavigate(node.lineNumber)}
            className="flex items-center gap-1.5 min-w-0 flex-1 text-left"
            title={`Baris ${node.lineNumber}: ${node.label}`}
          >
            <span
              className={`text-[9px] font-bold px-1 py-0.2 rounded border uppercase shrink-0 ${badge.color}`}
            >
              {badge.label}
            </span>
            <span className="truncate text-xs text-zinc-700 dark:text-zinc-300 group-hover:text-zinc-900 dark:group-hover:text-zinc-100">
              {node.label}
            </span>
          </button>
        </div>

        <button
          type="button"
          onClick={() => onNavigate(node.lineNumber)}
          className="text-[10px] text-zinc-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 font-mono ml-2 shrink-0 transition-colors"
        >
          :{node.lineNumber}
        </button>
      </div>

      {hasChildren && isExpanded && (
        <div className="flex flex-col">
          {node.children.map((child) => (
            <OutlineTreeItem
              key={child.id}
              node={child}
              level={level + 1}
              expandedKeys={expandedKeys}
              onToggle={onToggle}
              onNavigate={onNavigate}
            />
          ))}
        </div>
      )}
    </div>
  );
};
