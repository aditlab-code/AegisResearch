import React, { useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  Plus,
  Minus,
  RefreshCw,
  AlertCircle,
} from "lucide-react";
import { GitFileChange } from "./gitTypes";
import { GitFileItem } from "./GitFileItem";
import { apiClient } from "../../../services/api";

export interface GitStagingListProps {
  projectName: string;
  stagedFiles: GitFileChange[];
  unstagedFiles: GitFileChange[];
  commitMessage: string;
  isCommitting: boolean;
  commitError: string | null;
  onChangeCommitMessage: (msg: string) => void;
  onCommit: () => void;
  onStageFile: (path: string, e: React.MouseEvent) => void;
  onStageAll: (e: React.MouseEvent) => void;
  onUnstageFile: (path: string, e: React.MouseEvent) => void;
  onUnstageAll: (e: React.MouseEvent) => void;
  onDiscardFile: (path: string, e: React.MouseEvent) => void;
  onSelectFile?: (filePath: string) => void;
}

export const GitStagingList: React.FC<GitStagingListProps> = ({
  projectName,
  stagedFiles,
  unstagedFiles,
  commitMessage,
  isCommitting,
  commitError,
  onChangeCommitMessage,
  onCommit,
  onStageFile,
  onStageAll,
  onUnstageFile,
  onUnstageAll,
  onDiscardFile,
  onSelectFile,
}) => {
  const [isStagedOpen, setIsStagedOpen] = useState(true);
  const [isChangesOpen, setIsChangesOpen] = useState(true);
  const [activeDiffFile, setActiveDiffFile] = useState<{
    path: string;
    staged: boolean;
  } | null>(null);
  const [selectedFileDiff, setSelectedFileDiff] = useState<string | null>(null);
  const [diffLoading, setDiffLoading] = useState(false);

  const hasAnyChanges = stagedFiles.length > 0 || unstagedFiles.length > 0;

  const handleToggleDiff = async (
    path: string,
    staged: boolean,
    e: React.MouseEvent,
  ) => {
    e.stopPropagation();
    if (activeDiffFile?.path === path && activeDiffFile.staged === staged) {
      setActiveDiffFile(null);
      setSelectedFileDiff(null);
      return;
    }
    setDiffLoading(true);
    setActiveDiffFile({ path, staged });
    try {
      const res = await apiClient.get<{ diff: string }>(
        `/api/projects/${encodeURIComponent(projectName)}/git/diff?file=${encodeURIComponent(path)}&staged=${staged}`,
      );
      setSelectedFileDiff(res.diff || "No text differences.");
    } catch {
      setSelectedFileDiff("Failed to load diff.");
    } finally {
      setDiffLoading(false);
    }
  };

  const handleDiscard = (path: string, e: React.MouseEvent) => {
    if (activeDiffFile?.path === path) {
      setActiveDiffFile(null);
      setSelectedFileDiff(null);
    }
    onDiscardFile(path, e);
  };

  const renderHeader = (
    title: string,
    count: number,
    isOpen: boolean,
    onToggle: () => void,
    actionBtn?: React.ReactNode,
  ) => (
    <div className="flex items-center justify-between text-[11px] font-semibold text-zinc-600 dark:text-zinc-400 px-1">
      <button
        type="button"
        onClick={onToggle}
        className="flex items-center gap-1 hover:text-zinc-900 dark:hover:text-zinc-200"
      >
        {isOpen ? (
          <ChevronDown className="size-3.5" />
        ) : (
          <ChevronRight className="size-3.5" />
        )}
        <span>{title}</span>
        <span className="font-mono bg-zinc-200/80 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 px-1.5 py-0.2 rounded-full text-[10px] ml-1">
          {count}
        </span>
      </button>
      {actionBtn}
    </div>
  );

  return (
    <>
      {/* Commit Box & Actions */}
      <div className="flex flex-col gap-1.5 p-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-md shadow-2xs">
        <textarea
          rows={2}
          value={commitMessage}
          onChange={(e) => onChangeCommitMessage(e.target.value)}
          onKeyDown={(e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
              e.preventDefault();
              onCommit();
            }
          }}
          placeholder="Write commit message (Ctrl+Enter)..."
          disabled={isCommitting}
          className="w-full resize-none p-1.5 text-xs bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-700/70 rounded text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:border-[#4078f2] dark:focus:border-[#61afef] transition-colors"
        />

        {commitError && (
          <div className="flex items-center gap-1 text-[10px] text-rose-500">
            <AlertCircle className="size-3 shrink-0" />
            <span className="truncate">{commitError}</span>
          </div>
        )}

        <button
          type="button"
          onClick={onCommit}
          disabled={isCommitting || !hasAnyChanges}
          title={
            stagedFiles.length === 0 && unstagedFiles.length > 0
              ? "Smart Commit: Automatically stage all changes then commit"
              : "Commit staged files"
          }
          className="w-full py-1.5 bg-[#4078f2] hover:bg-[#3362c4] dark:bg-[#61afef] dark:hover:bg-[#528bff] disabled:opacity-40 disabled:hover:bg-[#4078f2] dark:disabled:hover:bg-[#61afef] text-white dark:text-zinc-950 rounded text-xs font-semibold shadow-xs flex items-center justify-center gap-1.5 transition-colors"
        >
          {isCommitting ? (
            <>
              <RefreshCw className="size-3 animate-spin" />
              Committing...
            </>
          ) : (
            <>
              <span>Commit</span>
              {stagedFiles.length === 0 && unstagedFiles.length > 0 && (
                <span className="text-[10px] font-normal opacity-90">
                  (Smart Commit All)
                </span>
              )}
            </>
          )}
        </button>
      </div>

      {/* STAGED CHANGES Section */}
      {stagedFiles.length > 0 && (
        <div className="flex flex-col gap-1 mt-1">
          {renderHeader(
            "STAGED CHANGES",
            stagedFiles.length,
            isStagedOpen,
            () => setIsStagedOpen((prev) => !prev),
            <button
              type="button"
              onClick={onUnstageAll}
              title="Unstage All Changes"
              className="p-0.5 rounded text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors"
            >
              <Minus className="size-3.5" />
            </button>,
          )}
          {isStagedOpen && (
            <div className="space-y-1">
              {stagedFiles.map((f) => (
                <GitFileItem
                  key={`staged-${f.path}`}
                  file={f}
                  isStaged={true}
                  isExpanded={
                    activeDiffFile?.path === f.path &&
                    activeDiffFile.staged === true
                  }
                  diff={selectedFileDiff}
                  diffLoading={diffLoading}
                  onSelectFile={onSelectFile}
                  onToggleDiff={handleToggleDiff}
                  onStageFile={onStageFile}
                  onUnstageFile={onUnstageFile}
                  onDiscardFile={handleDiscard}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* CHANGES (Unstaged) Section */}
      <div className="flex flex-col gap-1 mt-1">
        {renderHeader(
          "CHANGES",
          unstagedFiles.length,
          isChangesOpen,
          () => setIsChangesOpen((prev) => !prev),
          unstagedFiles.length > 0 ? (
            <button
              type="button"
              onClick={onStageAll}
              title="Stage All Changes (+)"
              className="p-0.5 rounded text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors"
            >
              <Plus className="size-3.5" />
            </button>
          ) : undefined,
        )}
        {isChangesOpen && (
          <div className="space-y-1">
            {unstagedFiles.length > 0 ? (
              unstagedFiles.map((f) => (
                <GitFileItem
                  key={`unstaged-${f.path}`}
                  file={f}
                  isStaged={false}
                  isExpanded={
                    activeDiffFile?.path === f.path &&
                    activeDiffFile.staged === false
                  }
                  diff={selectedFileDiff}
                  diffLoading={diffLoading}
                  onSelectFile={onSelectFile}
                  onToggleDiff={handleToggleDiff}
                  onStageFile={onStageFile}
                  onUnstageFile={onUnstageFile}
                  onDiscardFile={handleDiscard}
                />
              ))
            ) : (
              <div className="text-center py-6 text-zinc-400 dark:text-zinc-500 text-xs italic">
                No new changes in workspace.
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
};
