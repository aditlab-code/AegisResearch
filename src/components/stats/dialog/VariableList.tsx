import React from "react";
import { Search, Ruler, BarChart2, Tag } from "lucide-react";
import { MeasurementScale } from "../../../types/stats";
import { getScaleMeta } from "../../../utils/measurementScale";

export interface VariableListProps {
  columns: string[];
  searchFilter: string;
  onSearchChange: (val: string) => void;
  selectedAvailable: string | null;
  onSelectAvailable: (col: string) => void;
  variableScales: Record<string, MeasurementScale>;
  onToggleScale: (col: string, e: React.MouseEvent) => void;
}

export const VariableList: React.FC<VariableListProps> = ({
  columns,
  searchFilter,
  onSearchChange,
  selectedAvailable,
  onSelectAvailable,
  variableScales,
  onToggleScale,
}) => {
  const filteredColumns = columns.filter((col) =>
    col.toLowerCase().includes(searchFilter.toLowerCase()),
  );

  return (
    <div className="flex flex-col border border-zinc-200 dark:border-zinc-800 rounded p-2.5 bg-zinc-50/50 dark:bg-zinc-950/40">
      <div className="flex items-center justify-between mb-1.5">
        <label className="text-[10px] font-semibold uppercase text-zinc-500 tracking-wider">
          Available Variables ({columns.length})
        </label>
        <span
          className="text-[9px] text-zinc-400"
          title="Click scale badge to cycle scale"
        >
          Click badge to change scale
        </span>
      </div>

      <div className="relative mb-1.5">
        <Search className="w-3.5 h-3.5 absolute left-2 top-2 text-zinc-400" />
        <input
          type="text"
          value={searchFilter}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Filter variables..."
          className="w-full pl-7 pr-2 py-1 text-[11px] rounded border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
      </div>

      <div className="flex-1 overflow-y-auto border border-zinc-200 dark:border-zinc-800 rounded bg-white dark:bg-zinc-900 max-h-56 divide-y divide-zinc-100 dark:divide-zinc-800/50">
        {filteredColumns.map((col) => {
          const scale = variableScales[col] || "scale";
          const meta = getScaleMeta(scale);
          const isSelected = selectedAvailable === col;

          return (
            <div
              key={col}
              onClick={() => onSelectAvailable(col)}
              className={`px-2 py-1 flex items-center justify-between text-[11px] cursor-pointer select-none transition ${
                isSelected
                  ? "bg-indigo-600 text-white font-medium"
                  : "hover:bg-zinc-100 dark:hover:bg-zinc-800/60"
              }`}
            >
              <span className="truncate mr-1">{col}</span>
              <button
                type="button"
                onClick={(e) => onToggleScale(col, e)}
                title={`Scale: ${meta.label} (Click to change)`}
                className={`text-[9px] font-mono px-1.5 py-0.5 rounded border transition shrink-0 inline-flex items-center gap-1 ${
                  isSelected
                    ? "bg-white/20 text-white border-white/40"
                    : meta.badgeClass
                }`}
              >
                {scale === "scale" ? (
                  <Ruler className="w-2.5 h-2.5" />
                ) : scale === "ordinal" ? (
                  <BarChart2 className="w-2.5 h-2.5" />
                ) : (
                  <Tag className="w-2.5 h-2.5" />
                )}
                <span>{meta.shortLabel}</span>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
