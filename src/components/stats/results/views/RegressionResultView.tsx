import React from "react";
import {
  AnalysisResult,
  RegressionResponse,
  LogisticRegressionResponse,
} from "../../../../types/stats";
import { LinearRegressionView } from "./regression/LinearRegressionView";
import { LogisticRegressionView } from "./regression/LogisticRegressionView";

export interface RegressionResultViewProps {
  result: AnalysisResult;
}

export const RegressionResultView: React.FC<RegressionResultViewProps> = ({
  result,
}) => {
  if (result.analysis_type === "regression") {
    return <LinearRegressionView result={result as RegressionResponse} />;
  }

  if (result.analysis_type === "logistic_regression") {
    return (
      <LogisticRegressionView result={result as LogisticRegressionResponse} />
    );
  }

  return null;
};
