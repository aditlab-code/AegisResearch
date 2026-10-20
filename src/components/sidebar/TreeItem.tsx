import React from "react";
import {
  ChevronRight,
  ChevronDown,
  Folder,
  FolderOpen,
  FileText,
  FileCode,
  File,
  Trash2,
  Image as ImageIcon,
  Star,
  Table,
} from "lucide-react";
import { FileTreeNode } from "../../types";

export interface TreeItemProps {
  node: FileTreeNode;
  level: number;
  activePath?: string;
  rootDocument?: string;
  expandedKeys: Set<string>;
  onToggleFolder: (path: string) => void;
  onSelectFile: (file: FileTreeNode) => void;
  onDeleteNode?: (node: FileTreeNode) => void;
  onSetRootDocument?: (path: string) => void;
}

function formatBytes(bytes?: number): string {
  if (bytes === undefined || bytes === null) return "";
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  return `${(kb / 1024).toFixed(1)} MB`;
}

export const TreeItem: React.FC<TreeItemProps> = ({
  node,
  level,
  activePath,
  rootDocument,
  expandedKeys,
  onToggleFolder,
  onSelectFile,
  onDeleteNode,
  onSetRootDocument,
}) => {
  const isFolder = node.type === "folder";
  const isExpanded = expandedKeys.has(node.path);
  const isActive =
    !isFolder && (activePath === node.path || activePath === node.name);
  const isRoot =
    !isFolder &&
    rootDocument &&
    (node.path === rootDocument || node.name === rootDocument);

  const paddingLeft = `${level * 14 + 6}px`;

  if (isFolder) {
    return (
      <div className="flex flex-col select-none">
        <div
          style={{ paddingLeft }}
          className="group w-full flex items-center justify-between py-1 pr-2 rounded text-left transition-colors hover:bg-zinc-200/60 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-200"
        >
          <div
            onClick={() => onToggleFolder(node.path)}
            className="flex items-center gap-1.5 min-w-0 flex-1 cursor-pointer"
          >
            <span className="text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-300 shrink-0">
              {isExpanded ? (
                <ChevronDown className="size-3.5" />
              ) : (
                <ChevronRight className="size-3.5" />
              )}
            </span>
            {isExpanded ? (
              <FolderOpen className="size-3.5 text-amber-500 shrink-0" />
            ) : (
              <Folder className="size-3.5 text-amber-500 shrink-0" />
            )}
            <span className="truncate text-xs font-medium text-zinc-800 dark:text-zinc-100">
              {node.name}
            </span>
          </div>

          {onDeleteNode && (
            <button
              type="button"
              title={`Delete ${node.name}`}
              onClick={(e) => {
                e.stopPropagation();
                onDeleteNode(node);
              }}
              className="opacity-0 group-hover:opacity-100 text-zinc-400 hover:text-red-600 dark:hover:text-red-400 p-0.5 rounded transition-opacity shrink-0"
            >
              <Trash2 className="size-3.5" />
            </button>
          )}
        </div>

        {isExpanded && node.children && node.children.length > 0 && (
          <div className="flex flex-col">
            {node.children.map((child) => (
              <TreeItem
                key={child.id || child.path}
                node={child}
                level={level + 1}
                activePath={activePath}
                rootDocument={rootDocument}
                expandedKeys={expandedKeys}
                onToggleFolder={onToggleFolder}
                onSelectFile={onSelectFile}
                onDeleteNode={onDeleteNode}
                onSetRootDocument={onSetRootDocument}
              />
            ))}
          </div>
        )}

        {isExpanded && (!node.children || node.children.length === 0) && (
          <div
            style={{ paddingLeft: `${(level + 1) * 14 + 18}px` }}
            className="py-1 text-[11px] text-zinc-400 dark:text-zinc-500 italic"
          >
            Empty
          </div>
        )}
      </div>
    );
  }

  // File rendering
  const ext = node.name.split(".").pop()?.toLowerCase() || "";
  let fileIcon = <File className="size-3.5 text-zinc-400 shrink-0" />;

  if (ext === "tex" || node.kind === "tex") {
    fileIcon = (
      <FileCode className="size-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
    );
  } else if (ext === "md" || node.kind === "md") {
    fileIcon = (
      <FileText className="size-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
    );
  } else if (ext === "pdf" || node.kind === "pdf") {
    fileIcon = (
      <FileText className="size-3.5 text-rose-600 dark:text-rose-400 shrink-0" />
    );
  } else if (
    ["png", "jpg", "jpeg", "svg", "webp", "gif", "eps", "bmp"].includes(ext) ||
    node.kind === "image"
  ) {
    fileIcon = (
      <ImageIcon className="size-3.5 text-purple-600 dark:text-purple-400 shrink-0" />
    );
  } else if (
    ["csv", "tsv", "parquet", "pqt"].includes(ext) ||
    node.kind === "dataset"
  ) {
    fileIcon = (
      <Table className="size-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
    );
  }

  return (
    <div
      onClick={() => onSelectFile(node)}
      style={{ paddingLeft }}
      className={`group w-full flex items-center justify-between py-1 pr-2 rounded text-left transition-colors cursor-pointer ${
        isActive
          ? "bg-blue-50 dark:bg-zinc-800 text-blue-700 dark:text-blue-400 font-medium"
          : "hover:bg-zinc-200/60 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300"
      }`}
    >
      <div className="flex items-center gap-1.5 min-w-0 flex-1">
        <span className="shrink-0 ml-1">{fileIcon}</span>
        <span className="truncate text-xs">{node.name}</span>
        {isRoot && (
          <span
            className="flex items-center gap-0.5 text-[9px] px-1 py-0.2 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded font-semibold shrink-0"
            title="Project Main/Root Document"
          >
            <Star className="size-2.5 fill-amber-500 text-amber-500" />
            ROOT
          </span>
        )}
      </div>
      <div className="flex items-center gap-1 shrink-0 ml-2">
        {!isRoot &&
          (ext === "tex" || node.kind === "tex") &&
          onSetRootDocument && (
            <button
              type="button"
              title={`Set ${node.name} as Main Document`}
              onClick={(e) => {
                e.stopPropagation();
                onSetRootDocument(node.path);
              }}
              className="opacity-0 group-hover:opacity-100 text-zinc-400 hover:text-amber-500 p-0.5 rounded transition-opacity"
            >
              <Star className="size-3" />
            </button>
          )}
        {node.size !== undefined && node.size > 0 && (
          <span className="text-[10px] text-zinc-400 font-mono">
            {formatBytes(node.size)}
          </span>
        )}
        {onDeleteNode && (
          <button
            type="button"
            title={`Delete ${node.name}`}
            onClick={(e) => {
              e.stopPropagation();
              onDeleteNode(node);
            }}
            className="opacity-0 group-hover:opacity-100 text-zinc-400 hover:text-red-600 dark:hover:text-red-400 p-0.5 rounded transition-opacity"
          >
            <Trash2 className="size-3.5" />
          </button>
        )}
      </div>
    </div>
  );
};
