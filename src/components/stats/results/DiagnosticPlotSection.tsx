import React, { useState, useEffect } from "react";
import {
  Sparkles,
  Download,
  Image as ImageIcon,
  Loader2,
  Copy,
  Check,
  FileText,
  CheckCircle,
  X,
} from "lucide-react";
import {
  AnalysisResult,
  DiagnosticPlotResult,
  StandardizedPlotRequest,
} from "../../../types/stats";
import { statsApi } from "../../../services/statsApi";
import { buildApiUrl } from "../../../services/api";
import { getAvailablePlots } from "./plotRegistry";

export interface DiagnosticPlotSectionProps {
  result: AnalysisResult;
  projectName?: string;
  filePath?: string;
  onInsertLatex: (snippet: string) => void;
}

export const DiagnosticPlotSection: React.FC<DiagnosticPlotSectionProps> = ({
  result,
  projectName,
  filePath,
  onInsertLatex,
}) => {
  const [activePlot, setActivePlot] = useState<DiagnosticPlotResult | null>(
    null,
  );
  const [plotLoading, setPlotLoading] = useState(false);
  const [plotError, setPlotError] = useState<string | null>(null);
  const [plotCopied, setPlotCopied] = useState(false);
  const [plotInserted, setPlotInserted] = useState(false);
  const [selectedPlotVar, setSelectedPlotVar] = useState<string>("");

  useEffect(() => {
    setActivePlot(result?.plot || null);
    setPlotError(result?.plot_error || null);
  }, [result]);

  const handleDownloadPlot = () => {
    if (!activePlot || !projectName) return;
    const url = buildApiUrl(
      `/api/projects/${encodeURIComponent(projectName)}/raw/${activePlot.image_path}`,
    );
    const a = document.createElement("a");
    a.href = url;
    a.download =
      activePlot.image_path.split("/").pop() || "diagnostic_plot.png";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleCopyPlotLatex = async () => {
    if (!activePlot?.latex_snippet) return;
    try {
      await navigator.clipboard.writeText(activePlot.latex_snippet);
      setPlotCopied(true);
      setTimeout(() => setPlotCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  const handleInsertPlotLatex = () => {
    if (!activePlot?.latex_snippet) return;
    onInsertLatex(activePlot.latex_snippet);
    setPlotInserted(true);
    setTimeout(() => setPlotInserted(false), 2000);
  };

  const runPlotAction = async (buildRequest: () => StandardizedPlotRequest) => {
    if (!projectName) return;
    setPlotLoading(true);
    setPlotError(null);
    try {
      const plot = await statsApi.generatePlot(projectName, buildRequest());
      setActivePlot(plot);
    } catch (err: any) {
      setPlotError(err?.message || "Failed to generate plot");
    } finally {
      setPlotLoading(false);
    }
  };

  const availablePlots = getAvailablePlots(result, filePath, selectedPlotVar);

  return (
    <div className="border border-zinc-200 dark:border-zinc-800 rounded p-3 bg-zinc-50/50 dark:bg-zinc-900/40 space-y-2.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 font-semibold text-zinc-800 dark:text-zinc-200 text-[11px]">
          <ImageIcon className="w-3.5 h-3.5 text-indigo-500" />
          <span>Publication Diagnostic Plots (300 DPI PNG)</span>
        </div>
        {plotLoading && (
          <div className="flex items-center gap-1 text-[10px] text-indigo-600 dark:text-indigo-400">
            <Loader2 className="w-3 h-3 animate-spin" />
            <span>Generating Plot...</span>
          </div>
        )}
      </div>

      {/* Standardized Dynamic Plot Bar */}
      <div className="flex flex-wrap items-center gap-1.5 pt-1">
        {result.analysis_type === "descriptive" && (
          <select
            value={selectedPlotVar || result.results[0]?.variable || ""}
            onChange={(e) => setSelectedPlotVar(e.target.value)}
            className="p-1 text-[10px] rounded border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300"
          >
            {result.results.map((r) => (
              <option key={r.variable} value={r.variable}>
                {r.variable}
              </option>
            ))}
          </select>
        )}
        {availablePlots.map((opt) => (
          <button
            key={opt.id}
            type="button"
            disabled={plotLoading || !projectName || !filePath}
            onClick={() => runPlotAction(opt.buildRequest)}
            className={`px-2 py-1 text-[10px] font-medium rounded border transition ${opt.colorClass}`}
          >
            {opt.label}
          </button>
        ))}
        {availablePlots.length === 0 && (
          <span className="text-[10px] text-zinc-400 italic">
            No diagnostic plots available for this statistical test.
          </span>
        )}
      </div>

      {/* Error display */}
      {plotError && (
        <div className="p-2 rounded bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-300 text-[10px]">
          {plotError}
        </div>
      )}

      {/* Active Plot Preview & Export Toolbar */}
      {activePlot && (
        <div className="mt-2 p-2 rounded bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 space-y-2">
          <div className="flex items-center justify-between pb-1.5 border-b border-zinc-100 dark:border-zinc-800/80">
            <div className="flex items-center gap-1.5 text-zinc-700 dark:text-zinc-300 font-medium text-[11px] truncate max-w-md">
              <Sparkles className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
              <span className="truncate">
                {activePlot.caption || "Diagnostic Plot"}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setActivePlot(null)}
              title="Dismiss plot preview and keep tables"
              className="px-2 py-0.5 text-[10px] font-medium rounded text-zinc-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 border border-zinc-200 dark:border-zinc-700/80 transition flex items-center gap-1 shrink-0"
            >
              <X className="w-3 h-3 text-zinc-400 group-hover:text-red-500" />
              <span>Clear Plot</span>
            </button>
          </div>
          <div className="text-center bg-zinc-100 dark:bg-zinc-900/60 p-2 rounded overflow-hidden">
            <img
              src={
                activePlot.image_data_url ||
                buildApiUrl(
                  `/api/projects/${encodeURIComponent(projectName || "")}/raw/${activePlot.image_path}?t=${Date.now()}`,
                )
              }
              alt={activePlot.caption}
              className="max-h-60 mx-auto rounded shadow-xs object-contain"
            />
          </div>
          {/* Export Toolbar */}
          <div className="flex items-center justify-between flex-wrap gap-2 pt-1 border-t border-zinc-100 dark:border-zinc-800/80">
            <span className="text-[10px] text-zinc-500 font-mono truncate max-w-xs">
              {activePlot.image_path}
            </span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleDownloadPlot}
                title="Download 300 DPI PNG to your computer"
                className="px-2 py-1 text-[10px] font-medium rounded border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 transition flex items-center gap-1"
              >
                <Download className="w-3 h-3 text-indigo-500" />
                <span>Download PNG</span>
              </button>
              <button
                type="button"
                onClick={handleCopyPlotLatex}
                title="Copy LaTeX figure environment snippet"
                className="px-2 py-1 text-[10px] font-medium rounded border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 transition flex items-center gap-1"
              >
                {plotCopied ? (
                  <Check className="w-3 h-3 text-emerald-500" />
                ) : (
                  <Copy className="w-3 h-3" />
                )}
                <span>{plotCopied ? "Copied!" : "Copy Figure LaTeX"}</span>
              </button>
              <button
                type="button"
                onClick={handleInsertPlotLatex}
                title="Insert LaTeX figure code directly into active document"
                className="px-2 py-1 text-[10px] font-medium rounded bg-indigo-600 hover:bg-indigo-700 text-white transition flex items-center gap-1"
              >
                {plotInserted ? (
                  <CheckCircle className="w-3 h-3" />
                ) : (
                  <FileText className="w-3 h-3" />
                )}
                <span>{plotInserted ? "Inserted!" : "Insert to Document"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
