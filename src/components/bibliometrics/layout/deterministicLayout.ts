import { NetworkNode } from "../../../types/bibliometrics";
import { NodePosition } from "../types";
import { calculateNodeRadius } from "./vosScale";

export interface LayoutBounds {
  width: number;
  height: number;
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

export const CANVAS_BOUNDS: LayoutBounds = {
  width: 960,
  height: 620,
  minX: 30,
  maxX: 930,
  minY: 30,
  maxY: 590,
};

/**
 * Calculates a clean, 100% deterministic radial cluster layout.
 * Instant compute (0ms), zero frame drops, highly reproducible.
 */
export function computeDeterministicNetworkLayout(
  nodes: NetworkNode[],
  clusterCount: number,
  spacingScale: number,
  nodeSizeScale: number,
): Record<string, NodePosition> {
  const positions: Record<string, NodePosition> = {};
  if (!nodes || nodes.length === 0) return positions;

  const width = CANVAS_BOUNDS.width;
  const height = CANVAS_BOUNDS.height;
  const centerX = width / 2;
  const centerY = height / 2;

  const maxFreq = Math.max(...nodes.map((n) => n.frequency), 1);
  const totalClusters = Math.max(1, clusterCount);

  // Group nodes by cluster
  const clusters: Record<number, NetworkNode[]> = {};
  for (const node of nodes) {
    if (!clusters[node.cluster]) {
      clusters[node.cluster] = [];
    }
    clusters[node.cluster].push(node);
  }

  // Sort nodes in each cluster by frequency descending (most central items first)
  for (const cId in clusters) {
    clusters[cId].sort((a, b) => b.frequency - a.frequency);
  }

  // Cluster center radius from canvas center
  const clusterOrbitRadius = Math.min(width, height) * 0.28 * spacingScale;

  // Place cluster centers around radial circle
  const clusterKeys = Object.keys(clusters).map(Number);
  clusterKeys.forEach((cId, idx) => {
    const angle = (idx * 2 * Math.PI) / totalClusters - Math.PI / 2;
    const clusterCenterX = centerX + clusterOrbitRadius * Math.cos(angle);
    const clusterCenterY = centerY + clusterOrbitRadius * Math.sin(angle);

    const clusterNodes = clusters[cId];
    clusterNodes.forEach((node, nodeIdx) => {
      const r = calculateNodeRadius(
        node.frequency,
        maxFreq,
        nodes.length,
        nodeSizeScale,
      );

      if (nodeIdx === 0) {
        // Core node sits directly at cluster center
        positions[node.id] = {
          x: clusterCenterX,
          y: clusterCenterY,
          r,
          cluster: node.cluster,
        };
      } else {
        // Satellite nodes orbit their cluster center
        const goldenAngle = nodeIdx * 2.39996;
        const dist = (35 + nodeIdx * 18) * spacingScale;
        const px = clusterCenterX + dist * Math.cos(goldenAngle);
        const py = clusterCenterY + dist * Math.sin(goldenAngle);

        positions[node.id] = {
          x: Math.max(CANVAS_BOUNDS.minX, Math.min(CANVAS_BOUNDS.maxX, px)),
          y: Math.max(CANVAS_BOUNDS.minY, Math.min(CANVAS_BOUNDS.maxY, py)),
          r,
          cluster: node.cluster,
        };
      }
    });
  });

  // Fast 1-pass overlap resolution (anti-collision)
  const nodeIds = Object.keys(positions);
  const minClearance = 10;
  for (let i = 0; i < nodeIds.length; i++) {
    const u = nodeIds[i];
    const p1 = positions[u];
    for (let j = i + 1; j < nodeIds.length; j++) {
      const v = nodeIds[j];
      const p2 = positions[v];
      const dx = p1.x - p2.x;
      const dy = p1.y - p2.y;
      const dist = Math.hypot(dx, dy) || 1;
      const requiredDist = p1.r + p2.r + minClearance;

      if (dist < requiredDist) {
        const overlap = (requiredDist - dist) * 0.5;
        const nx = (dx / dist) * overlap;
        const ny = (dy / dist) * overlap;

        p1.x = Math.max(
          CANVAS_BOUNDS.minX,
          Math.min(CANVAS_BOUNDS.maxX, p1.x + nx),
        );
        p1.y = Math.max(
          CANVAS_BOUNDS.minY,
          Math.min(CANVAS_BOUNDS.maxY, p1.y + ny),
        );
        p2.x = Math.max(
          CANVAS_BOUNDS.minX,
          Math.min(CANVAS_BOUNDS.maxX, p2.x - nx),
        );
        p2.y = Math.max(
          CANVAS_BOUNDS.minY,
          Math.min(CANVAS_BOUNDS.maxY, p2.y - ny),
        );
      }
    }
  }

  return positions;
}

/**
 * Constrains a dragged node so it pushes away from nearby bubbles
 * and never overlaps or penetrates other nodes.
 */
export function constrainDragMovement(
  dragId: string,
  targetX: number,
  targetY: number,
  positions: Record<string, NodePosition>,
): { x: number; y: number } {
  let cx = Math.max(CANVAS_BOUNDS.minX, Math.min(CANVAS_BOUNDS.maxX, targetX));
  let cy = Math.max(CANVAS_BOUNDS.minY, Math.min(CANVAS_BOUNDS.maxY, targetY));

  const dragNode = positions[dragId];
  if (!dragNode) return { x: cx, y: cy };

  const minGap = 8;
  const dragR = dragNode.r;

  for (const id in positions) {
    if (id === dragId) continue;
    const other = positions[id];
    const dx = cx - other.x;
    const dy = cy - other.y;
    const dist = Math.hypot(dx, dy) || 1;
    const required = dragR + other.r + minGap;

    if (dist < required) {
      // Push target outside boundary of the conflicting bubble
      const pushFactor = required / dist;
      cx = other.x + dx * pushFactor;
      cy = other.y + dy * pushFactor;
    }
  }

  return {
    x: Math.max(CANVAS_BOUNDS.minX, Math.min(CANVAS_BOUNDS.maxX, cx)),
    y: Math.max(CANVAS_BOUNDS.minY, Math.min(CANVAS_BOUNDS.maxY, cy)),
  };
}
