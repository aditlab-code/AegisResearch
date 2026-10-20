import React from "react";
import { GitBranch, Check, Circle, XCircle, AlertCircle } from "lucide-react";
import { DocKind } from "../../types";

export interface StatusBarProps {
  branch?: string;
  statusMessage?: string;
  wordCount: number;
  docKind: DocKind;
  encoding?: string;
  language?: string;
}

function renderStatusIcon(msg: string) {
  if (msg.includes("✓")) {
    return <Check className="size-3 text-emerald-400 shrink-0" />;
  }
  if (msg.includes("●")) {
    return <Circle className="size-2 fill-amber-400 text-amber-400 shrink-0" />;
  }
  if (
    msg.includes("✗") ||
    msg.toLowerCase().includes("fail") ||
    msg.toLowerCase().includes("error")
  ) {
    return <XCircle className="size-3 text-rose-400 shrink-0" />;
  }
  if (msg.includes("⚠️") || msg.toLowerCase().includes("offline")) {
    return <AlertCircle className="size-3 text-amber-400 shrink-0" />;
  }
  return null;
}

export const StatusBar: React.FC<StatusBarProps> = ({
  branch = "main",
  statusMessage = "Compiled 0 errors",
  wordCount,
  docKind,
  encoding = "UTF-8",
  language = "English (UK)",
}) => {
  return (
    <footer className="h-6 bg-zinc-100 dark:bg-zinc-950 border-t border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 text-[11px] flex items-center px-3 gap-4 shrink-0 select-none">
      <span className="flex items-center gap-1.5 hover:text-zinc-900 dark:hover:text-zinc-200 transition-colors cursor-pointer">
        <GitBranch className="size-3 text-zinc-400 dark:text-zinc-500" />
        <span>{branch}</span>
      </span>
      <span className="flex items-center gap-1.5">
        {renderStatusIcon(statusMessage)}
        <span className="text-zinc-700 dark:text-zinc-300">
          {statusMessage.replace(/^[✓●✗⚠️]\s*/, "")}
        </span>
      </span>
      <span className="ml-auto text-zinc-500 dark:text-zinc-400">
        {wordCount} words
      </span>
      <span>{docKind === "tex" ? "LaTeX" : "Markdown"}</span>
      <span>{encoding}</span>
      <span>{language}</span>
    </footer>
  );
};
