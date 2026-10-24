import React from "react";
import { GitBranch, RefreshCw, ChevronDown } from "lucide-react";
import {
  GitBranchModal,
  GitStagingList,
  GitCommitGraphCanvas,
  GitInitView,
  useGitManager,
} from "./git";

export interface GitTrackPanelProps {
  projectName: string;
  onSelectFile?: (filePath: string) => void;
}

export const GitTrackPanel: React.FC<GitTrackPanelProps> = ({
  projectName,
  onSelectFile,
}) => {
  const git = useGitManager(projectName);

  if (git.data && !git.data.isGitRepo) {
    return (
      <GitInitView
        projectName={projectName}
        isInitializing={git.isInitializing}
        onInit={git.handleInitGit}
      />
    );
  }

  const stagedFiles = git.data?.staged || [];
  const unstagedFiles = git.data?.unstaged || [];

  return (
    <div className="flex flex-col gap-2.5 select-none text-xs">
      {/* 1. Branch Toolbar & Dropdown */}
      <div
        className="relative pb-1.5 border-b border-zinc-200 dark:border-zinc-800"
        ref={git.branchMenuRef}
      >
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={git.handleToggleBranchMenu}
            className="flex items-center gap-1.5 px-2 py-1 -ml-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800/80 font-semibold text-zinc-800 dark:text-zinc-200 transition-colors max-w-[200px]"
            title="Click to switch or create branch"
          >
            <GitBranch className="size-3.5 text-[#4078f2] dark:text-[#61afef] shrink-0" />
            <span className="font-mono text-xs truncate">
              {git.data?.branch || "main"}
            </span>
            <ChevronDown className="size-3 text-zinc-400 shrink-0" />
          </button>

          <button
            type="button"
            onClick={git.fetchStatus}
            disabled={git.loading}
            title="Refresh Git Status"
            className="p-1 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <RefreshCw
              className={`size-3 ${git.loading ? "animate-spin text-[#4078f2] dark:text-[#61afef]" : ""}`}
            />
          </button>
        </div>

        <GitBranchModal
          isOpen={git.isBranchMenuOpen}
          onClose={() => git.setIsBranchMenuOpen(false)}
          currentBranch={git.data?.branch || "main"}
          branches={git.branchesData?.branches || []}
          branchActionLoading={git.branchActionLoading}
          branchError={git.branchError}
          onCheckoutBranch={git.handleCheckoutBranch}
          onCreateBranch={git.handleCreateBranch}
        />
      </div>

      {/* 2. Commit Box & Staging List */}
      <GitStagingList
        projectName={projectName}
        stagedFiles={stagedFiles}
        unstagedFiles={unstagedFiles}
        commitMessage={git.commitMessage}
        isCommitting={git.isCommitting}
        commitError={git.commitError}
        onChangeCommitMessage={git.setCommitMessage}
        onCommit={git.handleCommit}
        onStageFile={git.handleStageFile}
        onStageAll={git.handleStageAll}
        onUnstageFile={git.handleUnstageFile}
        onUnstageAll={git.handleUnstageAll}
        onDiscardFile={git.handleDiscardFile}
        onSelectFile={onSelectFile}
      />

      {/* 3. Commit Graph */}
      <GitCommitGraphCanvas
        commits={git.commits}
        loading={git.graphLoading}
        onRefresh={git.fetchGitLog}
      />
    </div>
  );
};
