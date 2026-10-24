import React from "react";
import { AlertCircle, Tag, Ruler } from "lucide-react";
import {
  AnalysisResult,
  DescriptiveResponse,
  ReliabilityResponse,
} from "../../../../types/stats";

export interface DescriptiveResultViewProps {
  result: AnalysisResult;
}

export const DescriptiveResultView: React.FC<DescriptiveResultViewProps> = ({
  result,
}) => {
  if (result.analysis_type === "descriptive") {
    const desc = result as DescriptiveResponse;
    const hasMissing = desc.results.some((r) => (r.n_missing ?? 0) > 0);

    return (
      <div className="space-y-3">
        {hasMissing && (
          <div className="flex items-center gap-2 p-2 rounded bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 text-amber-800 dark:text-amber-300 text-[11px]">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>
              <strong>Missing Data Audit:</strong> Dataset contains missing
              observations. Sample counts below reflect valid available cases
              per variable.
            </span>
          </div>
        )}
        <div className="border border-zinc-200 dark:border-zinc-800 rounded overflow-x-auto text-[11px]">
          <table className="w-full text-left border-collapse">
            <thead className="bg-zinc-50 dark:bg-zinc-800/60 border-b border-zinc-200 dark:border-zinc-800">
              <tr>
                <th className="px-2.5 py-1.5 font-semibold">Variable</th>
                <th className="px-2.5 py-1.5 font-semibold">Scale</th>
                <th className="px-2.5 py-1.5 font-semibold text-right">
                  Valid N
                </th>
                <th className="px-2.5 py-1.5 font-semibold text-right">
                  Missing
                </th>
                <th className="px-2.5 py-1.5 font-semibold text-right">Mean</th>
                <th className="px-2.5 py-1.5 font-semibold text-right">
                  Variance
                </th>
                <th className="px-2.5 py-1.5 font-semibold text-right">
                  Std. Dev
                </th>
                <th className="px-2.5 py-1.5 font-semibold text-right">
                  Median
                </th>
                <th className="px-2.5 py-1.5 font-semibold text-right">Mode</th>
                <th className="px-2.5 py-1.5 font-semibold text-right">Min</th>
                <th className="px-2.5 py-1.5 font-semibold text-right">Max</th>
                <th className="px-2.5 py-1.5 font-semibold text-right">IQR</th>
                <th className="px-2.5 py-1.5 font-semibold text-right">CV</th>
                <th className="px-2.5 py-1.5 font-semibold text-right">
                  Skewness
                </th>
                <th className="px-2.5 py-1.5 font-semibold text-right">
                  Shapiro-Wilk (p)
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {desc.results.map((r) => {
                const isNominal = r.scale === "nominal" || r.mean === null;
                return (
                  <tr
                    key={r.variable}
                    className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30"
                  >
                    <td className="px-2.5 py-1.5 font-medium">{r.variable}</td>
                    <td className="px-2.5 py-1.5 font-mono text-[9px]">
                      {isNominal ? (
                        <span className="px-1 py-0.5 rounded bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 inline-flex items-center gap-0.5">
                          <Tag className="w-2.5 h-2.5" /> Nominal
                        </span>
                      ) : (
                        <span className="px-1 py-0.5 rounded bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 inline-flex items-center gap-0.5">
                          <Ruler className="w-2.5 h-2.5" /> Scale
                        </span>
                      )}
                    </td>
                    <td className="px-2.5 py-1.5 text-right font-mono">
                      {r.n_valid ?? r.n}
                    </td>
                    <td className="px-2.5 py-1.5 text-right font-mono">
                      {(r.n_missing ?? 0) > 0 ? (
                        <span className="text-amber-600 dark:text-amber-400 font-medium">
                          {r.n_missing} ({r.missing_pct}%)
                        </span>
                      ) : (
                        <span className="text-zinc-400">0</span>
                      )}
                    </td>
                    {isNominal ? (
                      <td
                        colSpan={11}
                        className="px-2.5 py-1.5 text-zinc-500 italic"
                      >
                        Nominal variable (Mode:{" "}
                        <strong className="text-zinc-800 dark:text-zinc-200 font-normal">
                          {r.mode || "-"}
                        </strong>
                        )
                      </td>
                    ) : (
                      <>
                        <td className="px-2.5 py-1.5 text-right font-mono">
                          {r.mean?.toFixed(2)}
                        </td>
                        <td className="px-2.5 py-1.5 text-right font-mono">
                          {r.variance !== null && r.variance !== undefined
                            ? r.variance.toFixed(2)
                            : "-"}
                        </td>
                        <td className="px-2.5 py-1.5 text-right font-mono">
                          {r.std?.toFixed(2)}
                        </td>
                        <td className="px-2.5 py-1.5 text-right font-mono">
                          {r.median?.toFixed(2)}
                        </td>
                        <td className="px-2.5 py-1.5 text-right font-mono">
                          {r.mode !== null && r.mode !== undefined
                            ? typeof r.mode === "number"
                              ? r.mode.toFixed(2)
                              : r.mode
                            : "-"}
                        </td>
                        <td className="px-2.5 py-1.5 text-right font-mono">
                          {r.min?.toFixed(2)}
                        </td>
                        <td className="px-2.5 py-1.5 text-right font-mono">
                          {r.max?.toFixed(2)}
                        </td>
                        <td className="px-2.5 py-1.5 text-right font-mono">
                          {r.iqr !== null && r.iqr !== undefined
                            ? r.iqr.toFixed(2)
                            : "-"}
                        </td>
                        <td className="px-2.5 py-1.5 text-right font-mono">
                          {r.coeff_variation !== null &&
                          r.coeff_variation !== undefined
                            ? r.coeff_variation.toFixed(3)
                            : "-"}
                        </td>
                        <td className="px-2.5 py-1.5 text-right font-mono">
                          {r.skewness?.toFixed(2)}
                        </td>
                        <td className="px-2.5 py-1.5 text-right font-mono">
                          {r.shapiro_p !== null && r.shapiro_p !== undefined
                            ? r.shapiro_p < 0.001
                              ? "< .001"
                              : r.shapiro_p.toFixed(3)
                            : "-"}
                        </td>
                      </>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Nominal Frequency tables if any */}
        {desc.results
          .filter((r) => r.frequencies && r.frequencies.length > 0)
          .map((r) => (
            <div
              key={r.variable}
              className="p-2.5 border border-zinc-200 dark:border-zinc-800 rounded bg-zinc-50/50 dark:bg-zinc-950/40"
            >
              <div className="text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                Frequency Distribution:{" "}
                <span className="text-indigo-600 dark:text-indigo-400">
                  {r.variable}
                </span>{" "}
                (Nominal)
              </div>
              <div className="flex flex-wrap gap-2 text-[10px]">
                {r.frequencies?.map((f) => (
                  <div
                    key={f.value}
                    className="px-2 py-1 rounded bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800"
                  >
                    <span className="font-semibold">{f.value}</span>: {f.count}{" "}
                    ({f.percentage}%)
                  </div>
                ))}
              </div>
            </div>
          ))}
      </div>
    );
  }

  if (result.analysis_type === "reliability") {
    const rel = result as ReliabilityResponse;
    return (
      <div>
        <div className="p-2.5 rounded bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900/60 flex items-center justify-between mb-3">
          <div>
            <div className="text-[10px] font-semibold uppercase text-indigo-600 dark:text-indigo-400">
              Cronbach's Alpha (α)
            </div>
            <div className="text-lg font-black text-indigo-700 dark:text-indigo-300">
              {rel.cronbach_alpha.toFixed(3)}
            </div>
          </div>
          <div className="text-[10px] text-right text-zinc-500">
            <div>Items: {rel.items_count}</div>
            <div>Sample (N): {rel.sample_size}</div>
          </div>
        </div>

        <div className="border border-zinc-200 dark:border-zinc-800 rounded overflow-x-auto text-[11px]">
          <table className="w-full text-left border-collapse">
            <thead className="bg-zinc-50 dark:bg-zinc-800/60 border-b border-zinc-200 dark:border-zinc-800">
              <tr>
                <th className="px-2.5 py-1.5 font-semibold">Scale Item</th>
                <th className="px-2.5 py-1.5 font-semibold text-right">Mean</th>
                <th className="px-2.5 py-1.5 font-semibold text-right">
                  Std. Dev
                </th>
                <th className="px-2.5 py-1.5 font-semibold text-right">
                  Corrected Item-Total Corr
                </th>
                <th className="px-2.5 py-1.5 font-semibold text-right">
                  Alpha if Item Deleted
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {rel.item_stats.map((it) => (
                <tr
                  key={it.item}
                  className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30"
                >
                  <td className="px-2.5 py-1.5 font-medium">{it.item}</td>
                  <td className="px-2.5 py-1.5 text-right">
                    {it.mean.toFixed(2)}
                  </td>
                  <td className="px-2.5 py-1.5 text-right">
                    {it.std.toFixed(2)}
                  </td>
                  <td className="px-2.5 py-1.5 text-right">
                    {it.corrected_item_total_corr.toFixed(3)}
                  </td>
                  <td className="px-2.5 py-1.5 text-right">
                    {it.alpha_if_deleted.toFixed(3)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return null;
};
