import React, { useState, useMemo } from "react";
import { X, Sparkles, RotateCcw } from "lucide-react";
import { AnalysisResult, TableStyle } from "../../types/stats";
import {
  LatexTableSection,
  LatexTableFooter,
  DiagnosticPlotSection,
  DescriptiveResultView,
  GroupComparisonResultView,
  RegressionResultView,
  NonParametricResultView,
  MultivariateResultView,
} from "./results";

export interface ResultsViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  result: AnalysisResult | null;
  projectName?: string;
  filePath?: string;
  onInsertLatex: (tableCode: string) => void;
  onClearAnalysis?: () => void;
}

export const ResultsViewerModal: React.FC<ResultsViewerModalProps> = ({
  isOpen,
  onClose,
  result,
  projectName,
  filePath,
  onInsertLatex,
  onClearAnalysis,
}) => {
  const [copied, setCopied] = useState(false);
  const [inserted, setInserted] = useState(false);
  const [tableStyle, setTableStyle] = useState<TableStyle>("apa");

  const activeTableCode = useMemo(() => {
    if (!result) return "";
    if (result.latex_tables && result.latex_tables[tableStyle]) {
      return result.latex_tables[tableStyle];
    }
    return result.latex_table || "";
  }, [result, tableStyle]);

  if (!isOpen || !result) return null;

  const handleCopyLatex = async () => {
    if (!activeTableCode) return;
    try {
      await navigator.clipboard.writeText(activeTableCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  const handleInsert = () => {
    if (!activeTableCode) return;
    onInsertLatex(activeTableCode);
    setInserted(true);
    setTimeout(() => {
      setInserted(false);
      onClose();
    }, 1200);
  };

  const handleClearAnalysis = () => {
    if (onClearAnalysis) {
      onClearAnalysis();
    }
    onClose();
  };

  const renderActiveResultView = () => {
    const type = result.analysis_type;
    if (type === "descriptive" || type === "reliability") {
      return <DescriptiveResultView result={result} />;
    }
    if (type === "regression" || type === "logistic_regression") {
      return <RegressionResultView result={result} />;
    }
    if (
      type === "ttest_one_sample" ||
      type === "ttest_independent" ||
      type === "ttest_paired" ||
      type === "anova_oneway" ||
      type === "anova_twoway" ||
      type === "ancova"
    ) {
      return <GroupComparisonResultView result={result} />;
    }
    if (type === "manova" || type === "pca") {
      return <MultivariateResultView result={result} />;
    }
    return <NonParametricResultView result={result} />;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-2xl w-full max-w-3xl flex flex-col max-h-[88vh] overflow-hidden text-zinc-900 dark:text-zinc-100 text-xs">
        {/* Header */}
        <div className="px-4 py-2.5 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50 dark:bg-zinc-950">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-indigo-500" />
            <h2 className="text-xs font-semibold tracking-tight capitalize text-zinc-800 dark:text-zinc-200">
              {result.analysis_type} Analysis Results
            </h2>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={handleClearAnalysis}
              title="Clear active analysis result and return workbench to clean state"
              className="px-2 py-0.5 text-[10px] font-medium rounded text-zinc-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 border border-transparent hover:border-red-200 dark:hover:border-red-900/40 transition flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3 text-zinc-400 group-hover:text-red-500" />
              <span>Clear Analysis</span>
            </button>
            <button
              onClick={onClose}
              className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Body content */}
        <div className="flex-1 p-3.5 overflow-y-auto space-y-3.5">
          {renderActiveResultView()}

          {/* Diagnostic Visualizations & Publication Plots */}
          <DiagnosticPlotSection
            result={result}
            projectName={projectName}
            filePath={filePath}
            onInsertLatex={onInsertLatex}
          />

          {/* LaTeX Code Preview Box */}
          <LatexTableSection
            activeTableCode={activeTableCode}
            tableStyle={tableStyle}
            onTableStyleChange={setTableStyle}
            onCopyLatex={handleCopyLatex}
            copied={copied}
          />
        </div>

        {/* Footer */}
        <LatexTableFooter
          tableStyle={tableStyle}
          onCopyLatex={handleCopyLatex}
          onInsertLatex={handleInsert}
          copied={copied}
          inserted={inserted}
        />
      </div>
    </div>
  );
};
