import React from "react";
import {
  AnovaTwoWayResponse,
  AncovaResponse,
} from "../../../../../types/stats";

export interface TwoWayAncovaViewProps {
  result: AnovaTwoWayResponse | AncovaResponse;
}

export const TwoWayAncovaView: React.FC<TwoWayAncovaViewProps> = ({
  result,
}) => {
  if (result.analysis_type === "anova_twoway") {
    return (
      <div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
          <div className="p-2 rounded bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/60">
            <div className="text-[10px] font-medium text-zinc-500 uppercase">
              Sample Size (N)
            </div>
            <div className="text-sm font-bold text-indigo-600 dark:text-indigo-400">
              {result.sample_size}
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
          {result.levene_test && (
            <div className="p-2 rounded bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/60">
              <div className="text-[10px] font-medium text-zinc-500 uppercase">
                Levene's Test (Cells F)
              </div>
              <div className="text-sm font-bold">
                {result.levene_test.statistic.toFixed(2)}{" "}
                <span className="text-[9px] font-normal text-zinc-500">
                  (p{" "}
                  {result.levene_test.p_value < 0.001
                    ? "< .001"
                    : `= ${result.levene_test.p_value.toFixed(3)}`}
                  )
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="border border-zinc-200 dark:border-zinc-800 rounded overflow-x-auto text-[11px]">
          <div className="px-2.5 py-1.5 font-semibold bg-zinc-50 dark:bg-zinc-800/60 border-b border-zinc-200 dark:border-zinc-800">
            Tests of Between-Subjects Effects ({result.dependent})
          </div>
          <table className="w-full text-left border-collapse">
            <thead className="border-b border-zinc-200 dark:border-zinc-800 text-[10px] text-zinc-500">
              <tr>
                <th className="px-2.5 py-1.5 font-semibold">Source</th>
                <th className="px-2.5 py-1.5 font-semibold text-right">
                  Type II SS
                </th>
                <th className="px-2.5 py-1.5 font-semibold text-right">df</th>
                <th className="px-2.5 py-1.5 font-semibold text-right">MS</th>
                <th className="px-2.5 py-1.5 font-semibold text-right">F</th>
                <th className="px-2.5 py-1.5 font-semibold text-right">
                  Sig. (p)
                </th>
                <th className="px-2.5 py-1.5 font-semibold text-right">
                  Partial η²
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {result.effects.map((e) => (
                <tr
                  key={e.source}
                  className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30"
                >
                  <td className="px-2.5 py-1.5 font-medium">{e.source}</td>
                  <td className="px-2.5 py-1.5 text-right">
                    {e.sum_sq.toFixed(2)}
                  </td>
                  <td className="px-2.5 py-1.5 text-right">
                    {e.df.toFixed(0)}
                  </td>
                  <td className="px-2.5 py-1.5 text-right">
                    {e.mean_sq.toFixed(2)}
                  </td>
                  <td className="px-2.5 py-1.5 text-right font-medium">
                    {e.f_stat !== null ? e.f_stat.toFixed(3) : "-"}
                  </td>
                  <td className="px-2.5 py-1.5 text-right font-medium">
                    {e.p_value !== null
                      ? e.p_value < 0.001
                        ? "< .001 ***"
                        : e.p_value.toFixed(3)
                      : "-"}
                  </td>
                  <td className="px-2.5 py-1.5 text-right font-mono">
                    {e.partial_eta_squared !== null &&
                    e.partial_eta_squared !== undefined
                      ? e.partial_eta_squared.toFixed(3)
                      : "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  if (result.analysis_type === "ancova") {
    return (
      <div className="space-y-3">
        {/* Diagnostic Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2">
          <div className="p-2 rounded bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/60">
            <div className="text-[10px] font-medium text-zinc-500 uppercase">
              Sample Size (N)
            </div>
            <div className="text-sm font-bold text-indigo-600 dark:text-indigo-400">
              {result.total_n}
            </div>
          </div>
          <div className="p-2 rounded bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/60">
            <div className="text-[10px] font-medium text-zinc-500 uppercase">
              Covariate(s)
            </div>
            <div
              className="text-xs font-semibold truncate"
              title={result.covariates.join(", ")}
            >
              {result.covariates.join(", ")}
            </div>
          </div>
          {result.homogeneity_of_slopes && (
            <div className="p-2 rounded bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/60">
              <div className="text-[10px] font-medium text-zinc-500 uppercase">
                Homogeneity of Slopes
              </div>
              <div className="text-sm font-bold">
                {result.homogeneity_of_slopes.assumption_met ? (
                  <span className="text-emerald-600 dark:text-emerald-400 text-xs">
                    Passed (p=
                    {result.homogeneity_of_slopes.p_value.toFixed(3)})
                  </span>
                ) : (
                  <span className="text-amber-600 dark:text-amber-400 text-xs">
                    Violated (p=
                    {result.homogeneity_of_slopes.p_value.toFixed(3)})
                  </span>
                )}
              </div>
            </div>
          )}
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

        {/* ANCOVA Summary Table */}
        <div className="border border-zinc-200 dark:border-zinc-800 rounded overflow-x-auto text-[11px]">
          <div className="px-2.5 py-1.5 font-semibold bg-zinc-50 dark:bg-zinc-800/60 border-b border-zinc-200 dark:border-zinc-800">
            ANCOVA Tests of Between-Subjects Effects (Outcome:{" "}
            {result.dependent})
          </div>
          <table className="w-full text-left border-collapse">
            <thead className="border-b border-zinc-200 dark:border-zinc-800 text-[10px] text-zinc-500">
              <tr>
                <th className="px-2.5 py-1.5 font-semibold">Source</th>
                <th className="px-2.5 py-1.5 font-semibold text-right">
                  Type II SS
                </th>
                <th className="px-2.5 py-1.5 font-semibold text-right">df</th>
                <th className="px-2.5 py-1.5 font-semibold text-right">MS</th>
                <th className="px-2.5 py-1.5 font-semibold text-right">F</th>
                <th className="px-2.5 py-1.5 font-semibold text-right">
                  Sig. (p)
                </th>
                <th className="px-2.5 py-1.5 font-semibold text-right">
                  Partial η²
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {result.effects.map((e) => (
                <tr
                  key={e.source}
                  className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30"
                >
                  <td className="px-2.5 py-1.5 font-medium">{e.source}</td>
                  <td className="px-2.5 py-1.5 text-right font-mono">
                    {e.sum_sq.toFixed(2)}
                  </td>
                  <td className="px-2.5 py-1.5 text-right font-mono">
                    {e.df.toFixed(0)}
                  </td>
                  <td className="px-2.5 py-1.5 text-right font-mono">
                    {e.mean_sq.toFixed(2)}
                  </td>
                  <td className="px-2.5 py-1.5 text-right font-mono font-medium">
                    {e.f_statistic !== null ? e.f_statistic.toFixed(3) : "-"}
                  </td>
                  <td className="px-2.5 py-1.5 text-right font-mono font-medium">
                    {e.p_value !== null
                      ? e.p_value < 0.001
                        ? "< .001 ***"
                        : e.p_value.toFixed(3)
                      : "-"}
                  </td>
                  <td className="px-2.5 py-1.5 text-right font-mono font-medium">
                    {e.partial_eta_squared !== null
                      ? e.partial_eta_squared.toFixed(3)
                      : "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Estimated Marginal Means (Adjusted Means) */}
        <div className="border border-zinc-200 dark:border-zinc-800 rounded overflow-x-auto text-[11px]">
          <div className="px-2.5 py-1.5 font-semibold bg-zinc-50 dark:bg-zinc-800/60 border-b border-zinc-200 dark:border-zinc-800">
            Estimated Marginal Means (Adjusted at Covariate Means)
          </div>
          <table className="w-full text-left border-collapse">
            <thead className="border-b border-zinc-200 dark:border-zinc-800 text-[10px] text-zinc-500">
              <tr>
                <th className="px-2.5 py-1.5 font-semibold">Group</th>
                <th className="px-2.5 py-1.5 font-semibold text-right">N</th>
                <th className="px-2.5 py-1.5 font-semibold text-right">
                  Raw Mean
                </th>
                <th className="px-2.5 py-1.5 font-semibold text-right">
                  Adjusted Mean
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {result.adjusted_means.map((m) => (
                <tr
                  key={m.group}
                  className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30"
                >
                  <td className="px-2.5 py-1.5 font-medium">{m.group}</td>
                  <td className="px-2.5 py-1.5 text-right">{m.n}</td>
                  <td className="px-2.5 py-1.5 text-right font-mono text-zinc-500">
                    {m.raw_mean.toFixed(2)}
                  </td>
                  <td className="px-2.5 py-1.5 text-right font-mono font-bold text-indigo-600 dark:text-indigo-400">
                    {m.adjusted_mean.toFixed(2)}
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
