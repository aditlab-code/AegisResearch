import React from "react";
import {
  AnovaOneWayResponse,
  AnovaTwoWayResponse,
  AncovaResponse,
} from "../../../../../types/stats";
import { OneWayAnovaView } from "./OneWayAnovaView";
import { TwoWayAncovaView } from "./TwoWayAncovaView";

export interface AnovaResultViewsProps {
  result: AnovaOneWayResponse | AnovaTwoWayResponse | AncovaResponse;
}

export const AnovaResultViews: React.FC<AnovaResultViewsProps> = ({
  result,
}) => {
  if (result.analysis_type === "anova_oneway") {
    return <OneWayAnovaView result={result as AnovaOneWayResponse} />;
  }

  if (
    result.analysis_type === "anova_twoway" ||
    result.analysis_type === "ancova"
  ) {
    return (
      <TwoWayAncovaView
        result={result as AnovaTwoWayResponse | AncovaResponse}
      />
    );
  }

  return null;
};
