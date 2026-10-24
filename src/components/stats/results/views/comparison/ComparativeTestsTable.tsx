import React from "react";
import { ComparativeTestResult } from "../../../../../types/stats";

export interface ComparativeTestsTableProps {
  comparativeTests?: ComparativeTestResult[];
  alternative?: string;
  residualsNormality?: {
    w: number;
    p: number;
  } | null;
  normalityLabel?: string;
}

export const ComparativeTestsTable: React.FC<ComparativeTestsTableProps> = ({
  comparativeTests,
  alternative,
  residualsNormality,
  normalityLabel = "Shapiro-Wilk",
}) => {
  if (!comparativeTests || comparativeTests.length === 0) return null;

  return (
    <div className="mt-3">
      <div className="text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5 flex items-center justify-between">
        <span>
          Comparative Methods (
          {alternative ? `Hypothesis: ${alternative}` : "Two-sided"})
        </span>
        {residualsNormality && (
          <span className="text-[10px] text-zinc-500 font-mono">
            {normalityLabel}: W={residualsNormality.w.toFixed(3)} (p=
            {residualsNormality.p.toFixed(3)})
          </span>
        )}
      </div>
      <div className="border border-zinc-200 dark:border-zinc-800 rounded overflow-x-auto text-[11px]">
        <table className="w-full text-left border-collapse">
          <thead className="bg-zinc-50 dark:bg-zinc-800/60 border-b border-zinc-200 dark:border-zinc-800">
            <tr>
              <th className="px-2.5 py-1.5 font-semibold">Test Method</th>
              <th className="px-2.5 py-1.5 font-semibold text-right">
                Statistic
              </th>
              <th className="px-2.5 py-1.5 font-semibold text-right">df</th>
              <th className="px-2.5 py-1.5 font-semibold text-right">
                p-value
              </th>
              <th className="px-2.5 py-1.5 font-semibold text-right">
                Mean Diff
              </th>
              <th className="px-2.5 py-1.5 font-semibold text-right">
                Effect Size
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800 font-mono">
            {comparativeTests.map((ct) => (
              <tr
                key={ct.test_name}
                className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30"
              >
                <td className="px-2.5 py-1.5 font-sans font-medium">
                  {ct.test_name}
                </td>
                <td className="px-2.5 py-1.5 text-right">
                  {ct.statistic.toFixed(3)}
                </td>
                <td className="px-2.5 py-1.5 text-right">
                  {ct.df !== null && ct.df !== undefined
                    ? Number.isInteger(ct.df)
                      ? ct.df
                      : ct.df.toFixed(1)
                    : "-"}
                </td>
                <td className="px-2.5 py-1.5 text-right font-medium">
                  {ct.p_value < 0.001 ? "< .001 ***" : ct.p_value.toFixed(3)}
                </td>
                <td className="px-2.5 py-1.5 text-right">
                  {ct.mean_diff !== null && ct.mean_diff !== undefined
                    ? ct.mean_diff.toFixed(2)
                    : "-"}
                </td>
                <td className="px-2.5 py-1.5 text-right font-sans">
                  {ct.effect_size !== null && ct.effect_size !== undefined
                    ? `${ct.effect_size_name || "Effect"}: ${ct.effect_size.toFixed(2)}`
                    : "-"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
