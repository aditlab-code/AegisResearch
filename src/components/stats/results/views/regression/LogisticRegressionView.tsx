import React from "react";
import { LogisticRegressionResponse } from "../../../../../types/stats";

export interface LogisticRegressionViewProps {
  result: LogisticRegressionResponse;
}

export const LogisticRegressionView: React.FC<LogisticRegressionViewProps> = ({
  result,
}) => {
  const aucLabel =
    result.classification.auc >= 0.8
      ? "Good"
      : result.classification.auc >= 0.7
        ? "Fair"
        : "Poor";

  const logSummaryCards = [
    {
      label: "Sample Size (N)",
      value: result.sample_size,
      valClass: "text-violet-600 dark:text-violet-400",
    },
    {
      label: "Model Omnibus χ²",
      value: (
        <>
          {result.model_chi2.toFixed(2)}{" "}
          <span className="text-[9px] font-normal text-zinc-500">
            (df={result.model_chi2_df}, p{" "}
            {result.model_chi2_p < 0.001
              ? "< .001"
              : `= ${result.model_chi2_p.toFixed(3)}`}
            )
          </span>
        </>
      ),
    },
    {
      label: "Nagelkerke R²",
      value: (
        <>
          {result.pseudo_r2.nagelkerke.toFixed(3)}{" "}
          <span className="text-[9px] font-normal text-zinc-500">
            (McFadden: {result.pseudo_r2.mcfadden.toFixed(3)})
          </span>
        </>
      ),
      valClass: "text-violet-600 dark:text-violet-400",
    },
    {
      label: "ROC-AUC Score",
      value: (
        <>
          {result.classification.auc.toFixed(3)}{" "}
          <span className="text-[9px] font-normal text-zinc-500">
            ({aucLabel})
          </span>
        </>
      ),
      valClass: "text-emerald-600 dark:text-emerald-400",
    },
  ];

  const confMatrix = [
    {
      label: "True Positive (TP)",
      value: result.classification.tp,
      color: "text-emerald-600 dark:text-emerald-400",
    },
    {
      label: "True Negative (TN)",
      value: result.classification.tn,
      color: "text-emerald-600 dark:text-emerald-400",
    },
    {
      label: "False Positive (FP)",
      value: result.classification.fp,
      color: "text-red-500",
    },
    {
      label: "False Negative (FN)",
      value: result.classification.fn,
      color: "text-amber-500",
    },
  ];

  return (
    <div className="space-y-3">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {logSummaryCards.map((c, i) => (
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

      {/* Coding Meta */}
      <div className="flex items-center gap-4 px-2.5 py-1.5 rounded bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-800 text-[11px]">
        <span>
          <strong>Target Dependent:</strong> {result.dependent}
        </span>
        <span>
          <strong>Reference (0):</strong> {result.reference_category}
        </span>
        <span>
          <strong>Event (1):</strong> {result.event_category}
        </span>
        <span>
          <strong>Deviance (-2LL):</strong> {result.deviance.toFixed(2)}
        </span>
        <span>
          <strong>AIC:</strong> {result.aic.toFixed(2)}
        </span>
      </div>

      {/* Variables in the Equation Table */}
      <div className="border border-zinc-200 dark:border-zinc-800 rounded overflow-x-auto text-[11px]">
        <div className="px-2.5 py-1.5 font-semibold bg-zinc-50 dark:bg-zinc-800/60 border-b border-zinc-200 dark:border-zinc-800">
          Variables in the Equation (Parameter Estimates)
        </div>
        <table className="w-full text-left border-collapse">
          <thead className="border-b border-zinc-200 dark:border-zinc-800 text-[10px] text-zinc-500">
            <tr>
              <th className="px-2.5 py-1.5 font-semibold">Predictor</th>
              <th className="px-2.5 py-1.5 font-semibold text-right">B</th>
              <th className="px-2.5 py-1.5 font-semibold text-right">SE</th>
              <th className="px-2.5 py-1.5 font-semibold text-right">
                Wald χ²
              </th>
              <th className="px-2.5 py-1.5 font-semibold text-right">df</th>
              <th className="px-2.5 py-1.5 font-semibold text-right">
                Sig. (p)
              </th>
              <th className="px-2.5 py-1.5 font-semibold text-right">
                Exp(B) / OR
              </th>
              <th className="px-2.5 py-1.5 font-semibold text-right">
                95% CI for OR
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800 font-mono">
            {result.coefficients.map((c) => (
              <tr
                key={c.variable}
                className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30"
              >
                <td className="px-2.5 py-1.5 font-sans font-medium">
                  {c.variable}
                </td>
                <td className="px-2.5 py-1.5 text-right">{c.b.toFixed(3)}</td>
                <td className="px-2.5 py-1.5 text-right">
                  {c.std_err.toFixed(3)}
                </td>
                <td className="px-2.5 py-1.5 text-right">
                  {c.wald.toFixed(3)}
                </td>
                <td className="px-2.5 py-1.5 text-right">{c.df}</td>
                <td className="px-2.5 py-1.5 text-right font-medium">
                  {c.p_value < 0.001 ? "< .001 ***" : c.p_value.toFixed(3)}
                </td>
                <td className="px-2.5 py-1.5 text-right font-semibold text-violet-600 dark:text-violet-400">
                  {c.odds_ratio.toFixed(3)}
                </td>
                <td className="px-2.5 py-1.5 text-right">
                  [{c.or_ci_lower.toFixed(2)}, {c.or_ci_upper.toFixed(2)}]
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Classification Matrix Table */}
      <div className="border border-zinc-200 dark:border-zinc-800 rounded overflow-x-auto text-[11px]">
        <div className="px-2.5 py-1.5 font-semibold bg-zinc-50 dark:bg-zinc-800/60 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
          <span>
            Classification Table (Cutoff ={" "}
            {result.classification.cutoff.toFixed(2)})
          </span>
          <span className="font-semibold text-emerald-600 dark:text-emerald-400">
            Overall Accuracy:{" "}
            {(result.classification.accuracy * 100).toFixed(1)}%
          </span>
        </div>
        <div className="p-3 grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
          {confMatrix.map((item, i) => (
            <div
              key={i}
              className="p-2 rounded bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-700/50"
            >
              <div className="text-[10px] text-zinc-500 uppercase">
                {item.label}
              </div>
              <div className={`text-base font-bold ${item.color}`}>
                {item.value}
              </div>
            </div>
          ))}
        </div>
        <div className="px-3 pb-3 flex flex-wrap gap-4 text-[11px] justify-center text-zinc-600 dark:text-zinc-400 font-mono">
          <span>
            Sensitivity (Recall):{" "}
            {(result.classification.sensitivity * 100).toFixed(1)}%
          </span>
          <span>
            Specificity: {(result.classification.specificity * 100).toFixed(1)}%
          </span>
          <span>
            Precision: {(result.classification.precision * 100).toFixed(1)}%
          </span>
          <span>F1-Score: {result.classification.f1_score.toFixed(3)}</span>
        </div>
      </div>
    </div>
  );
};
