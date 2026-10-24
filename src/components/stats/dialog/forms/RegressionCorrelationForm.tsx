import React from "react";
import { BaseFormProps } from "../dialogTypes";
import { SingleVariableSlot, MultiVariableSlot } from "../VariableSlots";

export const RegressionCorrelationForm: React.FC<BaseFormProps> = ({
  slotState,
  updateSlot,
  selectedAvailable,
  variableScales,
  analysisType,
}) => {
  // 1. Multiple Linear Regression
  if (analysisType === "regression") {
    return (
      <>
        <SingleVariableSlot
          label="Dependent Variable (Y):"
          value={slotState.dependentVar}
          onSet={() => {
            if (selectedAvailable) {
              updateSlot("dependentVar", selectedAvailable);
              updateSlot(
                "independentVars",
                slotState.independentVars.filter(
                  (v) => v !== selectedAvailable,
                ),
              );
            }
          }}
          onClear={() => updateSlot("dependentVar", null)}
          selectedAvailable={selectedAvailable}
          scale={
            slotState.dependentVar
              ? variableScales[slotState.dependentVar] || "scale"
              : undefined
          }
          buttonText="Set Y"
          placeholder="Select 1 continuous (Scale) variable"
        />

        <MultiVariableSlot
          label="Independent Variables (X):"
          values={slotState.independentVars}
          onAdd={() => {
            if (
              selectedAvailable &&
              selectedAvailable !== slotState.dependentVar &&
              !slotState.independentVars.includes(selectedAvailable)
            ) {
              updateSlot("independentVars", [
                ...slotState.independentVars,
                selectedAvailable,
              ]);
            }
          }}
          onRemove={(v) => {
            updateSlot(
              "independentVars",
              slotState.independentVars.filter((x) => x !== v),
            );
          }}
          selectedAvailable={selectedAvailable}
          variableScales={variableScales}
          buttonText="Add X"
          placeholder="Select predictor variables"
        />

        <div className="pt-1.5 border-t border-zinc-200 dark:border-zinc-800 flex flex-col gap-1 text-[10px] text-zinc-600 dark:text-zinc-400">
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={slotState.checkVif}
              onChange={(e) => updateSlot("checkVif", e.target.checked)}
              className="rounded text-indigo-600"
            />
            Collinearity Diagnostics (VIF & Tolerance)
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={slotState.checkDw}
              onChange={(e) => updateSlot("checkDw", e.target.checked)}
              className="rounded text-indigo-600"
            />
            Durbin-Watson Residual Autocorrelation
          </label>
        </div>

        <MultiVariableSlot
          label="Block 1 / Baseline Predictors (Optional F-Change):"
          values={slotState.regressionBaselineVars}
          onAdd={() => {
            if (
              selectedAvailable &&
              selectedAvailable !== slotState.dependentVar &&
              !slotState.regressionBaselineVars.includes(selectedAvailable)
            ) {
              updateSlot("regressionBaselineVars", [
                ...slotState.regressionBaselineVars,
                selectedAvailable,
              ]);
              if (!slotState.independentVars.includes(selectedAvailable)) {
                updateSlot("independentVars", [
                  ...slotState.independentVars,
                  selectedAvailable,
                ]);
              }
            }
          }}
          onRemove={(v) => {
            updateSlot(
              "regressionBaselineVars",
              slotState.regressionBaselineVars.filter((x) => x !== v),
            );
          }}
          selectedAvailable={selectedAvailable}
          buttonText="Add Baseline"
          placeholder="Leave empty for standard OLS, or add baseline covariates to test ΔR²"
          minHeight="min-h-[36px]"
          chipClass="bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300"
          showScale={false}
        />

        <div className="pt-1.5 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between text-[11px]">
          <span className="font-semibold text-zinc-700 dark:text-zinc-300">
            Missing Values Handling:
          </span>
          <select
            value={slotState.regressionMissingStrategy}
            onChange={(e) =>
              updateSlot(
                "regressionMissingStrategy",
                e.target.value as "listwise" | "pairwise",
              )
            }
            className="p-1 text-[11px] rounded border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200"
          >
            <option value="listwise">
              Exclude cases listwise (SPSS Default)
            </option>
            <option value="pairwise">Exclude cases pairwise</option>
          </select>
        </div>
      </>
    );
  }

  // 2. Binary Logistic Regression
  if (analysisType === "logistic_regression") {
    return (
      <>
        <SingleVariableSlot
          label="Binary Dependent Variable (Y):"
          value={slotState.dependentVar}
          onSet={() => {
            if (selectedAvailable) {
              updateSlot("dependentVar", selectedAvailable);
              updateSlot(
                "independentVars",
                slotState.independentVars.filter(
                  (v) => v !== selectedAvailable,
                ),
              );
            }
          }}
          onClear={() => updateSlot("dependentVar", null)}
          selectedAvailable={selectedAvailable}
          scale={
            slotState.dependentVar
              ? variableScales[slotState.dependentVar] || "nominal"
              : undefined
          }
          buttonText="Set Binary Y"
          placeholder="Select 1 binary categorical variable (2 groups / 0 and 1)"
          highlightClass="text-violet-600 dark:text-violet-400"
        />

        <MultiVariableSlot
          label="Predictor Variables (X):"
          values={slotState.independentVars}
          onAdd={() => {
            if (
              selectedAvailable &&
              selectedAvailable !== slotState.dependentVar &&
              !slotState.independentVars.includes(selectedAvailable)
            ) {
              updateSlot("independentVars", [
                ...slotState.independentVars,
                selectedAvailable,
              ]);
            }
          }}
          onRemove={(v) => {
            updateSlot(
              "independentVars",
              slotState.independentVars.filter((x) => x !== v),
            );
          }}
          selectedAvailable={selectedAvailable}
          variableScales={variableScales}
          buttonText="Add Predictor"
          placeholder="Select covariates / predictor variables"
        />

        <div className="pt-1.5 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between text-[11px]">
          <span className="font-semibold text-zinc-700 dark:text-zinc-300">
            Classification Cutoff:
          </span>
          <div className="flex items-center gap-2">
            <input
              type="range"
              min={0.1}
              max={0.9}
              step={0.05}
              value={slotState.logisticCutoff}
              onChange={(e) =>
                updateSlot("logisticCutoff", parseFloat(e.target.value))
              }
              className="w-24 accent-violet-600"
            />
            <span className="font-mono text-[11px] w-8 font-semibold text-violet-600 dark:text-violet-400">
              {slotState.logisticCutoff.toFixed(2)}
            </span>
          </div>
        </div>

        <div className="pt-1.5 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between text-[11px]">
          <span className="font-semibold text-zinc-700 dark:text-zinc-300">
            Missing Values Handling:
          </span>
          <select
            value={slotState.regressionMissingStrategy}
            onChange={(e) =>
              updateSlot(
                "regressionMissingStrategy",
                e.target.value as "listwise" | "pairwise",
              )
            }
            className="p-1 text-[11px] rounded border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200"
          >
            <option value="listwise">
              Exclude cases listwise (SPSS Default)
            </option>
            <option value="pairwise">Exclude cases pairwise</option>
          </select>
        </div>
      </>
    );
  }

  // 3. Pearson / Spearman Correlation Matrix
  return (
    <MultiVariableSlot
      label="Variables for Correlation Matrix:"
      values={slotState.corrVars}
      onAdd={() => {
        if (
          selectedAvailable &&
          !slotState.corrVars.includes(selectedAvailable)
        ) {
          updateSlot("corrVars", [...slotState.corrVars, selectedAvailable]);
        }
      }}
      onRemove={(v) => {
        updateSlot(
          "corrVars",
          slotState.corrVars.filter((x) => x !== v),
        );
      }}
      selectedAvailable={selectedAvailable}
      variableScales={variableScales}
      buttonText="Add Variable"
      placeholder="Select at least 2 variables to correlate"
      minHeight="min-h-[100px]"
    />
  );
};
