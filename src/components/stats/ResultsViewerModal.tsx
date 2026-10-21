import React, { useState, useMemo } from "react";
import {
  X,
  Copy,
  Check,
  FileText,
  Table,
  CheckCircle,
  Sparkles,
  Ruler,
  Tag,
} from "lucide-react";
import { AnalysisResult, TableStyle } from "../../types/stats";

export interface ResultsViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  result: AnalysisResult | null;
  onInsertLatex: (tableCode: string) => void;
}

export const ResultsViewerModal: React.FC<ResultsViewerModalProps> = ({
  isOpen,
  onClose,
  result,
  onInsertLatex,
}) => {
  const [copied, setCopied] = useState(false);
  const [inserted, setInserted] = useState(false);
  const [tableStyle, setTableStyle] = useState<TableStyle>("apa");

  const activeTableCode = useMemo(() => {
    if (!result) return "";
    if (result.latex_tables && result.latex_tables[tableStyle]) {
      return result.latex_tables[tableStyle];
    }
    return result.latex_table || "";
  }, [result, tableStyle]);

  if (!isOpen || !result) return null;

  const handleCopyLatex = async () => {
    if (!activeTableCode) return;
    try {
      await navigator.clipboard.writeText(activeTableCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  const handleInsert = () => {
    if (!activeTableCode) return;
    onInsertLatex(activeTableCode);
    setInserted(true);
    setTimeout(() => {
      setInserted(false);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-2xl w-full max-w-3xl flex flex-col max-h-[88vh] overflow-hidden text-zinc-900 dark:text-zinc-100 text-xs">
        {/* Header */}
        <div className="px-4 py-2.5 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50 dark:bg-zinc-950">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-indigo-500" />
            <h2 className="text-xs font-semibold tracking-tight capitalize text-zinc-800 dark:text-zinc-200">
              {result.analysis_type} Analysis Results
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body content */}
        <div className="flex-1 p-3.5 overflow-y-auto space-y-3.5">
          {/* Summary Cards */}
          {result.analysis_type === "regression" && (
            <div>
              {/* Compact Inline Summary Metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
                <div className="p-2 rounded bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/60">
                  <div className="text-[10px] font-medium text-zinc-500 uppercase">
                    Multiple R
                  </div>
                  <div className="text-sm font-bold text-indigo-600 dark:text-indigo-400">
                    {result.r.toFixed(3)}
                  </div>
                </div>
                <div className="p-2 rounded bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/60">
                  <div className="text-[10px] font-medium text-zinc-500 uppercase">
                    R Squared (R²)
                  </div>
                  <div className="text-sm font-bold text-indigo-600 dark:text-indigo-400">
                    {result.r_squared.toFixed(3)}
                  </div>
                </div>
                <div className="p-2 rounded bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/60">
                  <div className="text-[10px] font-medium text-zinc-500 uppercase">
                    F-Statistic
                  </div>
                  <div className="text-sm font-bold">
                    {result.f_statistic.toFixed(2)}{" "}
                    <span className="text-[9px] font-normal text-zinc-500">
                      (p{" "}
                      {result.f_p_value < 0.001
                        ? "< .001"
                        : `= ${result.f_p_value.toFixed(3)}`}
                      )
                    </span>
                  </div>
                </div>
                <div className="p-2 rounded bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/60">
                  <div className="text-[10px] font-medium text-zinc-500 uppercase">
                    Durbin-Watson
                  </div>
                  <div className="text-sm font-bold">
                    {result.durbin_watson !== null &&
                    result.durbin_watson !== undefined
                      ? result.durbin_watson.toFixed(2)
                      : "N/A"}
                  </div>
                </div>
              </div>

              <div className="border border-zinc-200 dark:border-zinc-800 rounded overflow-x-auto text-[11px]">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-zinc-50 dark:bg-zinc-800/60 border-b border-zinc-200 dark:border-zinc-800">
                    <tr>
                      <th className="px-2.5 py-1.5 font-semibold">Predictor</th>
                      <th className="px-2.5 py-1.5 font-semibold text-right">
                        B
                      </th>
                      <th className="px-2.5 py-1.5 font-semibold text-right">
                        Std. Error
                      </th>
                      <th className="px-2.5 py-1.5 font-semibold text-right">
                        Beta (β)
                      </th>
                      <th className="px-2.5 py-1.5 font-semibold text-right">
                        t
                      </th>
                      <th className="px-2.5 py-1.5 font-semibold text-right">
                        Sig. (p)
                      </th>
                      <th className="px-2.5 py-1.5 font-semibold text-right">
                        Tolerance
                      </th>
                      <th className="px-2.5 py-1.5 font-semibold text-right">
                        VIF
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                    {result.coefficients.map((c) => (
                      <tr
                        key={c.variable}
                        className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30"
                      >
                        <td className="px-2.5 py-1.5 font-medium">
                          {c.variable}
                        </td>
                        <td className="px-2.5 py-1.5 text-right">
                          {c.b.toFixed(3)}
                        </td>
                        <td className="px-2.5 py-1.5 text-right">
                          {c.std_err.toFixed(3)}
                        </td>
                        <td className="px-2.5 py-1.5 text-right">
                          {c.variable === "(Constant)"
                            ? "-"
                            : c.beta.toFixed(3)}
                        </td>
                        <td className="px-2.5 py-1.5 text-right">
                          {c.t.toFixed(3)}
                        </td>
                        <td className="px-2.5 py-1.5 text-right font-medium">
                          {c.p_value < 0.001
                            ? "< .001 ***"
                            : c.p_value.toFixed(3)}
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
            </div>
          )}

          {result.analysis_type === "descriptive" && (
            <div className="space-y-3">
              <div className="border border-zinc-200 dark:border-zinc-800 rounded overflow-x-auto text-[11px]">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-zinc-50 dark:bg-zinc-800/60 border-b border-zinc-200 dark:border-zinc-800">
                    <tr>
                      <th className="px-2.5 py-1.5 font-semibold">Variable</th>
                      <th className="px-2.5 py-1.5 font-semibold">Scale</th>
                      <th className="px-2.5 py-1.5 font-semibold text-right">
                        N
                      </th>
                      <th className="px-2.5 py-1.5 font-semibold text-right">
                        Mean
                      </th>
                      <th className="px-2.5 py-1.5 font-semibold text-right">
                        Std. Dev
                      </th>
                      <th className="px-2.5 py-1.5 font-semibold text-right">
                        Median
                      </th>
                      <th className="px-2.5 py-1.5 font-semibold text-right">
                        Min
                      </th>
                      <th className="px-2.5 py-1.5 font-semibold text-right">
                        Max
                      </th>
                      <th className="px-2.5 py-1.5 font-semibold text-right">
                        IQR
                      </th>
                      <th className="px-2.5 py-1.5 font-semibold text-right">
                        CV
                      </th>
                      <th className="px-2.5 py-1.5 font-semibold text-right">
                        Skewness
                      </th>
                      <th className="px-2.5 py-1.5 font-semibold text-right">
                        Shapiro-Wilk (p)
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                    {result.results.map((r) => {
                      const isNominal =
                        r.scale === "nominal" || r.mean === null;
                      return (
                        <tr
                          key={r.variable}
                          className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30"
                        >
                          <td className="px-2.5 py-1.5 font-medium">
                            {r.variable}
                          </td>
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
                          <td className="px-2.5 py-1.5 text-right">{r.n}</td>
                          {isNominal ? (
                            <td
                              colSpan={9}
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
                              <td className="px-2.5 py-1.5 text-right">
                                {r.mean?.toFixed(2)}
                              </td>
                              <td className="px-2.5 py-1.5 text-right">
                                {r.std?.toFixed(2)}
                              </td>
                              <td className="px-2.5 py-1.5 text-right">
                                {r.median?.toFixed(2)}
                              </td>
                              <td className="px-2.5 py-1.5 text-right">
                                {r.min?.toFixed(2)}
                              </td>
                              <td className="px-2.5 py-1.5 text-right">
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
                              <td className="px-2.5 py-1.5 text-right">
                                {r.skewness?.toFixed(2)}
                              </td>
                              <td className="px-2.5 py-1.5 text-right">
                                {r.shapiro_p !== null &&
                                r.shapiro_p !== undefined
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
              {result.results
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
                          <span className="font-semibold">{f.value}</span>:{" "}
                          {f.count} ({f.percentage}%)
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
            </div>
          )}

          {result.analysis_type === "reliability" && (
            <div>
              <div className="p-2.5 rounded bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900/60 flex items-center justify-between mb-3">
                <div>
                  <div className="text-[10px] font-semibold uppercase text-indigo-600 dark:text-indigo-400">
                    Cronbach's Alpha (α)
                  </div>
                  <div className="text-lg font-black text-indigo-700 dark:text-indigo-300">
                    {result.cronbach_alpha.toFixed(3)}
                  </div>
                </div>
                <div className="text-[10px] text-right text-zinc-500">
                  <div>Items: {result.items_count}</div>
                  <div>Sample (N): {result.sample_size}</div>
                </div>
              </div>

              <div className="border border-zinc-200 dark:border-zinc-800 rounded overflow-x-auto text-[11px]">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-zinc-50 dark:bg-zinc-800/60 border-b border-zinc-200 dark:border-zinc-800">
                    <tr>
                      <th className="px-2.5 py-1.5 font-semibold">
                        Scale Item
                      </th>
                      <th className="px-2.5 py-1.5 font-semibold text-right">
                        Mean
                      </th>
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
                    {result.item_stats.map((it) => (
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
          )}

          {result.analysis_type === "manova" && (
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
                  {result.tests.map((t) => (
                    <tr
                      key={t.test_name}
                      className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30"
                    >
                      <td className="px-2.5 py-1.5 font-medium">
                        {t.test_name}
                      </td>
                      <td className="px-2.5 py-1.5 text-right">
                        {t.value.toFixed(3)}
                      </td>
                      <td className="px-2.5 py-1.5 text-right">
                        {t.f_stat.toFixed(3)}
                      </td>
                      <td className="px-2.5 py-1.5 text-right">{t.num_df}</td>
                      <td className="px-2.5 py-1.5 text-right">{t.den_df}</td>
                      <td className="px-2.5 py-1.5 text-right font-medium">
                        {t.p_value < 0.001
                          ? "< .001 ***"
                          : t.p_value.toFixed(3)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {result.analysis_type === "pca" && (
            <div>
              <div className="grid grid-cols-2 gap-2 mb-3">
                <div className="p-2 rounded bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/60">
                  <div className="text-[10px] font-medium text-zinc-500 uppercase">
                    Components Extracted
                  </div>
                  <div className="text-sm font-bold">{result.n_components}</div>
                </div>
                <div className="p-2 rounded bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/60">
                  <div className="text-[10px] font-medium text-zinc-500 uppercase">
                    Total Variance Explained
                  </div>
                  <div className="text-sm font-bold text-indigo-600 dark:text-indigo-400">
                    {(
                      result.explained_variance_ratio.reduce(
                        (a, b) => a + b,
                        0,
                      ) * 100
                    ).toFixed(1)}
                    %
                  </div>
                </div>
              </div>

              <div className="border border-zinc-200 dark:border-zinc-800 rounded overflow-x-auto text-[11px]">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-zinc-50 dark:bg-zinc-800/60 border-b border-zinc-200 dark:border-zinc-800">
                    <tr>
                      <th className="px-2.5 py-1.5 font-semibold">Variable</th>
                      {result.explained_variance_ratio.map((_, i) => (
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
                    {result.loadings.map((l) => (
                      <tr
                        key={l.variable}
                        className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30"
                      >
                        <td className="px-2.5 py-1.5 font-medium">
                          {l.variable}
                        </td>
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
          )}

          {/* ONE-SAMPLE T-TEST */}
          {result.analysis_type === "ttest_one_sample" && (
            <div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
                <div className="p-2 rounded bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/60">
                  <div className="text-[10px] font-medium text-zinc-500 uppercase">
                    Sample Mean
                  </div>
                  <div className="text-sm font-bold text-indigo-600 dark:text-indigo-400">
                    {result.mean.toFixed(2)}
                  </div>
                </div>
                <div className="p-2 rounded bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/60">
                  <div className="text-[10px] font-medium text-zinc-500 uppercase">
                    Test Value
                  </div>
                  <div className="text-sm font-bold">{result.test_value}</div>
                </div>
                <div className="p-2 rounded bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/60">
                  <div className="text-[10px] font-medium text-zinc-500 uppercase">
                    t ({result.df})
                  </div>
                  <div className="text-sm font-bold">
                    {result.t_statistic.toFixed(3)}{" "}
                    <span className="text-[9px] font-normal text-zinc-500">
                      (p{" "}
                      {result.p_value < 0.001
                        ? "< .001"
                        : `= ${result.p_value.toFixed(3)}`}
                      )
                    </span>
                  </div>
                </div>
                <div className="p-2 rounded bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/60">
                  <div className="text-[10px] font-medium text-zinc-500 uppercase">
                    Cohen's d
                  </div>
                  <div className="text-sm font-bold">
                    {result.cohen_d.toFixed(2)}
                  </div>
                </div>
              </div>

              <div className="border border-zinc-200 dark:border-zinc-800 rounded overflow-x-auto text-[11px]">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-zinc-50 dark:bg-zinc-800/60 border-b border-zinc-200 dark:border-zinc-800">
                    <tr>
                      <th className="px-2.5 py-1.5 font-semibold">Variable</th>
                      <th className="px-2.5 py-1.5 font-semibold text-right">
                        N
                      </th>
                      <th className="px-2.5 py-1.5 font-semibold text-right">
                        M
                      </th>
                      <th className="px-2.5 py-1.5 font-semibold text-right">
                        SD
                      </th>
                      <th className="px-2.5 py-1.5 font-semibold text-right">
                        Mean Diff
                      </th>
                      <th className="px-2.5 py-1.5 font-semibold text-right">
                        95% CI
                      </th>
                      <th className="px-2.5 py-1.5 font-semibold text-right">
                        t
                      </th>
                      <th className="px-2.5 py-1.5 font-semibold text-right">
                        df
                      </th>
                      <th className="px-2.5 py-1.5 font-semibold text-right">
                        Sig. (p)
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30">
                      <td className="px-2.5 py-1.5 font-medium">
                        {result.variable}
                      </td>
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
                        [{result.ci_95_lower.toFixed(2)},{" "}
                        {result.ci_95_upper.toFixed(2)}]
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
            </div>
          )}

          {/* INDEPENDENT SAMPLES T-TEST */}
          {result.analysis_type === "ttest_independent" && (
            <div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 mb-3">
                <div className="p-2 rounded bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/60">
                  <div className="text-[10px] font-medium text-zinc-500 uppercase">
                    {result.group1.name} (N={result.group1.n})
                  </div>
                  <div className="text-sm font-bold text-indigo-600 dark:text-indigo-400">
                    {result.group1.mean.toFixed(2)}{" "}
                    <span className="text-[9px] font-normal text-zinc-500">
                      ±{result.group1.std.toFixed(2)}
                    </span>
                  </div>
                </div>
                <div className="p-2 rounded bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/60">
                  <div className="text-[10px] font-medium text-zinc-500 uppercase">
                    {result.group2.name} (N={result.group2.n})
                  </div>
                  <div className="text-sm font-bold text-indigo-600 dark:text-indigo-400">
                    {result.group2.mean.toFixed(2)}{" "}
                    <span className="text-[9px] font-normal text-zinc-500">
                      ±{result.group2.std.toFixed(2)}
                    </span>
                  </div>
                </div>
                <div className="p-2 rounded bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/60">
                  <div className="text-[10px] font-medium text-zinc-500 uppercase">
                    Levene's Test (F)
                  </div>
                  <div className="text-sm font-bold">
                    {result.levene_f.toFixed(2)}{" "}
                    <span className="text-[9px] font-normal text-zinc-500">
                      (p{" "}
                      {result.levene_p < 0.001
                        ? "< .001"
                        : `= ${result.levene_p.toFixed(3)}`}
                      )
                    </span>
                  </div>
                </div>
                <div className="p-2 rounded bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/60">
                  <div className="text-[10px] font-medium text-zinc-500 uppercase">
                    Cohen's d
                  </div>
                  <div className="text-sm font-bold">
                    {result.equal_var.cohen_d.toFixed(2)}
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

              <div className="border border-zinc-200 dark:border-zinc-800 rounded overflow-x-auto text-[11px]">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-zinc-50 dark:bg-zinc-800/60 border-b border-zinc-200 dark:border-zinc-800">
                    <tr>
                      <th className="px-2.5 py-1.5 font-semibold">
                        Variance Assumption
                      </th>
                      <th className="px-2.5 py-1.5 font-semibold text-right">
                        t
                      </th>
                      <th className="px-2.5 py-1.5 font-semibold text-right">
                        df
                      </th>
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
            </div>
          )}

          {/* PAIRED SAMPLES T-TEST */}
          {result.analysis_type === "ttest_paired" && (
            <div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
                <div className="p-2 rounded bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/60">
                  <div className="text-[10px] font-medium text-zinc-500 uppercase">
                    {result.var1} Mean
                  </div>
                  <div className="text-sm font-bold text-indigo-600 dark:text-indigo-400">
                    {result.mean1.toFixed(2)}
                  </div>
                </div>
                <div className="p-2 rounded bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/60">
                  <div className="text-[10px] font-medium text-zinc-500 uppercase">
                    {result.var2} Mean
                  </div>
                  <div className="text-sm font-bold text-indigo-600 dark:text-indigo-400">
                    {result.mean2.toFixed(2)}
                  </div>
                </div>
                <div className="p-2 rounded bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/60">
                  <div className="text-[10px] font-medium text-zinc-500 uppercase">
                    Paired Correlation (r)
                  </div>
                  <div className="text-sm font-bold">
                    {result.correlation.toFixed(3)}
                  </div>
                </div>
                <div className="p-2 rounded bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/60">
                  <div className="text-[10px] font-medium text-zinc-500 uppercase">
                    Cohen's d (dz)
                  </div>
                  <div className="text-sm font-bold">
                    {result.cohen_d.toFixed(2)}
                  </div>
                </div>
              </div>

              <div className="border border-zinc-200 dark:border-zinc-800 rounded overflow-x-auto text-[11px]">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-zinc-50 dark:bg-zinc-800/60 border-b border-zinc-200 dark:border-zinc-800">
                    <tr>
                      <th className="px-2.5 py-1.5 font-semibold">
                        Pair Comparison
                      </th>
                      <th className="px-2.5 py-1.5 font-semibold text-right">
                        Pairs (N)
                      </th>
                      <th className="px-2.5 py-1.5 font-semibold text-right">
                        Mean Diff
                      </th>
                      <th className="px-2.5 py-1.5 font-semibold text-right">
                        t
                      </th>
                      <th className="px-2.5 py-1.5 font-semibold text-right">
                        df
                      </th>
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
            </div>
          )}

          {/* ONE-WAY ANOVA */}
          {result.analysis_type === "anova_oneway" && (
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
                  <div className="text-sm font-bold">
                    {result.p_value < 0.001
                      ? "< .001 ***"
                      : result.p_value.toFixed(3)}
                  </div>
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
                      <th className="px-2.5 py-1.5 font-semibold text-right">
                        SS
                      </th>
                      <th className="px-2.5 py-1.5 font-semibold text-right">
                        df
                      </th>
                      <th className="px-2.5 py-1.5 font-semibold text-right">
                        MS
                      </th>
                      <th className="px-2.5 py-1.5 font-semibold text-right">
                        F
                      </th>
                      <th className="px-2.5 py-1.5 font-semibold text-right">
                        Sig. (p)
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                    <tr className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30">
                      <td className="px-2.5 py-1.5 font-medium">
                        Between Groups
                      </td>
                      <td className="px-2.5 py-1.5 text-right">
                        {result.ss_between.toFixed(2)}
                      </td>
                      <td className="px-2.5 py-1.5 text-right">
                        {result.df_between}
                      </td>
                      <td className="px-2.5 py-1.5 text-right">
                        {result.ms_between.toFixed(2)}
                      </td>
                      <td className="px-2.5 py-1.5 text-right font-medium">
                        {result.f_statistic.toFixed(3)}
                      </td>
                      <td className="px-2.5 py-1.5 text-right font-medium">
                        {result.p_value < 0.001
                          ? "< .001 ***"
                          : result.p_value.toFixed(3)}
                      </td>
                    </tr>
                    <tr className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30">
                      <td className="px-2.5 py-1.5 font-medium">
                        Within Groups (Error)
                      </td>
                      <td className="px-2.5 py-1.5 text-right">
                        {result.ss_within.toFixed(2)}
                      </td>
                      <td className="px-2.5 py-1.5 text-right">
                        {result.df_within}
                      </td>
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
                      <td className="px-2.5 py-1.5 text-right">
                        {result.df_total}
                      </td>
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
                        <th className="px-2.5 py-1 font-semibold text-right">
                          p-adj
                        </th>
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
                          <td className="px-2.5 py-1 font-medium">
                            {t.group1}
                          </td>
                          <td className="px-2.5 py-1 font-medium">
                            {t.group2}
                          </td>
                          <td className="px-2.5 py-1 text-right">
                            {t.mean_diff.toFixed(2)}
                          </td>
                          <td className="px-2.5 py-1 text-right font-medium">
                            {t.p_value < 0.001
                              ? "< .001"
                              : t.p_value.toFixed(3)}
                          </td>
                          <td className="px-2.5 py-1 text-center font-bold">
                            {t.reject ? (
                              <span className="text-emerald-600 dark:text-emerald-400">
                                Yes *
                              </span>
                            ) : (
                              <span className="text-zinc-400 font-normal">
                                No
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
          )}

          {/* TWO-WAY ANOVA */}
          {result.analysis_type === "anova_twoway" && (
            <div>
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
                      <th className="px-2.5 py-1.5 font-semibold text-right">
                        df
                      </th>
                      <th className="px-2.5 py-1.5 font-semibold text-right">
                        MS
                      </th>
                      <th className="px-2.5 py-1.5 font-semibold text-right">
                        F
                      </th>
                      <th className="px-2.5 py-1.5 font-semibold text-right">
                        Sig. (p)
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                    {result.effects.map((e) => (
                      <tr
                        key={e.source}
                        className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30"
                      >
                        <td className="px-2.5 py-1.5 font-medium">
                          {e.source}
                        </td>
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
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ANCOVA */}
          {result.analysis_type === "ancova" && (
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
                      <th className="px-2.5 py-1.5 font-semibold text-right">
                        df
                      </th>
                      <th className="px-2.5 py-1.5 font-semibold text-right">
                        MS
                      </th>
                      <th className="px-2.5 py-1.5 font-semibold text-right">
                        F
                      </th>
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
                        <td className="px-2.5 py-1.5 font-medium">
                          {e.source}
                        </td>
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
                          {e.f_statistic !== null
                            ? e.f_statistic.toFixed(3)
                            : "-"}
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
                      <th className="px-2.5 py-1.5 font-semibold text-right">
                        N
                      </th>
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
          )}

          {/* CORRELATIONS (PEARSON & SPEARMAN) */}
          {(result.analysis_type === "correlation_pearson" ||
            result.analysis_type === "correlation_spearman") && (
            <div>
              <div className="border border-zinc-200 dark:border-zinc-800 rounded overflow-x-auto text-[11px]">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-zinc-50 dark:bg-zinc-800/60 border-b border-zinc-200 dark:border-zinc-800">
                    <tr>
                      <th className="px-2.5 py-1.5 font-semibold">Variable</th>
                      {result.variables.map((v, i) => (
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
                    {result.matrix.map((row, i) => (
                      <tr
                        key={row.variable}
                        className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30"
                      >
                        <td className="px-2.5 py-1.5 font-medium">
                          ({i + 1}) {row.variable}
                        </td>
                        {row.correlations.map((cell, j) => {
                          const val =
                            cell.r !== undefined ? cell.r : (cell.rho ?? 0);
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
          )}

          {/* MANN-WHITNEY U */}
          {result.analysis_type === "mann_whitney_u" && (
            <div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
                <div className="p-2 rounded bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/60">
                  <div className="text-[10px] font-medium text-zinc-500 uppercase">
                    Mann-Whitney U
                  </div>
                  <div className="text-sm font-bold text-indigo-600 dark:text-indigo-400">
                    {result.u_statistic.toFixed(1)}
                  </div>
                </div>
                <div className="p-2 rounded bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/60">
                  <div className="text-[10px] font-medium text-zinc-500 uppercase">
                    Wilcoxon W
                  </div>
                  <div className="text-sm font-bold">
                    {result.w_statistic.toFixed(1)}
                  </div>
                </div>
                <div className="p-2 rounded bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/60">
                  <div className="text-[10px] font-medium text-zinc-500 uppercase">
                    Z-Score
                  </div>
                  <div className="text-sm font-bold">
                    {result.z_score.toFixed(3)}
                  </div>
                </div>
                <div className="p-2 rounded bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/60">
                  <div className="text-[10px] font-medium text-zinc-500 uppercase">
                    Asymp. Sig. (p)
                  </div>
                  <div className="text-sm font-bold">
                    {result.p_value < 0.001
                      ? "< .001 ***"
                      : result.p_value.toFixed(3)}
                  </div>
                </div>
              </div>

              <div className="border border-zinc-200 dark:border-zinc-800 rounded overflow-x-auto text-[11px]">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-zinc-50 dark:bg-zinc-800/60 border-b border-zinc-200 dark:border-zinc-800">
                    <tr>
                      <th className="px-2.5 py-1.5 font-semibold">Group</th>
                      <th className="px-2.5 py-1.5 font-semibold text-right">
                        N
                      </th>
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
                    <tr className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30">
                      <td className="px-2.5 py-1.5 font-medium">
                        {result.group1.name}
                      </td>
                      <td className="px-2.5 py-1.5 text-right">
                        {result.group1.n}
                      </td>
                      <td className="px-2.5 py-1.5 text-right">
                        {result.group1.median.toFixed(2)}
                      </td>
                      <td className="px-2.5 py-1.5 text-right font-medium">
                        {result.group1.mean_rank.toFixed(2)}
                      </td>
                      <td className="px-2.5 py-1.5 text-right">
                        {result.group1.sum_ranks.toFixed(1)}
                      </td>
                    </tr>
                    <tr className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30">
                      <td className="px-2.5 py-1.5 font-medium">
                        {result.group2.name}
                      </td>
                      <td className="px-2.5 py-1.5 text-right">
                        {result.group2.n}
                      </td>
                      <td className="px-2.5 py-1.5 text-right">
                        {result.group2.median.toFixed(2)}
                      </td>
                      <td className="px-2.5 py-1.5 text-right font-medium">
                        {result.group2.mean_rank.toFixed(2)}
                      </td>
                      <td className="px-2.5 py-1.5 text-right">
                        {result.group2.sum_ranks.toFixed(1)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* WILCOXON SIGNED-RANK */}
          {result.analysis_type === "wilcoxon_signed_rank" && (
            <div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
                <div className="p-2 rounded bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/60">
                  <div className="text-[10px] font-medium text-zinc-500 uppercase">
                    Wilcoxon W
                  </div>
                  <div className="text-sm font-bold text-indigo-600 dark:text-indigo-400">
                    {result.w_statistic.toFixed(1)}
                  </div>
                </div>
                <div className="p-2 rounded bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/60">
                  <div className="text-[10px] font-medium text-zinc-500 uppercase">
                    Z-Score
                  </div>
                  <div className="text-sm font-bold">
                    {result.z_score.toFixed(3)}
                  </div>
                </div>
                <div className="p-2 rounded bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/60">
                  <div className="text-[10px] font-medium text-zinc-500 uppercase">
                    p-Value
                  </div>
                  <div className="text-sm font-bold">
                    {result.p_value < 0.001
                      ? "< .001 ***"
                      : result.p_value.toFixed(3)}
                  </div>
                </div>
                <div className="p-2 rounded bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/60">
                  <div className="text-[10px] font-medium text-zinc-500 uppercase">
                    Pairs (+ / -)
                  </div>
                  <div className="text-sm font-bold">
                    {result.positive_pairs} / {result.negative_pairs} (N=
                    {result.n_effective})
                  </div>
                </div>
              </div>

              <div className="border border-zinc-200 dark:border-zinc-800 rounded p-2.5 bg-zinc-50 dark:bg-zinc-950/40 text-[11px]">
                <div className="flex items-center justify-between">
                  <span>
                    Median {result.var1}:{" "}
                    <strong className="text-indigo-600 dark:text-indigo-400">
                      {result.median1.toFixed(2)}
                    </strong>
                  </span>
                  <span>
                    Median {result.var2}:{" "}
                    <strong className="text-indigo-600 dark:text-indigo-400">
                      {result.median2.toFixed(2)}
                    </strong>
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* KRUSKAL-WALLIS */}
          {result.analysis_type === "kruskal_wallis" && (
            <div>
              <div className="grid grid-cols-3 gap-2 mb-3">
                <div className="p-2 rounded bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/60">
                  <div className="text-[10px] font-medium text-zinc-500 uppercase">
                    Kruskal-Wallis H
                  </div>
                  <div className="text-sm font-bold text-indigo-600 dark:text-indigo-400">
                    {result.h_statistic.toFixed(3)}
                  </div>
                </div>
                <div className="p-2 rounded bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/60">
                  <div className="text-[10px] font-medium text-zinc-500 uppercase">
                    df
                  </div>
                  <div className="text-sm font-bold">{result.df}</div>
                </div>
                <div className="p-2 rounded bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/60">
                  <div className="text-[10px] font-medium text-zinc-500 uppercase">
                    Asymp. Sig. (p)
                  </div>
                  <div className="text-sm font-bold">
                    {result.p_value < 0.001
                      ? "< .001 ***"
                      : result.p_value.toFixed(3)}
                  </div>
                </div>
              </div>

              <div className="border border-zinc-200 dark:border-zinc-800 rounded overflow-x-auto text-[11px]">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-zinc-50 dark:bg-zinc-800/60 border-b border-zinc-200 dark:border-zinc-800">
                    <tr>
                      <th className="px-2.5 py-1.5 font-semibold">
                        Group ({result.group_variable})
                      </th>
                      <th className="px-2.5 py-1.5 font-semibold text-right">
                        N
                      </th>
                      <th className="px-2.5 py-1.5 font-semibold text-right">
                        Median
                      </th>
                      <th className="px-2.5 py-1.5 font-semibold text-right">
                        Mean Rank
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                    {result.groups.map((g) => (
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
          )}

          {/* CHI-SQUARE */}
          {result.analysis_type === "chisquare_independence" && (
            <div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
                <div className="p-2 rounded bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/60">
                  <div className="text-[10px] font-medium text-zinc-500 uppercase">
                    Chi-Square (χ²)
                  </div>
                  <div className="text-sm font-bold text-indigo-600 dark:text-indigo-400">
                    {result.chi2_statistic.toFixed(2)}
                  </div>
                </div>
                <div className="p-2 rounded bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/60">
                  <div className="text-[10px] font-medium text-zinc-500 uppercase">
                    df
                  </div>
                  <div className="text-sm font-bold">{result.df}</div>
                </div>
                <div className="p-2 rounded bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/60">
                  <div className="text-[10px] font-medium text-zinc-500 uppercase">
                    p-Value
                  </div>
                  <div className="text-sm font-bold">
                    {result.p_value < 0.001
                      ? "< .001 ***"
                      : result.p_value.toFixed(3)}
                  </div>
                </div>
                <div className="p-2 rounded bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/60">
                  <div className="text-[10px] font-medium text-zinc-500 uppercase">
                    Cramér's V
                  </div>
                  <div className="text-sm font-bold">
                    {result.cramers_v.toFixed(3)}
                  </div>
                </div>
              </div>

              {/* Contingency Table */}
              <div className="border border-zinc-200 dark:border-zinc-800 rounded overflow-x-auto text-[11px]">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-zinc-50 dark:bg-zinc-800/60 border-b border-zinc-200 dark:border-zinc-800">
                    <tr>
                      <th className="px-2.5 py-1.5 font-semibold">
                        {result.row_variable} \ {result.col_variable}
                      </th>
                      {result.col_labels.map((c) => (
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
                    {result.crosstab.map((row) => (
                      <tr
                        key={row.row}
                        className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30"
                      >
                        <td className="px-2.5 py-1.5 font-medium">{row.row}</td>
                        {row.cells.map((cell) => (
                          <td
                            key={cell.col}
                            className="px-2.5 py-1.5 text-right"
                          >
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
                {result.sample_size}.
              </div>
            </div>
          )}

          {/* LaTeX Code Preview Box */}
          <div className="border border-zinc-200 dark:border-zinc-800 rounded overflow-hidden bg-zinc-950 text-zinc-200">
            <div className="px-3 py-1.5 border-b border-zinc-800 flex items-center justify-between text-[11px] font-mono text-zinc-400 bg-zinc-900/60 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1.5 text-zinc-300 font-semibold">
                  <Table className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Table Style:</span>
                </span>
                <div className="flex items-center gap-1 bg-zinc-800/80 p-0.5 rounded border border-zinc-700/60">
                  <button
                    type="button"
                    onClick={() => setTableStyle("apa")}
                    className={`px-2 py-0.5 rounded text-[10px] font-medium transition ${
                      tableStyle === "apa"
                        ? "bg-indigo-600 text-white font-semibold shadow-xs"
                        : "text-zinc-400 hover:text-zinc-200"
                    }`}
                  >
                    APA 7th
                  </button>
                  <button
                    type="button"
                    onClick={() => setTableStyle("ieee")}
                    className={`px-2 py-0.5 rounded text-[10px] font-medium transition ${
                      tableStyle === "ieee"
                        ? "bg-indigo-600 text-white font-semibold shadow-xs"
                        : "text-zinc-400 hover:text-zinc-200"
                    }`}
                  >
                    IEEE Style
                  </button>
                  <button
                    type="button"
                    onClick={() => setTableStyle("classic")}
                    className={`px-2 py-0.5 rounded text-[10px] font-medium transition ${
                      tableStyle === "classic"
                        ? "bg-indigo-600 text-white font-semibold shadow-xs"
                        : "text-zinc-400 hover:text-zinc-200"
                    }`}
                  >
                    Classic
                  </button>
                </div>
              </div>
              <button
                onClick={handleCopyLatex}
                className="flex items-center gap-1 text-zinc-300 hover:text-white transition"
              >
                {copied ? (
                  <Check className="w-3 h-3 text-emerald-400" />
                ) : (
                  <Copy className="w-3 h-3" />
                )}
                {copied ? "Copied" : "Copy Code"}
              </button>
            </div>
            <pre className="p-3 text-[10px] font-mono overflow-x-auto leading-relaxed text-zinc-300 max-h-40">
              {activeTableCode}
            </pre>
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 py-2 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50 dark:bg-zinc-950">
          <div className="text-[10px] text-zinc-400">
            {tableStyle === "apa" && (
              <span>
                APA 7th publication-ready format with{" "}
                <code className="text-indigo-600 dark:text-indigo-400">
                  booktabs
                </code>
              </span>
            )}
            {tableStyle === "ieee" && (
              <span>
                IEEE Transactions format with{" "}
                <code className="text-indigo-600 dark:text-indigo-400">
                  small caps &amp; technical metrics
                </code>
              </span>
            )}
            {tableStyle === "classic" && (
              <span>
                Standard LaTeX bordered format with{" "}
                <code className="text-indigo-600 dark:text-indigo-400">
                  \hline &amp; vertical borders
                </code>
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyLatex}
              className="px-2.5 py-1 text-[11px] font-medium rounded border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 transition flex items-center gap-1"
            >
              {copied ? (
                <Check className="w-3 h-3 text-emerald-500" />
              ) : (
                <Copy className="w-3 h-3" />
              )}
              {copied ? "Copied!" : "Copy LaTeX"}
            </button>
            <button
              onClick={handleInsert}
              className="px-3 py-1 text-[11px] font-medium rounded bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-1 shadow-xs transition"
            >
              {inserted ? (
                <CheckCircle className="w-3 h-3" />
              ) : (
                <FileText className="w-3 h-3" />
              )}
              {inserted ? "Inserted to Document!" : "Insert to LaTeX Document"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
