import React from "react";
import { RegressionResponse } from "../../../../../types/stats";

export interface LinearRegressionViewProps {
  result: RegressionResponse;
}

export const LinearRegressionView: React.FC<LinearRegressionViewProps> = ({
  result,
}) => {
  const summaryCards = [
    {
      label: "Multiple R",
      value: result.r.toFixed(3),
      valClass: "text-indigo-600 dark:text-indigo-400",
    },
    {
      label: "R Squared (R²)",
      value: result.r_squared.toFixed(3),
      valClass: "text-indigo-600 dark:text-indigo-400",
    },
    {
      label: "F-Statistic",
      value: (
        <>
          {result.f_statistic.toFixed(2)}{" "}
          <span className="text-[9px] font-normal text-zinc-500">
            (p{" "}
            {result.f_p_value < 0.001
              ? "< .001"
              : `= ${result.f_p_value.toFixed(3)}`}
            )
          </span>
        </>
      ),
    },
    {
      label: "Durbin-Watson",
      value:
        result.durbin_watson !== null && result.durbin_watson !== undefined
          ? result.durbin_watson.toFixed(2)
          : "N/A",
    },
  ];

  return (
    <div>
      {/* Compact Inline Summary Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
        {summaryCards.map((c, i) => (
          <div
            key={i}
            className="p-2 rounded bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/60"
          >
            <div className="text-[10px] font-medium text-zinc-500 uppercase">
              {c.label}
            </div>
            <div className={`text-sm font-bold ${c.valClass || ""}`}>
              {c.value}
            </div>
          </div>
        ))}
      </div>

      <div className="border border-zinc-200 dark:border-zinc-800 rounded overflow-x-auto text-[11px]">
        <table className="w-full text-left border-collapse">
          <thead className="bg-zinc-50 dark:bg-zinc-800/60 border-b border-zinc-200 dark:border-zinc-800">
            <tr>
              <th className="px-2.5 py-1.5 font-semibold">Predictor</th>
              <th className="px-2.5 py-1.5 font-semibold text-right">B</th>
              <th className="px-2.5 py-1.5 font-semibold text-right">
                Std. Error
              </th>
              <th className="px-2.5 py-1.5 font-semibold text-right">
                Beta (β)
              </th>
              <th className="px-2.5 py-1.5 font-semibold text-right">t</th>
              <th className="px-2.5 py-1.5 font-semibold text-right">
                Sig. (p)
              </th>
              <th className="px-2.5 py-1.5 font-semibold text-right">
                Tolerance
              </th>
              <th className="px-2.5 py-1.5 font-semibold text-right">VIF</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {result.coefficients.map((c) => (
              <tr
                key={c.variable}
                className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30"
              >
                <td className="px-2.5 py-1.5 font-medium">{c.variable}</td>
                <td className="px-2.5 py-1.5 text-right">{c.b.toFixed(3)}</td>
                <td className="px-2.5 py-1.5 text-right">
                  {c.std_err.toFixed(3)}
                </td>
                <td className="px-2.5 py-1.5 text-right">
                  {c.variable === "(Constant)" ? "-" : c.beta.toFixed(3)}
                </td>
                <td className="px-2.5 py-1.5 text-right">{c.t.toFixed(3)}</td>
                <td className="px-2.5 py-1.5 text-right font-medium">
                  {c.p_value < 0.001 ? "< .001 ***" : c.p_value.toFixed(3)}
                </td>
                <td className="px-2.5 py-1.5 text-right">
                  {c.tolerance ? c.tolerance.toFixed(3) : "-"}
                </td>
                <td className="px-2.5 py-1.5 text-right">
                  {c.vif ? c.vif.toFixed(3) : "-"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Hierarchical F-Change Card */}
      {result.f_change && (
        <div className="mt-3 p-2.5 rounded bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/60 text-[11px]">
          <div className="font-semibold text-zinc-700 dark:text-zinc-300 mb-1 flex items-center justify-between">
            <span>Hierarchical Model Summary &amp; F-Change Test</span>
            <span
              className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                result.f_change.p_change < 0.05
                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
                  : "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
              }`}
            >
              {result.f_change.p_change < 0.05
                ? "Significant ΔR² (p < .05)"
                : "Non-Significant ΔR² (p ≥ .05)"}
            </span>
          </div>
          <div className="text-zinc-600 dark:text-zinc-400 font-mono text-[10px] flex flex-wrap gap-4">
            <span>R² Change (ΔR²): {result.f_change.r2_change.toFixed(3)}</span>
            <span>F Change: {result.f_change.f_change.toFixed(2)}</span>
            <span>df1: {result.f_change.df1}</span>
            <span>df2: {result.f_change.df2}</span>
            <span>
              Sig. F Change:{" "}
              {result.f_change.p_change < 0.001
                ? "< .001 ***"
                : result.f_change.p_change.toFixed(3)}
            </span>
          </div>
        </div>
      )}

      {/* Collinearity Diagnostics Table */}
      {result.collinearity_diagnostics &&
        result.collinearity_diagnostics.length > 0 && (
          <div className="mt-3 border border-zinc-200 dark:border-zinc-800 rounded overflow-x-auto text-[11px]">
            <div className="px-2.5 py-1.5 font-semibold bg-zinc-50 dark:bg-zinc-800/60 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
              <span>Collinearity Diagnostics (Belsley et al.)</span>
              <span className="text-[10px] font-normal text-zinc-500">
                Condition Index: &gt;15 moderate, &gt;30 severe collinearity
              </span>
            </div>
            <table className="w-full text-left border-collapse font-mono">
              <thead className="border-b border-zinc-200 dark:border-zinc-800 text-[10px] text-zinc-500 font-sans">
                <tr>
                  <th className="px-2.5 py-1.5 font-semibold">Dimension</th>
                  <th className="px-2.5 py-1.5 font-semibold text-right">
                    Eigenvalue
                  </th>
                  <th className="px-2.5 py-1.5 font-semibold text-right">
                    Condition Index
                  </th>
                  <th className="px-2.5 py-1.5 font-semibold text-right">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {result.collinearity_diagnostics.map((cd) => (
                  <tr
                    key={cd.dimension}
                    className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30"
                  >
                    <td className="px-2.5 py-1.5 font-sans font-medium">
                      {cd.dimension}
                    </td>
                    <td className="px-2.5 py-1.5 text-right">
                      {cd.eigenvalue.toFixed(4)}
                    </td>
                    <td className="px-2.5 py-1.5 text-right font-semibold">
                      {cd.condition_index.toFixed(2)}
                    </td>
                    <td className="px-2.5 py-1.5 text-right font-sans">
                      {cd.condition_index >= 30 ? (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300">
                          Severe (CI ≥ 30)
                        </span>
                      ) : cd.condition_index >= 15 ? (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300">
                          Moderate (CI ≥ 15)
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                          Clear
                        </span>
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
