import React from "react";
import {
  Workflow,
  CheckCircle2,
  BarChart3,
  GitCompare,
  Play,
  ArrowRight,
} from "lucide-react";
import { AnalysisType } from "../../../types/stats";
import { WORKFLOW_STEPS, WorkflowStepItem } from "./guideData";

export interface WorkflowTabProps {
  onSelectAnalysis: (type: AnalysisType) => void;
  onClose: () => void;
  onSwitchToMatrix: () => void;
}

const STEP_BUTTON_CLASSES: Record<number, string> = {
  1: "border-cyan-300 dark:border-cyan-800 text-cyan-700 dark:text-cyan-300 hover:bg-cyan-50 dark:hover:bg-cyan-950/40",
  2: "border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40",
  3: "border-indigo-300 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/40",
  4: "border-purple-300 dark:border-purple-800 text-purple-700 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-950/40",
};

const renderStepIcon = (name: WorkflowStepItem["iconName"]) => {
  switch (name) {
    case "check":
      return <CheckCircle2 className="w-4 h-4 text-cyan-500" />;
    case "chart":
      return <BarChart3 className="w-4 h-4 text-emerald-500" />;
    case "compare":
      return <GitCompare className="w-4 h-4 text-indigo-500" />;
    case "play":
      return <Play className="w-4 h-4 text-purple-500 fill-current" />;
  }
};

export const WorkflowTab: React.FC<WorkflowTabProps> = ({
  onSelectAnalysis,
  onClose,
  onSwitchToMatrix,
}) => {
  const handleStepAction = (step: WorkflowStepItem) => {
    if (step.actionTargetTab === "matrix") {
      onSwitchToMatrix();
    } else if (step.actionType) {
      onSelectAnalysis(step.actionType);
      onClose();
    }
  };

  return (
    <div className="space-y-4">
      {/* Intro Banner */}
      <div className="p-3 rounded-lg border border-indigo-200 dark:border-indigo-900/60 bg-indigo-50/40 dark:bg-indigo-950/20">
        <h3 className="text-xs font-bold text-indigo-900 dark:text-indigo-300 flex items-center gap-1.5">
          <Workflow className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          Standard Sequence of Tests in Quantitative Research
        </h3>
        <p className="text-[11px] text-zinc-600 dark:text-zinc-400 mt-1">
          To ensure empirical findings are methodologically valid and defensible
          in academic defense or journal publication, follow these 4
          prerequisite stages sequentially:
        </p>
      </div>

      {/* Steps Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {WORKFLOW_STEPS.map((step) => (
          <div
            key={step.id}
            className="p-3 rounded border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-1">
                <span
                  className={`text-[10px] font-bold uppercase tracking-wider ${step.tagColorClass}`}
                >
                  {step.tag}
                </span>
                {renderStepIcon(step.iconName)}
              </div>
              <h4 className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
                {step.title}
              </h4>
              <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-1">
                {step.description}
              </p>
              <div className="mt-2 p-2 rounded bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/60 space-y-1 text-[10px]">
                <div>
                  <strong>{step.criteriaTitle}</strong>
                </div>
                {step.criteria.map((c, cIdx) => (
                  <div key={cIdx} className={c.colorClass}>
                    {c.text}
                  </div>
                ))}
                {step.footnote && (
                  <div className="text-zinc-500 text-[9px] pt-0.5">
                    {step.footnote}
                  </div>
                )}
              </div>
            </div>
            <button
              onClick={() => handleStepAction(step)}
              className={`mt-3 w-full py-1 text-[10px] font-medium rounded border transition flex items-center justify-center gap-1 ${
                STEP_BUTTON_CLASSES[step.id] || ""
              }`}
            >
              <span>{step.actionLabel}</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
