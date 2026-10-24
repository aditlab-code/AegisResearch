import React, { useState, useMemo, useEffect } from "react";
import { X, AlertTriangle, AlertCircle, Compass } from "lucide-react";
import { MeasurementScale } from "../../types/stats";
import {
  inferMeasurementScale,
  getNextScale,
} from "../../utils/measurementScale";
import {
  AnalysisDialogProps,
  DialogSlotState,
  INITIAL_SLOT_STATE,
  getTestMeta,
  validateStevensScales,
  executeAnalysis,
  VariableList,
  DialogFooter,
  DescriptiveForm,
  GroupComparisonForm,
  RegressionCorrelationForm,
  MultivariateForm,
} from "./dialog";

export type { AnalysisDialogProps };

export const AnalysisDialog: React.FC<AnalysisDialogProps> = ({
  isOpen,
  onClose,
  columns,
  filePath,
  projectName,
  analysisType,
  onAnalysisComplete,
  onOpenGuide,
}) => {
  const [searchFilter, setSearchFilter] = useState("");
  const [selectedAvailable, setSelectedAvailable] = useState<string | null>(
    null,
  );
  const [variableScales, setVariableScales] = useState<
    Record<string, MeasurementScale>
  >({});
  const [slotState, setSlotState] =
    useState<DialogSlotState>(INITIAL_SLOT_STATE);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initialScales: Record<string, MeasurementScale> = {};
    columns.forEach((col) => {
      initialScales[col] = inferMeasurementScale(col);
    });
    setVariableScales(initialScales);
  }, [columns]);

  const toggleVariableScale = (varName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setVariableScales((prev) => ({
      ...prev,
      [varName]: getNextScale(prev[varName] || "scale"),
    }));
  };

  const updateSlot = <K extends keyof DialogSlotState>(
    key: K,
    value:
      DialogSlotState[K] | ((prev: DialogSlotState[K]) => DialogSlotState[K]),
  ) => {
    setSlotState((prev) => ({
      ...prev,
      [key]:
        typeof value === "function"
          ? (value as (prevVal: DialogSlotState[K]) => DialogSlotState[K])(
              prev[key],
            )
          : value,
    }));
  };

  const headerMeta = useMemo(() => getTestMeta(analysisType), [analysisType]);
  const HeaderIcon = headerMeta.icon;

  const validationWarnings = useMemo(
    () => validateStevensScales(analysisType, slotState, variableScales),
    [analysisType, slotState, variableScales],
  );

  const handleRunAnalysis = async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await executeAnalysis(
        analysisType,
        projectName,
        filePath,
        slotState,
        variableScales,
      );
      onAnalysisComplete(res);
      onClose();
    } catch (err: any) {
      setError(err?.message || "Statistical analysis failed");
    } finally {
      setLoading(false);
    }
  };

  const handleResetAllSlots = () => {
    setSelectedAvailable(null);
    setSlotState(INITIAL_SLOT_STATE);
    setError(null);
  };

  const renderActiveForm = () => {
    const formProps = {
      slotState,
      updateSlot,
      selectedAvailable,
      variableScales,
      analysisType,
    };

    switch (analysisType) {
      case "descriptive":
      case "reliability":
        return <DescriptiveForm {...formProps} />;
      case "regression":
      case "logistic_regression":
      case "correlation_pearson":
      case "correlation_spearman":
        return <RegressionCorrelationForm {...formProps} />;
      case "manova":
      case "pca":
        return <MultivariateForm {...formProps} />;
      default:
        return <GroupComparisonForm {...formProps} />;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-2xl w-full max-w-2xl flex flex-col max-h-[85vh] overflow-hidden text-zinc-900 dark:text-zinc-100 text-xs">
        {/* Header */}
        <div className="px-4 py-2.5 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50 dark:bg-zinc-950">
          <div className="flex items-center gap-2">
            <HeaderIcon className="w-4 h-4 text-indigo-500 shrink-0" />
            <div>
              <h2 className="text-xs font-semibold tracking-tight text-zinc-800 dark:text-zinc-200">
                {headerMeta.title}
              </h2>
              <p className="text-[10px] text-zinc-500 dark:text-zinc-400">
                {headerMeta.desc}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            {onOpenGuide && (
              <button
                type="button"
                onClick={onOpenGuide}
                title="Open Statistical Method Advisor"
                className="px-2 py-0.5 rounded text-[10px] font-medium bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/40 flex items-center gap-1 transition"
              >
                <Compass className="w-3 h-3 text-amber-500" />
                <span>Method Guide</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 p-3.5 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-3">
          <VariableList
            columns={columns}
            searchFilter={searchFilter}
            onSearchChange={setSearchFilter}
            selectedAvailable={selectedAvailable}
            onSelectAvailable={setSelectedAvailable}
            variableScales={variableScales}
            onToggleScale={toggleVariableScale}
          />

          <div className="flex flex-col gap-2.5">
            {renderActiveForm()}

            {headerMeta.hasPlot && (
              <div className="pt-1.5 border-t border-zinc-200 dark:border-zinc-800 text-[10px] text-zinc-600 dark:text-zinc-400">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={slotState.includePlot}
                    onChange={(e) =>
                      updateSlot("includePlot", e.target.checked)
                    }
                    className="rounded text-indigo-600"
                  />
                  <span>Generate Plot ({headerMeta.defaultPlotLabel})</span>
                </label>
              </div>
            )}
          </div>
        </div>

        {/* Validation warnings banner */}
        {validationWarnings.length > 0 && (
          <div className="mx-3.5 mb-1.5 p-2 rounded bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-[10px] text-amber-800 dark:text-amber-300 space-y-0.5">
            {validationWarnings.map((w, idx) => (
              <div key={idx} className="flex items-center gap-1.5">
                <AlertTriangle className="w-3 h-3 text-amber-500 shrink-0" />
                <span>{w}</span>
              </div>
            ))}
          </div>
        )}

        {/* Error notification */}
        {error && (
          <div className="mx-3.5 mb-1.5 p-2 rounded bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 flex items-center gap-1.5 text-[10px] text-red-600 dark:text-red-400">
            <AlertCircle className="w-3 h-3 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <DialogFooter
          onReset={handleResetAllSlots}
          onClose={onClose}
          onRun={handleRunAnalysis}
          loading={loading}
        />
      </div>
    </div>
  );
};
