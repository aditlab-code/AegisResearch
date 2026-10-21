export type BibliometricsTab =
  "network" | "thematic" | "evolution" | "laws" | "stopwords" | "tikz";

export interface BibliometricsDataParams {
  networkType: "keywords" | "authors";
  minFrequency: number;
  topN: number;
  sliceCount: number;
  excludeKeywords: string[];
}

export interface BibliometricsVisualParams {
  spacingScale: number;
  nodeSizeScale: number;
  zoom: number;
}

export interface NodePosition {
  x: number;
  y: number;
  r: number;
  cluster: number;
}

export interface BibliometricsModalProps {
  isOpen: boolean;
  onClose: () => void;
  workspaceId: string;
  filePath: string;
  onInsertLatex: (code: string) => void;
}

// Academic stopwords synchronized with backend DEFAULT_ACADEMIC_STOPWORDS
export const ACADEMIC_STOPWORDS_PRESET = [
  "paper",
  "papers",
  "review",
  "reviews",
  "study",
  "studies",
  "survey",
  "surveys",
  "analysis",
  "analyses",
  "methodology",
  "methodologies",
  "model",
  "models",
  "framework",
  "frameworks",
  "system",
  "systems",
  "approach",
  "approaches",
  "evaluation",
  "evaluations",
  "article",
  "conference",
  "proceedings",
  "comparative study",
  "research",
];
