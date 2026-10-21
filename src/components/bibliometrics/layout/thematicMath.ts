import { ThematicCluster } from "../../../types/bibliometrics";

export interface PlottedThematicCluster extends ThematicCluster {
  cx: number;
  cy: number;
  r: number;
  color: string;
  displayTitle: string;
  labelY: number;
}

export interface ThematicPlotLayout {
  width: number;
  height: number;
  padLeft: number;
  padRight: number;
  padTop: number;
  padBottom: number;
  plotW: number;
  plotH: number;
  medianX: number;
  medianY: number;
  maxC: number;
  maxD: number;
  clusters: PlottedThematicCluster[];
}

export function computeThematicLayout(
  clusters: ThematicCluster[],
  medianCentrality: number,
  medianDensity: number,
  nodeSizeScale = 0.9,
): ThematicPlotLayout | null {
  if (!clusters || clusters.length === 0) return null;

  const width = 800;
  const height = 500;
  const padLeft = 75;
  const padRight = 50;
  const padTop = 45;
  const padBottom = 55;
  const plotW = width - padLeft - padRight;
  const plotH = height - padTop - padBottom;

  // Safe maximum thresholds with positive lower bounds
  const rawMaxC = Math.max(
    ...clusters.map((c) => c.centrality),
    medianCentrality * 1.4,
    0.5,
  );
  const rawMaxD = Math.max(
    ...clusters.map((c) => c.density),
    medianDensity * 1.4,
    0.5,
  );

  const maxC = rawMaxC * 1.15;
  const maxD = rawMaxD * 1.15;

  const scaleX = (val: number) =>
    padLeft + (Math.max(0, val) / Math.max(maxC, 0.001)) * plotW;
  const scaleY = (val: number) =>
    padTop + plotH - (Math.max(0, val) / Math.max(maxD, 0.001)) * plotH;

  const medianX = scaleX(medianCentrality);
  const medianY = scaleY(medianDensity);

  const maxSize = Math.max(...clusters.map((c) => c.size), 1);

  const plotted: PlottedThematicCluster[] = clusters.map((c) => {
    const cx = Math.max(
      padLeft + 15,
      Math.min(padLeft + plotW - 15, scaleX(c.centrality)),
    );
    const cy = Math.max(
      padTop + 15,
      Math.min(padTop + plotH - 15, scaleY(c.density)),
    );
    const r = Math.max(
      8,
      Math.min(36, (10 + (c.size / maxSize) * 16) * nodeSizeScale),
    );

    // Quadrant theme color
    let color = "#2563eb"; // Q1: Motor Themes (Blue)
    if (c.quadrant === "Niche Themes") color = "#7c3aed"; // Q2: Niche (Purple)
    if (c.quadrant === "Emerging or Declining") color = "#dc2626"; // Q3: Emerging (Crimson)
    if (c.quadrant === "Basic & Transversal") color = "#059669"; // Q4: Basic (Emerald)

    // Clean truncated title (max 22 chars) to avoid horizontal collision
    const rawTitle = c.name || "Cluster";
    const displayTitle =
      rawTitle.length > 22 ? rawTitle.substring(0, 20) + "…" : rawTitle;

    // Smart label auto-flip: if near bottom boundary, place label ABOVE bubble
    const bottomThreshold = padTop + plotH - 22;
    const labelY = cy + r + 14 > bottomThreshold ? cy - r - 6 : cy + r + 13;

    return {
      ...c,
      cx,
      cy,
      r,
      color,
      displayTitle,
      labelY,
    };
  });

  return {
    width,
    height,
    padLeft,
    padRight,
    padTop,
    padBottom,
    plotW,
    plotH,
    medianX,
    medianY,
    maxC,
    maxD,
    clusters: plotted,
  };
}
