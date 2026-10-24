import React from "react";
import {
  TTestOneSampleResponse,
  TTestIndependentResponse,
  TTestPairedResponse,
} from "../../../../../types/stats";
import { ComparativeTestsTable } from "./ComparativeTestsTable";

export interface TTestResultViewsProps {
  result:
    TTestOneSampleResponse | TTestIndependentResponse | TTestPairedResponse;
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

export const TTestResultViews: React.FC<TTestResultViewsProps> = ({
  result,
}) => {
  if (result.analysis_type === "ttest_one_sample") {
    const pStr =
      result.p_value < 0.001 ? "< .001" : `= ${result.p_value.toFixed(3)}`;

    return (
      <div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
          <MetricCard
            label="Sample Mean"
            value={result.mean.toFixed(2)}
            color="text-indigo-600 dark:text-indigo-400"
          />
          <MetricCard label="Test Value" value={result.test_value} />
          <MetricCard
            label={`t (${result.df})`}
            value={
              <>
                {result.t_statistic.toFixed(3)}{" "}
                <span className="text-[9px] font-normal text-zinc-500">
                  (p {pStr})
                </span>
              </>
            }
          />
          <MetricCard
            label="Cohen's d"
            value={result.cohen_d ? result.cohen_d.toFixed(2) : "-"}
          />
        </div>

        <div className="border border-zinc-200 dark:border-zinc-800 rounded overflow-x-auto text-[11px]">
          <table className="w-full text-left border-collapse">
            <thead className="bg-zinc-50 dark:bg-zinc-800/60 border-b border-zinc-200 dark:border-zinc-800">
              <tr>
                <th className="px-2.5 py-1.5 font-semibold">Variable</th>
                <th className="px-2.5 py-1.5 font-semibold text-right">N</th>
                <th className="px-2.5 py-1.5 font-semibold text-right">M</th>
                <th className="px-2.5 py-1.5 font-semibold text-right">SD</th>
                <th className="px-2.5 py-1.5 font-semibold text-right">
                  Mean Diff
                </th>
                <th className="px-2.5 py-1.5 font-semibold text-right">
                  95% CI
                </th>
                <th className="px-2.5 py-1.5 font-semibold text-right">t</th>
                <th className="px-2.5 py-1.5 font-semibold text-right">df</th>
                <th className="px-2.5 py-1.5 font-semibold text-right">
                  Sig. (p)
                </th>
              </tr>
            </thead>
            <tbody>
              <tr className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30">
                <td className="px-2.5 py-1.5 font-medium">{result.variable}</td>
                <td className="px-2.5 py-1.5 text-right">{result.n}</td>
                <td className="px-2.5 py-1.5 text-right">
                  {result.mean.toFixed(2)}
                </td>
                <td className="px-2.5 py-1.5 text-right">
                  {result.std.toFixed(2)}
                </td>
                <td className="px-2.5 py-1.5 text-right">
                  {result.mean_diff.toFixed(2)}
                </td>
                <td className="px-2.5 py-1.5 text-right">
                  [{result.ci_95_lower ? result.ci_95_lower.toFixed(2) : "-"},{" "}
                  {result.ci_95_upper ? result.ci_95_upper.toFixed(2) : "-"}]
                </td>
                <td className="px-2.5 py-1.5 text-right font-medium">
                  {result.t_statistic.toFixed(3)}
                </td>
                <td className="px-2.5 py-1.5 text-right">{result.df}</td>
                <td className="px-2.5 py-1.5 text-right font-medium">
                  {result.p_value < 0.001
                    ? "< .001 ***"
                    : result.p_value.toFixed(3)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <ComparativeTestsTable
          comparativeTests={result.comparative_tests}
          alternative={result.alternative}
          residualsNormality={result.residuals_normality}
        />
      </div>
    );
  }

  if (result.analysis_type === "ttest_independent") {
    return (
      <div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 mb-3">
          <MetricCard
            label={`${result.group1.name} (N=${result.group1.n})`}
            value={
              <>
                {result.group1.mean.toFixed(2)}{" "}
                <span className="text-[9px] font-normal text-zinc-500">
                  ±{result.group1.std.toFixed(2)}
                </span>
              </>
            }
            color="text-indigo-600 dark:text-indigo-400"
          />
          <MetricCard
            label={`${result.group2.name} (N=${result.group2.n})`}
            value={
              <>
                {result.group2.mean.toFixed(2)}{" "}
                <span className="text-[9px] font-normal text-zinc-500">
                  ±{result.group2.std.toFixed(2)}
                </span>
              </>
            }
            color="text-indigo-600 dark:text-indigo-400"
          />
          <MetricCard
            label="Levene's Test (F)"
            value={
              <>
                {result.levene_f.toFixed(2)}{" "}
                <span className="text-[9px] font-normal text-zinc-500">
                  (p{" "}
                  {result.levene_p < 0.001
                    ? "< .001"
                    : `= ${result.levene_p.toFixed(3)}`}
                  )
                </span>
              </>
            }
          />
          <MetricCard
            label="Cohen's d"
            value={result.equal_var.cohen_d.toFixed(2)}
          />
          {result.residuals_normality && (
            <MetricCard
              label="Residuals Shapiro (W)"
              value={
                <>
                  {result.residuals_normality.w.toFixed(4)}{" "}
                  <span className="text-[9px] font-normal text-zinc-500">
                    (p{" "}
                    {result.residuals_normality.p < 0.001
                      ? "< .001"
                      : `= ${result.residuals_normality.p.toFixed(3)}`}
                    )
                  </span>
                </>
              }
            />
          )}
        </div>

        <div className="border border-zinc-200 dark:border-zinc-800 rounded overflow-x-auto text-[11px]">
          <table className="w-full text-left border-collapse">
            <thead className="bg-zinc-50 dark:bg-zinc-800/60 border-b border-zinc-200 dark:border-zinc-800">
              <tr>
                <th className="px-2.5 py-1.5 font-semibold">
                  Variance Assumption
                </th>
                <th className="px-2.5 py-1.5 font-semibold text-right">t</th>
                <th className="px-2.5 py-1.5 font-semibold text-right">df</th>
                <th className="px-2.5 py-1.5 font-semibold text-right">
                  Sig. (2-tailed)
                </th>
                <th className="px-2.5 py-1.5 font-semibold text-right">
                  Mean Diff
                </th>
                <th className="px-2.5 py-1.5 font-semibold text-right">
                  Cohen's d
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              <tr className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30">
                <td className="px-2.5 py-1.5 font-medium">
                  Equal variances assumed (Student's t)
                </td>
                <td className="px-2.5 py-1.5 text-right font-medium">
                  {result.equal_var.t_statistic.toFixed(3)}
                </td>
                <td className="px-2.5 py-1.5 text-right">
                  {result.equal_var.df}
                </td>
                <td className="px-2.5 py-1.5 text-right font-medium">
                  {result.equal_var.p_value < 0.001
                    ? "< .001 ***"
                    : result.equal_var.p_value.toFixed(3)}
                </td>
                <td className="px-2.5 py-1.5 text-right">
                  {result.equal_var.mean_diff.toFixed(2)}
                </td>
                <td className="px-2.5 py-1.5 text-right">
                  {result.equal_var.cohen_d.toFixed(2)}
                </td>
              </tr>
              <tr className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30">
                <td className="px-2.5 py-1.5 font-medium">
                  Equal variances not assumed (Welch's t)
                </td>
                <td className="px-2.5 py-1.5 text-right font-medium">
                  {result.welch_var.t_statistic.toFixed(3)}
                </td>
                <td className="px-2.5 py-1.5 text-right">
                  {result.welch_var.df.toFixed(1)}
                </td>
                <td className="px-2.5 py-1.5 text-right font-medium">
                  {result.welch_var.p_value < 0.001
                    ? "< .001 ***"
                    : result.welch_var.p_value.toFixed(3)}
                </td>
                <td className="px-2.5 py-1.5 text-right">
                  {result.welch_var.mean_diff.toFixed(2)}
                </td>
                <td className="px-2.5 py-1.5 text-right">
                  {result.welch_var.cohen_d.toFixed(2)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <ComparativeTestsTable
          comparativeTests={result.comparative_tests}
          alternative={result.alternative}
        />
      </div>
    );
  }

  if (result.analysis_type === "ttest_paired") {
    return (
      <div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
          <MetricCard
            label={`${result.var1} Mean`}
            value={result.mean1.toFixed(2)}
            color="text-indigo-600 dark:text-indigo-400"
          />
          <MetricCard
            label={`${result.var2} Mean`}
            value={result.mean2.toFixed(2)}
            color="text-indigo-600 dark:text-indigo-400"
          />
          <MetricCard
            label="Paired Correlation (r)"
            value={result.correlation.toFixed(3)}
          />
          <MetricCard
            label="Cohen's d (dz)"
            value={result.cohen_d ? result.cohen_d.toFixed(2) : "-"}
          />
        </div>

        <div className="border border-zinc-200 dark:border-zinc-800 rounded overflow-x-auto text-[11px]">
          <table className="w-full text-left border-collapse">
            <thead className="bg-zinc-50 dark:bg-zinc-800/60 border-b border-zinc-200 dark:border-zinc-800">
              <tr>
                <th className="px-2.5 py-1.5 font-semibold">Pair Comparison</th>
                <th className="px-2.5 py-1.5 font-semibold text-right">
                  Pairs (N)
                </th>
                <th className="px-2.5 py-1.5 font-semibold text-right">
                  Mean Diff
                </th>
                <th className="px-2.5 py-1.5 font-semibold text-right">t</th>
                <th className="px-2.5 py-1.5 font-semibold text-right">df</th>
                <th className="px-2.5 py-1.5 font-semibold text-right">
                  Sig. (p)
                </th>
              </tr>
            </thead>
            <tbody>
              <tr className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30">
                <td className="px-2.5 py-1.5 font-medium">
                  {result.var1} - {result.var2}
                </td>
                <td className="px-2.5 py-1.5 text-right">{result.n}</td>
                <td className="px-2.5 py-1.5 text-right">
                  {result.mean_diff.toFixed(2)}
                </td>
                <td className="px-2.5 py-1.5 text-right font-medium">
                  {result.t_statistic.toFixed(3)}
                </td>
                <td className="px-2.5 py-1.5 text-right">{result.df}</td>
                <td className="px-2.5 py-1.5 text-right font-medium">
                  {result.p_value < 0.001
                    ? "< .001 ***"
                    : result.p_value.toFixed(3)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <ComparativeTestsTable
          comparativeTests={result.comparative_tests}
          alternative={result.alternative}
          residualsNormality={result.residuals_normality}
          normalityLabel="Differences Normality"
        />
      </div>
    );
  }

  return null;
};
