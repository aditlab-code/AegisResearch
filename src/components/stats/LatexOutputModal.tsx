import React, { useState } from "react";
import {
  X,
  TableProperties,
  Check,
  Copy,
  FileText,
  Sparkles,
  ExternalLink,
  BookOpen,
} from "lucide-react";
import { TableStyle } from "../../types/stats";

export interface LatexOutputModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedStyle: TableStyle;
  onSelectStyle: (style: TableStyle) => void;
  onInsertSample?: (latexCode: string) => void;
  onOpenLatestResults?: () => void;
  hasLatestResults?: boolean;
}

const SAMPLE_TABLES: Record<TableStyle, string> = {
  apa: `\\begin{table}[htbp]
  \\centering
  \\caption{Sample Statistical Summary in APA 7th Edition}
  \\label{tab:sample_apa}
  \\begin{tabular}{lrrrr}
    \\toprule
    Variable & $N$ & $M$ & $SD$ & $p$ \\\\
    \\midrule
    Treatment Group & 45 & 78.42 & 10.15 & < .001 \\\\
    Control Group   & 45 & 65.20 & 11.30 & - \\\\
    \\bottomrule
  \\end{tabular}
  \\par\\vspace{2pt}\\footnotesize{\\textit{Note.} * $p < .05$, ** $p < .01$, *** $p < .001$.}
\\end{table}`,
  ieee: `\\begin{table}[htbp]
  \\centering
  \\caption{\\textsc{Sample Statistical Summary in IEEE Style}}
  \\label{tab:sample_ieee}
  \\begin{tabular}{lrrrr}
    \\toprule
    Variable & Sample Size & Mean & Std. Dev. & p-Value \\\\
    \\midrule
    Treatment Group & 45 & 78.42 & 10.15 & < 0.001 \\\\
    Control Group   & 45 & 65.20 & 11.30 & - \\\\
    \\bottomrule
  \\end{tabular}
  \\par\\vspace{2pt}\\footnotesize{Note: * $p < 0.05$, ** $p < 0.01$, *** $p < 0.001$.}
\\end{table}`,
  classic: `\\begin{table}[htbp]
  \\centering
  \\caption{Sample Statistical Summary (Classic Bordered)}
  \\label{tab:sample_classic}
  \\begin{tabular}{|l|r|r|r|r|}
    \\hline
    Variable & N & Mean & SD & p-Value \\\\
    \\hline
    Treatment Group & 45 & 78.42 & 10.15 & < 0.001 \\\\
    Control Group   & 45 & 65.20 & 11.30 & - \\\\
    \\hline
  \\end{tabular}
\\end{table}`,
};

export const LatexOutputModal: React.FC<LatexOutputModalProps> = ({
  isOpen,
  onClose,
  selectedStyle,
  onSelectStyle,
  onInsertSample,
  onOpenLatestResults,
  hasLatestResults = false,
}) => {
  const [copied, setCopied] = useState(false);
  const [inserted, setInserted] = useState(false);

  if (!isOpen) return null;

  const currentSample = SAMPLE_TABLES[selectedStyle];

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(currentSample);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  const handleInsert = () => {
    if (!onInsertSample) return;
    onInsertSample(currentSample);
    setInserted(true);
    setTimeout(() => {
      setInserted(false);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh] overflow-hidden text-zinc-900 dark:text-zinc-100 text-xs">
        {/* Header */}
        <div className="px-4 py-2.5 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50 dark:bg-zinc-950">
          <div className="flex items-center gap-2">
            <TableProperties className="w-4 h-4 text-indigo-500 shrink-0" />
            <div>
              <h2 className="text-xs font-semibold tracking-tight text-zinc-800 dark:text-zinc-200">
                LaTeX Table Output Styles & Formats
              </h2>
              <p className="text-[10px] text-zinc-500 dark:text-zinc-400">
                Configure academic publication standard for generated LaTeX
                tables (APA 7th, IEEE, Classic)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 p-4 overflow-y-auto grid grid-cols-1 md:grid-cols-12 gap-4">
          {/* Left Column: Style Selection Cards */}
          <div className="md:col-span-6 flex flex-col gap-2.5">
            <label className="text-[10px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block">
              Select Output Style
            </label>

            <div className="space-y-2">
              {/* Option 1: APA 7th */}
              <button
                type="button"
                onClick={() => onSelectStyle("apa")}
                className={`w-full p-2.5 rounded-lg border text-left transition ${
                  selectedStyle === "apa"
                    ? "bg-indigo-50/70 dark:bg-indigo-950/40 border-indigo-500 text-indigo-900 dark:text-indigo-200 shadow-xs"
                    : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/60 text-zinc-700 dark:text-zinc-300"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <div
                      className={`w-2.5 h-2.5 rounded-full border ${selectedStyle === "apa" ? "bg-indigo-600 border-indigo-600" : "border-zinc-400"}`}
                    />
                    <span className="font-semibold text-xs">
                      APA 7th Edition
                    </span>
                  </div>
                  <span className="text-[9px] px-1.5 py-0.5 rounded font-mono bg-zinc-100 dark:bg-zinc-800 text-indigo-600 dark:text-indigo-400 border border-zinc-200 dark:border-zinc-700">
                    booktabs
                  </span>
                </div>
                <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-1 leading-relaxed">
                  Social Sciences, Psychology, Management, Education. Uses clean
                  horizontal rules without vertical borders and italicized
                  statistical notations (<i>M, SD, t, F, p</i>).
                </p>
              </button>

              {/* Option 2: IEEE Style */}
              <button
                type="button"
                onClick={() => onSelectStyle("ieee")}
                className={`w-full p-2.5 rounded-lg border text-left transition ${
                  selectedStyle === "ieee"
                    ? "bg-indigo-50/70 dark:bg-indigo-950/40 border-indigo-500 text-indigo-900 dark:text-indigo-200 shadow-xs"
                    : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/60 text-zinc-700 dark:text-zinc-300"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <div
                      className={`w-2.5 h-2.5 rounded-full border ${selectedStyle === "ieee" ? "bg-indigo-600 border-indigo-600" : "border-zinc-400"}`}
                    />
                    <span className="font-semibold text-xs">
                      IEEE Transactions
                    </span>
                  </div>
                  <span className="text-[9px] px-1.5 py-0.5 rounded font-mono bg-zinc-100 dark:bg-zinc-800 text-blue-600 dark:text-blue-400 border border-zinc-200 dark:border-zinc-700">
                    IEEEtran
                  </span>
                </div>
                <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-1 leading-relaxed">
                  Computer Science, Electrical &amp; Systems Engineering.
                  Centered small caps table captions (<code>\textsc</code>) with
                  upright technical metric labels (Mean, Std. Dev., t-Stat).
                </p>
              </button>

              {/* Option 3: Classic Bordered */}
              <button
                type="button"
                onClick={() => onSelectStyle("classic")}
                className={`w-full p-2.5 rounded-lg border text-left transition ${
                  selectedStyle === "classic"
                    ? "bg-indigo-50/70 dark:bg-indigo-950/40 border-indigo-500 text-indigo-900 dark:text-indigo-200 shadow-xs"
                    : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/60 text-zinc-700 dark:text-zinc-300"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <div
                      className={`w-2.5 h-2.5 rounded-full border ${selectedStyle === "classic" ? "bg-indigo-600 border-indigo-600" : "border-zinc-400"}`}
                    />
                    <span className="font-semibold text-xs">
                      Classic Bordered LaTeX
                    </span>
                  </div>
                  <span className="text-[9px] px-1.5 py-0.5 rounded font-mono bg-zinc-100 dark:bg-zinc-800 text-zinc-500 border border-zinc-200 dark:border-zinc-700">
                    \hline
                  </span>
                </div>
                <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-1 leading-relaxed">
                  Traditional standard LaTeX tables using full vertical column
                  borders (<code>|l|r|r|</code>) and standard horizontal rules (
                  <code>\hline</code>).
                </p>
              </button>
            </div>
          </div>

          {/* Right Column: Live Template Preview & Actions */}
          <div className="md:col-span-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                  Live LaTeX Template Preview
                </span>
                <button
                  type="button"
                  onClick={handleCopy}
                  className="text-[10px] text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 font-medium"
                >
                  {copied ? (
                    <Check className="w-3 h-3 text-emerald-500" />
                  ) : (
                    <Copy className="w-3 h-3" />
                  )}
                  <span>{copied ? "Copied" : "Copy Template"}</span>
                </button>
              </div>

              {/* Code Preview Box */}
              <div className="border border-zinc-800 rounded bg-zinc-950 p-2.5 overflow-hidden">
                <pre className="text-[9.5px] font-mono leading-relaxed text-zinc-300 overflow-x-auto max-h-56">
                  {currentSample}
                </pre>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="pt-3 border-t border-zinc-200 dark:border-zinc-800 flex flex-col gap-1.5 mt-3">
              {onInsertSample && (
                <button
                  type="button"
                  onClick={handleInsert}
                  className="w-full py-1.5 px-3 rounded bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 text-[11px] font-medium flex items-center justify-center gap-1.5 transition"
                >
                  {inserted ? (
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                  ) : (
                    <FileText className="w-3.5 h-3.5 text-indigo-500" />
                  )}
                  <span>
                    {inserted
                      ? "Inserted to Document!"
                      : "Insert Template Table into Document"}
                  </span>
                </button>
              )}

              {hasLatestResults && onOpenLatestResults && (
                <button
                  type="button"
                  onClick={() => {
                    onOpenLatestResults();
                    onClose();
                  }}
                  className="w-full py-1.5 px-3 rounded bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-semibold flex items-center justify-center gap-1.5 shadow-xs transition"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>View Latest Analysis Results</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 py-2 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50 dark:bg-zinc-950">
          <div className="text-[10px] text-zinc-400">
            Current active style:{" "}
            <strong className="text-zinc-700 dark:text-zinc-200 uppercase">
              {selectedStyle}
            </strong>
          </div>
          <button
            onClick={onClose}
            className="px-3 py-1 text-[11px] font-medium rounded bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
