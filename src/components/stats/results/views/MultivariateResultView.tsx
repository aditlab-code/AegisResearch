import React from "react";
import {
  AnalysisResult,
  ManovaResponse,
  PcaResponse,
} from "../../../../types/stats";

export interface MultivariateResultViewProps {
  result: AnalysisResult;
}

export const MultivariateResultView: React.FC<MultivariateResultViewProps> = ({
  result,
}) => {
  if (result.analysis_type === "manova") {
    const manova = result as ManovaResponse;
    return (
      <div className="space-y-3">
        <div className="border border-zinc-200 dark:border-zinc-800 rounded overflow-x-auto text-[11px]">
          <table className="w-full text-left border-collapse">
            <thead className="bg-zinc-50 dark:bg-zinc-800/60 border-b border-zinc-200 dark:border-zinc-800">
              <tr>
                <th className="px-2.5 py-1.5 font-semibold">
                  Multivariate Test
                </th>
                <th className="px-2.5 py-1.5 font-semibold text-right">
                  Value
                </th>
                <th className="px-2.5 py-1.5 font-semibold text-right">
                  F-Value
                </th>
                <th className="px-2.5 py-1.5 font-semibold text-right">
                  Num df
                </th>
                <th className="px-2.5 py-1.5 font-semibold text-right">
                  Den df
                </th>
                <th className="px-2.5 py-1.5 font-semibold text-right">
                  Sig. (p)
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {manova.tests.map((t) => (
                <tr
                  key={t.test_name}
                  className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30"
                >
                  <td className="px-2.5 py-1.5 font-medium">{t.test_name}</td>
                  <td className="px-2.5 py-1.5 text-right">
                    {t.value.toFixed(3)}
                  </td>
                  <td className="px-2.5 py-1.5 text-right">
                    {t.f_stat.toFixed(3)}
                  </td>
                  <td className="px-2.5 py-1.5 text-right">{t.num_df}</td>
                  <td className="px-2.5 py-1.5 text-right">{t.den_df}</td>
                  <td className="px-2.5 py-1.5 text-right font-medium">
                    {t.p_value < 0.001 ? "< .001 ***" : t.p_value.toFixed(3)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Box's M Test for Equality of Covariance Matrices */}
        {manova.box_m && (
          <div className="mt-3 p-2.5 rounded bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/60 text-[11px]">
            <div className="font-semibold text-zinc-700 dark:text-zinc-300 mb-1 flex items-center justify-between">
              <span>Box's M Test of Equality of Covariance Matrices</span>
              <span
                className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                  manova.box_m.assumption_met
                    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
                    : "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300"
                }`}
              >
                {manova.box_m.assumption_met
                  ? "Assumption Met (p ≥ .001)"
                  : "Covariances Unequal (p < .001)"}
              </span>
            </div>
            <div className="text-zinc-600 dark:text-zinc-400 font-mono text-[10px] flex gap-4">
              <span>Box's M: {manova.box_m.m_stat.toFixed(3)}</span>
              <span>Approx. χ²: {manova.box_m.chi2.toFixed(3)}</span>
              <span>df: {manova.box_m.df}</span>
              <span>
                Sig. (p):{" "}
                {manova.box_m.p_value < 0.001
                  ? "< .001"
                  : manova.box_m.p_value.toFixed(3)}
              </span>
            </div>
          </div>
        )}

        {/* MANOVA Group Descriptives */}
        {manova.group_descriptives && manova.group_descriptives.length > 0 && (
          <div className="mt-3 border border-zinc-200 dark:border-zinc-800 rounded overflow-x-auto text-[11px]">
            <div className="px-2.5 py-1.5 font-semibold bg-zinc-50 dark:bg-zinc-800/60 border-b border-zinc-200 dark:border-zinc-800">
              Descriptive Statistics per Group Level ({manova.factor})
            </div>
            <table className="w-full text-left border-collapse">
              <thead className="border-b border-zinc-200 dark:border-zinc-800 text-[10px] text-zinc-500">
                <tr>
                  <th className="px-2.5 py-1.5 font-semibold">Group Level</th>
                  <th className="px-2.5 py-1.5 font-semibold text-right">N</th>
                  {manova.dependents.map((dep) => (
                    <th
                      key={dep}
                      className="px-2.5 py-1.5 font-semibold text-right"
                    >
                      {dep} (M ± SD)
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800 font-mono">
                {manova.group_descriptives.map((gd) => (
                  <tr
                    key={gd.group}
                    className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30"
                  >
                    <td className="px-2.5 py-1.5 font-sans font-medium">
                      {gd.group}
                    </td>
                    <td className="px-2.5 py-1.5 text-right">{gd.n}</td>
                    {manova.dependents.map((dep) => {
                      const v = gd.variables[dep];
                      return (
                        <td key={dep} className="px-2.5 py-1.5 text-right">
                          {v
                            ? `${v.mean.toFixed(2)} ± ${v.std.toFixed(2)}`
                            : "-"}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  }

  if (result.analysis_type === "pca") {
    const pca = result as PcaResponse;
    const totalVariance = (
      pca.explained_variance_ratio.reduce((a, b) => a + b, 0) * 100
    ).toFixed(1);

    return (
      <div>
        <div className="grid grid-cols-2 gap-2 mb-3">
          <div className="p-2 rounded bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/60">
            <div className="text-[10px] font-medium text-zinc-500 uppercase">
              Components Extracted
            </div>
            <div className="text-sm font-bold">{pca.n_components}</div>
          </div>
          <div className="p-2 rounded bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/60">
            <div className="text-[10px] font-medium text-zinc-500 uppercase">
              Total Variance Explained
            </div>
            <div className="text-sm font-bold text-indigo-600 dark:text-indigo-400">
              {totalVariance}%
            </div>
          </div>
        </div>

        <div className="border border-zinc-200 dark:border-zinc-800 rounded overflow-x-auto text-[11px]">
          <table className="w-full text-left border-collapse">
            <thead className="bg-zinc-50 dark:bg-zinc-800/60 border-b border-zinc-200 dark:border-zinc-800">
              <tr>
                <th className="px-2.5 py-1.5 font-semibold">Variable</th>
                {pca.explained_variance_ratio.map((_, i) => (
                  <th
                    key={i}
                    className="px-2.5 py-1.5 font-semibold text-right"
                  >
                    Component {i + 1}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {pca.loadings.map((l) => (
                <tr
                  key={l.variable}
                  className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30"
                >
                  <td className="px-2.5 py-1.5 font-medium">{l.variable}</td>
                  {l.components.map((c, i) => (
                    <td key={i} className="px-2.5 py-1.5 text-right">
                      {c.toFixed(3)}
                    </td>
                  ))}
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
