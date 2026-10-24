import {
  AnalysisType,
  AnalysisResult,
  MeasurementScale,
} from "../../../types/stats";

export interface DialogSlotState {
  descriptiveVars: string[];
  includeNormality: boolean;
  descriptiveMissingStrategy: "pairwise" | "listwise";

  ttestAlternative: "two-sided" | "greater" | "less";
  ttestMissingStrategy: "pairwise" | "listwise";

  reliabilityItems: string[];

  dependentVar: string | null;
  independentVars: string[];
  checkVif: boolean;
  checkDw: boolean;
  regressionBaselineVars: string[];
  regressionMissingStrategy: "listwise" | "pairwise";
  logisticCutoff: number;

  manovaDeps: string[];
  manovaFactor: string | null;

  pcaVars: string[];
  pcaComponents: number;

  singleVar: string | null;
  testValue: number;
  groupVar: string | null;
  pairedVar1: string | null;
  pairedVar2: string | null;
  factorVar1: string | null;
  factorVar2: string | null;
  corrVars: string[];
  rowVar: string | null;
  colVar: string | null;
  ancovaCovariates: string[];
  postHocTukey: boolean;
  includePlot: boolean;
}

export const INITIAL_SLOT_STATE: DialogSlotState = {
  descriptiveVars: [],
  includeNormality: true,
  descriptiveMissingStrategy: "pairwise",

  ttestAlternative: "two-sided",
  ttestMissingStrategy: "pairwise",

  reliabilityItems: [],

  dependentVar: null,
  independentVars: [],
  checkVif: true,
  checkDw: true,
  regressionBaselineVars: [],
  regressionMissingStrategy: "listwise",
  logisticCutoff: 0.5,

  manovaDeps: [],
  manovaFactor: null,

  pcaVars: [],
  pcaComponents: 2,

  singleVar: null,
  testValue: 0,
  groupVar: null,
  pairedVar1: null,
  pairedVar2: null,
  factorVar1: null,
  factorVar2: null,
  corrVars: [],
  rowVar: null,
  colVar: null,
  ancovaCovariates: [],
  postHocTukey: true,
  includePlot: true,
};

export interface BaseFormProps {
  slotState: DialogSlotState;
  updateSlot: <K extends keyof DialogSlotState>(
    key: K,
    value:
      DialogSlotState[K] | ((prev: DialogSlotState[K]) => DialogSlotState[K]),
  ) => void;
  selectedAvailable: string | null;
  variableScales: Record<string, MeasurementScale>;
  analysisType: AnalysisType;
}

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
