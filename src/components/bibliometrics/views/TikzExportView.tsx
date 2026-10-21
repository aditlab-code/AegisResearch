import React, { useState } from "react";
import {
  ThematicMapResponse,
  BibliometricLawsResponse,
} from "../../../types/bibliometrics";

interface TikzExportViewProps {
  thematic: ThematicMapResponse | null;
  laws: BibliometricLawsResponse | null;
  onInsertLatex: (code: string) => void;
  onClose: () => void;
}

export const TikzExportView: React.FC<TikzExportViewProps> = ({
  thematic,
  laws,
  onInsertLatex,
  onClose,
}) => {
  const [selectedType, setSelectedType] = useState<"thematic" | "bradford">(
    "thematic",
  );
  const [copied, setCopied] = useState(false);
  const [inserted, setInserted] = useState(false);

  const activeTikzCode =
    selectedType === "thematic"
      ? thematic?.tikz_code || "% Thematic Map TikZ code unavailable"
      : laws?.bradford_tikz || "% Bradford Law TikZ code unavailable";

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(activeTikzCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  const handleInsert = () => {
    onInsertLatex(activeTikzCode);
    setInserted(true);
    setTimeout(() => {
      setInserted(false);
      onClose();
    }, 1000);
  };

  return (
    <div className="flex-1 relative w-full h-full bg-white dark:bg-gray-950 overflow-hidden flex flex-col p-6 space-y-4 max-w-4xl mx-auto">
      {/* Header & Controls */}
      <div className="flex items-center justify-between pb-3 border-b border-gray-200 dark:border-gray-800">
        <div>
          <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">
            LaTeX TikZ & PGFPlots Vector Export
          </h3>
          <p className="text-xs text-gray-500">
            Native standalone PGFPlots figure code for your LaTeX journal
            manuscript.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Target Toggle */}
          <div className="flex rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 p-0.5 text-xs">
            <button
              type="button"
              onClick={() => setSelectedType("thematic")}
              className={`px-3 py-1 font-semibold rounded-md transition-colors ${
                selectedType === "thematic"
                  ? "bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm"
                  : "text-gray-600 dark:text-gray-400"
              }`}
            >
              Thematic Map
            </button>
            <button
              type="button"
              onClick={() => setSelectedType("bradford")}
              className={`px-3 py-1 font-semibold rounded-md transition-colors ${
                selectedType === "bradford"
                  ? "bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm"
                  : "text-gray-600 dark:text-gray-400"
              }`}
            >
              Bradford Law
            </button>
          </div>

          <button
            type="button"
            onClick={handleCopy}
            className="px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-2xs"
          >
            {copied ? "Copied!" : "Copy Code"}
          </button>

          <button
            type="button"
            onClick={handleInsert}
            className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition-all"
          >
            {inserted ? "Inserted into Document!" : "Insert into LaTeX"}
          </button>
        </div>
      </div>

      {/* Code Area */}
      <div className="flex-1 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 p-4 font-mono text-xs overflow-auto select-all text-gray-800 dark:text-gray-200 leading-relaxed">
        <pre className="whitespace-pre">{activeTikzCode}</pre>
      </div>

      <div className="text-[11px] text-gray-400">
        Requires <code>\usepackage&#123;pgfplots&#125;</code> and{" "}
        <code>\usepackage&#123;tikz&#125;</code> in your LaTeX preamble.
      </div>
    </div>
  );
};
