import React from "react";
import { Table, Copy, Check, FileText, CheckCircle } from "lucide-react";
import { TableStyle } from "../../../types/stats";

export interface LatexTableSectionProps {
  activeTableCode: string;
  tableStyle: TableStyle;
  onTableStyleChange: (style: TableStyle) => void;
  onCopyLatex: () => void;
  copied: boolean;
}

export const LatexTableSection: React.FC<LatexTableSectionProps> = ({
  activeTableCode,
  tableStyle,
  onTableStyleChange,
  onCopyLatex,
  copied,
}) => {
  return (
    <div className="border border-zinc-200 dark:border-zinc-800 rounded overflow-hidden bg-zinc-950 text-zinc-200">
      <div className="px-3 py-1.5 border-b border-zinc-800 flex items-center justify-between text-[11px] font-mono text-zinc-400 bg-zinc-900/60 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 text-zinc-300 font-semibold">
            <Table className="w-3.5 h-3.5 text-indigo-400" />
            <span>Table Style:</span>
          </span>
          <div className="flex items-center gap-1 bg-zinc-800/80 p-0.5 rounded border border-zinc-700/60">
            <button
              type="button"
              onClick={() => onTableStyleChange("apa")}
              className={`px-2 py-0.5 rounded text-[10px] font-medium transition ${
                tableStyle === "apa"
                  ? "bg-indigo-600 text-white font-semibold shadow-xs"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              APA 7th
            </button>
            <button
              type="button"
              onClick={() => onTableStyleChange("ieee")}
              className={`px-2 py-0.5 rounded text-[10px] font-medium transition ${
                tableStyle === "ieee"
                  ? "bg-indigo-600 text-white font-semibold shadow-xs"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              IEEE Style
            </button>
            <button
              type="button"
              onClick={() => onTableStyleChange("classic")}
              className={`px-2 py-0.5 rounded text-[10px] font-medium transition ${
                tableStyle === "classic"
                  ? "bg-indigo-600 text-white font-semibold shadow-xs"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              Classic
            </button>
          </div>
        </div>
        <button
          onClick={onCopyLatex}
          className="flex items-center gap-1 text-zinc-300 hover:text-white transition"
        >
          {copied ? (
            <Check className="w-3 h-3 text-emerald-400" />
          ) : (
            <Copy className="w-3 h-3" />
          )}
          {copied ? "Copied" : "Copy Code"}
        </button>
      </div>
      <pre className="p-3 text-[10px] font-mono overflow-x-auto leading-relaxed text-zinc-300 max-h-40">
        {activeTableCode}
      </pre>
    </div>
  );
};

export interface LatexTableFooterProps {
  tableStyle: TableStyle;
  onCopyLatex: () => void;
  onInsertLatex: () => void;
  copied: boolean;
  inserted: boolean;
}

export const LatexTableFooter: React.FC<LatexTableFooterProps> = ({
  tableStyle,
  onCopyLatex,
  onInsertLatex,
  copied,
  inserted,
}) => {
  return (
    <div className="px-4 py-2 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50 dark:bg-zinc-950">
      <div className="text-[10px] text-zinc-400">
        {tableStyle === "apa" && (
          <span>
            APA 7th publication-ready format with{" "}
            <code className="text-indigo-600 dark:text-indigo-400">
              booktabs
            </code>
          </span>
        )}
        {tableStyle === "ieee" && (
          <span>
            IEEE Transactions format with{" "}
            <code className="text-indigo-600 dark:text-indigo-400">
              small caps &amp; technical metrics
            </code>
          </span>
        )}
        {tableStyle === "classic" && (
          <span>
            Standard LaTeX bordered format with{" "}
            <code className="text-indigo-600 dark:text-indigo-400">
              \hline &amp; vertical borders
            </code>
          </span>
        )}
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={onCopyLatex}
          className="px-2.5 py-1 text-[11px] font-medium rounded border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 transition flex items-center gap-1"
        >
          {copied ? (
            <Check className="w-3 h-3 text-emerald-500" />
          ) : (
            <Copy className="w-3 h-3" />
          )}
          {copied ? "Copied!" : "Copy LaTeX"}
        </button>
        <button
          onClick={onInsertLatex}
          className="px-3 py-1 text-[11px] font-medium rounded bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-1 shadow-xs transition"
        >
          {inserted ? (
            <CheckCircle className="w-3 h-3" />
          ) : (
            <FileText className="w-3 h-3" />
          )}
          {inserted ? "Inserted to Document!" : "Insert to LaTeX Document"}
        </button>
      </div>
    </div>
  );
};
