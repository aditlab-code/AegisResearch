import React from "react";
import {
  AnalysisResult,
  MannWhitneyResponse,
  WilcoxonSignedRankResponse,
  KruskalWallisResponse,
  ChiSquareIndependenceResponse,
  CorrelationResponse,
} from "../../../../types/stats";

export interface NonParametricResultViewProps {
  result: AnalysisResult;
}

const MetricCard: React.FC<{
  label: string;
  value: React.ReactNode;
  color?: string;
}> = ({ label, value, color }) => (
  <div className="p-2 rounded bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/60">
    <div className="text-[10px] font-medium text-zinc-500 uppercase">
      {label}
    </div>
    <div className={`text-sm font-bold ${color || ""}`}>{value}</div>
  </div>
);

export const NonParametricResultView: React.FC<
  NonParametricResultViewProps
> = ({ result }) => {
  if (
    result.analysis_type === "mann_whitney_u" ||
    (result.analysis_type as string) === "mann_whitney"
  ) {
    const mw = result as MannWhitneyResponse;
    const pStr = mw.p_value < 0.001 ? "< .001 ***" : mw.p_value.toFixed(3);
    return (
      <div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
          <MetricCard
            label="Mann-Whitney U"
            value={mw.u_statistic.toFixed(1)}
            color="text-indigo-600 dark:text-indigo-400"
          />
          <MetricCard label="Wilcoxon W" value={mw.w_statistic.toFixed(1)} />
          <MetricCard label="Z-Score" value={mw.z_score.toFixed(3)} />
          <MetricCard label="Asymp. Sig. (p)" value={pStr} />
        </div>

        <div className="border border-zinc-200 dark:border-zinc-800 rounded overflow-x-auto text-[11px]">
          <table className="w-full text-left border-collapse">
            <thead className="bg-zinc-50 dark:bg-zinc-800/60 border-b border-zinc-200 dark:border-zinc-800">
              <tr>
                <th className="px-2.5 py-1.5 font-semibold">Group</th>
                <th className="px-2.5 py-1.5 font-semibold text-right">N</th>
                <th className="px-2.5 py-1.5 font-semibold text-right">
                  Median
                </th>
                <th className="px-2.5 py-1.5 font-semibold text-right">
                  Mean Rank
                </th>
                <th className="px-2.5 py-1.5 font-semibold text-right">
                  Sum of Ranks
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {[mw.group1, mw.group2].map((g) => (
                <tr
                  key={g.name}
                  className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30"
                >
                  <td className="px-2.5 py-1.5 font-medium">{g.name}</td>
                  <td className="px-2.5 py-1.5 text-right">{g.n}</td>
                  <td className="px-2.5 py-1.5 text-right">
                    {g.median.toFixed(2)}
                  </td>
                  <td className="px-2.5 py-1.5 text-right font-medium">
                    {g.mean_rank.toFixed(2)}
                  </td>
                  <td className="px-2.5 py-1.5 text-right">
                    {g.sum_ranks.toFixed(1)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  if (
    result.analysis_type === "wilcoxon_signed_rank" ||
    (result.analysis_type as string) === "wilcoxon"
  ) {
    const wx = result as WilcoxonSignedRankResponse;
    const pStr = wx.p_value < 0.001 ? "< .001 ***" : wx.p_value.toFixed(3);
    return (
      <div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
          <MetricCard
            label="Wilcoxon W"
            value={wx.w_statistic.toFixed(1)}
            color="text-indigo-600 dark:text-indigo-400"
          />
          <MetricCard label="Z-Score" value={wx.z_score.toFixed(3)} />
          <MetricCard label="p-Value" value={pStr} />
          <MetricCard
            label="Pairs (+ / -)"
            value={`${wx.positive_pairs} / ${wx.negative_pairs} (N=${wx.n_effective})`}
          />
        </div>

        <div className="border border-zinc-200 dark:border-zinc-800 rounded p-2.5 bg-zinc-50 dark:bg-zinc-950/40 text-[11px]">
          <div className="flex items-center justify-between">
            <span>
              Median {wx.var1}:{" "}
              <strong className="text-indigo-600 dark:text-indigo-400">
                {wx.median1.toFixed(2)}
              </strong>
            </span>
            <span>
              Median {wx.var2}:{" "}
              <strong className="text-indigo-600 dark:text-indigo-400">
                {wx.median2.toFixed(2)}
              </strong>
            </span>
          </div>
        </div>
      </div>
    );
  }

  if (
    result.analysis_type === "kruskal_wallis" ||
    (result.analysis_type as string) === "kruskal"
  ) {
    const kw = result as KruskalWallisResponse;
    const pStr = kw.p_value < 0.001 ? "< .001 ***" : kw.p_value.toFixed(3);
    return (
      <div>
        <div className="grid grid-cols-3 gap-2 mb-3">
          <MetricCard
            label="Kruskal-Wallis H"
            value={kw.h_statistic.toFixed(3)}
            color="text-indigo-600 dark:text-indigo-400"
          />
          <MetricCard label="df" value={kw.df} />
          <MetricCard label="Asymp. Sig. (p)" value={pStr} />
        </div>

        <div className="border border-zinc-200 dark:border-zinc-800 rounded overflow-x-auto text-[11px]">
          <table className="w-full text-left border-collapse">
            <thead className="bg-zinc-50 dark:bg-zinc-800/60 border-b border-zinc-200 dark:border-zinc-800">
              <tr>
                <th className="px-2.5 py-1.5 font-semibold">
                  Group ({kw.group_variable})
                </th>
                <th className="px-2.5 py-1.5 font-semibold text-right">N</th>
                <th className="px-2.5 py-1.5 font-semibold text-right">
                  Median
                </th>
                <th className="px-2.5 py-1.5 font-semibold text-right">
                  Mean Rank
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {kw.groups.map((g) => (
                <tr
                  key={g.group}
                  className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30"
                >
                  <td className="px-2.5 py-1.5 font-medium">{g.group}</td>
                  <td className="px-2.5 py-1.5 text-right">{g.n}</td>
                  <td className="px-2.5 py-1.5 text-right">
                    {g.median.toFixed(2)}
                  </td>
                  <td className="px-2.5 py-1.5 text-right font-medium">
                    {g.mean_rank.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  if (
    result.analysis_type === "chisquare_independence" ||
    (result.analysis_type as string) === "chisquare"
  ) {
    const cs = result as ChiSquareIndependenceResponse;
    const pStr = cs.p_value < 0.001 ? "< .001 ***" : cs.p_value.toFixed(3);
    return (
      <div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
          <MetricCard
            label="Chi-Square (χ²)"
            value={cs.chi2_statistic.toFixed(2)}
            color="text-indigo-600 dark:text-indigo-400"
          />
          <MetricCard label="df" value={cs.df} />
          <MetricCard label="p-Value" value={pStr} />
          <MetricCard label="Cramér's V" value={cs.cramers_v.toFixed(3)} />
        </div>

        {/* Contingency Table */}
        <div className="border border-zinc-200 dark:border-zinc-800 rounded overflow-x-auto text-[11px]">
          <table className="w-full text-left border-collapse">
            <thead className="bg-zinc-50 dark:bg-zinc-800/60 border-b border-zinc-200 dark:border-zinc-800">
              <tr>
                <th className="px-2.5 py-1.5 font-semibold">
                  {cs.row_variable} \ {cs.col_variable}
                </th>
                {cs.col_labels.map((c) => (
                  <th
                    key={c}
                    className="px-2.5 py-1.5 font-semibold text-right"
                  >
                    {c}
                  </th>
                ))}
                <th className="px-2.5 py-1.5 font-semibold text-right">
                  Total
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {cs.crosstab.map((row) => (
                <tr
                  key={row.row}
                  className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30"
                >
                  <td className="px-2.5 py-1.5 font-medium">{row.row}</td>
                  {row.cells.map((cell) => (
                    <td key={cell.col} className="px-2.5 py-1.5 text-right">
                      <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                        {cell.observed}
                      </span>
                      <span className="text-[9px] text-zinc-400 ml-1">
                        ({cell.expected})
                      </span>
                    </td>
                  ))}
                  <td className="px-2.5 py-1.5 text-right font-bold">
                    {row.total}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="text-[10px] text-zinc-400 italic pt-1">
          Observed counts (expected frequencies in parentheses). Total N ={" "}
          {cs.sample_size}.
        </div>
      </div>
    );
  }

  if (
    result.analysis_type === "correlation_pearson" ||
    result.analysis_type === "correlation_spearman"
  ) {
    const corr = result as CorrelationResponse;
    return (
      <div>
        <div className="border border-zinc-200 dark:border-zinc-800 rounded overflow-x-auto text-[11px]">
          <table className="w-full text-left border-collapse">
            <thead className="bg-zinc-50 dark:bg-zinc-800/60 border-b border-zinc-200 dark:border-zinc-800">
              <tr>
                <th className="px-2.5 py-1.5 font-semibold">Variable</th>
                {corr.variables.map((v, i) => (
                  <th
                    key={v}
                    className="px-2.5 py-1.5 font-semibold text-right"
                  >
                    ({i + 1}) {v}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {corr.matrix.map((row, i) => (
                <tr
                  key={row.variable}
                  className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30"
                >
                  <td className="px-2.5 py-1.5 font-medium">
                    ({i + 1}) {row.variable}
                  </td>
                  {row.correlations.map((cell, j) => {
                    const val = cell.r !== undefined ? cell.r : (cell.rho ?? 0);
                    const star =
                      cell.p_value < 0.001
                        ? "***"
                        : cell.p_value < 0.01
                          ? "**"
                          : cell.p_value < 0.05
                            ? "*"
                            : "";
                    return (
                      <td key={j} className="px-2.5 py-1.5 text-right">
                        {i === j ? (
                          <span className="text-zinc-400">1.00</span>
                        ) : (
                          <div>
                            <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                              {val.toFixed(2)}
                              {star}
                            </span>
                            <div className="text-[9px] text-zinc-400">
                              p=
                              {cell.p_value < 0.001
                                ? "<.001"
                                : cell.p_value.toFixed(3)}
                            </div>
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="text-[10px] text-zinc-400 italic pt-1">
          * p &lt; .05, ** p &lt; .01, *** p &lt; .001 (two-tailed)
        </div>
      </div>
    );
  }

  return null;
};
