import React from "react";
import { BaseFormProps } from "../dialogTypes";
import { SingleVariableSlot, MultiVariableSlot } from "../VariableSlots";

export const MultivariateForm: React.FC<BaseFormProps> = ({
  slotState,
  updateSlot,
  selectedAvailable,
  analysisType,
}) => {
  // 1. MANOVA
  if (analysisType === "manova") {
    return (
      <>
        <SingleVariableSlot
          label="Factor / Grouping Variable:"
          value={slotState.manovaFactor}
          onSet={() => {
            if (selectedAvailable) {
              updateSlot("manovaFactor", selectedAvailable);
              updateSlot(
                "manovaDeps",
                slotState.manovaDeps.filter((x) => x !== selectedAvailable),
              );
            }
          }}
          onClear={() => updateSlot("manovaFactor", null)}
          selectedAvailable={selectedAvailable}
          buttonText="Set Factor"
          placeholder="Select 1 grouping variable (Nominal/Ordinal)"
        />

        <MultiVariableSlot
          label="Dependent Variables (Y1, Y2...):"
          values={slotState.manovaDeps}
          onAdd={() => {
            if (
              selectedAvailable &&
              selectedAvailable !== slotState.manovaFactor &&
              !slotState.manovaDeps.includes(selectedAvailable)
            ) {
              updateSlot("manovaDeps", [
                ...slotState.manovaDeps,
                selectedAvailable,
              ]);
            }
          }}
          onRemove={(v) => {
            updateSlot(
              "manovaDeps",
              slotState.manovaDeps.filter((x) => x !== v),
            );
          }}
          selectedAvailable={selectedAvailable}
          buttonText="Add Y"
          placeholder="Add at least 2 continuous Scale variables"
          showScale={false}
        />
      </>
    );
  }

  // 2. PCA
  return (
    <>
      <MultiVariableSlot
        label="Input Variables:"
        values={slotState.pcaVars}
        onAdd={() => {
          if (
            selectedAvailable &&
            !slotState.pcaVars.includes(selectedAvailable)
          ) {
            updateSlot("pcaVars", [...slotState.pcaVars, selectedAvailable]);
          }
        }}
        onRemove={(v) => {
          updateSlot(
            "pcaVars",
            slotState.pcaVars.filter((x) => x !== v),
          );
        }}
        selectedAvailable={selectedAvailable}
        buttonText="Add Variable"
        placeholder="Select quantitative variables"
        minHeight="min-h-[80px]"
        showScale={false}
      />
      <div className="flex items-center gap-2 text-[10px]">
        <label className="text-zinc-500">Components:</label>
        <input
          type="number"
          min={1}
          max={Math.max(2, slotState.pcaVars.length)}
          value={slotState.pcaComponents}
          onChange={(e) =>
            updateSlot(
              "pcaComponents",
              Math.max(1, parseInt(e.target.value) || 1),
            )
          }
          className="w-12 px-1.5 py-0.5 rounded border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-center text-xs"
        />
      </div>
    </>
  );
};
