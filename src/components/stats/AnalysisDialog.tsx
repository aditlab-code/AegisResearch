import React, { useState, useMemo, useEffect } from "react";
import {
  X,
  Play,
  ArrowRight,
  Search,
  AlertTriangle,
  AlertCircle,
  HelpCircle,
  Sliders,
  BarChart3,
  CheckCircle2,
  GitCompare,
  Layers,
  Ruler,
  BarChart2,
  Tag,
  Loader2,
  Compass,
} from "lucide-react";
import {
  AnalysisType,
  AnalysisResult,
  MeasurementScale,
  DescriptiveRequest,
  ReliabilityRequest,
  RegressionRequest,
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
} from "../../types/stats";
import {
  inferMeasurementScale,
  getNextScale,
  getScaleMeta,
  validateSlotScale,
} from "../../utils/measurementScale";
import { statsApi } from "../../services";

export interface AnalysisDialogProps {
  isOpen: boolean;
  onClose: () => void;
  columns: string[];
  filePath: string;
  projectName: string;
  analysisType: AnalysisType;
  onAnalysisComplete: (result: AnalysisResult) => void;
  onOpenGuide?: () => void;
}

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

  // Variable measurement scales map (variableName -> scale)
  const [variableScales, setVariableScales] = useState<
    Record<string, MeasurementScale>
  >({});

  // Initialize measurement scales when columns change
  useEffect(() => {
    const initialScales: Record<string, MeasurementScale> = {};
    columns.forEach((col) => {
      initialScales[col] = inferMeasurementScale(col);
    });
    setVariableScales(initialScales);
  }, [columns]);

  const toggleVariableScale = (varName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setVariableScales((prev) => {
      const current = prev[varName] || "scale";
      return { ...prev, [varName]: getNextScale(current) };
    });
  };

  // Model variable slots
  const [descriptiveVars, setDescriptiveVars] = useState<string[]>([]);
  const [includeNormality, setIncludeNormality] = useState(true);

  const [reliabilityItems, setReliabilityItems] = useState<string[]>([]);

  const [dependentVar, setDependentVar] = useState<string | null>(null);
  const [independentVars, setIndependentVars] = useState<string[]>([]);
  const [checkVif, setCheckVif] = useState(true);
  const [checkDw, setCheckDw] = useState(true);

  const [manovaDeps, setManovaDeps] = useState<string[]>([]);
  const [manovaFactor, setManovaFactor] = useState<string | null>(null);

  const [pcaVars, setPcaVars] = useState<string[]>([]);
  const [pcaComponents, setPcaComponents] = useState<number>(2);

  // Parametric & Non-Parametric Slots
  const [singleVar, setSingleVar] = useState<string | null>(null);
  const [testValue, setTestValue] = useState<number>(0);
  const [groupVar, setGroupVar] = useState<string | null>(null);
  const [pairedVar1, setPairedVar1] = useState<string | null>(null);
  const [pairedVar2, setPairedVar2] = useState<string | null>(null);
  const [factorVar1, setFactorVar1] = useState<string | null>(null);
  const [factorVar2, setFactorVar2] = useState<string | null>(null);
  const [corrVars, setCorrVars] = useState<string[]>([]);
  const [rowVar, setRowVar] = useState<string | null>(null);
  const [colVar, setColVar] = useState<string | null>(null);
  const [ancovaCovariates, setAncovaCovariates] = useState<string[]>([]);
  const [postHocTukey, setPostHocTukey] = useState(true);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filter available columns
  const filteredColumns = useMemo(() => {
    return columns.filter((col) =>
      col.toLowerCase().includes(searchFilter.toLowerCase()),
    );
  }, [columns, searchFilter]);

  // Validation Warnings
  const validationWarnings = useMemo(() => {
    const warnings: string[] = [];

    if (analysisType === "regression") {
      if (dependentVar) {
        const scale = variableScales[dependentVar] || "scale";
        const v = validateSlotScale(scale, "dependent", "regression");
        if (v.warning) warnings.push(v.warning);
      }
      independentVars.forEach((vName) => {
        const scale = variableScales[vName] || "scale";
        const v = validateSlotScale(scale, "independent", "regression");
        if (v.warning) warnings.push(v.warning);
      });
    } else if (analysisType === "manova") {
      if (manovaFactor) {
        const scale = variableScales[manovaFactor] || "nominal";
        const v = validateSlotScale(scale, "factor", "manova");
        if (v.warning) warnings.push(v.warning);
      }
      manovaDeps.forEach((vName) => {
        const scale = variableScales[vName] || "scale";
        const v = validateSlotScale(scale, "dependent", "manova");
        if (v.warning) warnings.push(v.warning);
      });
    } else if (analysisType === "reliability") {
      reliabilityItems.forEach((vName) => {
        const scale = variableScales[vName] || "ordinal";
        const v = validateSlotScale(scale, "item", "reliability");
        if (v.warning) warnings.push(v.warning);
      });
    } else if (analysisType === "pca") {
      pcaVars.forEach((vName) => {
        const scale = variableScales[vName] || "scale";
        const v = validateSlotScale(scale, "independent", "pca");
        if (v.warning) warnings.push(v.warning);
      });
    } else if (analysisType === "ttest_one_sample") {
      if (singleVar) {
        const scale = variableScales[singleVar] || "scale";
        const v = validateSlotScale(scale, "dependent", "ttest_one_sample");
        if (v.warning) warnings.push(v.warning);
      }
    } else if (analysisType === "ttest_independent") {
      if (singleVar) {
        const scale = variableScales[singleVar] || "scale";
        const v = validateSlotScale(scale, "dependent", "ttest_independent");
        if (v.warning) warnings.push(v.warning);
      }
      if (groupVar) {
        const scale = variableScales[groupVar] || "nominal";
        const v = validateSlotScale(scale, "factor", "ttest_independent");
        if (v.warning) warnings.push(v.warning);
      }
    } else if (analysisType === "ttest_paired") {
      if (pairedVar1) {
        const scale = variableScales[pairedVar1] || "scale";
        const v = validateSlotScale(scale, "dependent", "ttest_paired");
        if (v.warning) warnings.push(v.warning);
      }
      if (pairedVar2) {
        const scale = variableScales[pairedVar2] || "scale";
        const v = validateSlotScale(scale, "dependent", "ttest_paired");
        if (v.warning) warnings.push(v.warning);
      }
    } else if (analysisType === "anova_oneway") {
      if (singleVar) {
        const scale = variableScales[singleVar] || "scale";
        const v = validateSlotScale(scale, "dependent", "anova_oneway");
        if (v.warning) warnings.push(v.warning);
      }
      if (groupVar) {
        const scale = variableScales[groupVar] || "nominal";
        const v = validateSlotScale(scale, "factor", "anova_oneway");
        if (v.warning) warnings.push(v.warning);
      }
    } else if (analysisType === "anova_twoway") {
      if (singleVar) {
        const scale = variableScales[singleVar] || "scale";
        const v = validateSlotScale(scale, "dependent", "anova_twoway");
        if (v.warning) warnings.push(v.warning);
      }
      if (factorVar1) {
        const scale = variableScales[factorVar1] || "nominal";
        const v = validateSlotScale(scale, "factor", "anova_twoway");
        if (v.warning) warnings.push(v.warning);
      }
      if (factorVar2) {
        const scale = variableScales[factorVar2] || "nominal";
        const v = validateSlotScale(scale, "factor", "anova_twoway");
        if (v.warning) warnings.push(v.warning);
      }
    } else if (analysisType === "ancova") {
      if (singleVar) {
        const scale = variableScales[singleVar] || "scale";
        const v = validateSlotScale(scale, "dependent", "ancova");
        if (v.warning) warnings.push(v.warning);
      }
      if (groupVar) {
        const scale = variableScales[groupVar] || "nominal";
        const v = validateSlotScale(scale, "factor", "ancova");
        if (v.warning) warnings.push(v.warning);
      }
      ancovaCovariates.forEach((vName) => {
        const scale = variableScales[vName] || "scale";
        const v = validateSlotScale(scale, "independent", "ancova");
        if (v.warning) warnings.push(v.warning);
      });
    } else if (analysisType === "correlation_pearson") {
      corrVars.forEach((vName) => {
        const scale = variableScales[vName] || "scale";
        const v = validateSlotScale(scale, "dependent", "correlation_pearson");
        if (v.warning) warnings.push(v.warning);
      });
    } else if (analysisType === "chisquare") {
      if (rowVar) {
        const scale = variableScales[rowVar] || "nominal";
        const v = validateSlotScale(scale, "factor", "chisquare");
        if (v.warning) warnings.push(v.warning);
      }
      if (colVar) {
        const scale = variableScales[colVar] || "nominal";
        const v = validateSlotScale(scale, "factor", "chisquare");
        if (v.warning) warnings.push(v.warning);
      }
    }

    return warnings;
  }, [
    analysisType,
    dependentVar,
    independentVars,
    manovaFactor,
    manovaDeps,
    reliabilityItems,
    pcaVars,
    singleVar,
    groupVar,
    pairedVar1,
    pairedVar2,
    factorVar1,
    factorVar2,
    ancovaCovariates,
    corrVars,
    rowVar,
    colVar,
    variableScales,
  ]);

  if (!isOpen) return null;

  const getHeaderMeta = () => {
    switch (analysisType) {
      case "regression":
        return {
          title: "Multiple Linear Regression",
          icon: Sliders,
          desc: "Model linear relationships, evaluate coefficients, and test collinearity (VIF).",
        };
      case "descriptive":
        return {
          title: "Descriptive Statistics & Normality",
          icon: BarChart3,
          desc: "Calculate summary statistics (Mean, SD, Skewness, Kurtosis) & Shapiro-Wilk test.",
        };
      case "reliability":
        return {
          title: "Scale Reliability Analysis",
          icon: CheckCircle2,
          desc: "Evaluate internal consistency across questionnaire items (Cronbach's Alpha).",
        };
      case "manova":
        return {
          title: "Multivariate Analysis of Variance (MANOVA)",
          icon: GitCompare,
          desc: "Assess group differences across multiple continuous dependent variables simultaneously.",
        };
      case "pca":
        return {
          title: "Principal Component Analysis (PCA)",
          icon: Layers,
          desc: "Reduce dimensionality while preserving maximal variance in component loadings.",
        };
      case "ttest_one_sample":
        return {
          title: "One-Sample t-Test",
          icon: Ruler,
          desc: "Compare sample mean of a continuous variable against a standard hypothesized value.",
        };
      case "ttest_independent":
        return {
          title: "Independent Samples t-Test",
          icon: GitCompare,
          desc: "Compare means between two independent groups (with Levene's and Welch's correction).",
        };
      case "ttest_paired":
        return {
          title: "Paired Samples t-Test",
          icon: GitCompare,
          desc: "Compare means between two related or repeated measures (e.g. pre-test vs. post-test).",
        };
      case "anova_oneway":
        return {
          title: "One-Way ANOVA",
          icon: BarChart3,
          desc: "Compare means across three or more groups with post-hoc Tukey HSD test.",
        };
      case "anova_twoway":
        return {
          title: "Two-Way Factorial ANOVA",
          icon: Layers,
          desc: "Analyze main effects of two categorical factors and their interaction effect on an outcome.",
        };
      case "ancova":
        return {
          title: "Analysis of Covariance (ANCOVA)",
          icon: BarChart3,
          desc: "Evaluate treatment group differences on a continuous outcome while controlling for continuous covariate(s).",
        };
      case "correlation_pearson":
        return {
          title: "Bivariate Pearson Correlation",
          icon: Sliders,
          desc: "Measure linear correlation coefficient (r) and significance among quantitative variables.",
        };
      case "mann_whitney":
        return {
          title: "Mann-Whitney U Test",
          icon: BarChart2,
          desc: "Non-parametric rank test comparing distributions between two independent groups.",
        };
      case "wilcoxon":
        return {
          title: "Wilcoxon Signed-Rank Test",
          icon: BarChart2,
          desc: "Non-parametric test for paired observations or non-normal repeated measures.",
        };
      case "kruskal":
        return {
          title: "Kruskal-Wallis H Test",
          icon: BarChart2,
          desc: "Non-parametric alternative to one-way ANOVA for comparing three or more independent groups.",
        };
      case "correlation_spearman":
        return {
          title: "Spearman Rank Correlation",
          icon: BarChart2,
          desc: "Measure monotonic association (rho) for ranked or ordinal variables.",
        };
      case "chisquare":
        return {
          title: "Chi-Square Test of Independence",
          icon: Tag,
          desc: "Analyze cross-tabulation and association between two categorical variables with Cramér's V.",
        };
    }
  };

  const headerMeta = getHeaderMeta();
  const HeaderIcon = headerMeta.icon;

  const handleRunAnalysis = async () => {
    setError(null);
    setLoading(true);
    try {
      let res: AnalysisResult;

      if (analysisType === "descriptive") {
        if (descriptiveVars.length === 0) {
          throw new Error(
            "Please select at least one variable for descriptive analysis.",
          );
        }
        const req: DescriptiveRequest = {
          file_path: filePath,
          variables: descriptiveVars,
          include_normality: includeNormality,
        };
        res = await statsApi.runDescriptive(projectName, req);
      } else if (analysisType === "reliability") {
        if (reliabilityItems.length < 2) {
          throw new Error(
            "Reliability analysis requires at least 2 items/variables.",
          );
        }
        const req: ReliabilityRequest = {
          file_path: filePath,
          items: reliabilityItems,
        };
        res = await statsApi.runReliability(projectName, req);
      } else if (analysisType === "regression") {
        if (!dependentVar) {
          throw new Error("Please select a Dependent (Y) variable.");
        }
        if (independentVars.length === 0) {
          throw new Error(
            "Please select at least one Independent (X) variable.",
          );
        }
        if (variableScales[dependentVar] === "nominal") {
          throw new Error(
            "Dependent variable (Y) cannot be Nominal for OLS regression.",
          );
        }
        const req: RegressionRequest = {
          file_path: filePath,
          dependent: dependentVar,
          independents: independentVars,
          check_vif: checkVif,
          check_durbin_watson: checkDw,
        };
        res = await statsApi.runRegression(projectName, req);
      } else if (analysisType === "manova") {
        if (manovaDeps.length < 2) {
          throw new Error("MANOVA requires at least 2 Dependent variables.");
        }
        if (!manovaFactor) {
          throw new Error("Please select a Factor (grouping) variable.");
        }
        const req: ManovaRequest = {
          file_path: filePath,
          dependents: manovaDeps,
          factor: manovaFactor,
        };
        res = await statsApi.runManova(projectName, req);
      } else if (analysisType === "pca") {
        if (pcaVars.length < 2) {
          throw new Error("PCA requires at least 2 variables.");
        }
        const req: PcaRequest = {
          file_path: filePath,
          variables: pcaVars,
          n_components: pcaComponents,
        };
        res = await statsApi.runPca(projectName, req);
      } else if (analysisType === "ttest_one_sample") {
        if (!singleVar) {
          throw new Error("Please select a Test Variable.");
        }
        const req: TTestOneSampleRequest = {
          file_path: filePath,
          variable: singleVar,
          test_value: testValue,
        };
        res = await statsApi.runTTestOneSample(projectName, req);
      } else if (analysisType === "ttest_independent") {
        if (!singleVar) {
          throw new Error("Please select a Test Variable.");
        }
        if (!groupVar) {
          throw new Error("Please select a Grouping Variable.");
        }
        const req: TTestIndependentRequest = {
          file_path: filePath,
          test_variable: singleVar,
          group_variable: groupVar,
        };
        res = await statsApi.runTTestIndependent(projectName, req);
      } else if (analysisType === "ttest_paired") {
        if (!pairedVar1 || !pairedVar2) {
          throw new Error(
            "Please select both Variable 1 and Variable 2 for paired comparison.",
          );
        }
        const req: TTestPairedRequest = {
          file_path: filePath,
          var1: pairedVar1,
          var2: pairedVar2,
        };
        res = await statsApi.runTTestPaired(projectName, req);
      } else if (analysisType === "anova_oneway") {
        if (!singleVar) {
          throw new Error("Please select a Dependent Variable.");
        }
        if (!groupVar) {
          throw new Error("Please select a Factor (grouping) Variable.");
        }
        const req: AnovaOneWayRequest = {
          file_path: filePath,
          dependent: singleVar,
          factor: groupVar,
          post_hoc: postHocTukey,
        };
        res = await statsApi.runAnovaOneWay(projectName, req);
      } else if (analysisType === "anova_twoway") {
        if (!singleVar) {
          throw new Error("Please select a Dependent Variable.");
        }
        if (!factorVar1 || !factorVar2) {
          throw new Error("Please select both Factor 1 and Factor 2.");
        }
        const req: AnovaTwoWayRequest = {
          file_path: filePath,
          dependent: singleVar,
          factor1: factorVar1,
          factor2: factorVar2,
        };
        res = await statsApi.runAnovaTwoWay(projectName, req);
      } else if (analysisType === "ancova") {
        if (!singleVar) {
          throw new Error("Please select a Dependent Variable.");
        }
        if (!groupVar) {
          throw new Error("Please select a Factor / Grouping Variable.");
        }
        if (ancovaCovariates.length === 0) {
          throw new Error("Please select at least one Covariate variable.");
        }
        const req: AncovaRequest = {
          file_path: filePath,
          dependent: singleVar,
          factor: groupVar,
          covariates: ancovaCovariates,
        };
        res = await statsApi.runAncova(projectName, req);
      } else if (analysisType === "correlation_pearson") {
        if (corrVars.length < 2) {
          throw new Error("Correlation requires at least 2 variables.");
        }
        const req: CorrelationRequest = {
          file_path: filePath,
          variables: corrVars,
        };
        res = await statsApi.runCorrelationPearson(projectName, req);
      } else if (analysisType === "mann_whitney") {
        if (!singleVar) {
          throw new Error("Please select a Test Variable.");
        }
        if (!groupVar) {
          throw new Error(
            "Please select a Grouping Variable (with 2 categories).",
          );
        }
        const req: MannWhitneyRequest = {
          file_path: filePath,
          test_variable: singleVar,
          group_variable: groupVar,
        };
        res = await statsApi.runMannWhitney(projectName, req);
      } else if (analysisType === "wilcoxon") {
        if (!pairedVar1 || !pairedVar2) {
          throw new Error("Please select both Paired Measure 1 and Measure 2.");
        }
        const req: WilcoxonSignedRankRequest = {
          file_path: filePath,
          var1: pairedVar1,
          var2: pairedVar2,
        };
        res = await statsApi.runWilcoxon(projectName, req);
      } else if (analysisType === "kruskal") {
        if (!singleVar) {
          throw new Error("Please select a Test Variable.");
        }
        if (!groupVar) {
          throw new Error("Please select a Grouping Variable.");
        }
        const req: KruskalWallisRequest = {
          file_path: filePath,
          test_variable: singleVar,
          group_variable: groupVar,
        };
        res = await statsApi.runKruskal(projectName, req);
      } else if (analysisType === "correlation_spearman") {
        if (corrVars.length < 2) {
          throw new Error(
            "Spearman correlation requires at least 2 variables.",
          );
        }
        const req: CorrelationRequest = {
          file_path: filePath,
          variables: corrVars,
        };
        res = await statsApi.runCorrelationSpearman(projectName, req);
      } else {
        // chisquare
        if (!rowVar || !colVar) {
          throw new Error(
            "Please select both Row and Column categorical variables.",
          );
        }
        const req: ChiSquareIndependenceRequest = {
          file_path: filePath,
          row_variable: rowVar,
          col_variable: colVar,
        };
        res = await statsApi.runChiSquare(projectName, req);
      }

      onAnalysisComplete(res);
      onClose();
    } catch (err: any) {
      setError(err?.message || "Statistical analysis failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-2xl w-full max-w-2xl flex flex-col max-h-[85vh] overflow-hidden text-zinc-900 dark:text-zinc-100 text-xs">
        {/* Header - Compact Single Purpose */}
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
          {/* Left Column: Available Variables with Measurement Scale badges */}
          <div className="flex flex-col border border-zinc-200 dark:border-zinc-800 rounded p-2.5 bg-zinc-50/50 dark:bg-zinc-950/40">
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[10px] font-semibold uppercase text-zinc-500 tracking-wider">
                Available Variables ({columns.length})
              </label>
              <span
                className="text-[9px] text-zinc-400"
                title="Click scale badge to cycle scale"
              >
                Click badge to change scale
              </span>
            </div>

            <div className="relative mb-1.5">
              <Search className="w-3.5 h-3.5 absolute left-2 top-2 text-zinc-400" />
              <input
                type="text"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                placeholder="Filter variables..."
                className="w-full pl-7 pr-2 py-1 text-[11px] rounded border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div className="flex-1 overflow-y-auto border border-zinc-200 dark:border-zinc-800 rounded bg-white dark:bg-zinc-900 max-h-56 divide-y divide-zinc-100 dark:divide-zinc-800/50">
              {filteredColumns.map((col) => {
                const scale = variableScales[col] || "scale";
                const meta = getScaleMeta(scale);
                const isSelected = selectedAvailable === col;

                return (
                  <div
                    key={col}
                    onClick={() => setSelectedAvailable(col)}
                    className={`px-2 py-1 flex items-center justify-between text-[11px] cursor-pointer select-none transition ${
                      isSelected
                        ? "bg-indigo-600 text-white font-medium"
                        : "hover:bg-zinc-100 dark:hover:bg-zinc-800/60"
                    }`}
                  >
                    <span className="truncate mr-1">{col}</span>
                    <button
                      type="button"
                      onClick={(e) => toggleVariableScale(col, e)}
                      title={`Scale: ${meta.label} (Click to change)`}
                      className={`text-[9px] font-mono px-1.5 py-0.5 rounded border transition shrink-0 inline-flex items-center gap-1 ${
                        isSelected
                          ? "bg-white/20 text-white border-white/40"
                          : meta.badgeClass
                      }`}
                    >
                      {scale === "scale" ? (
                        <Ruler className="w-2.5 h-2.5" />
                      ) : scale === "ordinal" ? (
                        <BarChart2 className="w-2.5 h-2.5" />
                      ) : (
                        <Tag className="w-2.5 h-2.5" />
                      )}
                      <span>{meta.shortLabel}</span>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Model Variable Slots */}
          <div className="flex flex-col gap-2.5">
            {/* 1. REGRESSION */}
            {analysisType === "regression" && (
              <>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] font-semibold text-zinc-700 dark:text-zinc-300">
                      Dependent Variable (Y):
                    </span>
                    {selectedAvailable && (
                      <button
                        onClick={() => {
                          setDependentVar(selectedAvailable);
                          setIndependentVars((prev) =>
                            prev.filter((v) => v !== selectedAvailable),
                          );
                        }}
                        className="text-[10px] text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-0.5"
                      >
                        <ArrowRight className="w-2.5 h-2.5" /> Set Y
                      </button>
                    )}
                  </div>
                  <div className="p-1.5 border border-zinc-200 dark:border-zinc-800 rounded bg-white dark:bg-zinc-900 text-[11px] min-h-[30px] flex items-center justify-between">
                    {dependentVar ? (
                      <div className="flex items-center justify-between w-full">
                        <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                          {dependentVar}{" "}
                          <span className="text-[9px] font-normal text-zinc-400">
                            (
                            {
                              getScaleMeta(
                                variableScales[dependentVar] || "scale",
                              ).shortLabel
                            }
                            )
                          </span>
                        </span>
                        <button
                          onClick={() => setDependentVar(null)}
                          className="text-zinc-400 hover:text-red-500"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <span className="text-zinc-400 italic text-[10px]">
                        Select 1 continuous (Scale) variable
                      </span>
                    )}
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] font-semibold text-zinc-700 dark:text-zinc-300">
                      Independent Variables (X):
                    </span>
                    {selectedAvailable && (
                      <button
                        onClick={() => {
                          if (selectedAvailable === dependentVar) return;
                          if (!independentVars.includes(selectedAvailable)) {
                            setIndependentVars((prev) => [
                              ...prev,
                              selectedAvailable,
                            ]);
                          }
                        }}
                        className="text-[10px] text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-0.5"
                      >
                        <ArrowRight className="w-2.5 h-2.5" /> Add X
                      </button>
                    )}
                  </div>
                  <div className="p-1.5 border border-zinc-200 dark:border-zinc-800 rounded bg-white dark:bg-zinc-900 text-[11px] min-h-[60px] flex flex-wrap gap-1 content-start">
                    {independentVars.length === 0 ? (
                      <span className="text-zinc-400 italic text-[10px]">
                        Select predictor variables
                      </span>
                    ) : (
                      independentVars.map((v) => (
                        <span
                          key={v}
                          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-[10px]"
                        >
                          {v}{" "}
                          <span className="text-[9px] text-zinc-400">
                            (
                            {
                              getScaleMeta(variableScales[v] || "scale")
                                .shortLabel
                            }
                            )
                          </span>
                          <button
                            onClick={() =>
                              setIndependentVars((prev) =>
                                prev.filter((x) => x !== v),
                              )
                            }
                            className="hover:text-red-500"
                          >
                            <X className="w-2.5 h-2.5" />
                          </button>
                        </span>
                      ))
                    )}
                  </div>
                </div>

                <div className="pt-1.5 border-t border-zinc-200 dark:border-zinc-800 flex flex-col gap-1 text-[10px] text-zinc-600 dark:text-zinc-400">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={checkVif}
                      onChange={(e) => setCheckVif(e.target.checked)}
                      className="rounded text-indigo-600"
                    />
                    Collinearity Diagnostics (VIF & Tolerance)
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={checkDw}
                      onChange={(e) => setCheckDw(e.target.checked)}
                      className="rounded text-indigo-600"
                    />
                    Durbin-Watson Residual Autocorrelation
                  </label>
                </div>
              </>
            )}

            {/* 2. DESCRIPTIVE */}
            {analysisType === "descriptive" && (
              <>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-semibold text-zinc-700 dark:text-zinc-300">
                    Selected Variables:
                  </span>
                  {selectedAvailable && (
                    <button
                      onClick={() => {
                        if (!descriptiveVars.includes(selectedAvailable)) {
                          setDescriptiveVars((prev) => [
                            ...prev,
                            selectedAvailable,
                          ]);
                        }
                      }}
                      className="text-[10px] text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-0.5"
                    >
                      <ArrowRight className="w-2.5 h-2.5" /> Add Variable
                    </button>
                  )}
                </div>
                <div className="p-1.5 border border-zinc-200 dark:border-zinc-800 rounded bg-white dark:bg-zinc-900 text-[11px] min-h-[90px] flex flex-wrap gap-1 content-start">
                  {descriptiveVars.length === 0 ? (
                    <span className="text-zinc-400 italic text-[10px]">
                      Add variables to analyze
                    </span>
                  ) : (
                    descriptiveVars.map((v) => (
                      <span
                        key={v}
                        className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-[10px]"
                      >
                        {v}{" "}
                        <span className="text-[9px] text-zinc-400">
                          (
                          {
                            getScaleMeta(variableScales[v] || "scale")
                              .shortLabel
                          }
                          )
                        </span>
                        <button
                          onClick={() =>
                            setDescriptiveVars((prev) =>
                              prev.filter((x) => x !== v),
                            )
                          }
                          className="hover:text-red-500"
                        >
                          <X className="w-2.5 h-2.5" />
                        </button>
                      </span>
                    ))
                  )}
                </div>
                <label className="flex items-center gap-1.5 text-[10px] cursor-pointer text-zinc-600 dark:text-zinc-400">
                  <input
                    type="checkbox"
                    checked={includeNormality}
                    onChange={(e) => setIncludeNormality(e.target.checked)}
                    className="rounded text-indigo-600"
                  />
                  Shapiro-Wilk Normality Test (for Scale variables)
                </label>
              </>
            )}

            {/* 3. RELIABILITY */}
            {analysisType === "reliability" && (
              <>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-semibold text-zinc-700 dark:text-zinc-300">
                    Scale / Questionnaire Items:
                  </span>
                  {selectedAvailable && (
                    <button
                      onClick={() => {
                        if (!reliabilityItems.includes(selectedAvailable)) {
                          setReliabilityItems((prev) => [
                            ...prev,
                            selectedAvailable,
                          ]);
                        }
                      }}
                      className="text-[10px] text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-0.5"
                    >
                      <ArrowRight className="w-2.5 h-2.5" /> Add Item
                    </button>
                  )}
                </div>
                <div className="p-1.5 border border-zinc-200 dark:border-zinc-800 rounded bg-white dark:bg-zinc-900 text-[11px] min-h-[100px] flex flex-wrap gap-1 content-start">
                  {reliabilityItems.length === 0 ? (
                    <span className="text-zinc-400 italic text-[10px]">
                      Select at least 2 items (Ordinal / Scale)
                    </span>
                  ) : (
                    reliabilityItems.map((v) => (
                      <span
                        key={v}
                        className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-[10px]"
                      >
                        {v}
                        <button
                          onClick={() =>
                            setReliabilityItems((prev) =>
                              prev.filter((x) => x !== v),
                            )
                          }
                          className="hover:text-red-500"
                        >
                          <X className="w-2.5 h-2.5" />
                        </button>
                      </span>
                    ))
                  )}
                </div>
              </>
            )}

            {/* 4. MANOVA */}
            {analysisType === "manova" && (
              <>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] font-semibold text-zinc-700 dark:text-zinc-300">
                      Factor / Grouping Variable:
                    </span>
                    {selectedAvailable && (
                      <button
                        onClick={() => {
                          setManovaFactor(selectedAvailable);
                          setManovaDeps((prev) =>
                            prev.filter((x) => x !== selectedAvailable),
                          );
                        }}
                        className="text-[10px] text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-0.5"
                      >
                        <ArrowRight className="w-2.5 h-2.5" /> Set Factor
                      </button>
                    )}
                  </div>
                  <div className="p-1.5 border border-zinc-200 dark:border-zinc-800 rounded bg-white dark:bg-zinc-900 text-[11px] min-h-[30px] flex items-center justify-between">
                    {manovaFactor ? (
                      <div className="flex items-center justify-between w-full">
                        <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                          {manovaFactor}
                        </span>
                        <button
                          onClick={() => setManovaFactor(null)}
                          className="hover:text-red-500"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <span className="text-zinc-400 italic text-[10px]">
                        Select 1 grouping variable (Nominal/Ordinal)
                      </span>
                    )}
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] font-semibold text-zinc-700 dark:text-zinc-300">
                      Dependent Variables (Y1, Y2...):
                    </span>
                    {selectedAvailable && (
                      <button
                        onClick={() => {
                          if (selectedAvailable === manovaFactor) return;
                          if (!manovaDeps.includes(selectedAvailable)) {
                            setManovaDeps((prev) => [
                              ...prev,
                              selectedAvailable,
                            ]);
                          }
                        }}
                        className="text-[10px] text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-0.5"
                      >
                        <ArrowRight className="w-2.5 h-2.5" /> Add Y
                      </button>
                    )}
                  </div>
                  <div className="p-1.5 border border-zinc-200 dark:border-zinc-800 rounded bg-white dark:bg-zinc-900 text-[11px] min-h-[60px] flex flex-wrap gap-1 content-start">
                    {manovaDeps.length === 0 ? (
                      <span className="text-zinc-400 italic text-[10px]">
                        Add at least 2 continuous Scale variables
                      </span>
                    ) : (
                      manovaDeps.map((v) => (
                        <span
                          key={v}
                          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-[10px]"
                        >
                          {v}
                          <button
                            onClick={() =>
                              setManovaDeps((prev) =>
                                prev.filter((x) => x !== v),
                              )
                            }
                            className="hover:text-red-500"
                          >
                            <X className="w-2.5 h-2.5" />
                          </button>
                        </span>
                      ))
                    )}
                  </div>
                </div>
              </>
            )}

            {/* 5. PCA */}
            {analysisType === "pca" && (
              <>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-semibold text-zinc-700 dark:text-zinc-300">
                    Input Variables:
                  </span>
                  {selectedAvailable && (
                    <button
                      onClick={() => {
                        if (!pcaVars.includes(selectedAvailable)) {
                          setPcaVars((prev) => [...prev, selectedAvailable]);
                        }
                      }}
                      className="text-[10px] text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-0.5"
                    >
                      <ArrowRight className="w-2.5 h-2.5" /> Add Variable
                    </button>
                  )}
                </div>
                <div className="p-1.5 border border-zinc-200 dark:border-zinc-800 rounded bg-white dark:bg-zinc-900 text-[11px] min-h-[80px] flex flex-wrap gap-1 content-start">
                  {pcaVars.length === 0 ? (
                    <span className="text-zinc-400 italic text-[10px]">
                      Select quantitative variables
                    </span>
                  ) : (
                    pcaVars.map((v) => (
                      <span
                        key={v}
                        className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-[10px]"
                      >
                        {v}
                        <button
                          onClick={() =>
                            setPcaVars((prev) => prev.filter((x) => x !== v))
                          }
                          className="hover:text-red-500"
                        >
                          <X className="w-2.5 h-2.5" />
                        </button>
                      </span>
                    ))
                  )}
                </div>
                <div className="flex items-center gap-2 text-[10px]">
                  <label className="text-zinc-500">Components:</label>
                  <input
                    type="number"
                    min={1}
                    max={Math.max(2, pcaVars.length)}
                    value={pcaComponents}
                    onChange={(e) =>
                      setPcaComponents(
                        Math.max(1, parseInt(e.target.value) || 1),
                      )
                    }
                    className="w-12 px-1.5 py-0.5 rounded border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-center text-xs"
                  />
                </div>
              </>
            )}

            {/* 6. ONE-SAMPLE T-TEST */}
            {analysisType === "ttest_one_sample" && (
              <>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] font-semibold text-zinc-700 dark:text-zinc-300">
                      Test Variable:
                    </span>
                    {selectedAvailable && (
                      <button
                        onClick={() => setSingleVar(selectedAvailable)}
                        className="text-[10px] text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-0.5"
                      >
                        <ArrowRight className="w-2.5 h-2.5" /> Set Variable
                      </button>
                    )}
                  </div>
                  <div className="p-1.5 border border-zinc-200 dark:border-zinc-800 rounded bg-white dark:bg-zinc-900 text-[11px] min-h-[30px] flex items-center justify-between">
                    {singleVar ? (
                      <div className="flex items-center justify-between w-full">
                        <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                          {singleVar} (
                          {
                            getScaleMeta(variableScales[singleVar] || "scale")
                              .shortLabel
                          }
                          )
                        </span>
                        <button
                          onClick={() => setSingleVar(null)}
                          className="hover:text-red-500"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <span className="text-zinc-400 italic text-[10px]">
                        Select 1 continuous Scale variable
                      </span>
                    )}
                  </div>
                </div>

                <div className="pt-2">
                  <label className="text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">
                    Test Value (Hypothesized Population Mean):
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={testValue}
                    onChange={(e) =>
                      setTestValue(parseFloat(e.target.value) || 0)
                    }
                    className="w-full px-2 py-1 text-[11px] rounded border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </>
            )}

            {/* 7. INDEPENDENT T-TEST / MANN-WHITNEY / KRUSKAL / ANOVA ONE-WAY */}
            {(analysisType === "ttest_independent" ||
              analysisType === "mann_whitney" ||
              analysisType === "kruskal" ||
              analysisType === "anova_oneway") && (
              <>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] font-semibold text-zinc-700 dark:text-zinc-300">
                      {analysisType === "anova_oneway"
                        ? "Dependent Variable (Outcome):"
                        : "Test Variable:"}
                    </span>
                    {selectedAvailable && (
                      <button
                        onClick={() => {
                          setSingleVar(selectedAvailable);
                          if (groupVar === selectedAvailable) setGroupVar(null);
                        }}
                        className="text-[10px] text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-0.5"
                      >
                        <ArrowRight className="w-2.5 h-2.5" /> Set Outcome
                      </button>
                    )}
                  </div>
                  <div className="p-1.5 border border-zinc-200 dark:border-zinc-800 rounded bg-white dark:bg-zinc-900 text-[11px] min-h-[30px] flex items-center justify-between">
                    {singleVar ? (
                      <div className="flex items-center justify-between w-full">
                        <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                          {singleVar} (
                          {
                            getScaleMeta(variableScales[singleVar] || "scale")
                              .shortLabel
                          }
                          )
                        </span>
                        <button
                          onClick={() => setSingleVar(null)}
                          className="hover:text-red-500"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <span className="text-zinc-400 italic text-[10px]">
                        Select continuous or ordinal outcome variable
                      </span>
                    )}
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] font-semibold text-zinc-700 dark:text-zinc-300">
                      Grouping Variable (Factor):
                    </span>
                    {selectedAvailable && (
                      <button
                        onClick={() => {
                          setGroupVar(selectedAvailable);
                          if (singleVar === selectedAvailable)
                            setSingleVar(null);
                        }}
                        className="text-[10px] text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-0.5"
                      >
                        <ArrowRight className="w-2.5 h-2.5" /> Set Factor
                      </button>
                    )}
                  </div>
                  <div className="p-1.5 border border-zinc-200 dark:border-zinc-800 rounded bg-white dark:bg-zinc-900 text-[11px] min-h-[30px] flex items-center justify-between">
                    {groupVar ? (
                      <div className="flex items-center justify-between w-full">
                        <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                          {groupVar} (
                          {
                            getScaleMeta(variableScales[groupVar] || "nominal")
                              .shortLabel
                          }
                          )
                        </span>
                        <button
                          onClick={() => setGroupVar(null)}
                          className="hover:text-red-500"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <span className="text-zinc-400 italic text-[10px]">
                        Select categorical factor (2 groups for
                        t-test/Mann-Whitney, 3+ for ANOVA/Kruskal)
                      </span>
                    )}
                  </div>
                </div>

                {analysisType === "anova_oneway" && (
                  <label className="flex items-center gap-1.5 text-[10px] cursor-pointer text-zinc-600 dark:text-zinc-400 pt-1">
                    <input
                      type="checkbox"
                      checked={postHocTukey}
                      onChange={(e) => setPostHocTukey(e.target.checked)}
                      className="rounded text-indigo-600"
                    />
                    Include Post-Hoc Tukey HSD Multiple Comparisons
                  </label>
                )}
              </>
            )}

            {/* 8. PAIRED T-TEST / WILCOXON */}
            {(analysisType === "ttest_paired" ||
              analysisType === "wilcoxon") && (
              <>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] font-semibold text-zinc-700 dark:text-zinc-300">
                      Variable 1 (e.g. Pre-Test):
                    </span>
                    {selectedAvailable && (
                      <button
                        onClick={() => setPairedVar1(selectedAvailable)}
                        className="text-[10px] text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-0.5"
                      >
                        <ArrowRight className="w-2.5 h-2.5" /> Set Var 1
                      </button>
                    )}
                  </div>
                  <div className="p-1.5 border border-zinc-200 dark:border-zinc-800 rounded bg-white dark:bg-zinc-900 text-[11px] min-h-[30px] flex items-center justify-between">
                    {pairedVar1 ? (
                      <div className="flex items-center justify-between w-full">
                        <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                          {pairedVar1}
                        </span>
                        <button
                          onClick={() => setPairedVar1(null)}
                          className="hover:text-red-500"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <span className="text-zinc-400 italic text-[10px]">
                        Select first paired measure
                      </span>
                    )}
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] font-semibold text-zinc-700 dark:text-zinc-300">
                      Variable 2 (e.g. Post-Test):
                    </span>
                    {selectedAvailable && (
                      <button
                        onClick={() => setPairedVar2(selectedAvailable)}
                        className="text-[10px] text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-0.5"
                      >
                        <ArrowRight className="w-2.5 h-2.5" /> Set Var 2
                      </button>
                    )}
                  </div>
                  <div className="p-1.5 border border-zinc-200 dark:border-zinc-800 rounded bg-white dark:bg-zinc-900 text-[11px] min-h-[30px] flex items-center justify-between">
                    {pairedVar2 ? (
                      <div className="flex items-center justify-between w-full">
                        <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                          {pairedVar2}
                        </span>
                        <button
                          onClick={() => setPairedVar2(null)}
                          className="hover:text-red-500"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <span className="text-zinc-400 italic text-[10px]">
                        Select second paired measure
                      </span>
                    )}
                  </div>
                </div>
              </>
            )}

            {/* 9. TWO-WAY ANOVA */}
            {analysisType === "anova_twoway" && (
              <>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] font-semibold text-zinc-700 dark:text-zinc-300">
                      Dependent Variable:
                    </span>
                    {selectedAvailable && (
                      <button
                        onClick={() => setSingleVar(selectedAvailable)}
                        className="text-[10px] text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-0.5"
                      >
                        <ArrowRight className="w-2.5 h-2.5" /> Set Outcome
                      </button>
                    )}
                  </div>
                  <div className="p-1.5 border border-zinc-200 dark:border-zinc-800 rounded bg-white dark:bg-zinc-900 text-[11px] min-h-[30px] flex items-center justify-between">
                    {singleVar ? (
                      <div className="flex items-center justify-between w-full">
                        <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                          {singleVar}
                        </span>
                        <button
                          onClick={() => setSingleVar(null)}
                          className="hover:text-red-500"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <span className="text-zinc-400 italic text-[10px]">
                        Select continuous Scale outcome
                      </span>
                    )}
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] font-semibold text-zinc-700 dark:text-zinc-300">
                      Factor 1 (Categorical):
                    </span>
                    {selectedAvailable && (
                      <button
                        onClick={() => setFactorVar1(selectedAvailable)}
                        className="text-[10px] text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-0.5"
                      >
                        <ArrowRight className="w-2.5 h-2.5" /> Set Factor 1
                      </button>
                    )}
                  </div>
                  <div className="p-1.5 border border-zinc-200 dark:border-zinc-800 rounded bg-white dark:bg-zinc-900 text-[11px] min-h-[30px] flex items-center justify-between">
                    {factorVar1 ? (
                      <div className="flex items-center justify-between w-full">
                        <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                          {factorVar1}
                        </span>
                        <button
                          onClick={() => setFactorVar1(null)}
                          className="hover:text-red-500"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <span className="text-zinc-400 italic text-[10px]">
                        Select Factor A
                      </span>
                    )}
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] font-semibold text-zinc-700 dark:text-zinc-300">
                      Factor 2 (Categorical):
                    </span>
                    {selectedAvailable && (
                      <button
                        onClick={() => setFactorVar2(selectedAvailable)}
                        className="text-[10px] text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-0.5"
                      >
                        <ArrowRight className="w-2.5 h-2.5" /> Set Factor 2
                      </button>
                    )}
                  </div>
                  <div className="p-1.5 border border-zinc-200 dark:border-zinc-800 rounded bg-white dark:bg-zinc-900 text-[11px] min-h-[30px] flex items-center justify-between">
                    {factorVar2 ? (
                      <div className="flex items-center justify-between w-full">
                        <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                          {factorVar2}
                        </span>
                        <button
                          onClick={() => setFactorVar2(null)}
                          className="hover:text-red-500"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <span className="text-zinc-400 italic text-[10px]">
                        Select Factor B
                      </span>
                    )}
                  </div>
                </div>
              </>
            )}

            {/* ANCOVA */}
            {analysisType === "ancova" && (
              <>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] font-semibold text-zinc-700 dark:text-zinc-300">
                      Dependent Variable (Continuous):
                    </span>
                    {selectedAvailable && (
                      <button
                        onClick={() => setSingleVar(selectedAvailable)}
                        className="text-[10px] text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-0.5"
                      >
                        <ArrowRight className="w-2.5 h-2.5" /> Set Outcome
                      </button>
                    )}
                  </div>
                  <div className="p-1.5 border border-zinc-200 dark:border-zinc-800 rounded bg-white dark:bg-zinc-900 text-[11px] min-h-[30px] flex items-center justify-between">
                    {singleVar ? (
                      <div className="flex items-center justify-between w-full">
                        <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                          {singleVar}
                        </span>
                        <button
                          onClick={() => setSingleVar(null)}
                          className="hover:text-red-500"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <span className="text-zinc-400 italic text-[10px]">
                        Select continuous Scale outcome
                      </span>
                    )}
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] font-semibold text-zinc-700 dark:text-zinc-300">
                      Factor Variable (Categorical):
                    </span>
                    {selectedAvailable && (
                      <button
                        onClick={() => setGroupVar(selectedAvailable)}
                        className="text-[10px] text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-0.5"
                      >
                        <ArrowRight className="w-2.5 h-2.5" /> Set Factor
                      </button>
                    )}
                  </div>
                  <div className="p-1.5 border border-zinc-200 dark:border-zinc-800 rounded bg-white dark:bg-zinc-900 text-[11px] min-h-[30px] flex items-center justify-between">
                    {groupVar ? (
                      <div className="flex items-center justify-between w-full">
                        <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                          {groupVar}
                        </span>
                        <button
                          onClick={() => setGroupVar(null)}
                          className="hover:text-red-500"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <span className="text-zinc-400 italic text-[10px]">
                        Select categorical factor/treatment
                      </span>
                    )}
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] font-semibold text-zinc-700 dark:text-zinc-300">
                      Covariates ({ancovaCovariates.length}):
                    </span>
                    {selectedAvailable && (
                      <button
                        onClick={() => {
                          if (
                            selectedAvailable !== singleVar &&
                            selectedAvailable !== groupVar &&
                            !ancovaCovariates.includes(selectedAvailable)
                          ) {
                            setAncovaCovariates((prev) => [
                              ...prev,
                              selectedAvailable,
                            ]);
                          }
                        }}
                        className="text-[10px] text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-0.5"
                      >
                        <ArrowRight className="w-2.5 h-2.5" /> Add Covariate
                      </button>
                    )}
                  </div>
                  <div className="p-1.5 border border-zinc-200 dark:border-zinc-800 rounded bg-white dark:bg-zinc-900 text-[11px] min-h-[48px] flex flex-wrap gap-1 content-start">
                    {ancovaCovariates.length === 0 ? (
                      <span className="text-zinc-400 italic text-[10px]">
                        Select 1 or more continuous covariates
                      </span>
                    ) : (
                      ancovaCovariates.map((c) => (
                        <span
                          key={c}
                          className="px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 flex items-center gap-1 font-mono text-[10px]"
                        >
                          {c}
                          <button
                            onClick={() =>
                              setAncovaCovariates((prev) =>
                                prev.filter((v) => v !== c),
                              )
                            }
                            className="hover:text-red-500"
                          >
                            <X className="w-2.5 h-2.5" />
                          </button>
                        </span>
                      ))
                    )}
                  </div>
                </div>
              </>
            )}

            {/* 10. CORRELATIONS (PEARSON & SPEARMAN) */}
            {(analysisType === "correlation_pearson" ||
              analysisType === "correlation_spearman") && (
              <>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-semibold text-zinc-700 dark:text-zinc-300">
                    Variables for Correlation Matrix:
                  </span>
                  {selectedAvailable && (
                    <button
                      onClick={() => {
                        if (!corrVars.includes(selectedAvailable)) {
                          setCorrVars((prev) => [...prev, selectedAvailable]);
                        }
                      }}
                      className="text-[10px] text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-0.5"
                    >
                      <ArrowRight className="w-2.5 h-2.5" /> Add Variable
                    </button>
                  )}
                </div>
                <div className="p-1.5 border border-zinc-200 dark:border-zinc-800 rounded bg-white dark:bg-zinc-900 text-[11px] min-h-[100px] flex flex-wrap gap-1 content-start">
                  {corrVars.length === 0 ? (
                    <span className="text-zinc-400 italic text-[10px]">
                      Select at least 2 variables to correlate
                    </span>
                  ) : (
                    corrVars.map((v) => (
                      <span
                        key={v}
                        className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-[10px]"
                      >
                        {v}{" "}
                        <span className="text-[9px] text-zinc-400">
                          (
                          {
                            getScaleMeta(variableScales[v] || "scale")
                              .shortLabel
                          }
                          )
                        </span>
                        <button
                          onClick={() =>
                            setCorrVars((prev) => prev.filter((x) => x !== v))
                          }
                          className="hover:text-red-500"
                        >
                          <X className="w-2.5 h-2.5" />
                        </button>
                      </span>
                    ))
                  )}
                </div>
              </>
            )}

            {/* 11. CHI-SQUARE */}
            {analysisType === "chisquare" && (
              <>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] font-semibold text-zinc-700 dark:text-zinc-300">
                      Row Variable (Categorical):
                    </span>
                    {selectedAvailable && (
                      <button
                        onClick={() => setRowVar(selectedAvailable)}
                        className="text-[10px] text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-0.5"
                      >
                        <ArrowRight className="w-2.5 h-2.5" /> Set Row
                      </button>
                    )}
                  </div>
                  <div className="p-1.5 border border-zinc-200 dark:border-zinc-800 rounded bg-white dark:bg-zinc-900 text-[11px] min-h-[30px] flex items-center justify-between">
                    {rowVar ? (
                      <div className="flex items-center justify-between w-full">
                        <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                          {rowVar} (
                          {
                            getScaleMeta(variableScales[rowVar] || "nominal")
                              .shortLabel
                          }
                          )
                        </span>
                        <button
                          onClick={() => setRowVar(null)}
                          className="hover:text-red-500"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <span className="text-zinc-400 italic text-[10px]">
                        Select Nominal or Ordinal variable
                      </span>
                    )}
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] font-semibold text-zinc-700 dark:text-zinc-300">
                      Column Variable (Categorical):
                    </span>
                    {selectedAvailable && (
                      <button
                        onClick={() => setColVar(selectedAvailable)}
                        className="text-[10px] text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-0.5"
                      >
                        <ArrowRight className="w-2.5 h-2.5" /> Set Col
                      </button>
                    )}
                  </div>
                  <div className="p-1.5 border border-zinc-200 dark:border-zinc-800 rounded bg-white dark:bg-zinc-900 text-[11px] min-h-[30px] flex items-center justify-between">
                    {colVar ? (
                      <div className="flex items-center justify-between w-full">
                        <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                          {colVar} (
                          {
                            getScaleMeta(variableScales[colVar] || "nominal")
                              .shortLabel
                          }
                          )
                        </span>
                        <button
                          onClick={() => setColVar(null)}
                          className="hover:text-red-500"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <span className="text-zinc-400 italic text-[10px]">
                        Select Nominal or Ordinal variable
                      </span>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Validation warnings / Guardrails banner */}
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

        {/* Footer */}
        <div className="px-4 py-2 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50 dark:bg-zinc-950">
          <div className="flex items-center gap-2 text-[10px] text-zinc-400">
            <HelpCircle className="w-3 h-3 text-zinc-400 shrink-0" />
            <span>Click badges to cycle:</span>
            <span className="inline-flex items-center gap-0.5 font-medium text-amber-600 dark:text-amber-400">
              <Ruler className="w-2.5 h-2.5" /> Scale
            </span>
            <span className="inline-flex items-center gap-0.5 font-medium text-blue-600 dark:text-blue-400">
              <BarChart2 className="w-2.5 h-2.5" /> Ordinal
            </span>
            <span className="inline-flex items-center gap-0.5 font-medium text-purple-600 dark:text-purple-400">
              <Tag className="w-2.5 h-2.5" /> Nominal
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              disabled={loading}
              className="px-3 py-1 text-[11px] font-medium rounded text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition"
            >
              Cancel
            </button>
            <button
              onClick={handleRunAnalysis}
              disabled={loading}
              className="px-3 py-1 text-[11px] font-medium rounded bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-1 shadow-xs transition disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="w-3 h-3 animate-spin mr-1" />
              ) : (
                <Play className="w-3 h-3 fill-current" />
              )}
              Run Analysis
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
