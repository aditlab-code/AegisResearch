// High-contrast, publication-grade cluster palette (accessible & distinct)
export const VOS_PALETTE = [
  "#2563eb", // Vibrant Blue
  "#7c3aed", // Rich Purple
  "#dc2626", // Crimson Red
  "#059669", // Emerald Green
  "#d97706", // Amber Orange
  "#0891b2", // Cyan Teal
  "#db2777", // Deep Rose
  "#4f46e5", // Indigo
  "#0d9488", // Teal
  "#ea580c", // Burnt Orange
];

export function getClusterColor(clusterId: number): string {
  const normalized = Math.max(0, clusterId);
  return VOS_PALETTE[normalized % VOS_PALETTE.length];
}

export function calculateNodeRadius(
  freq: number,
  maxFreq: number,
  nodeCount: number,
  nodeSizeScale: number,
): number {
  const safeMax = Math.max(maxFreq, 1);
  const normalized = Math.max(0, freq) / safeMax;
  const countFactor = Math.sqrt(36 / Math.max(12, nodeCount));
  // Keep bubble sizes balanced: minimum 6px, maximum 28px
  const baseR = (5.5 + normalized * 14.5) * countFactor * nodeSizeScale;
  return Math.max(6, Math.min(32, baseR));
}

export function calculateEdgeWidth(weight: number): number {
  // Edge thickness based on normalized association weight
  const safeW = Math.max(0, Math.min(1, weight));
  return 0.6 + safeW * 3.4;
}

export function calculateEdgeOpacity(weight: number): number {
  const safeW = Math.max(0, Math.min(1, weight));
  return 0.18 + safeW * 0.45;
}

export function calculateFontSize(radius: number): number {
  // Readability-first: minimum 11px font size so text is always legible
  return Math.max(11, Math.min(15, 10 + radius * 0.28));
}
