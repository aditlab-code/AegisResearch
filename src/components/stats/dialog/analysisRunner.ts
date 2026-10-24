import {
  AnalysisType,
  AnalysisResult,
  MeasurementScale,
  DescriptiveRequest,
  ReliabilityRequest,
  RegressionRequest,
  LogisticRegressionRequest,
  ManovaRequest,
  PcaRequest,
  TTestOneSampleRequest,
  TTestIndependentRequest,
  TTestPairedRequest,
  AnovaOneWayRequest,
  AnovaTwoWayRequest,
  AncovaRequest,
  CorrelationRequest,
  MannWhitneyRequest,
  WilcoxonSignedRankRequest,
  KruskalWallisRequest,
  ChiSquareIndependenceRequest,
} from "../../../types/stats";
import { statsApi } from "../../../services";
import { DialogSlotState } from "./dialogTypes";

export async function executeAnalysis(
  analysisType: AnalysisType,
  projectName: string,
  filePath: string,
  slots: DialogSlotState,
  variableScales: Record<string, MeasurementScale>,
): Promise<AnalysisResult> {
  if (analysisType === "descriptive") {
    if (slots.descriptiveVars.length === 0) {
      throw new Error(
        "Please select at least one variable for descriptive analysis.",
      );
    }
    const req: DescriptiveRequest = {
      file_path: filePath,
      variables: slots.descriptiveVars,
      include_normality: slots.includeNormality,
      missing_strategy: slots.descriptiveMissingStrategy,
      include_plot: slots.includePlot,
    };
    return await statsApi.runDescriptive(projectName, req);
  }

  if (analysisType === "reliability") {
    if (slots.reliabilityItems.length < 2) {
      throw new Error(
        "Reliability analysis requires at least 2 items/variables.",
      );
    }
    const req: ReliabilityRequest = {
      file_path: filePath,
      items: slots.reliabilityItems,
    };
    return await statsApi.runReliability(projectName, req);
  }

  if (analysisType === "regression") {
    if (!slots.dependentVar) {
      throw new Error("Please select a Dependent (Y) variable.");
    }
    if (slots.independentVars.length === 0) {
      throw new Error("Please select at least one Independent (X) variable.");
    }
    if (variableScales[slots.dependentVar] === "nominal") {
      throw new Error(
        "Dependent variable (Y) cannot be Nominal for OLS regression.",
      );
    }
    const req: RegressionRequest = {
      file_path: filePath,
      dependent: slots.dependentVar,
      independents: slots.independentVars,
      check_vif: slots.checkVif,
      check_durbin_watson: slots.checkDw,
      baseline_independents:
        slots.regressionBaselineVars.length > 0
          ? slots.regressionBaselineVars
          : undefined,
      missing_strategy: slots.regressionMissingStrategy,
      include_plot: slots.includePlot,
    };
    return await statsApi.runRegression(projectName, req);
  }

  if (analysisType === "logistic_regression") {
    if (!slots.dependentVar) {
      throw new Error("Please select a Binary Dependent (Y) variable.");
    }
    if (slots.independentVars.length === 0) {
      throw new Error("Please select at least one Independent (X) variable.");
    }
    const req: LogisticRegressionRequest = {
      file_path: filePath,
      dependent: slots.dependentVar,
      independents: slots.independentVars,
      cutoff: slots.logisticCutoff,
      missing_strategy: slots.regressionMissingStrategy,
      include_plot: slots.includePlot,
    };
    return await statsApi.runLogisticRegression(projectName, req);
  }

  if (analysisType === "manova") {
    if (slots.manovaDeps.length < 2) {
      throw new Error("MANOVA requires at least 2 Dependent variables.");
    }
    if (!slots.manovaFactor) {
      throw new Error("Please select a Factor (grouping) variable.");
    }
    const req: ManovaRequest = {
      file_path: filePath,
      dependents: slots.manovaDeps,
      factor: slots.manovaFactor,
      include_plot: slots.includePlot,
    };
    return await statsApi.runManova(projectName, req);
  }

  if (analysisType === "pca") {
    if (slots.pcaVars.length < 2) {
      throw new Error("PCA requires at least 2 variables.");
    }
    const req: PcaRequest = {
      file_path: filePath,
      variables: slots.pcaVars,
      n_components: slots.pcaComponents,
    };
    return await statsApi.runPca(projectName, req);
  }

  if (analysisType === "ttest_one_sample") {
    if (!slots.singleVar) {
      throw new Error("Please select a Test Variable.");
    }
    const req: TTestOneSampleRequest = {
      file_path: filePath,
      variable: slots.singleVar,
      test_value: slots.testValue,
      alternative: slots.ttestAlternative,
      missing_strategy: slots.ttestMissingStrategy,
      include_plot: slots.includePlot,
    };
    return await statsApi.runTTestOneSample(projectName, req);
  }

  if (analysisType === "ttest_independent") {
    if (!slots.singleVar) {
      throw new Error("Please select a Test Variable.");
    }
    if (!slots.groupVar) {
      throw new Error("Please select a Grouping Variable.");
    }
    const req: TTestIndependentRequest = {
      file_path: filePath,
      test_variable: slots.singleVar,
      group_variable: slots.groupVar,
      alternative: slots.ttestAlternative,
      missing_strategy: slots.ttestMissingStrategy,
      include_plot: slots.includePlot,
    };
    return await statsApi.runTTestIndependent(projectName, req);
  }

  if (analysisType === "ttest_paired") {
    if (!slots.pairedVar1 || !slots.pairedVar2) {
      throw new Error(
        "Please select both Variable 1 and Variable 2 for paired comparison.",
      );
    }
    const req: TTestPairedRequest = {
      file_path: filePath,
      var1: slots.pairedVar1,
      var2: slots.pairedVar2,
      alternative: slots.ttestAlternative,
      missing_strategy: slots.ttestMissingStrategy,
      include_plot: slots.includePlot,
    };
    return await statsApi.runTTestPaired(projectName, req);
  }

  if (analysisType === "anova_oneway") {
    if (!slots.singleVar) {
      throw new Error("Please select a Dependent Variable.");
    }
    if (!slots.groupVar) {
      throw new Error("Please select a Factor (grouping) Variable.");
    }
    const req: AnovaOneWayRequest = {
      file_path: filePath,
      dependent: slots.singleVar,
      factor: slots.groupVar,
      post_hoc: slots.postHocTukey,
      include_plot: slots.includePlot,
    };
    return await statsApi.runAnovaOneWay(projectName, req);
  }

  if (analysisType === "anova_twoway") {
    if (!slots.singleVar) {
      throw new Error("Please select a Dependent Variable.");
    }
    if (!slots.factorVar1 || !slots.factorVar2) {
      throw new Error("Please select both Factor 1 and Factor 2.");
    }
    const req: AnovaTwoWayRequest = {
      file_path: filePath,
      dependent: slots.singleVar,
      factor1: slots.factorVar1,
      factor2: slots.factorVar2,
      include_plot: slots.includePlot,
    };
    return await statsApi.runAnovaTwoWay(projectName, req);
  }

  if (analysisType === "ancova") {
    if (!slots.singleVar) {
      throw new Error("Please select a Dependent Variable.");
    }
    if (!slots.groupVar) {
      throw new Error("Please select a Factor / Grouping Variable.");
    }
    if (slots.ancovaCovariates.length === 0) {
      throw new Error("Please select at least one Covariate variable.");
    }
    const req: AncovaRequest = {
      file_path: filePath,
      dependent: slots.singleVar,
      factor: slots.groupVar,
      covariates: slots.ancovaCovariates,
      include_plot: slots.includePlot,
    };
    return await statsApi.runAncova(projectName, req);
  }

  if (analysisType === "correlation_pearson") {
    if (slots.corrVars.length < 2) {
      throw new Error("Correlation requires at least 2 variables.");
    }
    const req: CorrelationRequest = {
      file_path: filePath,
      variables: slots.corrVars,
      include_plot: slots.includePlot,
    };
    return await statsApi.runCorrelationPearson(projectName, req);
  }

  if (analysisType === "mann_whitney") {
    if (!slots.singleVar) {
      throw new Error("Please select a Test Variable.");
    }
    if (!slots.groupVar) {
      throw new Error("Please select a Grouping Variable (with 2 categories).");
    }
    const req: MannWhitneyRequest = {
      file_path: filePath,
      test_variable: slots.singleVar,
      group_variable: slots.groupVar,
      include_plot: slots.includePlot,
    };
    return await statsApi.runMannWhitney(projectName, req);
  }

  if (analysisType === "wilcoxon") {
    if (!slots.pairedVar1 || !slots.pairedVar2) {
      throw new Error("Please select both Paired Measure 1 and Measure 2.");
    }
    const req: WilcoxonSignedRankRequest = {
      file_path: filePath,
      var1: slots.pairedVar1,
      var2: slots.pairedVar2,
      include_plot: slots.includePlot,
    };
    return await statsApi.runWilcoxon(projectName, req);
  }

  if (analysisType === "kruskal") {
    if (!slots.singleVar) {
      throw new Error("Please select a Test Variable.");
    }
    if (!slots.groupVar) {
      throw new Error("Please select a Grouping Variable.");
    }
    const req: KruskalWallisRequest = {
      file_path: filePath,
      test_variable: slots.singleVar,
      group_variable: slots.groupVar,
      include_plot: slots.includePlot,
    };
    return await statsApi.runKruskal(projectName, req);
  }

  if (analysisType === "correlation_spearman") {
    if (slots.corrVars.length < 2) {
      throw new Error("Spearman correlation requires at least 2 variables.");
    }
    const req: CorrelationRequest = {
      file_path: filePath,
      variables: slots.corrVars,
      include_plot: slots.includePlot,
    };
    return await statsApi.runCorrelationSpearman(projectName, req);
  }

  // analysisType === "chisquare"
  if (!slots.rowVar || !slots.colVar) {
    throw new Error("Please select both Row and Column categorical variables.");
  }
  const req: ChiSquareIndependenceRequest = {
    file_path: filePath,
    row_variable: slots.rowVar,
    col_variable: slots.colVar,
    include_plot: slots.includePlot,
  };
  return await statsApi.runChiSquare(projectName, req);
}
