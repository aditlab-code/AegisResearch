import { AnalysisType, MeasurementScale } from "../../../types/stats";
import { validateSlotScale } from "../../../utils/measurementScale";
import { DialogSlotState } from "./dialogTypes";

export function validateStevensScales(
  analysisType: AnalysisType,
  slots: DialogSlotState,
  variableScales: Record<string, MeasurementScale>,
): string[] {
  const warnings: string[] = [];

  if (analysisType === "regression") {
    if (slots.dependentVar) {
      const scale = variableScales[slots.dependentVar] || "scale";
      const v = validateSlotScale(scale, "dependent", "regression");
      if (v.warning) warnings.push(v.warning);
    }
    slots.independentVars.forEach((vName) => {
      const scale = variableScales[vName] || "scale";
      const v = validateSlotScale(scale, "independent", "regression");
      if (v.warning) warnings.push(v.warning);
    });
  } else if (analysisType === "logistic_regression") {
    if (slots.dependentVar) {
      const scale = variableScales[slots.dependentVar] || "nominal";
      const v = validateSlotScale(scale, "dependent", "logistic_regression");
      if (v.warning) warnings.push(v.warning);
    }
  } else if (analysisType === "manova") {
    if (slots.manovaFactor) {
      const scale = variableScales[slots.manovaFactor] || "nominal";
      const v = validateSlotScale(scale, "factor", "manova");
      if (v.warning) warnings.push(v.warning);
    }
    slots.manovaDeps.forEach((vName) => {
      const scale = variableScales[vName] || "scale";
      const v = validateSlotScale(scale, "dependent", "manova");
      if (v.warning) warnings.push(v.warning);
    });
  } else if (analysisType === "reliability") {
    slots.reliabilityItems.forEach((vName) => {
      const scale = variableScales[vName] || "ordinal";
      const v = validateSlotScale(scale, "item", "reliability");
      if (v.warning) warnings.push(v.warning);
    });
  } else if (analysisType === "pca") {
    slots.pcaVars.forEach((vName) => {
      const scale = variableScales[vName] || "scale";
      const v = validateSlotScale(scale, "independent", "pca");
      if (v.warning) warnings.push(v.warning);
    });
  } else if (analysisType === "ttest_one_sample") {
    if (slots.singleVar) {
      const scale = variableScales[slots.singleVar] || "scale";
      const v = validateSlotScale(scale, "dependent", "ttest_one_sample");
      if (v.warning) warnings.push(v.warning);
    }
  } else if (analysisType === "ttest_independent") {
    if (slots.singleVar) {
      const scale = variableScales[slots.singleVar] || "scale";
      const v = validateSlotScale(scale, "dependent", "ttest_independent");
      if (v.warning) warnings.push(v.warning);
    }
    if (slots.groupVar) {
      const scale = variableScales[slots.groupVar] || "nominal";
      const v = validateSlotScale(scale, "factor", "ttest_independent");
      if (v.warning) warnings.push(v.warning);
    }
  } else if (analysisType === "ttest_paired") {
    if (slots.pairedVar1) {
      const scale = variableScales[slots.pairedVar1] || "scale";
      const v = validateSlotScale(scale, "dependent", "ttest_paired");
      if (v.warning) warnings.push(v.warning);
    }
    if (slots.pairedVar2) {
      const scale = variableScales[slots.pairedVar2] || "scale";
      const v = validateSlotScale(scale, "dependent", "ttest_paired");
      if (v.warning) warnings.push(v.warning);
    }
  } else if (analysisType === "anova_oneway") {
    if (slots.singleVar) {
      const scale = variableScales[slots.singleVar] || "scale";
      const v = validateSlotScale(scale, "dependent", "anova_oneway");
      if (v.warning) warnings.push(v.warning);
    }
    if (slots.groupVar) {
      const scale = variableScales[slots.groupVar] || "nominal";
      const v = validateSlotScale(scale, "factor", "anova_oneway");
      if (v.warning) warnings.push(v.warning);
    }
  } else if (analysisType === "anova_twoway") {
    if (slots.singleVar) {
      const scale = variableScales[slots.singleVar] || "scale";
      const v = validateSlotScale(scale, "dependent", "anova_twoway");
      if (v.warning) warnings.push(v.warning);
    }
    if (slots.factorVar1) {
      const scale = variableScales[slots.factorVar1] || "nominal";
      const v = validateSlotScale(scale, "factor", "anova_twoway");
      if (v.warning) warnings.push(v.warning);
    }
    if (slots.factorVar2) {
      const scale = variableScales[slots.factorVar2] || "nominal";
      const v = validateSlotScale(scale, "factor", "anova_twoway");
      if (v.warning) warnings.push(v.warning);
    }
  } else if (analysisType === "ancova") {
    if (slots.singleVar) {
      const scale = variableScales[slots.singleVar] || "scale";
      const v = validateSlotScale(scale, "dependent", "ancova");
      if (v.warning) warnings.push(v.warning);
    }
    if (slots.groupVar) {
      const scale = variableScales[slots.groupVar] || "nominal";
      const v = validateSlotScale(scale, "factor", "ancova");
      if (v.warning) warnings.push(v.warning);
    }
    slots.ancovaCovariates.forEach((vName) => {
      const scale = variableScales[vName] || "scale";
      const v = validateSlotScale(scale, "independent", "ancova");
      if (v.warning) warnings.push(v.warning);
    });
  } else if (analysisType === "correlation_pearson") {
    slots.corrVars.forEach((vName) => {
      const scale = variableScales[vName] || "scale";
      const v = validateSlotScale(scale, "dependent", "correlation_pearson");
      if (v.warning) warnings.push(v.warning);
    });
  } else if (analysisType === "chisquare") {
    if (slots.rowVar) {
      const scale = variableScales[slots.rowVar] || "nominal";
      const v = validateSlotScale(scale, "factor", "chisquare");
      if (v.warning) warnings.push(v.warning);
    }
    if (slots.colVar) {
      const scale = variableScales[slots.colVar] || "nominal";
      const v = validateSlotScale(scale, "factor", "chisquare");
      if (v.warning) warnings.push(v.warning);
    }
  }

  return warnings;
}
