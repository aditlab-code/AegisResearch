export type PaperSize = "a4" | "f4" | "letter" | "custom";

export interface PaperDimension {
  name: string;
  label: string;
  widthMm: number;
  heightMm: number;
  baseWidthPx: number; // at 96 DPI
  baseHeightPx: number; // at 96 DPI
  aspectRatio: number;
}

export const PAPER_PRESETS: Record<PaperSize, PaperDimension> = {
  a4: {
    name: "a4",
    label: "A4 (210 × 297 mm)",
    widthMm: 210,
    heightMm: 297,
    baseWidthPx: 794,
    baseHeightPx: 1123,
    aspectRatio: 297 / 210,
  },
  f4: {
    name: "f4",
    label: "F4 / Folio (215 × 330 mm)",
    widthMm: 215,
    heightMm: 330,
    baseWidthPx: 813,
    baseHeightPx: 1247,
    aspectRatio: 330 / 215,
  },
  letter: {
    name: "letter",
    label: "Letter (216 × 279 mm)",
    widthMm: 216,
    heightMm: 279,
    baseWidthPx: 816,
    baseHeightPx: 1056,
    aspectRatio: 279 / 216,
  },
  custom: {
    name: "custom",
    label: "Custom (.tex layout)",
    widthMm: 210,
    heightMm: 297,
    baseWidthPx: 794,
    baseHeightPx: 1123,
    aspectRatio: 297 / 210,
  },
};
