import React, { useState, useMemo } from "react";
import { AnalysisType, MeasurementScale } from "../../../types/stats";
import { getScaleMeta } from "../../../utils/measurementScale";
import { MATRIX_DATA } from "./guideData";

export interface MatrixTabProps {
  onSelectAnalysis: (type: AnalysisType) => void;
  onClose: () => void;
}

const FILTER_BUTTONS: { id: "all" | MeasurementScale; label: string }[] = [
  { id: "all", label: "All Scales" },
  { id: "scale", label: "Scale (Interval/Ratio)" },
  { id: "ordinal", label: "Ordinal" },
  { id: "nominal", label: "Nominal" },
];

export const MatrixTab: React.FC<MatrixTabProps> = ({
  onSelectAnalysis,
  onClose,
}) => {
  const [matrixFilterScale, setMatrixFilterScale] = useState<
    "all" | MeasurementScale
  >("all");

  const filteredMatrix = useMemo(() => {
    if (matrixFilterScale === "all") return MATRIX_DATA;
    return MATRIX_DATA.filter((m) => m.scale === matrixFilterScale);
  }, [matrixFilterScale]);

  return (
    <div className="space-y-3">
      {/* Scale Filter */}
      <div className="flex items-center justify-between pb-2 border-b border-zinc-200 dark:border-zinc-800">
        <span className="text-[11px] font-semibold text-zinc-700 dark:text-zinc-300">
          Filter by Measurement Scale:
        </span>
        <div className="flex items-center gap-1">
          {FILTER_BUTTONS.map((btn) => (
            <button
              key={btn.id}
              onClick={() => setMatrixFilterScale(btn.id)}
              className={`px-2 py-0.5 rounded text-[10px] font-medium border transition ${
                matrixFilterScale === btn.id
                  ? "bg-amber-600 text-white border-amber-600"
                  : "bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100"
              }`}
            >
              {btn.label}
            </button>
          ))}
        </div>
      </div>

      {/* Matrix Table */}
      <div className="border border-zinc-200 dark:border-zinc-800 rounded overflow-x-auto text-[11px]">
        <table className="w-full text-left border-collapse">
          <thead className="bg-zinc-50 dark:bg-zinc-800/60 border-b border-zinc-200 dark:border-zinc-800 text-[10px] text-zinc-500 uppercase">
            <tr>
              <th className="px-2.5 py-1.5 font-semibold">Scale</th>
              <th className="px-2.5 py-1.5 font-semibold">
                Research Objective
              </th>
              <th className="px-2.5 py-1.5 font-semibold">Groups / Design</th>
              <th className="px-2.5 py-1.5 font-semibold">
                Recommended Test (Parametric)
              </th>
              <th className="px-2.5 py-1.5 font-semibold">
                Non-Parametric Alternative
              </th>
              <th className="px-2.5 py-1.5 font-semibold text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {filteredMatrix.map((row, idx) => {
              const scaleMeta = getScaleMeta(row.scale);
              return (
                <tr
                  key={idx}
                  className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30"
                >
                  <td className="px-2.5 py-1.5">
                    <span
                      className={`text-[9px] px-1.5 py-0.5 rounded font-mono border ${scaleMeta.badgeClass}`}
                    >
                      {scaleMeta.shortLabel}
                    </span>
                  </td>
                  <td className="px-2.5 py-1.5 font-medium">{row.purpose}</td>
                  <td className="px-2.5 py-1.5 text-zinc-500">
                    {row.groups} ({row.design})
                  </td>
                  <td className="px-2.5 py-1.5 font-semibold text-indigo-600 dark:text-indigo-400">
                    {row.normalTest.title}
                  </td>
                  <td className="px-2.5 py-1.5 text-emerald-600 dark:text-emerald-400">
                    {row.nonParamAlt?.title || "-"}
                  </td>
                  <td className="px-2.5 py-1.5 text-right">
                    <button
                      onClick={() => {
                        onSelectAnalysis(row.normalTest.type);
                        onClose();
                      }}
                      className="px-2 py-0.5 rounded bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/60 text-indigo-600 dark:text-indigo-300 font-semibold text-[10px] border border-indigo-200 dark:border-indigo-800 transition"
                    >
                      Open
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
