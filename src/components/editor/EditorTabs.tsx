import React from "react";
import {
  Circle,
  X,
  FileText,
  FileCode,
  Image as ImageIcon,
  Table,
} from "lucide-react";
import { Doc } from "../../types";

export interface EditorTabsProps {
  docs: Doc[];
  openDocIndices: number[];
  activeDocIndex: number;
  isDirty?: boolean;
  onSelectTab: (index: number) => void;
  onCloseTab: (index: number) => void;
}

export const EditorTabs: React.FC<EditorTabsProps> = ({
  docs,
  openDocIndices,
  activeDocIndex,
  isDirty = false,
  onSelectTab,
  onCloseTab,
}) => {
  if (openDocIndices.length === 0) {
    return (
      <div className="flex items-center h-9 bg-zinc-100 dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800 text-xs px-3 text-zinc-400 select-none">
        No open tabs
      </div>
    );
  }

  // Deduplicate unique open document indices
  const uniqueOpenIndices = Array.from(new Set(openDocIndices));

  return (
    <div className="flex bg-zinc-100 dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800 text-xs select-none overflow-x-auto">
      {uniqueOpenIndices.map((docIdx) => {
        const isActive = docIdx === activeDocIndex;
        const doc = docs[docIdx];
        if (!doc) return null;

        const isTex = doc.kind === "tex";
        const isImage = doc.kind === "image";
        const isDataset = doc.kind === "dataset";

        return (
          <div
            key={docIdx}
            onClick={() => onSelectTab(docIdx)}
            className={`group px-3 py-2 cursor-pointer flex gap-2 border-r border-zinc-200 dark:border-zinc-800 items-center transition-colors min-w-0 max-w-[180px] ${
              isActive
                ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 font-medium border-t-2 border-t-[#4078f2] dark:border-t-[#61afef] shadow-xs"
                : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-200/60 dark:hover:bg-zinc-900/60"
            }`}
          >
            {isImage ? (
              <ImageIcon className="size-3.5 text-purple-600 dark:text-purple-400 shrink-0" />
            ) : isDataset ? (
              <Table className="size-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
            ) : isTex ? (
              <FileCode className="size-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
            ) : (
              <FileText className="size-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            )}

            <span className="truncate flex-1 text-xs">{doc.name}</span>

            {isActive && isDirty && (
              <Circle className="size-2 fill-amber-500 text-amber-500 shrink-0" />
            )}

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onCloseTab(docIdx);
              }}
              title="Close tab"
              className="text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded p-0.5 transition-colors shrink-0"
            >
              <X className="size-3" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
