import { Ruler, BarChart2, Tag } from "lucide-react";
import { MeasurementScale } from "../../../types/stats";
import { WizardPurpose, WizardGroupDesign } from "./guideData";

export interface PurposeOption {
  id: WizardPurpose;
  label: string;
  desc: string;
}

export interface ScaleOption {
  id: MeasurementScale;
  title: string;
  sub: string;
  icon: typeof Ruler;
  badge: string;
}

export interface GroupDesignOption {
  id: WizardGroupDesign;
  label: string;
  desc: string;
}

export const PURPOSE_ITEMS: PurposeOption[] = [
  {
    id: "comparison",
    label: "Group Comparisons",
    desc: "Mean / median difference tests",
  },
  {
    id: "correlation",
    label: "Correlation & Association",
    desc: "Direction & strength of relationships",
  },
  {
    id: "prediction",
    label: "Regression & Prediction",
    desc: "Model effect of X on outcome Y",
  },
  {
    id: "instrument",
    label: "Questionnaire Reliability",
    desc: "Cronbach's Alpha consistency",
  },
  {
    id: "reduction",
    label: "Dimensionality Reduction (PCA)",
    desc: "Extract principal components",
  },
  {
    id: "exploration",
    label: "Exploration & Normality",
    desc: "Mean, SD, Skew, Shapiro-Wilk",
  },
];

export const SCALE_ITEMS: ScaleOption[] = [
  {
    id: "scale",
    title: "Scale (Interval/Ratio)",
    sub: "Continuous, numeric metric",
    icon: Ruler,
    badge: "text-amber-600 dark:text-amber-400",
  },
  {
    id: "ordinal",
    title: "Ordinal (Ranked)",
    sub: "Likert scales, rankings, order",
    icon: BarChart2,
    badge: "text-blue-600 dark:text-blue-400",
  },
  {
    id: "nominal",
    title: "Nominal (Categorical)",
    sub: "Unordered categories, groups",
    icon: Tag,
    badge: "text-purple-600 dark:text-purple-400",
  },
];

export const GROUP_DESIGN_ITEMS: GroupDesignOption[] = [
  {
    id: "1_sample",
    label: "1 Sample",
    desc: "Compared to benchmark value",
  },
  {
    id: "2_indep",
    label: "2 Independent Groups",
    desc: "Control vs Experimental",
  },
  {
    id: "2_paired",
    label: "2 Paired Conditions",
    desc: "Pre-test vs Post-test",
  },
  {
    id: "3_plus_indep",
    label: "3+ Independent Groups",
    desc: "3+ method variations",
  },
  {
    id: "2_factors",
    label: "2 Crossed Factors",
    desc: "Factor A x Factor B",
  },
  {
    id: "ancova_covar",
    label: "Groups + Covariate (ANCOVA)",
    desc: "Controlling continuous covariate",
  },
];
