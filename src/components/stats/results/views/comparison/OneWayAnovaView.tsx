import React from "react";
import { AnovaOneWayResponse } from "../../../../../types/stats";

export interface OneWayAnovaViewProps {
  result: AnovaOneWayResponse;
}

export const OneWayAnovaView: React.FC<OneWayAnovaViewProps> = ({ result }) => {
  const pStr =
    result.p_value < 0.001 ? "< .001 ***" : result.p_value.toFixed(3);

  return (
    <div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 mb-3">
        <div className="p-2 rounded bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/60">
          <div className="text-[10px] font-medium text-zinc-500 uppercase">
            F-Statistic
          </div>
          <div className="text-sm font-bold text-indigo-600 dark:text-indigo-400">
            {result.f_statistic.toFixed(3)}
          </div>
        </div>
        <div className="p-2 rounded bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/60">
          <div className="text-[10px] font-medium text-zinc-500 uppercase">
            p-Value
          </div>
          <div className="text-sm font-bold">{pStr}</div>
        </div>
        <div className="p-2 rounded bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/60">
          <div className="text-[10px] font-medium text-zinc-500 uppercase">
            Eta-Squared (η²)
          </div>
          <div className="text-sm font-bold">
            {result.eta_squared.toFixed(3)}
          </div>
        </div>
        <div className="p-2 rounded bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/60">
          <div className="text-[10px] font-medium text-zinc-500 uppercase">
            Groups (k)
          </div>
          <div className="text-sm font-bold">
            {result.k_groups} (N={result.total_n})
          </div>
        </div>
        {result.residuals_normality && (
          <div className="p-2 rounded bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/60">
            <div className="text-[10px] font-medium text-zinc-500 uppercase">
              Residuals Shapiro (W)
            </div>
            <div className="text-sm font-bold">
              {result.residuals_normality.w.toFixed(4)}{" "}
              <span className="text-[9px] font-normal text-zinc-500">
                (p{" "}
                {result.residuals_normality.p < 0.001
                  ? "< .001"
                  : `= ${result.residuals_normality.p.toFixed(3)}`}
                )
              </span>
            </div>
          </div>
        )}
      </div>

      {/* ANOVA Table */}
      <div className="border border-zinc-200 dark:border-zinc-800 rounded overflow-x-auto text-[11px] mb-3">
        <table className="w-full text-left border-collapse">
          <thead className="bg-zinc-50 dark:bg-zinc-800/60 border-b border-zinc-200 dark:border-zinc-800">
            <tr>
              <th className="px-2.5 py-1.5 font-semibold">
                Source of Variation
              </th>
              <th className="px-2.5 py-1.5 font-semibold text-right">SS</th>
              <th className="px-2.5 py-1.5 font-semibold text-right">df</th>
              <th className="px-2.5 py-1.5 font-semibold text-right">MS</th>
              <th className="px-2.5 py-1.5 font-semibold text-right">F</th>
              <th className="px-2.5 py-1.5 font-semibold text-right">
                Sig. (p)
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
            <tr className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30">
              <td className="px-2.5 py-1.5 font-medium">Between Groups</td>
              <td className="px-2.5 py-1.5 text-right">
                {result.ss_between.toFixed(2)}
              </td>
              <td className="px-2.5 py-1.5 text-right">{result.df_between}</td>
              <td className="px-2.5 py-1.5 text-right">
                {result.ms_between.toFixed(2)}
              </td>
              <td className="px-2.5 py-1.5 text-right font-medium">
                {result.f_statistic.toFixed(3)}
              </td>
              <td className="px-2.5 py-1.5 text-right font-medium">{pStr}</td>
            </tr>
            <tr className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30">
              <td className="px-2.5 py-1.5 font-medium">
                Within Groups (Error)
              </td>
              <td className="px-2.5 py-1.5 text-right">
                {result.ss_within.toFixed(2)}
              </td>
              <td className="px-2.5 py-1.5 text-right">{result.df_within}</td>
              <td className="px-2.5 py-1.5 text-right">
                {result.ms_within.toFixed(2)}
              </td>
              <td className="px-2.5 py-1.5 text-right">-</td>
              <td className="px-2.5 py-1.5 text-right">-</td>
            </tr>
            <tr className="font-semibold bg-zinc-50/30 dark:bg-zinc-800/20">
              <td className="px-2.5 py-1.5">Total</td>
              <td className="px-2.5 py-1.5 text-right">
                {result.ss_total.toFixed(2)}
              </td>
              <td className="px-2.5 py-1.5 text-right">{result.df_total}</td>
              <td className="px-2.5 py-1.5 text-right">-</td>
              <td className="px-2.5 py-1.5 text-right">-</td>
              <td className="px-2.5 py-1.5 text-right">-</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Tukey Post-Hoc if available */}
      {result.post_hoc_tukey && result.post_hoc_tukey.length > 0 && (
        <div className="border border-zinc-200 dark:border-zinc-800 rounded overflow-x-auto text-[11px]">
          <div className="px-2.5 py-1 font-semibold bg-zinc-50 dark:bg-zinc-800/60 border-b border-zinc-200 dark:border-zinc-800">
            Post-Hoc Tukey HSD Multiple Comparisons
          </div>
          <table className="w-full text-left border-collapse">
            <thead className="border-b border-zinc-200 dark:border-zinc-800 text-[10px] text-zinc-500">
              <tr>
                <th className="px-2.5 py-1 font-semibold">Group (I)</th>
                <th className="px-2.5 py-1 font-semibold">Group (J)</th>
                <th className="px-2.5 py-1 font-semibold text-right">
                  Mean Diff (I-J)
                </th>
                <th className="px-2.5 py-1 font-semibold text-right">p-adj</th>
                <th className="px-2.5 py-1 font-semibold text-center">
                  Significant
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {result.post_hoc_tukey.map((t, idx) => (
                <tr
                  key={idx}
                  className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30"
                >
                  <td className="px-2.5 py-1 font-medium">{t.group1}</td>
                  <td className="px-2.5 py-1 font-medium">{t.group2}</td>
                  <td className="px-2.5 py-1 text-right">
                    {t.mean_diff.toFixed(2)}
                  </td>
                  <td className="px-2.5 py-1 text-right font-medium">
                    {t.p_value < 0.001 ? "< .001" : t.p_value.toFixed(3)}
                  </td>
                  <td className="px-2.5 py-1 text-center font-bold">
                    {t.reject ? (
                      <span className="text-emerald-600 dark:text-emerald-400">
                        Yes *
                      </span>
                    ) : (
                      <span className="text-zinc-400 font-normal">No</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
