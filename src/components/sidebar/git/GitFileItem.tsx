import React from "react";
import {
  FileText,
  ChevronDown,
  ChevronRight,
  Plus,
  Minus,
  RotateCcw,
} from "lucide-react";
import { GitFileChange } from "./gitTypes";
import { GitDiffViewer } from "./GitDiffViewer";

export interface GitFileItemProps {
  file: GitFileChange;
  isStaged: boolean;
  isExpanded: boolean;
  diff: string | null;
  diffLoading: boolean;
  onSelectFile?: (filePath: string) => void;
  onToggleDiff: (path: string, staged: boolean, e: React.MouseEvent) => void;
  onStageFile: (path: string, e: React.MouseEvent) => void;
  onUnstageFile: (path: string, e: React.MouseEvent) => void;
  onDiscardFile: (path: string, e: React.MouseEvent) => void;
}

export const GitFileItem: React.FC<GitFileItemProps> = ({
  file,
  isStaged,
  isExpanded,
  diff,
  diffLoading,
  onSelectFile,
  onToggleDiff,
  onStageFile,
  onUnstageFile,
  onDiscardFile,
}) => {
  const statusColor = isStaged
    ? "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10"
    : file.status === "M"
      ? "text-amber-500 bg-amber-500/10"
      : file.status === "D"
        ? "text-rose-500 bg-rose-500/10"
        : "text-emerald-500 bg-emerald-500/10";

  return (
    <div className="flex flex-col border border-zinc-200 dark:border-zinc-800 rounded-md overflow-hidden bg-white dark:bg-zinc-900">
      <div className="flex items-center justify-between p-1.5 hover:bg-zinc-50 dark:hover:bg-zinc-800/60 transition-colors">
        <button
          type="button"
          onClick={() => onSelectFile?.(file.path)}
          className="flex items-center gap-1.5 min-w-0 text-left flex-1"
          title={file.path}
        >
          <FileText className="size-3.5 text-zinc-400 shrink-0" />
          <span className="truncate text-xs text-zinc-800 dark:text-zinc-200">
            {file.path}
          </span>
        </button>

        <div className="flex items-center gap-1 shrink-0">
          <span
            className={`text-[9px] font-mono font-bold px-1 rounded ${statusColor}`}
          >
            {file.status}
          </span>

          <button
            type="button"
            onClick={(e) => onToggleDiff(file.path, isStaged, e)}
            title="View Differences (Diff)"
            className={`p-0.5 rounded transition-colors ${
              isExpanded
                ? "text-[#4078f2] dark:text-[#61afef]"
                : "text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
            }`}
          >
            {isExpanded ? (
              <ChevronDown className="size-3.5" />
            ) : (
              <ChevronRight className="size-3.5" />
            )}
          </button>

          {!isStaged && (
            <button
              type="button"
              onClick={(e) => onDiscardFile(file.path, e)}
              title="Discard Changes"
              className="p-0.5 rounded text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              <RotateCcw className="size-3.5" />
            </button>
          )}

          <button
            type="button"
            onClick={(e) =>
              isStaged ? onUnstageFile(file.path, e) : onStageFile(file.path, e)
            }
            title={isStaged ? "Unstage File (-)" : "Stage File (+)"}
            className="p-0.5 rounded text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            {isStaged ? (
              <Minus className="size-3.5" />
            ) : (
              <Plus className="size-3.5" />
            )}
          </button>
        </div>
      </div>

      {isExpanded && <GitDiffViewer diff={diff} loading={diffLoading} />}
    </div>
  );
};
