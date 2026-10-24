import React, { useState } from "react";
import { ChevronDown, ChevronRight, GitCommit, RefreshCw } from "lucide-react";
import {
  GitCommitGraphNode,
  LANE_COLORS,
  LANE_WIDTH,
  ROW_HEIGHT,
} from "./gitTypes";

export interface GitCommitGraphCanvasProps {
  commits: GitCommitGraphNode[];
  loading?: boolean;
  onRefresh?: () => void;
  selectedCommitHash?: string | null;
  onSelectCommit?: (hash: string | null) => void;
}

export const GitCommitGraphCanvas: React.FC<GitCommitGraphCanvasProps> = ({
  commits,
  loading = false,
  onRefresh,
  selectedCommitHash: controlledSelectedHash,
  onSelectCommit,
}) => {
  const [isGraphOpen, setIsGraphOpen] = useState(true);
  const [internalSelectedHash, setInternalSelectedHash] = useState<
    string | null
  >(null);

  const selectedHash =
    controlledSelectedHash !== undefined
      ? controlledSelectedHash
      : internalSelectedHash;

  const handleToggleSelect = (hash: string) => {
    const next = selectedHash === hash ? null : hash;
    if (onSelectCommit) {
      onSelectCommit(next);
    } else {
      setInternalSelectedHash(next);
    }
  };

  const nodeCenterY = Math.floor(ROW_HEIGHT / 2);

  return (
    <div className="flex flex-col gap-1 mt-2 border-t border-zinc-200 dark:border-zinc-800 pt-2">
      {/* Header */}
      <div className="flex items-center justify-between text-[11px] font-semibold text-zinc-600 dark:text-zinc-400 px-1">
        <button
          type="button"
          onClick={() => setIsGraphOpen((prev) => !prev)}
          className="flex items-center gap-1 hover:text-zinc-900 dark:hover:text-zinc-200"
        >
          {isGraphOpen ? (
            <ChevronDown className="size-3.5" />
          ) : (
            <ChevronRight className="size-3.5" />
          )}
          <GitCommit className="size-3 text-[#4078f2] dark:text-[#61afef]" />
          <span>COMMITS & GRAPH</span>
          <span className="font-mono bg-zinc-200/80 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 px-1.5 py-0.2 rounded-full text-[10px] ml-1">
            {commits.length}
          </span>
        </button>

        {onRefresh && (
          <button
            type="button"
            onClick={onRefresh}
            title="Refresh Commit Graph"
            className="p-0.5 rounded text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors"
          >
            <RefreshCw
              className={`size-3.5 ${loading ? "animate-spin" : ""}`}
            />
          </button>
        )}
      </div>

      {/* Graph Body */}
      {isGraphOpen && (
        <div className="space-y-0.5 mt-1">
          {loading && commits.length === 0 ? (
            <div className="text-[11px] text-zinc-400 animate-pulse px-2 py-3 text-center">
              Loading commits & graph...
            </div>
          ) : commits.length > 0 ? (
            <div className="flex flex-col divide-y divide-zinc-100 dark:divide-zinc-800/60 max-h-72 overflow-y-auto">
              {commits.map((c, idx) => {
                const isSelected = selectedHash === c.hash;
                const color = LANE_COLORS[c.lane % LANE_COLORS.length];
                const maxLane = Math.max(
                  ...commits.slice(0, 15).map((x) => x.lane),
                  0,
                );
                const svgWidth = Math.max((maxLane + 1) * LANE_WIDTH + 10, 24);
                const cx = 8 + c.lane * LANE_WIDTH;

                return (
                  <div
                    key={c.hash}
                    onClick={() => handleToggleSelect(c.hash)}
                    className={`flex items-start gap-1.5 py-1 px-1 rounded transition-colors cursor-pointer select-none ${
                      isSelected
                        ? "bg-blue-50/80 dark:bg-zinc-800/90"
                        : "hover:bg-zinc-100/70 dark:hover:bg-zinc-800/50"
                    }`}
                  >
                    {/* SVG Lane & Node Graph */}
                    <svg
                      width={svgWidth}
                      height={ROW_HEIGHT}
                      className="shrink-0 overflow-visible"
                    >
                      {/* Top connection line */}
                      {idx > 0 && (
                        <line
                          x1={cx}
                          y1={0}
                          x2={cx}
                          y2={nodeCenterY}
                          stroke={color}
                          strokeWidth={2}
                        />
                      )}
                      {/* Bottom connection line */}
                      {idx < commits.length - 1 && (
                        <line
                          x1={cx}
                          y1={nodeCenterY}
                          x2={cx}
                          y2={ROW_HEIGHT}
                          stroke={color}
                          strokeWidth={2}
                        />
                      )}
                      {/* Branch fork/merge bezier curve if parents > 1 */}
                      {c.parents.length > 1 && (
                        <path
                          d={`M ${cx} ${nodeCenterY} C ${cx} ${nodeCenterY + 8}, ${cx + LANE_WIDTH} ${nodeCenterY + 8}, ${cx + LANE_WIDTH} ${ROW_HEIGHT}`}
                          fill="none"
                          stroke={
                            LANE_COLORS[(c.lane + 1) % LANE_COLORS.length]
                          }
                          strokeWidth={1.5}
                          strokeDasharray="2 2"
                        />
                      )}
                      {/* Commit dot */}
                      {c.isHead && (
                        <circle
                          cx={cx}
                          cy={nodeCenterY}
                          r={6.5}
                          fill="none"
                          stroke={color}
                          strokeWidth={1.5}
                        />
                      )}
                      <circle
                        cx={cx}
                        cy={nodeCenterY}
                        r={c.isHead ? 3.5 : 3}
                        fill={color}
                        stroke="#ffffff"
                        strokeWidth={1}
                      />
                    </svg>

                    {/* Commit Details */}
                    <div className="flex-1 min-w-0 pr-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {c.refs.map((ref) => (
                          <span
                            key={ref}
                            className={`text-[9px] font-mono px-1 py-0.2 rounded font-semibold ${
                              ref.includes("HEAD")
                                ? "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border border-blue-300 dark:border-blue-800"
                                : "bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300"
                            }`}
                          >
                            {ref}
                          </span>
                        ))}
                        <span
                          className="text-xs text-zinc-800 dark:text-zinc-200 truncate font-medium flex-1"
                          title={c.message}
                        >
                          {c.message}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-[10px] text-zinc-400 dark:text-zinc-500 font-mono mt-0.5">
                        <span className="text-[#4078f2] dark:text-[#61afef] font-semibold">
                          {c.hash}
                        </span>
                        <span className="truncate">{c.author}</span>
                        <span className="ml-auto">{c.date}</span>
                      </div>

                      {isSelected && (
                        <div className="mt-1.5 p-1.5 bg-zinc-50 dark:bg-zinc-950 rounded border border-zinc-200 dark:border-zinc-800 text-[10px] space-y-0.5 font-mono">
                          <div>
                            <strong className="text-zinc-500">Hash:</strong>{" "}
                            {c.hash}
                          </div>
                          {c.parents.length > 0 && (
                            <div>
                              <strong className="text-zinc-500">
                                Parents:
                              </strong>{" "}
                              {c.parents.join(", ")}
                            </div>
                          )}
                          <div>
                            <strong className="text-zinc-500">Author:</strong>{" "}
                            {c.author}
                          </div>
                          <div>
                            <strong className="text-zinc-500">Date:</strong>{" "}
                            {c.date}
                          </div>
                          <div className="pt-0.5 text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap font-sans">
                            {c.message}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-4 text-zinc-400 dark:text-zinc-500 text-xs italic">
              No commits found in repository.
            </div>
          )}
        </div>
      )}
    </div>
  );
};
