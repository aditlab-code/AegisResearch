import React from "react";
import { BaseFormProps } from "../dialogTypes";
import { SingleVariableSlot, MultiVariableSlot } from "../VariableSlots";
import { TTestOptions } from "./TTestOptions";

export const GroupComparisonForm: React.FC<BaseFormProps> = ({
  slotState,
  updateSlot,
  selectedAvailable,
  variableScales,
  analysisType,
}) => {
  // 1. One-Sample t-Test
  if (analysisType === "ttest_one_sample") {
    return (
      <>
        <SingleVariableSlot
          label="Test Variable:"
          value={slotState.singleVar}
          onSet={() => {
            if (selectedAvailable) updateSlot("singleVar", selectedAvailable);
          }}
          onClear={() => updateSlot("singleVar", null)}
          selectedAvailable={selectedAvailable}
          scale={
            slotState.singleVar
              ? variableScales[slotState.singleVar] || "scale"
              : undefined
          }
          buttonText="Set Variable"
          placeholder="Select 1 continuous Scale variable"
        />

        <div className="pt-2">
          <label className="text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">
            Test Value (Hypothesized Population Mean):
          </label>
          <input
            type="number"
            step="any"
            value={slotState.testValue}
            onChange={(e) =>
              updateSlot("testValue", parseFloat(e.target.value) || 0)
            }
            className="w-full px-2 py-1 text-[11px] rounded border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        <TTestOptions
          alternative={slotState.ttestAlternative}
          onChangeAlternative={(val) => updateSlot("ttestAlternative", val)}
          missingStrategy={slotState.ttestMissingStrategy}
          onChangeMissing={(val) => updateSlot("ttestMissingStrategy", val)}
          labels={["≠ Test Value", "> Test Value", "< Test Value"]}
          radioNamePrefix="ttest_one"
        />
      </>
    );
  }

  // 2. Independent t-Test / Mann-Whitney / Kruskal / One-Way ANOVA
  if (
    analysisType === "ttest_independent" ||
    analysisType === "mann_whitney" ||
    analysisType === "kruskal" ||
    analysisType === "anova_oneway"
  ) {
    return (
      <>
        <SingleVariableSlot
          label={
            analysisType === "anova_oneway"
              ? "Dependent Variable (Outcome):"
              : "Test Variable:"
          }
          value={slotState.singleVar}
          onSet={() => {
            if (selectedAvailable) {
              updateSlot("singleVar", selectedAvailable);
              if (slotState.groupVar === selectedAvailable) {
                updateSlot("groupVar", null);
              }
            }
          }}
          onClear={() => updateSlot("singleVar", null)}
          selectedAvailable={selectedAvailable}
          scale={
            slotState.singleVar
              ? variableScales[slotState.singleVar] || "scale"
              : undefined
          }
          buttonText="Set Outcome"
          placeholder="Select continuous or ordinal outcome variable"
        />

        <SingleVariableSlot
          label="Grouping Variable (Factor):"
          value={slotState.groupVar}
          onSet={() => {
            if (selectedAvailable) {
              updateSlot("groupVar", selectedAvailable);
              if (slotState.singleVar === selectedAvailable) {
                updateSlot("singleVar", null);
              }
            }
          }}
          onClear={() => updateSlot("groupVar", null)}
          selectedAvailable={selectedAvailable}
          scale={
            slotState.groupVar
              ? variableScales[slotState.groupVar] || "nominal"
              : undefined
          }
          buttonText="Set Factor"
          placeholder="Select categorical factor (2 groups for t-test/Mann-Whitney, 3+ for ANOVA/Kruskal)"
        />

        {analysisType === "anova_oneway" && (
          <label className="flex items-center gap-1.5 text-[10px] cursor-pointer text-zinc-600 dark:text-zinc-400 pt-1">
            <input
              type="checkbox"
              checked={slotState.postHocTukey}
              onChange={(e) => updateSlot("postHocTukey", e.target.checked)}
              className="rounded text-indigo-600"
            />
            Include Post-Hoc Tukey HSD Multiple Comparisons
          </label>
        )}

        {analysisType === "ttest_independent" && (
          <TTestOptions
            alternative={slotState.ttestAlternative}
            onChangeAlternative={(val) => updateSlot("ttestAlternative", val)}
            missingStrategy={slotState.ttestMissingStrategy}
            onChangeMissing={(val) => updateSlot("ttestMissingStrategy", val)}
            labels={[
              "Group 1 ≠ Group 2",
              "Group 1 > Group 2",
              "Group 1 < Group 2",
            ]}
            radioNamePrefix="ttest_ind"
          />
        )}
      </>
    );
  }

  // 3. Paired t-Test / Wilcoxon
  if (analysisType === "ttest_paired" || analysisType === "wilcoxon") {
    return (
      <>
        <SingleVariableSlot
          label="Variable 1 (e.g. Pre-Test):"
          value={slotState.pairedVar1}
          onSet={() => {
            if (selectedAvailable) updateSlot("pairedVar1", selectedAvailable);
          }}
          onClear={() => updateSlot("pairedVar1", null)}
          selectedAvailable={selectedAvailable}
          buttonText="Set Var 1"
          placeholder="Select first paired measure"
        />

        <SingleVariableSlot
          label="Variable 2 (e.g. Post-Test):"
          value={slotState.pairedVar2}
          onSet={() => {
            if (selectedAvailable) updateSlot("pairedVar2", selectedAvailable);
          }}
          onClear={() => updateSlot("pairedVar2", null)}
          selectedAvailable={selectedAvailable}
          buttonText="Set Var 2"
          placeholder="Select second paired measure"
        />

        {analysisType === "ttest_paired" && (
          <TTestOptions
            alternative={slotState.ttestAlternative}
            onChangeAlternative={(val) => updateSlot("ttestAlternative", val)}
            missingStrategy={slotState.ttestMissingStrategy}
            onChangeMissing={(val) => updateSlot("ttestMissingStrategy", val)}
            labels={[
              "Measure 1 ≠ Measure 2",
              "Measure 1 > Measure 2",
              "Measure 1 < Measure 2",
            ]}
            radioNamePrefix="ttest_pair"
          />
        )}
      </>
    );
  }

  // 4. Two-Way Factorial ANOVA
  if (analysisType === "anova_twoway") {
    return (
      <>
        <SingleVariableSlot
          label="Dependent Variable:"
          value={slotState.singleVar}
          onSet={() => {
            if (selectedAvailable) updateSlot("singleVar", selectedAvailable);
          }}
          onClear={() => updateSlot("singleVar", null)}
          selectedAvailable={selectedAvailable}
          buttonText="Set Outcome"
          placeholder="Select continuous Scale outcome"
        />

        <SingleVariableSlot
          label="Factor 1 (Categorical):"
          value={slotState.factorVar1}
          onSet={() => {
            if (selectedAvailable) updateSlot("factorVar1", selectedAvailable);
          }}
          onClear={() => updateSlot("factorVar1", null)}
          selectedAvailable={selectedAvailable}
          buttonText="Set Factor 1"
          placeholder="Select Factor A"
        />

        <SingleVariableSlot
          label="Factor 2 (Categorical):"
          value={slotState.factorVar2}
          onSet={() => {
            if (selectedAvailable) updateSlot("factorVar2", selectedAvailable);
          }}
          onClear={() => updateSlot("factorVar2", null)}
          selectedAvailable={selectedAvailable}
          buttonText="Set Factor 2"
          placeholder="Select Factor B"
        />
      </>
    );
  }

  // 5. ANCOVA
  if (analysisType === "ancova") {
    return (
      <>
        <SingleVariableSlot
          label="Dependent Variable (Continuous):"
          value={slotState.singleVar}
          onSet={() => {
            if (selectedAvailable) updateSlot("singleVar", selectedAvailable);
          }}
          onClear={() => updateSlot("singleVar", null)}
          selectedAvailable={selectedAvailable}
          buttonText="Set Outcome"
          placeholder="Select continuous Scale outcome"
        />

        <SingleVariableSlot
          label="Factor Variable (Categorical):"
          value={slotState.groupVar}
          onSet={() => {
            if (selectedAvailable) updateSlot("groupVar", selectedAvailable);
          }}
          onClear={() => updateSlot("groupVar", null)}
          selectedAvailable={selectedAvailable}
          buttonText="Set Factor"
          placeholder="Select categorical factor/treatment"
        />

        <MultiVariableSlot
          label={`Covariates (${slotState.ancovaCovariates.length}):`}
          values={slotState.ancovaCovariates}
          onAdd={() => {
            if (
              selectedAvailable &&
              selectedAvailable !== slotState.singleVar &&
              selectedAvailable !== slotState.groupVar &&
              !slotState.ancovaCovariates.includes(selectedAvailable)
            ) {
              updateSlot("ancovaCovariates", [
                ...slotState.ancovaCovariates,
                selectedAvailable,
              ]);
            }
          }}
          onRemove={(c) => {
            updateSlot(
              "ancovaCovariates",
              slotState.ancovaCovariates.filter((v) => v !== c),
            );
          }}
          selectedAvailable={selectedAvailable}
          buttonText="Add Covariate"
          placeholder="Select 1 or more continuous covariates"
          minHeight="min-h-[48px]"
          chipClass="bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 font-mono"
          showScale={false}
        />
      </>
    );
  }

  // 6. Chi-Square Test of Independence
  return (
    <>
      <SingleVariableSlot
        label="Row Variable (Categorical):"
        value={slotState.rowVar}
        onSet={() => {
          if (selectedAvailable) updateSlot("rowVar", selectedAvailable);
        }}
        onClear={() => updateSlot("rowVar", null)}
        selectedAvailable={selectedAvailable}
        scale={
          slotState.rowVar
            ? variableScales[slotState.rowVar] || "nominal"
            : undefined
        }
        buttonText="Set Row"
        placeholder="Select Nominal or Ordinal variable"
      />

      <SingleVariableSlot
        label="Column Variable (Categorical):"
        value={slotState.colVar}
        onSet={() => {
          if (selectedAvailable) updateSlot("colVar", selectedAvailable);
        }}
        onClear={() => updateSlot("colVar", null)}
        selectedAvailable={selectedAvailable}
        scale={
          slotState.colVar
            ? variableScales[slotState.colVar] || "nominal"
            : undefined
        }
        buttonText="Set Col"
        placeholder="Select Nominal or Ordinal variable"
      />
    </>
  );
};
