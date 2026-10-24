import { useState, useCallback, useEffect, useRef } from "react";
import { apiClient } from "../../../services/api";
import {
  GitStatusData,
  GitBranchesData,
  GitCommitGraphNode,
  GitLogResponse,
} from "./gitTypes";

export function useGitManager(projectName: string) {
  const [data, setData] = useState<GitStatusData | null>(null);
  const [loading, setLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);

  // Commit state
  const [commitMessage, setCommitMessage] = useState("");
  const [isCommitting, setIsCommitting] = useState(false);
  const [commitError, setCommitError] = useState<string | null>(null);

  // Branch state
  const [isBranchMenuOpen, setIsBranchMenuOpen] = useState(false);
  const [branchesData, setBranchesData] = useState<GitBranchesData | null>(
    null,
  );
  const [branchActionLoading, setBranchActionLoading] = useState(false);
  const [branchError, setBranchError] = useState<string | null>(null);
  const branchMenuRef = useRef<HTMLDivElement>(null);

  // Commit Graph state
  const [commits, setCommits] = useState<GitCommitGraphNode[]>([]);
  const [graphLoading, setGraphLoading] = useState(false);

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

  const handleToggleBranchMenu = () => {
    if (!isBranchMenuOpen) {
      fetchBranches();
    }
    setIsBranchMenuOpen((prev) => !prev);
    setBranchError(null);
  };

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

  const handleCreateBranch = async (branchName: string) => {
    setBranchError(null);
    try {
      await apiClient.post<{ success: boolean }>(
        `/api/projects/${encodeURIComponent(projectName)}/git/branch/create`,
        { name: branchName, checkout: true },
      );
      setIsBranchMenuOpen(false);
      await fetchStatus();
      await fetchBranches();
      await fetchGitLog();
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Failed to create new branch.";
      setBranchError(msg);
      throw err;
    }
  };

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

  const runGitPost = async (
    endpoint: string,
    body: Record<string, unknown>,
    defaultErr: string,
  ) => {
    try {
      await apiClient.post(
        `/api/projects/${encodeURIComponent(projectName)}/git/${endpoint}`,
        body,
      );
      await fetchStatus();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : defaultErr);
    }
  };

  const handleStageFile = (path: string, e: React.MouseEvent) => {
    e.stopPropagation();
    runGitPost("stage", { file: path }, "Failed to stage file.");
  };

  const handleStageAll = (e: React.MouseEvent) => {
    e.stopPropagation();
    runGitPost("stage", { all: true }, "Failed to stage all files.");
  };

  const handleUnstageFile = (path: string, e: React.MouseEvent) => {
    e.stopPropagation();
    runGitPost("unstage", { file: path }, "Failed to unstage file.");
  };

  const handleUnstageAll = (e: React.MouseEvent) => {
    e.stopPropagation();
    runGitPost("unstage", { all: true }, "Failed to unstage all files.");
  };

  const handleDiscardFile = async (path: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const ok = window.confirm(
      `Discard all changes in "${path}"? Local changes will be lost.`,
    );
    if (!ok) return;
    runGitPost("discard", { file: path }, "Failed to discard file changes.");
  };

  return {
    data,
    loading,
    isInitializing,
    commits,
    graphLoading,
    commitMessage,
    isCommitting,
    commitError,
    setCommitMessage,
    isBranchMenuOpen,
    setIsBranchMenuOpen,
    branchesData,
    branchActionLoading,
    branchError,
    branchMenuRef,
    fetchStatus,
    fetchBranches,
    fetchGitLog,
    handleInitGit,
    handleToggleBranchMenu,
    handleCheckoutBranch,
    handleCreateBranch,
    handleCommit,
    handleStageFile,
    handleStageAll,
    handleUnstageFile,
    handleUnstageAll,
    handleDiscardFile,
  };
}
