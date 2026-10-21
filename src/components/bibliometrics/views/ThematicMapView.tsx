import React, { useState, useRef } from "react";
import {
  ThematicMapResponse,
  ThematicCluster,
} from "../../../types/bibliometrics";
import { computeThematicLayout } from "../layout/thematicMath";

interface ThematicMapViewProps {
  thematic: ThematicMapResponse | null;
  selectedCluster: ThematicCluster | null;
  onSelectCluster: (cluster: ThematicCluster | null) => void;
  nodeSizeScale: number;
  zoom: number;
  setZoom: React.Dispatch<React.SetStateAction<number>>;
  loading: boolean;
}

export const ThematicMapView: React.FC<ThematicMapViewProps> = ({
  thematic,
  selectedCluster,
  onSelectCluster,
  nodeSizeScale,
  zoom,
  setZoom,
  loading,
}) => {
  const [hoveredClusterId, setHoveredClusterId] = useState<number | null>(null);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const panStartRef = useRef<{
    x: number;
    y: number;
    startPanX: number;
    startPanY: number;
  } | null>(null);

  if (loading && !thematic) {
    return (
      <div className="flex-1 flex items-center justify-center text-sm text-gray-500 font-medium">
        Computing thematic map...
      </div>
    );
  }

  if (!thematic || thematic.clusters.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-sm text-gray-500 font-medium">
        No thematic clusters found. Try lowering Min Frequency threshold.
      </div>
    );
  }

  const layout = computeThematicLayout(
    thematic.clusters,
    thematic.median_centrality,
    thematic.median_density,
    nodeSizeScale,
  );

  if (!layout) {
    return (
      <div className="flex-1 flex items-center justify-center text-sm text-gray-500 font-medium">
        Unable to compute layout for thematic map.
      </div>
    );
  }

  // Optical ViewBox with smooth zoom & pan
  const vbW = layout.width / zoom;
  const vbH = layout.height / zoom;
  const vbX = (layout.width - vbW) / 2 - pan.x;
  const vbY = (layout.height - vbH) / 2 - pan.y;

  const handlePointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    if (e.button !== 0) return;
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
          className={`w-full h-full max-h-[580px] select-none ${
            isPanning ? "cursor-grabbing" : "cursor-grab"
          }`}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
        >
          {/* Quadrant Background Tints */}
          {/* Q1: Motor Themes (Top-Right) */}
          <rect
            x={layout.medianX}
            y={layout.padTop}
            width={Math.max(0, layout.padLeft + layout.plotW - layout.medianX)}
            height={Math.max(0, layout.medianY - layout.padTop)}
            fill="#2563eb"
            fillOpacity={0.06}
          />
          {/* Q2: Niche Themes (Top-Left) */}
          <rect
            x={layout.padLeft}
            y={layout.padTop}
            width={Math.max(0, layout.medianX - layout.padLeft)}
            height={Math.max(0, layout.medianY - layout.padTop)}
            fill="#7c3aed"
            fillOpacity={0.06}
          />
          {/* Q3: Emerging / Declining (Bottom-Left) */}
          <rect
            x={layout.padLeft}
            y={layout.medianY}
            width={Math.max(0, layout.medianX - layout.padLeft)}
            height={Math.max(0, layout.padTop + layout.plotH - layout.medianY)}
            fill="#dc2626"
            fillOpacity={0.06}
          />
          {/* Q4: Basic & Transversal (Bottom-Right) */}
          <rect
            x={layout.medianX}
            y={layout.medianY}
            width={Math.max(0, layout.padLeft + layout.plotW - layout.medianX)}
            height={Math.max(0, layout.padTop + layout.plotH - layout.medianY)}
            fill="#059669"
            fillOpacity={0.06}
          />

          {/* Plot Border */}
          <rect
            x={layout.padLeft}
            y={layout.padTop}
            width={layout.plotW}
            height={layout.plotH}
            fill="none"
            stroke="#94a3b8"
            strokeWidth={1}
          />

          {/* Median Threshold Lines */}
          <line
            x1={layout.medianX}
            y1={layout.padTop}
            x2={layout.medianX}
            y2={layout.padTop + layout.plotH}
            stroke="#ef4444"
            strokeWidth={1.5}
            strokeDasharray="4 4"
          />
          <line
            x1={layout.padLeft}
            y1={layout.medianY}
            x2={layout.padLeft + layout.plotW}
            y2={layout.medianY}
            stroke="#ef4444"
            strokeWidth={1.5}
            strokeDasharray="4 4"
          />

          {/* Quadrant Titles (Readability First) */}
          <text
            x={layout.padLeft + 12}
            y={layout.padTop + 20}
            fontSize="10"
            fontWeight="bold"
            fill="#7c3aed"
            className="uppercase tracking-wider pointer-events-none"
          >
            Q2: Niche Themes
          </text>
          <text
            x={layout.padLeft + layout.plotW - 12}
            y={layout.padTop + 20}
            textAnchor="end"
            fontSize="10"
            fontWeight="bold"
            fill="#2563eb"
            className="uppercase tracking-wider pointer-events-none"
          >
            Q1: Motor Themes
          </text>
          <text
            x={layout.padLeft + 12}
            y={layout.padTop + layout.plotH - 12}
            fontSize="10"
            fontWeight="bold"
            fill="#dc2626"
            className="uppercase tracking-wider pointer-events-none"
          >
            Q3: Emerging / Declining
          </text>
          <text
            x={layout.padLeft + layout.plotW - 12}
            y={layout.padTop + layout.plotH - 12}
            textAnchor="end"
            fontSize="10"
            fontWeight="bold"
            fill="#059669"
            className="uppercase tracking-wider pointer-events-none"
          >
            Q4: Basic & Transversal
          </text>

          {/* Axis Titles */}
          <text
            x={layout.padLeft + layout.plotW / 2}
            y={layout.padTop + layout.plotH + 38}
            textAnchor="middle"
            fontSize="11"
            fontWeight="bold"
            fill="#475569"
            className="dark:fill-slate-300 pointer-events-none"
          >
            Callon's Centrality (Relevance Degree) ➔
          </text>
          <text
            x={22}
            y={layout.padTop + layout.plotH / 2}
            textAnchor="middle"
            fontSize="11"
            fontWeight="bold"
            fill="#475569"
            className="dark:fill-slate-300 pointer-events-none"
            transform={`rotate(-90, 22, ${layout.padTop + layout.plotH / 2})`}
          >
            Callon's Density (Development Degree) ➔
          </text>

          {/* Thematic Clusters (Symmetric highlight on hover - NO JUMPING) */}
          {layout.clusters.map((c) => {
            const isSelected = selectedCluster?.cluster_id === c.cluster_id;
            const isHovered = hoveredClusterId === c.cluster_id;

            return (
              <g
                key={`thematic-${c.cluster_id}`}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectCluster(isSelected ? null : c);
                }}
                onMouseEnter={() => setHoveredClusterId(c.cluster_id)}
                onMouseLeave={() => setHoveredClusterId(null)}
                className="cursor-pointer"
              >
                <circle
                  cx={c.cx}
                  cy={c.cy}
                  r={c.r}
                  fill={c.color}
                  fillOpacity={isSelected || isHovered ? 0.95 : 0.8}
                  stroke={
                    isSelected ? "#0f172a" : isHovered ? "#2563eb" : "#ffffff"
                  }
                  strokeWidth={isSelected ? 3.5 : isHovered ? 2.5 : 1.5}
                  className="transition-colors"
                />

                {/* Smart Auto-Flip Label with Text Halo */}
                <text
                  x={c.cx}
                  y={c.labelY}
                  textAnchor="middle"
                  fontSize="10"
                  fontWeight="600"
                  fill="#0f172a"
                  className="dark:fill-slate-100 pointer-events-none"
                  style={{
                    paintOrder: "stroke fill",
                    stroke: "var(--color-bg-halo, rgba(255,255,255,0.9))",
                    strokeWidth: "3px",
                    strokeLinejoin: "round",
                  }}
                >
                  {c.displayTitle}
                </text>
              </g>
            );
          })}
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

      {/* Loading Overlay */}
      {loading && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/40 dark:bg-gray-950/40 backdrop-blur-[1px] transition-all">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-md text-xs font-semibold text-blue-600 dark:text-blue-400">
            <span className="w-2 h-2 rounded-full bg-blue-600 animate-ping" />
            <span>Computing thematic map...</span>
          </div>
        </div>
      )}

      {/* Status Bar */}
      <div className="px-4 py-1.5 border-t border-gray-200 dark:border-gray-800 bg-gray-50/80 dark:bg-gray-900/80 flex items-center justify-between text-[11px] text-gray-500">
        <div>
          <span>Median Centrality: </span>
          <span className="font-mono font-semibold text-gray-800 dark:text-gray-200">
            {thematic.median_centrality}
          </span>
          <span className="mx-2">·</span>
          <span>Median Density: </span>
          <span className="font-mono font-semibold text-gray-800 dark:text-gray-200">
            {thematic.median_density}
          </span>
        </div>
        <div className="text-gray-400">
          Click on empty area and drag to pan · Click cluster to inspect
        </div>
      </div>
    </div>
  );
};
