import React, { useState } from "react";
import {
  BibliometricsDataParams,
  BibliometricsVisualParams,
  BibliometricsTab,
} from "../types";
import {
  ThematicCluster,
  BibliometricLawsResponse,
} from "../../../types/bibliometrics";

interface ConfigPanelProps {
  activeTab: BibliometricsTab;
  dataParams: BibliometricsDataParams;
  setDataParams: React.Dispatch<React.SetStateAction<BibliometricsDataParams>>;
  visualParams: BibliometricsVisualParams;
  setVisualParams: React.Dispatch<
    React.SetStateAction<BibliometricsVisualParams>
  >;
  onApplyFilter: () => void;
  onAddStopword: (tag: string) => void;
  onRemoveStopword: (tag: string) => void;
  onAddAcademicPresets: () => void;
  onClearStopwords: () => void;
  selectedCluster: ThematicCluster | null;
  laws?: BibliometricLawsResponse | null;
  loading: boolean;
}

export const ConfigPanel: React.FC<ConfigPanelProps> = ({
  activeTab,
  dataParams,
  setDataParams,
  visualParams,
  setVisualParams,
  onApplyFilter,
  onAddStopword,
  onRemoveStopword,
  onAddAcademicPresets,
  onClearStopwords,
  selectedCluster,
  laws,
  loading,
}) => {
  const [tagInput, setTagInput] = useState("");

  const handleAddTag = () => {
    if (!tagInput.trim()) return;
    onAddStopword(tagInput);
    setTagInput("");
  };

  return (
    <aside className="w-[260px] flex-shrink-0 flex flex-col justify-between border-l border-gray-200 dark:border-gray-800 bg-gray-50/70 dark:bg-gray-900/70 p-3 select-none overflow-y-auto">
      <div className="space-y-4">
        {/* =========================================================================
            CONTEXT 1: NETWORK & THEMATIC MAP
           ========================================================================= */}
        {(activeTab === "network" || activeTab === "thematic") && (
          <>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  {activeTab === "network"
                    ? "Network Filters"
                    : "Thematic Filters"}
                </span>
                <span className="text-[10px] text-gray-500">Backend Query</span>
              </div>

              {/* Mode Toggle */}
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-gray-600 dark:text-gray-300">
                  Target Entity
                </label>
                <div className="grid grid-cols-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 p-0.5">
                  <button
                    type="button"
                    onClick={() =>
                      setDataParams((prev) => ({
                        ...prev,
                        networkType: "keywords",
                      }))
                    }
                    className={`py-1 text-xs font-semibold rounded-md transition-colors ${
                      dataParams.networkType === "keywords"
                        ? "bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm"
                        : "text-gray-600 dark:text-gray-400 hover:text-gray-900"
                    }`}
                  >
                    Keywords
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setDataParams((prev) => ({
                        ...prev,
                        networkType: "authors",
                      }))
                    }
                    className={`py-1 text-xs font-semibold rounded-md transition-colors ${
                      dataParams.networkType === "authors"
                        ? "bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm"
                        : "text-gray-600 dark:text-gray-400 hover:text-gray-900"
                    }`}
                  >
                    Authors
                  </button>
                </div>
              </div>

              {/* Min Frequency (Expanded to 2 - 50 for large corpora) */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-medium text-gray-600 dark:text-gray-300">
                    Min Frequency
                  </span>
                  <span className="font-mono font-semibold px-1.5 py-0.2 rounded bg-gray-200 dark:bg-gray-800 text-gray-800 dark:text-gray-200">
                    ≥ {dataParams.minFrequency}
                  </span>
                </div>
                <input
                  type="range"
                  min="2"
                  max="50"
                  step="1"
                  value={dataParams.minFrequency}
                  onChange={(e) =>
                    setDataParams((prev) => ({
                      ...prev,
                      minFrequency: Number(e.target.value),
                    }))
                  }
                  className="w-full accent-blue-600 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-gray-400">
                  <span>2</span>
                  <span>25</span>
                  <span>50</span>
                </div>
              </div>

              {/* Top Nodes Limit */}
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-gray-600 dark:text-gray-300">
                  Max Top Nodes
                </label>
                <select
                  value={dataParams.topN}
                  onChange={(e) =>
                    setDataParams((prev) => ({
                      ...prev,
                      topN: Number(e.target.value),
                    }))
                  }
                  className="w-full px-2 py-1.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs font-medium text-gray-800 dark:text-gray-200 cursor-pointer"
                >
                  <option value={30}>30 most frequent</option>
                  <option value={40}>40 most frequent</option>
                  <option value={60}>60 most frequent</option>
                  <option value={80}>80 most frequent</option>
                  <option value={100}>100 most frequent</option>
                </select>
              </div>

              {/* Apply Button */}
              <button
                type="button"
                onClick={onApplyFilter}
                disabled={loading}
                className="w-full py-2 px-3 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-semibold shadow-sm transition-all text-center"
              >
                {loading ? "Re-analyzing..." : "Apply & Re-analyze"}
              </button>
            </div>

            {/* Visual Sliders */}
            <div className="space-y-3 pt-3 border-t border-gray-200 dark:border-gray-800">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Visual Layout
                </span>
                <span className="text-[10px] text-gray-500">Real-time</span>
              </div>

              {activeTab === "network" && (
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-medium text-gray-600 dark:text-gray-300">
                      Cluster Spacing
                    </span>
                    <span className="font-mono text-gray-500 text-[11px]">
                      {visualParams.spacingScale.toFixed(1)}x
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0.6"
                    max="2.0"
                    step="0.1"
                    value={visualParams.spacingScale}
                    onChange={(e) =>
                      setVisualParams((prev) => ({
                        ...prev,
                        spacingScale: Number(e.target.value),
                      }))
                    }
                    className="w-full accent-blue-600 cursor-pointer"
                  />
                </div>
              )}

              <div className="space-y-1">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-medium text-gray-600 dark:text-gray-300">
                    Bubble Size
                  </span>
                  <span className="font-mono text-gray-500 text-[11px]">
                    {visualParams.nodeSizeScale.toFixed(1)}x
                  </span>
                </div>
                <input
                  type="range"
                  min="0.4"
                  max="1.6"
                  step="0.1"
                  value={visualParams.nodeSizeScale}
                  onChange={(e) =>
                    setVisualParams((prev) => ({
                      ...prev,
                      nodeSizeScale: Number(e.target.value),
                    }))
                  }
                  className="w-full accent-blue-600 cursor-pointer"
                />
              </div>
            </div>

            {/* In-Context Stopwords */}
            <div className="space-y-2.5 pt-3 border-t border-gray-200 dark:border-gray-800">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Quick Stopwords
                </span>
                {dataParams.excludeKeywords.length > 0 && (
                  <button
                    type="button"
                    onClick={onClearStopwords}
                    className="text-[10px] text-red-600 hover:underline"
                  >
                    Clear all
                  </button>
                )}
              </div>

              <div className="flex gap-1.5">
                <input
                  type="text"
                  placeholder="Exclude term..."
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddTag()}
                  className="flex-1 px-2.5 py-1.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={handleAddTag}
                  className="px-2.5 py-1.5 bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg text-xs font-semibold"
                >
                  Add
                </button>
              </div>

              {dataParams.excludeKeywords.length > 0 && (
                <div className="flex flex-wrap gap-1 max-h-[110px] overflow-y-auto p-1 rounded-lg border border-gray-200 dark:border-gray-800 bg-white/70 dark:bg-gray-900/60">
                  {dataParams.excludeKeywords.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[10px] font-medium bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700"
                    >
                      <span className="truncate max-w-[80px]">{tag}</span>
                      <button
                        type="button"
                        onClick={() => onRemoveStopword(tag)}
                        className="text-gray-400 hover:text-red-500 font-bold"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Cluster Inspector */}
            {selectedCluster && (
              <div className="p-2.5 rounded-lg border border-blue-200 dark:border-blue-900/60 bg-blue-50/50 dark:bg-blue-950/30 space-y-1.5 text-xs">
                <div className="font-semibold text-blue-900 dark:text-blue-200">
                  Theme #{selectedCluster.cluster_id + 1} (
                  {selectedCluster.quadrant})
                </div>
                <div className="flex flex-wrap gap-1">
                  {selectedCluster.keywords.map((kw) => (
                    <span
                      key={kw}
                      className="px-1.5 py-0.2 bg-white dark:bg-gray-800 border border-blue-200 dark:border-blue-800 rounded text-[9.5px] font-mono text-blue-700 dark:text-blue-300"
                    >
                      {kw}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* =========================================================================
            CONTEXT 2: THEMATIC EVOLUTION (SANKEY FLOW)
           ========================================================================= */}
        {activeTab === "evolution" && (
          <div className="space-y-4">
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Evolution Parameters
              </span>
              <p className="text-[11px] text-gray-500">
                Track theme birth, mutation, and convergence across time
                periods.
              </p>
            </div>

            {/* Time Slice Count */}
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-gray-600 dark:text-gray-300">
                Time Slices (Period Segments)
              </label>
              <div className="grid grid-cols-3 gap-1 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 p-0.5">
                {[2, 3, 4].map((slices) => (
                  <button
                    key={`slice-${slices}`}
                    type="button"
                    onClick={() =>
                      setDataParams((prev) => ({ ...prev, sliceCount: slices }))
                    }
                    className={`py-1 text-xs font-semibold rounded-md transition-colors ${
                      dataParams.sliceCount === slices
                        ? "bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm"
                        : "text-gray-600 dark:text-gray-400"
                    }`}
                  >
                    {slices} Periods
                  </button>
                ))}
              </div>
            </div>

            {/* Min Frequency per Period */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-medium text-gray-600 dark:text-gray-300">
                  Min Freq per Period
                </span>
                <span className="font-mono font-semibold px-1.5 py-0.2 rounded bg-gray-200 dark:bg-gray-800 text-gray-800 dark:text-gray-200">
                  ≥ {dataParams.minFrequency}
                </span>
              </div>
              <input
                type="range"
                min="2"
                max="15"
                value={dataParams.minFrequency}
                onChange={(e) =>
                  setDataParams((prev) => ({
                    ...prev,
                    minFrequency: Number(e.target.value),
                  }))
                }
                className="w-full accent-blue-600 cursor-pointer"
              />
            </div>

            <button
              type="button"
              onClick={onApplyFilter}
              disabled={loading}
              className="w-full py-2 px-3 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-semibold shadow-sm transition-all"
            >
              {loading ? "Re-analyzing..." : "Apply Evolution Filter"}
            </button>
          </div>
        )}

        {/* =========================================================================
            CONTEXT 3: SCIENTIFIC LAWS (BRADFORD & LOTKA) - NO KEYWORD SLIDERS!
           ========================================================================= */}
        {activeTab === "laws" && (
          <div className="space-y-4">
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Scientometric Laws
              </span>
              <p className="text-[11px] text-gray-500">
                Mathematical evaluation across the entire population of
                publications.
              </p>
            </div>

            {/* Bradford Card */}
            <div className="p-3 rounded-lg border border-blue-200 dark:border-blue-900/60 bg-blue-50/40 dark:bg-blue-950/20 space-y-1.5 text-xs">
              <div className="font-semibold text-blue-900 dark:text-blue-200">
                Bradford's Law (Sources)
              </div>
              <p className="text-[11px] text-gray-600 dark:text-gray-300 leading-relaxed">
                Divides journals into 3 zones with equal 1/3 volume yield (1 : n
                : n²). Evaluates entire corpus without keyword pruning.
              </p>
              {laws?.bradford && (
                <div className="text-[10px] font-mono text-blue-700 dark:text-blue-300 pt-1">
                  Multiplier k: {laws.bradford.bradford_multiplier}
                </div>
              )}
            </div>

            {/* Lotka Card */}
            <div className="p-3 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 space-y-1.5 text-xs">
              <div className="font-semibold text-gray-900 dark:text-gray-100">
                Lotka's Law (Authors)
              </div>
              <p className="text-[11px] text-gray-600 dark:text-gray-300 leading-relaxed">
                Inverse power-law model: y = C / xⁿ. Evaluates author
                productivity distribution via Kolmogorov-Smirnov
                goodness-of-fit.
              </p>
              {laws?.lotka && (
                <div className="text-[10px] font-mono text-gray-500 pt-1">
                  Exponent n: {laws.lotka.n_exponent.toFixed(2)} · Fit:{" "}
                  {laws.lotka.is_fit ? "Yes (p ≥ 0.05)" : "No"}
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={onApplyFilter}
              disabled={loading}
              className="w-full py-2 px-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 text-xs font-semibold shadow-2xs transition-all"
            >
              {loading ? "Re-calculating..." : "Force Re-calculate Laws"}
            </button>
          </div>
        )}

        {/* =========================================================================
            CONTEXT 4: SLR STOPWORDS MANAGEMENT - NO GRAPH SLIDERS!
           ========================================================================= */}
        {activeTab === "stopwords" && (
          <div className="space-y-4">
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                SLR Curation Actions
              </span>
              <p className="text-[11px] text-gray-500">
                Manage stopwords rules to improve cluster purity across all
                graphs.
              </p>
            </div>

            <div className="space-y-2">
              <button
                type="button"
                onClick={onAddAcademicPresets}
                disabled={loading}
                className="w-full py-2 px-3 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-semibold shadow-sm transition-all"
              >
                + Add Academic SLR Presets
              </button>

              {dataParams.excludeKeywords.length > 0 && (
                <button
                  type="button"
                  onClick={onClearStopwords}
                  disabled={loading}
                  className="w-full py-1.5 px-3 rounded-lg border border-red-300 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 text-xs font-semibold transition-all"
                >
                  Clear All ({dataParams.excludeKeywords.length}) Stopwords
                </button>
              )}
            </div>

            <div className="p-3 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-[11px] text-gray-600 dark:text-gray-300 space-y-1">
              <div className="font-semibold text-gray-900 dark:text-gray-100">
                Scientometric Tip:
              </div>
              <p>
                Generic words like <em>study, paper, approach, model</em> create
                artificial central super-hubs. Removing them reveals distinct
                thematic domains.
              </p>
            </div>
          </div>
        )}

        {/* =========================================================================
            CONTEXT 5: LATEX TIKZ EXPORT
           ========================================================================= */}
        {activeTab === "tikz" && (
          <div className="space-y-4">
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                LaTeX Guidelines
              </span>
              <p className="text-[11px] text-gray-500">
                Native vector figure code ready for IEEE, Elsevier, and Springer
                manuscripts.
              </p>
            </div>

            <div className="p-3 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-xs space-y-2">
              <div className="font-semibold text-gray-800 dark:text-gray-200">
                Required Preamble
              </div>
              <code className="block p-2 bg-gray-100 dark:bg-gray-800 rounded font-mono text-[10px] text-blue-600 dark:text-blue-400">
                \usepackage&#123;tikz&#125;
                <br />
                \usepackage&#123;pgfplots&#125;
                <br />
                \pgfplotsset&#123;compat=1.18&#125;
              </code>
            </div>

            <p className="text-[11px] text-gray-500 leading-relaxed">
              Use the top-right button in the main view to copy or insert
              directly into your document editor.
            </p>
          </div>
        )}
      </div>
    </aside>
  );
};
