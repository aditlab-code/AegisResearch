import React, { useRef, useState } from "react";
import { NetworkResponse } from "../../../types/bibliometrics";
import {
  getClusterColor,
  calculateEdgeWidth,
  calculateEdgeOpacity,
  calculateFontSize,
} from "../layout/vosScale";
import { CANVAS_BOUNDS } from "../layout/deterministicLayout";
import { useNetworkLayout } from "../hooks/useNetworkLayout";

interface NetworkViewProps {
  network: NetworkResponse | null;
  spacingScale: number;
  nodeSizeScale: number;
  zoom: number;
  setZoom: React.Dispatch<React.SetStateAction<number>>;
  loading: boolean;
}

export const NetworkView: React.FC<NetworkViewProps> = ({
  network,
  spacingScale,
  nodeSizeScale,
  zoom,
  setZoom,
  loading,
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const panStartRef = useRef<{
    x: number;
    y: number;
    startPanX: number;
    startPanY: number;
  } | null>(null);

  const {
    nodePositions,
    draggingNodeId,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    resetPositions,
  } = useNetworkLayout(network, spacingScale, nodeSizeScale, svgRef);

  // Optical ViewBox calculation for smooth zoom & pan
  const vbW = CANVAS_BOUNDS.width / zoom;
  const vbH = CANVAS_BOUNDS.height / zoom;
  const vbX = (CANVAS_BOUNDS.width - vbW) / 2 - pan.x;
  const vbY = (CANVAS_BOUNDS.height - vbH) / 2 - pan.y;

  const handleSvgPointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    // Only pan if clicking on empty background or edges layer (not a dragging node)
    if (draggingNodeId || e.button !== 0) return;
    const target = e.target as HTMLElement;
    if (target.tagName === "circle" || target.tagName === "text") return;

    panStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      startPanX: pan.x,
      startPanY: pan.y,
    };
    setIsPanning(true);
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {}
  };

  const handleSvgPointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (panStartRef.current) {
      const dx = (e.clientX - panStartRef.current.x) / zoom;
      const dy = (e.clientY - panStartRef.current.y) / zoom;
      setPan({
        x: panStartRef.current.startPanX + dx,
        y: panStartRef.current.startPanY + dy,
      });
      return;
    }
    handlePointerMove(e);
  };

  const handleSvgPointerUp = (e: React.PointerEvent<SVGSVGElement>) => {
    if (panStartRef.current) {
      panStartRef.current = null;
      setIsPanning(false);
      try {
        if (e.currentTarget.hasPointerCapture(e.pointerId)) {
          e.currentTarget.releasePointerCapture(e.pointerId);
        }
      } catch {}
      return;
    }
    handlePointerUp(e);
  };

  if (loading && !network) {
    return (
      <div className="flex-1 flex items-center justify-center text-sm text-gray-500 font-medium">
        Computing co-occurrence network...
      </div>
    );
  }

  if (!network || network.nodes.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-sm text-gray-500 font-medium">
        No network nodes meeting the frequency threshold. Try lowering Min
        Frequency.
      </div>
    );
  }

  // Active connected node IDs for highlighting
  const connectedNodeIds = new Set<string>();
  if (hoveredNodeId) {
    connectedNodeIds.add(hoveredNodeId);
    network.edges.forEach((e) => {
      if (e.source === hoveredNodeId) connectedNodeIds.add(e.target);
      if (e.target === hoveredNodeId) connectedNodeIds.add(e.source);
    });
  }

  return (
    <div className="flex-1 relative w-full h-full bg-white dark:bg-gray-950 overflow-hidden flex flex-col">
      <svg
        ref={svgRef}
        viewBox={`${vbX} ${vbY} ${vbW} ${vbH}`}
        className={`w-full h-full select-none ${
          isPanning ? "cursor-grabbing" : "cursor-grab"
        }`}
        onPointerDown={handleSvgPointerDown}
        onPointerMove={handleSvgPointerMove}
        onPointerUp={handleSvgPointerUp}
      >
        {/* Network Edges */}
        <g className="edges-layer">
          {network.edges.map((e) => {
            const p1 = nodePositions[e.source];
            const p2 = nodePositions[e.target];
            if (!p1 || !p2) return null;

            const isHighlighted =
              hoveredNodeId &&
              (e.source === hoveredNodeId || e.target === hoveredNodeId);
            const isDimmed = hoveredNodeId && !isHighlighted;

            return (
              <line
                key={`edge-${e.source}-${e.target}`}
                x1={p1.x}
                y1={p1.y}
                x2={p2.x}
                y2={p2.y}
                stroke={isHighlighted ? "#2563eb" : "#94a3b8"}
                strokeWidth={
                  isHighlighted
                    ? calculateEdgeWidth(e.weight) * 1.5
                    : calculateEdgeWidth(e.weight)
                }
                strokeOpacity={isDimmed ? 0.08 : calculateEdgeOpacity(e.weight)}
              />
            );
          })}
        </g>

        {/* Network Nodes */}
        <g className="nodes-layer">
          {network.nodes.map((node) => {
            const pos = nodePositions[node.id];
            if (!pos) return null;

            const isDragging = draggingNodeId === node.id;
            const isHovered = hoveredNodeId === node.id;
            const isDimmed =
              hoveredNodeId !== null && !connectedNodeIds.has(node.id);
            const color = getClusterColor(node.cluster);
            const fontSize = calculateFontSize(pos.r);

            return (
              <g
                key={`node-${node.id}`}
                transform={`translate(${pos.x}, ${pos.y})`}
                onPointerDown={(e) => handlePointerDown(node.id, e)}
                onMouseEnter={() => setHoveredNodeId(node.id)}
                onMouseLeave={() => setHoveredNodeId(null)}
                className="cursor-grab active:cursor-grabbing transition-opacity"
                opacity={isDimmed ? 0.22 : 1}
              >
                {/* Bubble Circle */}
                <circle
                  r={pos.r}
                  fill={color}
                  fillOpacity={isHovered || isDragging ? 0.95 : 0.85}
                  stroke="#ffffff"
                  strokeWidth={isHovered ? 2.5 : 1.5}
                  className="transition-all"
                />

                {/* High-Contrast Text Halo (Readability First: stroke-fill order) */}
                <text
                  y={pos.r + 12}
                  textAnchor="middle"
                  fontSize={fontSize}
                  fontWeight="600"
                  fill="#0f172a"
                  className="dark:fill-slate-100 pointer-events-none"
                  style={{
                    paintOrder: "stroke fill",
                    stroke: "var(--color-bg-halo, rgba(255,255,255,0.85))",
                    strokeWidth: "3.5px",
                    strokeLinejoin: "round",
                  }}
                >
                  {node.label}
                </text>
              </g>
            );
          })}
        </g>
      </svg>

      {/* Floating Mini-HUD (Zoom & Reset Controls) */}
      <div className="absolute bottom-4 right-4 flex items-center gap-1.5 p-1 rounded-lg border border-gray-200 dark:border-gray-800 bg-white/90 dark:bg-gray-900/90 shadow-md backdrop-blur-sm text-xs">
        <button
          type="button"
          onClick={() => setZoom((z) => Math.max(0.5, z - 0.2))}
          className="w-7 h-7 flex items-center justify-center rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 font-bold"
          title="Zoom Out"
        >
          −
        </button>
        <span className="font-mono text-[11px] text-gray-500 min-w-[36px] text-center">
          {Math.round(zoom * 100)}%
        </span>
        <button
          type="button"
          onClick={() => setZoom((z) => Math.min(2.5, z + 0.2))}
          className="w-7 h-7 flex items-center justify-center rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 font-bold"
          title="Zoom In"
        >
          +
        </button>
        <div className="h-4 w-[1px] bg-gray-200 dark:bg-gray-700 mx-0.5" />
        <button
          type="button"
          onClick={() => {
            setZoom(1.0);
            setPan({ x: 0, y: 0 });
            resetPositions();
          }}
          className="px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 text-[11px] font-medium"
        >
          Reset
        </button>
      </div>

      {/* Loading Overlay */}
      {loading && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/40 dark:bg-gray-950/40 backdrop-blur-[1px] transition-all">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-md text-xs font-semibold text-blue-600 dark:text-blue-400">
            <span className="w-2 h-2 rounded-full bg-blue-600 animate-ping" />
            <span>Computing network analysis...</span>
          </div>
        </div>
      )}

      {/* Status Bar Summary */}
      <div className="px-4 py-1.5 border-t border-gray-200 dark:border-gray-800 bg-gray-50/80 dark:bg-gray-900/80 flex items-center justify-between text-[11px] text-gray-500">
        <div>
          <span>Nodes: </span>
          <span className="font-mono font-semibold text-gray-800 dark:text-gray-200">
            {network.total_nodes}
          </span>
          <span className="mx-2">·</span>
          <span>Edges: </span>
          <span className="font-mono font-semibold text-gray-800 dark:text-gray-200">
            {network.total_edges}
          </span>
          <span className="mx-2">·</span>
          <span>Clusters: </span>
          <span className="font-mono font-semibold text-gray-800 dark:text-gray-200">
            {network.cluster_count}
          </span>
        </div>
        <div className="text-gray-400">
          Drag nodes to arrange · Text halo enabled
        </div>
      </div>
    </div>
  );
};
