import React from "react";
import {
  Sliders,
  BarChart3,
  CheckCircle2,
  GitCompare,
  Layers,
  Database,
  TableProperties,
  Ruler,
  BarChart2,
  Tag,
  ArrowRightLeft,
  Split,
  Network,
  Compass,
} from "lucide-react";
import { AnalysisType, TableStyle } from "../../types/stats";

export interface DataRibbonGroupProps {
  onOpenAnalysis?: (type: AnalysisType) => void;
  onOpenDataset?: () => void;
  onOpenGuide?: () => void;
  onOpenLatexOutputModal?: () => void;
  selectedTableStyle?: TableStyle;
  hasResults?: boolean;
}

export const DataRibbonGroup: React.FC<DataRibbonGroupProps> = ({
  onOpenAnalysis,
  onOpenDataset,
  onOpenGuide,
  onOpenLatexOutputModal,
  selectedTableStyle = "apa",
  hasResults,
}) => {
  return (
    <div className="h-full flex items-stretch gap-1.5 select-none overflow-x-auto relative text-zinc-700 dark:text-zinc-200">
      {/* 1. Dataset & Management */}
      <div className="relative h-full flex flex-col items-center justify-between py-1 px-2 border-r border-zinc-200 dark:border-zinc-800 shrink-0">
        <div className="flex items-center gap-1 h-full">
          <button
            type="button"
            onClick={onOpenDataset}
            title="Open or View Active Dataset Tab"
            className="flex flex-col items-center justify-center gap-1 px-2 py-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 transition text-zinc-700 dark:text-zinc-200"
          >
            <Database className="w-4 h-4 text-amber-500" />
            <span className="text-[10px] font-medium leading-none whitespace-nowrap">
              Dataset
            </span>
          </button>
        </div>
        <span className="text-[8px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
          Source
        </span>
      </div>

      {/* 2. Method Advisor & Research Guide */}
      <div className="relative h-full flex flex-col items-center justify-between py-1 px-2 border-r border-zinc-200 dark:border-zinc-800 shrink-0 bg-amber-50/30 dark:bg-amber-950/20 rounded-xs">
        <div className="flex items-center gap-1 h-full">
          <button
            type="button"
            onClick={onOpenGuide}
            title="Statistical Method Advisor, Prerequisite Workflow & Decision Matrix"
            className="flex flex-col items-center justify-center gap-1 px-2 py-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 transition text-zinc-700 dark:text-zinc-200"
          >
            <Compass className="w-4 h-4 text-amber-500" />
            <span className="text-[10px] font-semibold text-amber-700 dark:text-amber-300 leading-none whitespace-nowrap">
              Method Advisor
            </span>
          </button>
        </div>
        <span className="text-[8px] font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
          Guidance
        </span>
      </div>

      {/* 2. Exploration & Scale Quality */}
      <div className="relative h-full flex flex-col items-center justify-between py-1 px-2 border-r border-zinc-200 dark:border-zinc-800 shrink-0">
        <div className="flex items-center gap-1.5 h-full">
          <button
            type="button"
            onClick={() => onOpenAnalysis?.("descriptive")}
            title="Descriptive Statistics (Mean, SD, Skewness, Shapiro-Wilk Normality)"
            className="flex flex-col items-center justify-center gap-1 px-2 py-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 transition text-zinc-700 dark:text-zinc-200"
          >
            <BarChart3 className="w-4 h-4 text-emerald-500" />
            <span className="text-[10px] font-medium leading-none whitespace-nowrap">
              Descriptives
            </span>
          </button>
          <button
            type="button"
            onClick={() => onOpenAnalysis?.("reliability")}
            title="Scale Reliability & Cronbach's Alpha"
            className="flex flex-col items-center justify-center gap-1 px-2 py-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 transition text-zinc-700 dark:text-zinc-200"
          >
            <CheckCircle2 className="w-4 h-4 text-cyan-500" />
            <span className="text-[10px] font-medium leading-none whitespace-nowrap">
              Reliability
            </span>
          </button>
          <button
            type="button"
            onClick={() => onOpenAnalysis?.("pca")}
            title="Principal Component Analysis (PCA)"
            className="flex flex-col items-center justify-center gap-1 px-2 py-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 transition text-zinc-700 dark:text-zinc-200"
          >
            <Layers className="w-4 h-4 text-amber-500" />
            <span className="text-[10px] font-medium leading-none whitespace-nowrap">
              PCA
            </span>
          </button>
        </div>
        <span className="text-[8px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
          Exploration
        </span>
      </div>

      {/* 3. Parametric: t-Tests */}
      <div className="relative h-full flex flex-col items-center justify-between py-1 px-2 border-r border-zinc-200 dark:border-zinc-800 shrink-0">
        <div className="flex items-center gap-1.5 h-full">
          <button
            type="button"
            onClick={() => onOpenAnalysis?.("ttest_one_sample")}
            title="One-Sample t-Test: Compare sample mean against hypothesized value"
            className="flex flex-col items-center justify-center gap-1 px-2 py-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 transition text-zinc-700 dark:text-zinc-200"
          >
            <Ruler className="w-4 h-4 text-indigo-500" />
            <span className="text-[10px] font-medium leading-none whitespace-nowrap">
              1-Sample t
            </span>
          </button>
          <button
            type="button"
            onClick={() => onOpenAnalysis?.("ttest_independent")}
            title="Independent Samples t-Test (with Levene's & Welch correction)"
            className="flex flex-col items-center justify-center gap-1 px-2 py-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 transition text-zinc-700 dark:text-zinc-200"
          >
            <GitCompare className="w-4 h-4 text-indigo-500" />
            <span className="text-[10px] font-medium leading-none whitespace-nowrap">
              Indep. t
            </span>
          </button>
          <button
            type="button"
            onClick={() => onOpenAnalysis?.("ttest_paired")}
            title="Paired Samples t-Test (Repeated Measures / Pre-Post comparison)"
            className="flex flex-col items-center justify-center gap-1 px-2 py-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 transition text-zinc-700 dark:text-zinc-200"
          >
            <ArrowRightLeft className="w-4 h-4 text-indigo-500" />
            <span className="text-[10px] font-medium leading-none whitespace-nowrap">
              Paired t
            </span>
          </button>
        </div>
        <span className="text-[8px] font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
          t-Tests
        </span>
      </div>

      {/* 4. Parametric: ANOVA, Correlation & Regression */}
      <div className="relative h-full flex flex-col items-center justify-between py-1 px-2 border-r border-zinc-200 dark:border-zinc-800 shrink-0">
        <div className="flex items-center gap-1.5 h-full">
          <button
            type="button"
            onClick={() => onOpenAnalysis?.("anova_oneway")}
            title="One-Way ANOVA with Post-Hoc Tukey HSD Multiple Comparisons"
            className="flex flex-col items-center justify-center gap-1 px-2 py-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 transition text-zinc-700 dark:text-zinc-200"
          >
            <Split className="w-4 h-4 text-blue-500" />
            <span className="text-[10px] font-medium leading-none whitespace-nowrap">
              1-Way ANOVA
            </span>
          </button>
          <button
            type="button"
            onClick={() => onOpenAnalysis?.("anova_twoway")}
            title="Two-Way Factorial ANOVA with Main and Interaction Effects"
            className="flex flex-col items-center justify-center gap-1 px-2 py-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 transition text-zinc-700 dark:text-zinc-200"
          >
            <Network className="w-4 h-4 text-blue-500" />
            <span className="text-[10px] font-medium leading-none whitespace-nowrap">
              2-Way ANOVA
            </span>
          </button>
          <button
            type="button"
            onClick={() => onOpenAnalysis?.("ancova")}
            title="Analysis of Covariance (ANCOVA) with Continuous Covariates"
            className="flex flex-col items-center justify-center gap-1 px-2 py-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 transition text-zinc-700 dark:text-zinc-200"
          >
            <Split className="w-4 h-4 text-emerald-500" />
            <span className="text-[10px] font-medium leading-none whitespace-nowrap">
              ANCOVA
            </span>
          </button>
          <button
            type="button"
            onClick={() => onOpenAnalysis?.("correlation_pearson")}
            title="Bivariate Pearson Correlation Matrix (r)"
            className="flex flex-col items-center justify-center gap-1 px-2 py-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 transition text-zinc-700 dark:text-zinc-200"
          >
            <Sliders className="w-4 h-4 text-blue-500" />
            <span className="text-[10px] font-medium leading-none whitespace-nowrap">
              Pearson r
            </span>
          </button>
          <button
            type="button"
            onClick={() => onOpenAnalysis?.("regression")}
            title="Multiple Linear Regression with Collinearity (VIF) & Durbin-Watson"
            className="flex flex-col items-center justify-center gap-1 px-2 py-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 transition text-zinc-700 dark:text-zinc-200"
          >
            <Sliders className="w-4 h-4 text-purple-500" />
            <span className="text-[10px] font-medium leading-none whitespace-nowrap">
              Regression
            </span>
          </button>
          <button
            type="button"
            onClick={() => onOpenAnalysis?.("logistic_regression")}
            title="Binary Logistic Regression (Odds Ratio exp(B), Pseudo R², ROC-AUC)"
            className="flex flex-col items-center justify-center gap-1 px-2 py-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 transition text-zinc-700 dark:text-zinc-200"
          >
            <Sliders className="w-4 h-4 text-violet-500" />
            <span className="text-[10px] font-medium leading-none whitespace-nowrap">
              Logistic
            </span>
          </button>
          <button
            type="button"
            onClick={() => onOpenAnalysis?.("manova")}
            title="Multivariate Analysis of Variance (MANOVA)"
            className="flex flex-col items-center justify-center gap-1 px-2 py-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 transition text-zinc-700 dark:text-zinc-200"
          >
            <GitCompare className="w-4 h-4 text-purple-500" />
            <span className="text-[10px] font-medium leading-none whitespace-nowrap">
              MANOVA
            </span>
          </button>
        </div>
        <span className="text-[8px] font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
          ANOVA & Models
        </span>
      </div>

      {/* 5. Non-Parametric Tests */}
      <div className="relative h-full flex flex-col items-center justify-between py-1 px-2 border-r border-zinc-200 dark:border-zinc-800 shrink-0">
        <div className="flex items-center gap-1.5 h-full">
          <button
            type="button"
            onClick={() => onOpenAnalysis?.("mann_whitney")}
            title="Mann-Whitney U Test (Independent 2-group rank comparison)"
            className="flex flex-col items-center justify-center gap-1 px-2 py-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 transition text-zinc-700 dark:text-zinc-200"
          >
            <BarChart2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span className="text-[10px] font-medium leading-none whitespace-nowrap">
              Mann-Whitney
            </span>
          </button>
          <button
            type="button"
            onClick={() => onOpenAnalysis?.("wilcoxon")}
            title="Wilcoxon Signed-Rank Test (Paired non-parametric test)"
            className="flex flex-col items-center justify-center gap-1 px-2 py-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 transition text-zinc-700 dark:text-zinc-200"
          >
            <ArrowRightLeft className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span className="text-[10px] font-medium leading-none whitespace-nowrap">
              Wilcoxon
            </span>
          </button>
          <button
            type="button"
            onClick={() => onOpenAnalysis?.("kruskal")}
            title="Kruskal-Wallis H Test (Non-parametric 3+ group comparison)"
            className="flex flex-col items-center justify-center gap-1 px-2 py-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 transition text-zinc-700 dark:text-zinc-200"
          >
            <BarChart2 className="w-4 h-4 text-teal-600 dark:text-teal-400" />
            <span className="text-[10px] font-medium leading-none whitespace-nowrap">
              Kruskal-Wallis
            </span>
          </button>
          <button
            type="button"
            onClick={() => onOpenAnalysis?.("correlation_spearman")}
            title="Spearman Rank Correlation (rho) for Ordinal / Non-Normal Data"
            className="flex flex-col items-center justify-center gap-1 px-2 py-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 transition text-zinc-700 dark:text-zinc-200"
          >
            <Sliders className="w-4 h-4 text-teal-600 dark:text-teal-400" />
            <span className="text-[10px] font-medium leading-none whitespace-nowrap">
              Spearman Rho
            </span>
          </button>
          <button
            type="button"
            onClick={() => onOpenAnalysis?.("chisquare")}
            title="Chi-Square Test of Independence with Cross-Tabulation & Cramér's V"
            className="flex flex-col items-center justify-center gap-1 px-2 py-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 transition text-zinc-700 dark:text-zinc-200"
          >
            <Tag className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            <span className="text-[10px] font-medium leading-none whitespace-nowrap">
              Chi-Square
            </span>
          </button>
        </div>
        <span className="text-[8px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
          Non-Parametric
        </span>
      </div>

      {/* 6. LaTeX Publishing Bridge */}
      <div className="relative h-full flex flex-col items-center justify-between py-1 px-2 shrink-0">
        <div className="flex items-center gap-1 h-full">
          <button
            type="button"
            onClick={onOpenLatexOutputModal}
            title="Configure LaTeX Table Output Formats (APA 7th, IEEE Style, Classic)"
            className={`flex flex-col items-center justify-center gap-1 px-2.5 py-1 rounded transition text-center cursor-pointer ${
              hasResults
                ? "hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300"
                : "hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-200"
            }`}
          >
            <div className="relative">
              <TableProperties className="w-4 h-4 text-indigo-500" />
              {hasResults && (
                <span className="absolute -top-1 -right-1.5 w-2 h-2 rounded-full bg-emerald-500" />
              )}
            </div>
            <span className="text-[10px] font-medium font-mono leading-none whitespace-nowrap">
              {selectedTableStyle === "ieee"
                ? "IEEE Style"
                : selectedTableStyle === "classic"
                  ? "Classic"
                  : "APA 7th"}
            </span>
          </button>
        </div>
        <span className="text-[8px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
          LaTeX Output
        </span>
      </div>
    </div>
  );
};
