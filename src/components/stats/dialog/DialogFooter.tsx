import React from "react";
import {
  HelpCircle,
  Ruler,
  BarChart2,
  Tag,
  RotateCcw,
  Loader2,
  Play,
} from "lucide-react";

export interface DialogFooterProps {
  onReset: () => void;
  onClose: () => void;
  onRun: () => void;
  loading: boolean;
}

export const DialogFooter: React.FC<DialogFooterProps> = ({
  onReset,
  onClose,
  onRun,
  loading,
}) => {
  return (
    <div className="px-4 py-2 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50 dark:bg-zinc-950">
      <div className="flex items-center gap-2 text-[10px] text-zinc-400">
        <HelpCircle className="w-3 h-3 text-zinc-400 shrink-0" />
        <span>Click badges to cycle:</span>
        <span className="inline-flex items-center gap-0.5 font-medium text-amber-600 dark:text-amber-400">
          <Ruler className="w-2.5 h-2.5" /> Scale
        </span>
        <span className="inline-flex items-center gap-0.5 font-medium text-blue-600 dark:text-blue-400">
          <BarChart2 className="w-2.5 h-2.5" /> Ordinal
        </span>
        <span className="inline-flex items-center gap-0.5 font-medium text-purple-600 dark:text-purple-400">
          <Tag className="w-2.5 h-2.5" /> Nominal
        </span>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onReset}
          disabled={loading}
          title="Clear all selected variables and restore default options"
          className="px-2.5 py-1 text-[11px] font-medium rounded border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 hover:text-red-600 dark:hover:text-red-400 transition flex items-center gap-1"
        >
          <RotateCcw className="w-3 h-3" />
          <span>Reset Slots</span>
        </button>
        <button
          onClick={onClose}
          disabled={loading}
          className="px-3 py-1 text-[11px] font-medium rounded text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition"
        >
          Cancel
        </button>
        <button
          onClick={onRun}
          disabled={loading}
          className="px-3 py-1 text-[11px] font-medium rounded bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-1 shadow-xs transition disabled:opacity-50"
        >
          {loading ? (
            <Loader2 className="w-3 h-3 animate-spin mr-1" />
          ) : (
            <Play className="w-3 h-3 fill-current" />
          )}
          Run Analysis
        </button>
      </div>
    </div>
  );
};
