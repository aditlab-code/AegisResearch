import { useState, useEffect, useRef, useCallback } from "react";
import { NetworkResponse } from "../../../types/bibliometrics";
import { NodePosition } from "../types";
import {
  computeDeterministicNetworkLayout,
  constrainDragMovement,
} from "../layout/deterministicLayout";

export interface UseNetworkLayoutReturn {
  nodePositions: Record<string, NodePosition>;
  draggingNodeId: string | null;
  handlePointerDown: (
    nodeId: string,
    e: React.PointerEvent<SVGGElement>,
  ) => void;
  handlePointerMove: (e: React.PointerEvent<SVGSVGElement>) => void;
  handlePointerUp: (e: React.PointerEvent<SVGSVGElement>) => void;
  resetPositions: () => void;
}

export function useNetworkLayout(
  network: NetworkResponse | null,
  spacingScale: number,
  nodeSizeScale: number,
  svgRef: React.RefObject<SVGSVGElement | null>,
): UseNetworkLayoutReturn {
  const [nodePositions, setNodePositions] = useState<
    Record<string, NodePosition>
  >({});
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);

  const dragRef = useRef<{
    nodeId: string | null;
    offsetX: number;
    offsetY: number;
  }>({
    nodeId: null,
    offsetX: 0,
    offsetY: 0,
  });

  // Calculate layout deterministically when data or visual scale changes
  const resetPositions = useCallback(() => {
    if (!network || !network.nodes || network.nodes.length === 0) {
      setNodePositions({});
      return;
    }
    const computed = computeDeterministicNetworkLayout(
      network.nodes,
      network.cluster_count,
      spacingScale,
      nodeSizeScale,
    );
    setNodePositions(computed);
  }, [network, spacingScale, nodeSizeScale]);

  useEffect(() => {
    resetPositions();
  }, [resetPositions]);

  const handlePointerDown = useCallback(
    (nodeId: string, e: React.PointerEvent<SVGGElement>) => {
      if (e.button !== 0) return; // Only primary mouse button
      e.stopPropagation();
      e.preventDefault();

      const svg = svgRef.current;
      const pos = nodePositions[nodeId];
      if (!svg || !pos) return;

      const pt = svg.createSVGPoint();
      pt.x = e.clientX;
      pt.y = e.clientY;
      const ctm = svg.getScreenCTM();
      if (!ctm) return;
      const svgPoint = pt.matrixTransform(ctm.inverse());

      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch {}

      dragRef.current = {
        nodeId,
        offsetX: pos.x - svgPoint.x,
        offsetY: pos.y - svgPoint.y,
      };
      setDraggingNodeId(nodeId);
    },
    [nodePositions, svgRef],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<SVGSVGElement>) => {
      const activeId = dragRef.current.nodeId;
      const svg = svgRef.current;
      if (!activeId || !svg) return;

      e.stopPropagation();
      e.preventDefault();

      const pt = svg.createSVGPoint();
      pt.x = e.clientX;
      pt.y = e.clientY;
      const ctm = svg.getScreenCTM();
      if (!ctm) return;

      const svgPoint = pt.matrixTransform(ctm.inverse());
      const rawTargetX = svgPoint.x + dragRef.current.offsetX;
      const rawTargetY = svgPoint.y + dragRef.current.offsetY;

      // Apply anti-collision constraint so dragged bubble never overlaps nearby nodes
      setNodePositions((prev) => {
        const constrained = constrainDragMovement(
          activeId,
          rawTargetX,
          rawTargetY,
          prev,
        );
        const cur = prev[activeId];
        if (!cur) return prev;
        return {
          ...prev,
          [activeId]: {
            ...cur,
            x: constrained.x,
            y: constrained.y,
          },
        };
      });
    },
    [svgRef],
  );

  const handlePointerUp = useCallback(
    (e: React.PointerEvent<SVGSVGElement>) => {
      const activeId = dragRef.current.nodeId;
      if (!activeId) return;

      e.stopPropagation();
      e.preventDefault();

      try {
        if (e.currentTarget.hasPointerCapture(e.pointerId)) {
          e.currentTarget.releasePointerCapture(e.pointerId);
        }
      } catch {}

      dragRef.current = {
        nodeId: null,
        offsetX: 0,
        offsetY: 0,
      };
      setDraggingNodeId(null);
    },
    [],
  );

  return {
    nodePositions,
    draggingNodeId,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    resetPositions,
  };
}
