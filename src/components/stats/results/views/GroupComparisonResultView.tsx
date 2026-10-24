import React from "react";
import {
  AnalysisResult,
  TTestOneSampleResponse,
  TTestIndependentResponse,
  TTestPairedResponse,
  AnovaOneWayResponse,
  AnovaTwoWayResponse,
  AncovaResponse,
} from "../../../../types/stats";
import { TTestResultViews } from "./comparison/TTestResultViews";
import { AnovaResultViews } from "./comparison/AnovaResultViews";

export interface GroupComparisonResultViewProps {
  result: AnalysisResult;
}

export const GroupComparisonResultView: React.FC<
  GroupComparisonResultViewProps
> = ({ result }) => {
  if (
    result.analysis_type === "ttest_one_sample" ||
    result.analysis_type === "ttest_independent" ||
    result.analysis_type === "ttest_paired"
  ) {
    return (
      <TTestResultViews
        result={
          result as
            | TTestOneSampleResponse
            | TTestIndependentResponse
            | TTestPairedResponse
        }
      />
    );
  }

  if (
    result.analysis_type === "anova_oneway" ||
    result.analysis_type === "anova_twoway" ||
    result.analysis_type === "ancova"
  ) {
    return (
      <AnovaResultViews
        result={
          result as AnovaOneWayResponse | AnovaTwoWayResponse | AncovaResponse
        }
      />
    );
  }

  return null;
};
