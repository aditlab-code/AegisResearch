import React, { useEffect, useState, useCallback, useRef } from "react";
import {
  GitBranch,
  RefreshCw,
  FileText,
  ChevronDown,
  ChevronRight,
  Plus,
  Minus,
  RotateCcw,
  PlusCircle,
  FolderGit2,
  Check,
  AlertCircle,
  X,
  GitCommit,
} from "lucide-react";
import { apiClient } from "../../services/api";
import { GitCommitNode, GitLogResponse } from "../../types";

const LANE_COLORS = [
  "#4078f2",
  "#98c379",
  "#e5c07b",
  "#c678dd",
  "#e06c75",
  "#56b6c2",
];

interface GitFileChange {
  status: string;
  path: string;
  staged: boolean;
}

interface GitStatusData {
  isGitRepo: boolean;
  branch: string | null;
  modifiedCount: number;
  files: GitFileChange[];
  staged: GitFileChange[];
  unstaged: GitFileChange[];
}

interface GitBranchesData {
  branches: string[];
  current: string;
}

export interface GitTrackPanelProps {
  projectName: string;
  onSelectFile?: (filePath: string) => void;
}

export const GitTrackPanel: React.FC<GitTrackPanelProps> = ({
  projectName,
  onSelectFile,
}) => {
  const [data, setData] = useState<GitStatusData | null>(null);
  const [loading, setLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);

  // Commit state
  const [commitMessage, setCommitMessage] = useState("");
  const [isCommitting, setIsCommitting] = useState(false);
  const [commitError, setCommitError] = useState<string | null>(null);

  // Branch management state
  const [isBranchMenuOpen, setIsBranchMenuOpen] = useState(false);
  const [branchesData, setBranchesData] = useState<GitBranchesData | null>(
    null,
  );
  const [newBranchName, setNewBranchName] = useState("");
  const [isCreatingBranch, setIsCreatingBranch] = useState(false);
  const [branchActionLoading, setBranchActionLoading] = useState(false);
  const [branchError, setBranchError] = useState<string | null>(null);
  const branchMenuRef = useRef<HTMLDivElement>(null);

  // Diff state
  const [activeDiffFile, setActiveDiffFile] = useState<{
    path: string;
    staged: boolean;
  } | null>(null);
  const [selectedFileDiff, setSelectedFileDiff] = useState<string | null>(null);
  const [diffLoading, setDiffLoading] = useState(false);

  // Section collapse state
  const [isStagedOpen, setIsStagedOpen] = useState(true);
  const [isChangesOpen, setIsChangesOpen] = useState(true);
  const [isGraphOpen, setIsGraphOpen] = useState(true);

  // Commit Graph state
  const [commits, setCommits] = useState<GitCommitNode[]>([]);
  const [graphLoading, setGraphLoading] = useState(false);
  const [selectedCommitHash, setSelectedCommitHash] = useState<string | null>(
    null,
  );

  // Fetch status
  const fetchStatus = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.get<GitStatusData>(
        `/api/projects/${encodeURIComponent(projectName)}/git/status`,
      );
      setData(res);
    } catch {
      setData({
        isGitRepo: false,
        branch: null,
        modifiedCount: 0,
        files: [],
        staged: [],
        unstaged: [],
      });
    } finally {
      setLoading(false);
    }
  }, [projectName]);

  // Fetch branches
  const fetchBranches = useCallback(async () => {
    try {
      const res = await apiClient.get<GitBranchesData>(
        `/api/projects/${encodeURIComponent(projectName)}/git/branches`,
      );
      setBranchesData(res);
    } catch {
      // ignore
    }
  }, [projectName]);

  // Fetch git log
  const fetchGitLog = useCallback(async () => {
    setGraphLoading(true);
    try {
      const res = await apiClient.get<GitLogResponse>(
        `/api/projects/${encodeURIComponent(projectName)}/git/log`,
      );
      setCommits(res.commits || []);
    } catch {
      setCommits([]);
    } finally {
      setGraphLoading(false);
    }
  }, [projectName]);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  useEffect(() => {
    if (data?.isGitRepo) {
      fetchGitLog();
    }
  }, [data?.isGitRepo, fetchGitLog]);

  // Close branch dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        branchMenuRef.current &&
        !branchMenuRef.current.contains(e.target as Node)
      ) {
        setIsBranchMenuOpen(false);
        setBranchError(null);
      }
    };
    if (isBranchMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isBranchMenuOpen]);

  // Initialize Git repo
  const handleInitGit = async () => {
    setIsInitializing(true);
    try {
      await apiClient.post<{ success: boolean }>(
        `/api/projects/${encodeURIComponent(projectName)}/git/init`,
      );
      await fetchStatus();
      await fetchGitLog();
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : "Failed to initialize Git repository.";
      alert(msg);
    } finally {
      setIsInitializing(false);
    }
  };

  // Toggle branch menu
  const handleToggleBranchMenu = () => {
    if (!isBranchMenuOpen) {
      fetchBranches();
    }
    setIsBranchMenuOpen((prev) => !prev);
    setBranchError(null);
  };

  // Checkout existing branch
  const handleCheckoutBranch = async (branch: string) => {
    if (branch === data?.branch) {
      setIsBranchMenuOpen(false);
      return;
    }
    setBranchActionLoading(true);
    setBranchError(null);
    try {
      await apiClient.post<{ success: boolean }>(
        `/api/projects/${encodeURIComponent(projectName)}/git/checkout`,
        { branch },
      );
      setIsBranchMenuOpen(false);
      await fetchStatus();
      await fetchBranches();
      await fetchGitLog();
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Failed to switch branch.";
      setBranchError(msg);
    } finally {
      setBranchActionLoading(false);
    }
  };

  // Create new branch
  const handleCreateBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newBranchName.trim();
    if (!trimmed) return;

    setIsCreatingBranch(true);
    setBranchError(null);
    try {
      await apiClient.post<{ success: boolean }>(
        `/api/projects/${encodeURIComponent(projectName)}/git/branch/create`,
        { name: trimmed, checkout: true },
      );
      setNewBranchName("");
      setIsBranchMenuOpen(false);
      await fetchStatus();
      await fetchBranches();
      await fetchGitLog();
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Failed to create new branch.";
      setBranchError(msg);
    } finally {
      setIsCreatingBranch(false);
    }
  };

  // Commit changes (with Smart Commit)
  const handleCommit = async () => {
    const trimmed = commitMessage.trim();
    if (!trimmed) {
      setCommitError("Please enter a commit message.");
      return;
    }

    setIsCommitting(true);
    setCommitError(null);
    try {
      await apiClient.post<{ success: boolean }>(
        `/api/projects/${encodeURIComponent(projectName)}/git/commit`,
        { message: trimmed, smartCommit: true },
      );
      setCommitMessage("");
      setActiveDiffFile(null);
      setSelectedFileDiff(null);
      await fetchStatus();
      await fetchGitLog();
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Failed to execute commit.";
      setCommitError(msg);
    } finally {
      setIsCommitting(false);
    }
  };

  // Stage single file
  const handleStageFile = async (path: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await apiClient.post(
        `/api/projects/${encodeURIComponent(projectName)}/git/stage`,
        {
          file: path,
        },
      );
      await fetchStatus();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to stage file.";
      alert(msg);
    }
  };

  // Stage all
  const handleStageAll = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await apiClient.post(
        `/api/projects/${encodeURIComponent(projectName)}/git/stage`,
        {
          all: true,
        },
      );
      await fetchStatus();
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Failed to stage all files.";
      alert(msg);
    }
  };

  // Unstage single file
  const handleUnstageFile = async (path: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await apiClient.post(
        `/api/projects/${encodeURIComponent(projectName)}/git/unstage`,
        {
          file: path,
        },
      );
      await fetchStatus();
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Failed to unstage file.";
      alert(msg);
    }
  };

  // Unstage all
  const handleUnstageAll = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await apiClient.post(
        `/api/projects/${encodeURIComponent(projectName)}/git/unstage`,
        {
          all: true,
        },
      );
      await fetchStatus();
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Failed to unstage all files.";
      alert(msg);
    }
  };

  // Discard file changes
  const handleDiscardFile = async (path: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const ok = window.confirm(
      `Discard all changes in "${path}"? Local changes will be lost.`,
    );
    if (!ok) return;

    try {
      await apiClient.post(
        `/api/projects/${encodeURIComponent(projectName)}/git/discard`,
        {
          file: path,
        },
      );
      if (activeDiffFile?.path === path) {
        setActiveDiffFile(null);
        setSelectedFileDiff(null);
      }
      await fetchStatus();
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Failed to discard file changes.";
      alert(msg);
    }
  };

  // Fetch diff
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

  // CASE 1: NOT A GIT REPO -> INITIALIZE UI
  if (data && !data.isGitRepo) {
    return (
      <div className="flex flex-col items-center justify-center py-10 px-4 text-center select-none">
        <div className="size-12 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-500 mb-3">
          <FolderGit2 className="size-6 text-[#4078f2] dark:text-[#61afef]" />
        </div>
        <h4 className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 mb-1">
          Git Repository Not Initialized
        </h4>
        <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mb-4 leading-relaxed">
          Workspace "{projectName}" is not tracked with Git yet. Initialize now
          to track document revisions and history.
        </p>

        <button
          type="button"
          onClick={handleInitGit}
          disabled={isInitializing}
          className="w-full py-2 bg-[#4078f2] hover:bg-[#3362c4] dark:bg-[#61afef] dark:hover:bg-[#528bff] disabled:opacity-50 text-white dark:text-zinc-950 rounded-md text-xs font-semibold shadow-sm flex items-center justify-center gap-1.5 transition-colors"
        >
          {isInitializing ? (
            <>
              <RefreshCw className="size-3.5 animate-spin" />
              Initializing...
            </>
          ) : (
            <>
              <PlusCircle className="size-3.5" />
              Initialize Git Repository
            </>
          )}
        </button>
      </div>
    );
  }

  const stagedFiles = data?.staged || [];
  const unstagedFiles = data?.unstaged || [];
  const hasAnyChanges = stagedFiles.length > 0 || unstagedFiles.length > 0;

  return (
    <div className="flex flex-col gap-2.5 select-none text-xs">
      {/* 1. Branch Toolbar & Dropdown */}
      <div
        className="relative pb-1.5 border-b border-zinc-200 dark:border-zinc-800"
        ref={branchMenuRef}
      >
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={handleToggleBranchMenu}
            className="flex items-center gap-1.5 px-2 py-1 -ml-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800/80 font-semibold text-zinc-800 dark:text-zinc-200 transition-colors max-w-[200px]"
            title="Click to switch or create branch"
          >
            <GitBranch className="size-3.5 text-[#4078f2] dark:text-[#61afef] shrink-0" />
            <span className="font-mono text-xs truncate">
              {data?.branch || "main"}
            </span>
            <ChevronDown className="size-3 text-zinc-400 shrink-0" />
          </button>

          <button
            type="button"
            onClick={fetchStatus}
            disabled={loading}
            title="Refresh Git Status"
            className="p-1 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <RefreshCw
              className={`size-3 ${loading ? "animate-spin text-[#4078f2] dark:text-[#61afef]" : ""}`}
            />
          </button>
        </div>

        {/* Branch Popover Dropdown */}
        {isBranchMenuOpen && (
          <div className="absolute left-0 top-full mt-1 w-full min-w-[220px] bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-md shadow-lg z-50 p-2 text-xs flex flex-col gap-2">
            <div className="flex items-center justify-between font-semibold text-[11px] text-zinc-500 dark:text-zinc-400 border-b border-zinc-100 dark:border-zinc-700/60 pb-1">
              <span>SWITCH BRANCH</span>
              <button
                type="button"
                onClick={() => setIsBranchMenuOpen(false)}
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
              >
                <X className="size-3" />
              </button>
            </div>

            {branchError && (
              <div className="p-1.5 text-[10px] text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded">
                {branchError}
              </div>
            )}

            {/* Existing branches list */}
            <div className="max-h-36 overflow-y-auto space-y-0.5">
              {branchesData?.branches.map((b) => {
                const isCurrent = b === data?.branch;
                return (
                  <button
                    key={b}
                    type="button"
                    disabled={branchActionLoading}
                    onClick={() => handleCheckoutBranch(b)}
                    className={`w-full flex items-center justify-between px-2 py-1 rounded text-left transition-colors font-mono text-[11px] ${
                      isCurrent
                        ? "bg-blue-50 dark:bg-zinc-700 text-[#4078f2] dark:text-[#61afef] font-bold"
                        : "text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700/60"
                    }`}
                  >
                    <span className="truncate">{b}</span>
                    {isCurrent && <Check className="size-3 shrink-0" />}
                  </button>
                );
              })}
            </div>

            {/* Create new branch form */}
            <form
              onSubmit={handleCreateBranch}
              className="pt-1.5 border-t border-zinc-100 dark:border-zinc-700/60 flex gap-1"
            >
              <input
                type="text"
                placeholder="Create new branch..."
                value={newBranchName}
                onChange={(e) => setNewBranchName(e.target.value)}
                disabled={isCreatingBranch}
                className="flex-1 min-w-0 px-2 py-1 text-[11px] bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:border-[#4078f2] dark:focus:border-[#61afef]"
              />
              <button
                type="submit"
                disabled={isCreatingBranch || !newBranchName.trim()}
                className="px-2 py-1 bg-[#4078f2] hover:bg-[#3362c4] dark:bg-[#61afef] dark:hover:bg-[#528bff] disabled:opacity-50 text-white dark:text-zinc-950 rounded text-[11px] font-semibold transition-colors shrink-0"
              >
                {isCreatingBranch ? "..." : "+ Create"}
              </button>
            </form>
          </div>
        )}
      </div>

      {/* 2. Commit Box & Actions */}
      <div className="flex flex-col gap-1.5 p-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-md shadow-2xs">
        <textarea
          rows={2}
          value={commitMessage}
          onChange={(e) => setCommitMessage(e.target.value)}
          onKeyDown={(e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
              e.preventDefault();
              handleCommit();
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
          onClick={handleCommit}
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

      {/* 3. STAGED CHANGES Section */}
      {stagedFiles.length > 0 && (
        <div className="flex flex-col gap-1 mt-1">
          <div className="flex items-center justify-between text-[11px] font-semibold text-zinc-600 dark:text-zinc-400 px-1">
            <button
              type="button"
              onClick={() => setIsStagedOpen((prev) => !prev)}
              className="flex items-center gap-1 hover:text-zinc-900 dark:hover:text-zinc-200"
            >
              {isStagedOpen ? (
                <ChevronDown className="size-3.5" />
              ) : (
                <ChevronRight className="size-3.5" />
              )}
              <span>STAGED CHANGES</span>
              <span className="font-mono bg-zinc-200/80 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 px-1.5 py-0.2 rounded-full text-[10px] ml-1">
                {stagedFiles.length}
              </span>
            </button>

            <button
              type="button"
              onClick={handleUnstageAll}
              title="Unstage All Changes"
              className="p-0.5 rounded text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors"
            >
              <Minus className="size-3.5" />
            </button>
          </div>

          {isStagedOpen && (
            <div className="space-y-1">
              {stagedFiles.map((f) => {
                const isExpanded =
                  activeDiffFile?.path === f.path &&
                  activeDiffFile.staged === true;
                return (
                  <div
                    key={`staged-${f.path}`}
                    className="flex flex-col border border-zinc-200 dark:border-zinc-800 rounded-md overflow-hidden bg-white dark:bg-zinc-900"
                  >
                    <div className="flex items-center justify-between p-1.5 hover:bg-zinc-50 dark:hover:bg-zinc-800/60 transition-colors">
                      <button
                        type="button"
                        onClick={() => onSelectFile?.(f.path)}
                        className="flex items-center gap-1.5 min-w-0 text-left flex-1"
                        title={f.path}
                      >
                        <FileText className="size-3.5 text-zinc-400 shrink-0" />
                        <span className="truncate text-xs text-zinc-800 dark:text-zinc-200">
                          {f.path}
                        </span>
                      </button>

                      <div className="flex items-center gap-1 shrink-0">
                        <span className="text-[9px] font-mono font-bold px-1 rounded text-emerald-600 dark:text-emerald-400 bg-emerald-500/10">
                          {f.status}
                        </span>

                        <button
                          type="button"
                          onClick={(e) => handleToggleDiff(f.path, true, e)}
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

                        <button
                          type="button"
                          onClick={(e) => handleUnstageFile(f.path, e)}
                          title="Unstage File (-)"
                          className="p-0.5 rounded text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                        >
                          <Minus className="size-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Inline Diff Accordion */}
                    {isExpanded && (
                      <div className="p-2 bg-zinc-50 dark:bg-zinc-950 font-mono text-[10px] overflow-x-auto max-h-48 border-t border-zinc-200 dark:border-zinc-800">
                        {diffLoading ? (
                          <div className="text-zinc-400 animate-pulse">
                            Loading diff...
                          </div>
                        ) : selectedFileDiff ? (
                          <div className="space-y-0.5 whitespace-pre">
                            {selectedFileDiff.split("\n").map((line, idx) => {
                              const isAdd =
                                line.startsWith("+") && !line.startsWith("+++");
                              const isDel =
                                line.startsWith("-") && !line.startsWith("---");
                              const isHeader = line.startsWith("@@");
                              return (
                                <div
                                  key={idx}
                                  className={
                                    isAdd
                                      ? "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1"
                                      : isDel
                                        ? "text-rose-600 dark:text-rose-400 bg-rose-500/10 px-1"
                                        : isHeader
                                          ? "text-sky-600 dark:text-sky-400 font-bold"
                                          : "text-zinc-600 dark:text-zinc-400"
                                  }
                                >
                                  {line || " "}
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="text-zinc-400">No text changes.</div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 4. CHANGES (Unstaged) Section */}
      <div className="flex flex-col gap-1 mt-1">
        <div className="flex items-center justify-between text-[11px] font-semibold text-zinc-600 dark:text-zinc-400 px-1">
          <button
            type="button"
            onClick={() => setIsChangesOpen((prev) => !prev)}
            className="flex items-center gap-1 hover:text-zinc-900 dark:hover:text-zinc-200"
          >
            {isChangesOpen ? (
              <ChevronDown className="size-3.5" />
            ) : (
              <ChevronRight className="size-3.5" />
            )}
            <span>CHANGES</span>
            <span className="font-mono bg-zinc-200/80 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 px-1.5 py-0.2 rounded-full text-[10px] ml-1">
              {unstagedFiles.length}
            </span>
          </button>

          {unstagedFiles.length > 0 && (
            <button
              type="button"
              onClick={handleStageAll}
              title="Stage All Changes (+)"
              className="p-0.5 rounded text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors"
            >
              <Plus className="size-3.5" />
            </button>
          )}
        </div>

        {isChangesOpen && (
          <div className="space-y-1">
            {unstagedFiles.length > 0 ? (
              unstagedFiles.map((f) => {
                const isExpanded =
                  activeDiffFile?.path === f.path &&
                  activeDiffFile.staged === false;
                const isM = f.status === "M";
                const isD = f.status === "D";
                return (
                  <div
                    key={`unstaged-${f.path}`}
                    className="flex flex-col border border-zinc-200 dark:border-zinc-800 rounded-md overflow-hidden bg-white dark:bg-zinc-900"
                  >
                    <div className="flex items-center justify-between p-1.5 hover:bg-zinc-50 dark:hover:bg-zinc-800/60 transition-colors">
                      <button
                        type="button"
                        onClick={() => onSelectFile?.(f.path)}
                        className="flex items-center gap-1.5 min-w-0 text-left flex-1"
                        title={f.path}
                      >
                        <FileText className="size-3.5 text-zinc-400 shrink-0" />
                        <span className="truncate text-xs text-zinc-800 dark:text-zinc-200">
                          {f.path}
                        </span>
                      </button>

                      <div className="flex items-center gap-1 shrink-0">
                        <span
                          className={`text-[9px] font-mono font-bold px-1 rounded ${
                            isM
                              ? "text-amber-500 bg-amber-500/10"
                              : isD
                                ? "text-rose-500 bg-rose-500/10"
                                : "text-emerald-500 bg-emerald-500/10"
                          }`}
                        >
                          {f.status}
                        </span>

                        <button
                          type="button"
                          onClick={(e) => handleToggleDiff(f.path, false, e)}
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

                        <button
                          type="button"
                          onClick={(e) => handleDiscardFile(f.path, e)}
                          title="Discard Changes"
                          className="p-0.5 rounded text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                        >
                          <RotateCcw className="size-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={(e) => handleStageFile(f.path, e)}
                          title="Stage File (+)"
                          className="p-0.5 rounded text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                        >
                          <Plus className="size-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Inline Diff Accordion */}
                    {isExpanded && (
                      <div className="p-2 bg-zinc-50 dark:bg-zinc-950 font-mono text-[10px] overflow-x-auto max-h-48 border-t border-zinc-200 dark:border-zinc-800">
                        {diffLoading ? (
                          <div className="text-zinc-400 animate-pulse">
                            Loading diff...
                          </div>
                        ) : selectedFileDiff ? (
                          <div className="space-y-0.5 whitespace-pre">
                            {selectedFileDiff.split("\n").map((line, idx) => {
                              const isAdd =
                                line.startsWith("+") && !line.startsWith("+++");
                              const isDel =
                                line.startsWith("-") && !line.startsWith("---");
                              const isHeader = line.startsWith("@@");
                              return (
                                <div
                                  key={idx}
                                  className={
                                    isAdd
                                      ? "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1"
                                      : isDel
                                        ? "text-rose-600 dark:text-rose-400 bg-rose-500/10 px-1"
                                        : isHeader
                                          ? "text-sky-600 dark:text-sky-400 font-bold"
                                          : "text-zinc-600 dark:text-zinc-400"
                                  }
                                >
                                  {line || " "}
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="text-zinc-400">No text changes.</div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="text-center py-6 text-zinc-400 dark:text-zinc-500 text-xs italic">
                No new changes in workspace.
              </div>
            )}
          </div>
        )}
      </div>

      {/* 5. COMMITS & GRAPH Section */}
      <div className="flex flex-col gap-1 mt-2 border-t border-zinc-200 dark:border-zinc-800 pt-2">
        <div className="flex items-center justify-between text-[11px] font-semibold text-zinc-600 dark:text-zinc-400 px-1">
          <button
            type="button"
            onClick={() => setIsGraphOpen((prev) => !prev)}
            className="flex items-center gap-1 hover:text-zinc-900 dark:hover:text-zinc-200"
          >
            {isGraphOpen ? (
              <ChevronDown className="size-3.5" />
            ) : (
              <ChevronRight className="size-3.5" />
            )}
            <GitCommit className="size-3 text-[#4078f2] dark:text-[#61afef]" />
            <span>COMMITS & GRAPH</span>
            <span className="font-mono bg-zinc-200/80 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 px-1.5 py-0.2 rounded-full text-[10px] ml-1">
              {commits.length}
            </span>
          </button>

          <button
            type="button"
            onClick={fetchGitLog}
            title="Refresh Commit Graph"
            className="p-0.5 rounded text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors"
          >
            <RefreshCw
              className={`size-3.5 ${graphLoading ? "animate-spin" : ""}`}
            />
          </button>
        </div>

        {isGraphOpen && (
          <div className="space-y-0.5 mt-1">
            {graphLoading && commits.length === 0 ? (
              <div className="text-[11px] text-zinc-400 animate-pulse px-2 py-3 text-center">
                Loading commits & graph...
              </div>
            ) : commits.length > 0 ? (
              <div className="flex flex-col divide-y divide-zinc-100 dark:divide-zinc-800/60 max-h-72 overflow-y-auto">
                {commits.map((c, idx) => {
                  const isSelected = selectedCommitHash === c.hash;
                  const color = LANE_COLORS[c.lane % LANE_COLORS.length];
                  const maxLane = Math.max(
                    ...commits.slice(0, 15).map((x) => x.lane),
                    0,
                  );
                  const svgWidth = Math.max((maxLane + 1) * 12 + 10, 24);
                  const cx = 8 + c.lane * 12;

                  return (
                    <div
                      key={c.hash}
                      onClick={() =>
                        setSelectedCommitHash(isSelected ? null : c.hash)
                      }
                      className={`flex items-start gap-1.5 py-1 px-1 rounded transition-colors cursor-pointer select-none ${
                        isSelected
                          ? "bg-blue-50/80 dark:bg-zinc-800/90"
                          : "hover:bg-zinc-100/70 dark:hover:bg-zinc-800/50"
                      }`}
                    >
                      {/* SVG Lane & Node Graph */}
                      <svg
                        width={svgWidth}
                        height={34}
                        className="shrink-0 overflow-visible"
                      >
                        {/* Top connection line */}
                        {idx > 0 && (
                          <line
                            x1={cx}
                            y1={0}
                            x2={cx}
                            y2={17}
                            stroke={color}
                            strokeWidth={2}
                          />
                        )}
                        {/* Bottom connection line */}
                        {idx < commits.length - 1 && (
                          <line
                            x1={cx}
                            y1={17}
                            x2={cx}
                            y2={34}
                            stroke={color}
                            strokeWidth={2}
                          />
                        )}
                        {/* Branch fork/merge curve if parents > 1 */}
                        {c.parents.length > 1 && (
                          <path
                            d={`M ${cx} 17 Q ${cx + 10} 25 ${cx + 12} 34`}
                            fill="none"
                            stroke={
                              LANE_COLORS[(c.lane + 1) % LANE_COLORS.length]
                            }
                            strokeWidth={1.5}
                            strokeDasharray="2 2"
                          />
                        )}
                        {/* Commit dot */}
                        {c.isHead && (
                          <circle
                            cx={cx}
                            cy={17}
                            r={6.5}
                            fill="none"
                            stroke={color}
                            strokeWidth={1.5}
                          />
                        )}
                        <circle
                          cx={cx}
                          cy={17}
                          r={c.isHead ? 3.5 : 3}
                          fill={color}
                          stroke="#ffffff"
                          strokeWidth={1}
                        />
                      </svg>

                      {/* Commit Details */}
                      <div className="flex-1 min-w-0 pr-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {c.refs.map((ref) => (
                            <span
                              key={ref}
                              className={`text-[9px] font-mono px-1 py-0.2 rounded font-semibold ${
                                ref.includes("HEAD")
                                  ? "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border border-blue-300 dark:border-blue-800"
                                  : "bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300"
                              }`}
                            >
                              {ref}
                            </span>
                          ))}
                          <span
                            className="text-xs text-zinc-800 dark:text-zinc-200 truncate font-medium flex-1"
                            title={c.message}
                          >
                            {c.message}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 text-[10px] text-zinc-400 dark:text-zinc-500 font-mono mt-0.5">
                          <span className="text-[#4078f2] dark:text-[#61afef] font-semibold">
                            {c.hash}
                          </span>
                          <span className="truncate">{c.author}</span>
                          <span className="ml-auto">{c.date}</span>
                        </div>

                        {isSelected && (
                          <div className="mt-1.5 p-1.5 bg-zinc-50 dark:bg-zinc-950 rounded border border-zinc-200 dark:border-zinc-800 text-[10px] space-y-0.5 font-mono">
                            <div>
                              <strong className="text-zinc-500">Hash:</strong>{" "}
                              {c.hash}
                            </div>
                            {c.parents.length > 0 && (
                              <div>
                                <strong className="text-zinc-500">
                                  Parents:
                                </strong>{" "}
                                {c.parents.join(", ")}
                              </div>
                            )}
                            <div>
                              <strong className="text-zinc-500">Author:</strong>{" "}
                              {c.author}
                            </div>
                            <div>
                              <strong className="text-zinc-500">Date:</strong>{" "}
                              {c.date}
                            </div>
                            <div className="pt-0.5 text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap font-sans">
                              {c.message}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-4 text-zinc-400 dark:text-zinc-500 text-xs italic">
                No commits found in repository.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
