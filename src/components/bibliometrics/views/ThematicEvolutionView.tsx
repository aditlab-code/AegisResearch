import React, { useState, useRef } from "react";
import { ThematicEvolutionResponse } from "../../../types/bibliometrics";

interface ThematicEvolutionViewProps {
  evolution: ThematicEvolutionResponse | null;
  loading: boolean;
}

export const ThematicEvolutionView: React.FC<ThematicEvolutionViewProps> = ({
  evolution,
  loading,
}) => {
  const [zoom, setZoom] = useState(1.0);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const panStartRef = useRef<{
    x: number;
    y: number;
    startPanX: number;
    startPanY: number;
  } | null>(null);

  if (loading && !evolution) {
    return (
      <div className="flex-1 flex items-center justify-center text-sm text-gray-500 font-medium">
        Computing thematic evolution...
      </div>
    );
  }

  if (!evolution || evolution.nodes.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-sm text-gray-500 font-medium">
        No thematic evolution data available across the corpus publication
        years.
      </div>
    );
  }

  const { time_slices, nodes, links } = evolution;

  // Build column coordinates
  const svgW = 860;
  const svgH = 500;
  const padX = 60;
  const colWidth = (svgW - 2 * padX) / Math.max(1, time_slices.length - 1);

  const nodeMap: Record<string, { x: number; y: number; name: string }> = {};

  time_slices.forEach((slice, sliceIdx) => {
    const colNodes = nodes.filter((n) => n.period === slice);
    const x = padX + sliceIdx * colWidth;
    const spacingY = (svgH - 120) / Math.max(1, colNodes.length);

    colNodes.forEach((node, nodeIdx) => {
      nodeMap[node.id] = {
        x,
        y: 60 + nodeIdx * spacingY + spacingY * 0.5,
        name: node.name,
      };
    });
  });

  const vbW = svgW / zoom;
  const vbH = svgH / zoom;
  const vbX = (svgW - vbW) / 2 - pan.x;
  const vbY = (svgH - vbH) / 2 - pan.y;

  const handlePointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    if (e.button !== 0) return;
    const target = e.target as HTMLElement;
    if (target.tagName === "rect" || target.tagName === "text") return;

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

  const handlePointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!panStartRef.current) return;
    const dx = (e.clientX - panStartRef.current.x) / zoom;
    const dy = (e.clientY - panStartRef.current.y) / zoom;
    setPan({
      x: panStartRef.current.startPanX + dx,
      y: panStartRef.current.startPanY + dy,
    });
  };

  const handlePointerUp = (e: React.PointerEvent<SVGSVGElement>) => {
    if (panStartRef.current) {
      panStartRef.current = null;
      setIsPanning(false);
      try {
        if (e.currentTarget.hasPointerCapture(e.pointerId)) {
          e.currentTarget.releasePointerCapture(e.pointerId);
        }
      } catch {}
    }
  };

  return (
    <div className="flex-1 relative w-full h-full bg-white dark:bg-gray-950 overflow-hidden flex flex-col p-2">
      <div className="flex-1 flex items-center justify-center overflow-hidden">
        <svg
          viewBox={`${vbX} ${vbY} ${vbW} ${vbH}`}
          className={`w-full h-full max-h-[560px] select-none ${
            isPanning ? "cursor-grabbing" : "cursor-grab"
          }`}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
        >
          {/* Column Background Banners & Slices */}
          {time_slices.map((slice, idx) => {
            const x = padX + idx * colWidth;
            return (
              <g key={`slice-${slice}`}>
                <line
                  x1={x}
                  y1={45}
                  x2={x}
                  y2={svgH - 25}
                  stroke="#e2e8f0"
                  className="dark:stroke-gray-800"
                  strokeWidth={1}
                  strokeDasharray="3 3"
                />
                <rect
                  x={x - 45}
                  y={12}
                  width={90}
                  height={24}
                  rx={6}
                  fill="#f1f5f9"
                  className="dark:fill-gray-800"
                />
                <text
                  x={x}
                  y={28}
                  textAnchor="middle"
                  fontSize="11"
                  fontWeight="bold"
                  fill="#334155"
                  className="dark:fill-slate-200 font-mono pointer-events-none"
                >
                  {slice}
                </text>
              </g>
            );
          })}

          {/* Sankey Flow Links (Bézier Curves) */}
          <g className="links-layer">
            {links.map((link, idx) => {
              const src = nodeMap[link.source];
              const tgt = nodeMap[link.target];
              if (!src || !tgt) return null;

              const midX = (src.x + tgt.x) / 2;
              const pathD = `M ${src.x + 35} ${src.y} C ${midX} ${src.y}, ${midX} ${tgt.y}, ${tgt.x - 35} ${tgt.y}`;
              const strokeW = Math.max(
                2,
                Math.min(12, link.inclusion_index * 14),
              );

              return (
                <path
                  key={`link-${idx}`}
                  d={pathD}
                  fill="none"
                  stroke="#3b82f6"
                  strokeWidth={strokeW}
                  strokeOpacity={0.35}
                  className="transition-all hover:stroke-blue-700 hover:stroke-opacity-80"
                >
                  <title>{`${src.name} ➔ ${tgt.name} (Inclusion Index: ${link.inclusion_index.toFixed(2)})`}</title>
                </path>
              );
            })}
          </g>

          {/* Evolution Nodes */}
          <g className="nodes-layer">
            {nodes.map((node) => {
              const pos = nodeMap[node.id];
              if (!pos) return null;

              const label =
                node.name.length > 18
                  ? node.name.substring(0, 16) + "…"
                  : node.name;

              return (
                <g key={`evo-node-${node.id}`} className="cursor-default">
                  <rect
                    x={pos.x - 38}
                    y={pos.y - 12}
                    width={76}
                    height={24}
                    rx={5}
                    fill="#2563eb"
                    className="shadow-sm"
                  />
                  <text
                    x={pos.x}
                    y={pos.y + 4}
                    textAnchor="middle"
                    fontSize="9.5"
                    fontWeight="600"
                    fill="#ffffff"
                    className="pointer-events-none"
                  >
                    {label}
                  </text>
                </g>
              );
            })}
          </g>
        </svg>
      </div>

      {/* Floating Mini-HUD (Zoom & Reset) */}
      <div className="absolute bottom-12 right-4 flex items-center gap-1.5 p-1 rounded-lg border border-gray-200 dark:border-gray-800 bg-white/90 dark:bg-gray-900/90 shadow-md backdrop-blur-sm text-xs">
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
          }}
          className="px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 text-[11px] font-medium"
        >
          Reset
        </button>
      </div>

      <div className="px-4 py-1.5 border-t border-gray-200 dark:border-gray-800 bg-gray-50/80 dark:bg-gray-900/80 flex items-center justify-between text-[11px] text-gray-500">
        <div>
          <span>Time Periods: </span>
          <span className="font-mono font-semibold text-gray-800 dark:text-gray-200">
            {time_slices.length} slices
          </span>
          <span className="mx-2">·</span>
          <span>Flow Connections: </span>
          <span className="font-mono font-semibold text-gray-800 dark:text-gray-200">
            {links.length} links
          </span>
        </div>
        <div className="text-gray-400">
          Click on empty area and drag to pan · Lineage via Salton Inclusion
          Index
        </div>
      </div>
    </div>
  );
};
