import React from "react";
import { BaseFormProps } from "../dialogTypes";
import { MultiVariableSlot } from "../VariableSlots";

export const DescriptiveForm: React.FC<BaseFormProps> = ({
  slotState,
  updateSlot,
  selectedAvailable,
  variableScales,
  analysisType,
}) => {
  if (analysisType === "reliability") {
    return (
      <MultiVariableSlot
        label="Scale / Questionnaire Items:"
        values={slotState.reliabilityItems}
        onAdd={() => {
          if (
            selectedAvailable &&
            !slotState.reliabilityItems.includes(selectedAvailable)
          ) {
            updateSlot("reliabilityItems", [
              ...slotState.reliabilityItems,
              selectedAvailable,
            ]);
          }
        }}
        onRemove={(v) => {
          updateSlot(
            "reliabilityItems",
            slotState.reliabilityItems.filter((x) => x !== v),
          );
        }}
        selectedAvailable={selectedAvailable}
        buttonText="Add Item"
        placeholder="Select at least 2 items (Ordinal / Scale)"
        minHeight="min-h-[100px]"
        showScale={false}
      />
    );
  }

  // analysisType === "descriptive"
  return (
    <>
      <MultiVariableSlot
        label="Selected Variables:"
        values={slotState.descriptiveVars}
        onAdd={() => {
          if (
            selectedAvailable &&
            !slotState.descriptiveVars.includes(selectedAvailable)
          ) {
            updateSlot("descriptiveVars", [
              ...slotState.descriptiveVars,
              selectedAvailable,
            ]);
          }
        }}
        onRemove={(v) => {
          updateSlot(
            "descriptiveVars",
            slotState.descriptiveVars.filter((x) => x !== v),
          );
        }}
        selectedAvailable={selectedAvailable}
        variableScales={variableScales}
        buttonText="Add Variable"
        placeholder="Add variables to analyze"
        minHeight="min-h-[90px]"
      />
      <label className="flex items-center gap-1.5 text-[10px] cursor-pointer text-zinc-600 dark:text-zinc-400">
        <input
          type="checkbox"
          checked={slotState.includeNormality}
          onChange={(e) => updateSlot("includeNormality", e.target.checked)}
          className="rounded text-indigo-600"
        />
        Shapiro-Wilk Normality Test (for Scale variables)
      </label>
    </>
  );
};
