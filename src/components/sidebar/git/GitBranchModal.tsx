import React, { useState } from "react";
import { X, Check } from "lucide-react";

export interface GitBranchModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentBranch: string | null;
  branches: string[];
  branchActionLoading: boolean;
  branchError: string | null;
  onCheckoutBranch: (branch: string) => void;
  onCreateBranch: (branchName: string) => Promise<void> | void;
}

export const GitBranchModal: React.FC<GitBranchModalProps> = ({
  isOpen,
  onClose,
  currentBranch,
  branches,
  branchActionLoading,
  branchError,
  onCheckoutBranch,
  onCreateBranch,
}) => {
  const [newBranchName, setNewBranchName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newBranchName.trim();
    if (!trimmed) return;

    setIsSubmitting(true);
    try {
      await onCreateBranch(trimmed);
      setNewBranchName("");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="absolute left-0 top-full mt-1 w-full min-w-[220px] bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-md shadow-lg z-50 p-2 text-xs flex flex-col gap-2">
      {/* Header */}
      <div className="flex items-center justify-between font-semibold text-[11px] text-zinc-500 dark:text-zinc-400 border-b border-zinc-100 dark:border-zinc-700/60 pb-1">
        <span>SWITCH BRANCH</span>
        <button
          type="button"
          onClick={onClose}
          className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
          title="Close"
        >
          <X className="size-3" />
        </button>
      </div>

      {/* Error notification */}
      {branchError && (
        <div className="p-1.5 text-[10px] text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded">
          {branchError}
        </div>
      )}

      {/* Existing branches list */}
      <div className="max-h-36 overflow-y-auto space-y-0.5">
        {branches.map((b) => {
          const isCurrent = b === currentBranch;
          return (
            <button
              key={b}
              type="button"
              disabled={branchActionLoading}
              onClick={() => onCheckoutBranch(b)}
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
        onSubmit={handleSubmit}
        className="pt-1.5 border-t border-zinc-100 dark:border-zinc-700/60 flex gap-1"
      >
        <input
          type="text"
          placeholder="Create new branch..."
          value={newBranchName}
          onChange={(e) => setNewBranchName(e.target.value)}
          disabled={isSubmitting}
          className="flex-1 min-w-0 px-2 py-1 text-[11px] bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:border-[#4078f2] dark:focus:border-[#61afef]"
        />
        <button
          type="submit"
          disabled={isSubmitting || !newBranchName.trim()}
          className="px-2 py-1 bg-[#4078f2] hover:bg-[#3362c4] dark:bg-[#61afef] dark:hover:bg-[#528bff] disabled:opacity-50 text-white dark:text-zinc-950 rounded text-[11px] font-semibold transition-colors shrink-0"
        >
          {isSubmitting ? "..." : "+ Create"}
        </button>
      </form>
    </div>
  );
};
