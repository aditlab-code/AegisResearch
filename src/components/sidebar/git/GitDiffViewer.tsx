import React from "react";

export interface GitDiffViewerProps {
  diff: string | null;
  loading: boolean;
}

export const GitDiffViewer: React.FC<GitDiffViewerProps> = ({
  diff,
  loading,
}) => {
  if (loading) {
    return (
      <div className="p-2 bg-zinc-50 dark:bg-zinc-950 font-mono text-[10px] text-zinc-400 animate-pulse border-t border-zinc-200 dark:border-zinc-800">
        Loading diff...
      </div>
    );
  }

  if (!diff) {
    return (
      <div className="p-2 bg-zinc-50 dark:bg-zinc-950 font-mono text-[10px] text-zinc-400 border-t border-zinc-200 dark:border-zinc-800">
        No text changes.
      </div>
    );
  }

  return (
    <div className="p-2 bg-zinc-50 dark:bg-zinc-950 font-mono text-[10px] overflow-x-auto max-h-48 border-t border-zinc-200 dark:border-zinc-800 space-y-0.5 whitespace-pre">
      {diff.split("\n").map((line, idx) => {
        const isAdd = line.startsWith("+") && !line.startsWith("+++");
        const isDel = line.startsWith("-") && !line.startsWith("---");
        const isHeader = line.startsWith("@@");
        const cls = isAdd
          ? "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1"
          : isDel
            ? "text-rose-600 dark:text-rose-400 bg-rose-500/10 px-1"
            : isHeader
              ? "text-sky-600 dark:text-sky-400 font-bold"
              : "text-zinc-600 dark:text-zinc-400";
        return (
          <div key={idx} className={cls}>
            {line || " "}
          </div>
        );
      })}
    </div>
  );
};
