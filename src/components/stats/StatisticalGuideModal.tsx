import React, { useState } from "react";
import { X, Compass, Table, Workflow } from "lucide-react";
import { AnalysisType } from "../../types/stats";
import { GuideTab, WizardTab, MatrixTab, WorkflowTab } from "./guide";

export interface StatisticalGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectAnalysis: (type: AnalysisType) => void;
}

export const StatisticalGuideModal: React.FC<StatisticalGuideModalProps> = ({
  isOpen,
  onClose,
  onSelectAnalysis,
}) => {
  const [activeTab, setActiveTab] = useState<GuideTab>("wizard");

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-2xl w-full max-w-4xl flex flex-col max-h-[90vh] overflow-hidden text-zinc-900 dark:text-zinc-100 text-xs">
        {/* Header */}
        <div className="px-4 py-2.5 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50 dark:bg-zinc-950">
          <div className="flex items-center gap-2">
            <Compass className="w-4 h-4 text-amber-500 shrink-0" />
            <div>
              <h2 className="text-xs font-semibold tracking-tight text-zinc-800 dark:text-zinc-200">
                Statistical Method Advisor & Research Guide
              </h2>
              <p className="text-[10px] text-zinc-500 dark:text-zinc-400">
                Interactive statistical method selection & quantitative research
                prerequisite guide
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center px-4 pt-1.5 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/40 gap-1">
          <button
            onClick={() => setActiveTab("wizard")}
            className={`px-3 py-1.5 text-xs font-medium border-b-2 flex items-center gap-1.5 transition cursor-pointer ${
              activeTab === "wizard"
                ? "border-amber-500 text-amber-600 dark:text-amber-400 font-semibold bg-white dark:bg-zinc-900 rounded-t"
                : "border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
            }`}
          >
            <Compass className="w-3.5 h-3.5 text-amber-500" />
            <span>Interactive Advisor (Wizard)</span>
          </button>
          <button
            onClick={() => setActiveTab("workflow")}
            className={`px-3 py-1.5 text-xs font-medium border-b-2 flex items-center gap-1.5 transition cursor-pointer ${
              activeTab === "workflow"
                ? "border-indigo-500 text-indigo-600 dark:text-indigo-400 font-semibold bg-white dark:bg-zinc-900 rounded-t"
                : "border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
            }`}
          >
            <Workflow className="w-3.5 h-3.5 text-indigo-500" />
            <span>Research Workflow & Prerequisites</span>
          </button>
          <button
            onClick={() => setActiveTab("matrix")}
            className={`px-3 py-1.5 text-xs font-medium border-b-2 flex items-center gap-1.5 transition cursor-pointer ${
              activeTab === "matrix"
                ? "border-blue-500 text-blue-600 dark:text-blue-400 font-semibold bg-white dark:bg-zinc-900 rounded-t"
                : "border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
            }`}
          >
            <Table className="w-3.5 h-3.5 text-blue-500" />
            <span>Decision Matrix Cheat-Sheet</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 p-4 overflow-y-auto">
          {activeTab === "wizard" && (
            <WizardTab onSelectAnalysis={onSelectAnalysis} onClose={onClose} />
          )}

          {activeTab === "workflow" && (
            <WorkflowTab
              onSelectAnalysis={onSelectAnalysis}
              onClose={onClose}
              onSwitchToMatrix={() => setActiveTab("matrix")}
            />
          )}

          {activeTab === "matrix" && (
            <MatrixTab onSelectAnalysis={onSelectAnalysis} onClose={onClose} />
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50 dark:bg-zinc-950">
          <div className="text-[10px] text-zinc-400">
            AegisResearch Academic Methodology Advisor — Guiding sound empirical
            research.
          </div>
          <button
            onClick={onClose}
            className="px-3 py-1 text-[11px] font-medium rounded bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 transition cursor-pointer"
          >
            Close Guide
          </button>
        </div>
      </div>
    </div>
  );
};
