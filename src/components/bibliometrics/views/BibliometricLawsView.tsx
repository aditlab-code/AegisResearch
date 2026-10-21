import React from "react";
import { BibliometricLawsResponse } from "../../../types/bibliometrics";

interface BibliometricLawsViewProps {
  laws: BibliometricLawsResponse | null;
  loading: boolean;
}

export const BibliometricLawsView: React.FC<BibliometricLawsViewProps> = ({
  laws,
  loading,
}) => {
  if (loading && !laws) {
    return (
      <div className="flex-1 flex items-center justify-center text-sm text-gray-500 font-medium">
        Computing scientometric laws...
      </div>
    );
  }

  if (!laws) {
    return (
      <div className="flex-1 flex items-center justify-center text-sm text-gray-500 font-medium">
        No scientometric laws data available.
      </div>
    );
  }

  const { bradford, lotka } = laws;
  const curve = bradford.curve || [];

  // Bradford Chart Geometry
  const svgW = 560;
  const svgH = 260;
  const padL = 55;
  const padR = 25;
  const padT = 20;
  const padB = 40;
  const plotW = svgW - padL - padR;
  const plotH = svgH - padT - padB;

  const maxLn = Math.max(...curve.map((p) => p.ln_rank), 3.5);
  const maxCum = Math.max(...curve.map((p) => p.cum_articles), 10);

  const scaleX = (lnVal: number) => padL + (lnVal / maxLn) * plotW;
  const scaleY = (cumVal: number) => padT + plotH - (cumVal / maxCum) * plotH;

  // Polyline Points
  const pointsString = curve
    .map((p) => `${scaleX(p.ln_rank)},${scaleY(p.cum_articles)}`)
    .join(" ");

  // Zone Cutoffs: guaranteed visible width for all 3 zones
  const rawZ1Cutoff =
    bradford.zone1_cutoff_ln_rank ??
    Math.log(Math.max(1, bradford.zone1.source_count) + 0.5);
  const rawZ2Cutoff =
    bradford.zone2_cutoff_ln_rank ??
    Math.log(
      Math.max(2, bradford.zone1.source_count + bradford.zone2.source_count) +
        0.5,
    );

  const z1X = Math.max(
    padL + 45,
    Math.min(padL + plotW * 0.45, scaleX(rawZ1Cutoff)),
  );
  const z2X = Math.max(
    z1X + 45,
    Math.min(padL + plotW - 40, scaleX(rawZ2Cutoff)),
  );

  // Axis Ticks
  const xTicks = [0, 1, 2, 3, 4].filter((v) => v <= maxLn);
  const yTicks = [
    0,
    Math.round(maxCum * 0.25),
    Math.round(maxCum * 0.5),
    Math.round(maxCum * 0.75),
    maxCum,
  ];

  return (
    <div className="flex-1 relative w-full h-full bg-white dark:bg-gray-950 overflow-y-auto p-5 space-y-6">
      {/* 1. BRADFORD'S LAW SECTION */}
      <section className="space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-gray-200 dark:border-gray-800">
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              Bradford's Law of Scattering (Source Productivity)
            </h3>
            <p className="text-xs text-gray-500">
              Corpus divided into 3 zones with equal literature yield (1:n:n²
              progression). Multiplier k = {bradford.bradford_multiplier}
            </p>
          </div>
          <span className="font-mono text-xs px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 font-semibold">
            {bradford.total_sources} Journals · {bradford.total_articles}{" "}
            Articles
          </span>
        </div>

        {/* 3 Zone Metric Badges */}
        <div className="grid grid-cols-3 gap-3">
          <div className="p-3 rounded-lg border border-blue-200 dark:border-blue-900/60 bg-blue-50/40 dark:bg-blue-950/20">
            <div className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
              Zone 1 (Core Sources)
            </div>
            <div className="text-lg font-bold text-gray-900 dark:text-gray-100 font-mono">
              {bradford.zone1.source_count}{" "}
              <span className="text-xs font-normal text-gray-500">
                journals
              </span>
            </div>
            <div className="text-[11px] text-gray-600 dark:text-gray-400">
              {bradford.zone1.article_count} articles (1/3 of total)
            </div>
          </div>

          <div className="p-3 rounded-lg border border-amber-200 dark:border-amber-900/60 bg-amber-50/40 dark:bg-amber-950/20">
            <div className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
              Zone 2 (Moderate Sources)
            </div>
            <div className="text-lg font-bold text-gray-900 dark:text-gray-100 font-mono">
              {bradford.zone2.source_count}{" "}
              <span className="text-xs font-normal text-gray-500">
                journals
              </span>
            </div>
            <div className="text-[11px] text-gray-600 dark:text-gray-400">
              {bradford.zone2.article_count} articles (1/3 of total)
            </div>
          </div>

          <div className="p-3 rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50/60 dark:bg-gray-900/50">
            <div className="text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Zone 3 (Peripheral Sources)
            </div>
            <div className="text-lg font-bold text-gray-900 dark:text-gray-100 font-mono">
              {bradford.zone3.source_count}{" "}
              <span className="text-xs font-normal text-gray-500">
                journals
              </span>
            </div>
            <div className="text-[11px] text-gray-600 dark:text-gray-400">
              {bradford.zone3.article_count} articles (1/3 of total)
            </div>
          </div>
        </div>

        {/* Publication-Ready Bradford SVG Chart */}
        <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 flex flex-col items-center">
          <svg
            viewBox={`0 0 ${svgW} ${svgH}`}
            className="w-full max-w-[640px] select-none"
          >
            {/* 3-Zone Shading Bands (High Contrast & Visible) */}
            <rect
              x={padL}
              y={padT}
              width={Math.max(0, z1X - padL)}
              height={plotH}
              fill="#2563eb"
              fillOpacity={0.16}
            />
            <rect
              x={z1X}
              y={padT}
              width={Math.max(0, z2X - z1X)}
              height={plotH}
              fill="#d97706"
              fillOpacity={0.16}
            />
            <rect
              x={z2X}
              y={padT}
              width={Math.max(0, padL + plotW - z2X)}
              height={plotH}
              fill="#6b7280"
              fillOpacity={0.14}
            />

            {/* Zone Demarcation Vertical Lines */}
            <line
              x1={z1X}
              y1={padT}
              x2={z1X}
              y2={padT + plotH}
              stroke="#2563eb"
              strokeWidth={1.5}
              strokeDasharray="4 4"
            />
            <line
              x1={z2X}
              y1={padT}
              x2={z2X}
              y2={padT + plotH}
              stroke="#d97706"
              strokeWidth={1.5}
              strokeDasharray="4 4"
            />

            {/* Zone Labels with contrast backgrounds */}
            <text
              x={padL + 6}
              y={padT + 14}
              fontSize="9"
              fontWeight="bold"
              fill="#1d4ed8"
              className="dark:fill-blue-300"
            >
              Zone 1 (Core)
            </text>
            <text
              x={z1X + 6}
              y={padT + 14}
              fontSize="9"
              fontWeight="bold"
              fill="#b45309"
              className="dark:fill-amber-300"
            >
              Zone 2 (Moderate)
            </text>
            <text
              x={z2X + 6}
              y={padT + 14}
              fontSize="9"
              fontWeight="bold"
              fill="#4b5563"
              className="dark:fill-gray-300"
            >
              Zone 3 (Peripheral)
            </text>

            {/* Grid & Axis Lines */}
            <line
              x1={padL}
              y1={padT + plotH}
              x2={padL + plotW}
              y2={padT + plotH}
              stroke="#94a3b8"
              strokeWidth={1}
            />
            <line
              x1={padL}
              y1={padT}
              x2={padL}
              y2={padT + plotH}
              stroke="#94a3b8"
              strokeWidth={1}
            />

            {/* X-Axis Ticks & Labels */}
            {xTicks.map((val) => {
              const x = scaleX(val);
              return (
                <g key={`xtick-${val}`}>
                  <line
                    x1={x}
                    y1={padT + plotH}
                    x2={x}
                    y2={padT + plotH + 4}
                    stroke="#94a3b8"
                  />
                  <text
                    x={x}
                    y={padT + plotH + 16}
                    textAnchor="middle"
                    fontSize="9"
                    fill="#64748b"
                    className="font-mono"
                  >
                    {val}
                  </text>
                </g>
              );
            })}

            {/* Y-Axis Ticks & Labels */}
            {yTicks.map((val) => {
              const y = scaleY(val);
              return (
                <g key={`ytick-${val}`}>
                  <line
                    x1={padL - 4}
                    y1={y}
                    x2={padL}
                    y2={y}
                    stroke="#94a3b8"
                  />
                  <text
                    x={padL - 8}
                    y={y + 3}
                    textAnchor="end"
                    fontSize="9"
                    fill="#64748b"
                    className="font-mono"
                  >
                    {val}
                  </text>
                </g>
              );
            })}

            {/* Axis Titles */}
            <text
              x={padL + plotW / 2}
              y={padT + plotH + 32}
              textAnchor="middle"
              fontSize="10"
              fontWeight="bold"
              fill="#475569"
              className="dark:fill-slate-300"
            >
              ln(Journal Rank) ➔
            </text>
            <text
              x={18}
              y={padT + plotH / 2}
              textAnchor="middle"
              fontSize="10"
              fontWeight="bold"
              fill="#475569"
              className="dark:fill-slate-300"
              transform={`rotate(-90, 18, ${padT + plotH / 2})`}
            >
              Cumulative Articles ➔
            </text>

            {/* Bradford Curve Polyline */}
            <polyline
              fill="none"
              stroke="#2563eb"
              strokeWidth={2.5}
              points={pointsString}
            />

            {/* Curve Points */}
            {curve.map((p) => (
              <circle
                key={`pt-${p.rank}`}
                cx={scaleX(p.ln_rank)}
                cy={scaleY(p.cum_articles)}
                r={2.5}
                fill="#2563eb"
                stroke="#ffffff"
                strokeWidth={1}
              >
                <title>{`Rank #${p.rank}: ${p.source} (${p.articles} arts, cum: ${p.cum_articles})`}</title>
              </circle>
            ))}
          </svg>
        </div>
      </section>

      {/* 2. LOTKA'S LAW SECTION */}
      <section className="space-y-3 pt-3 border-t border-gray-200 dark:border-gray-800">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              Lotka's Law of Author Productivity (y = C / xⁿ)
            </h3>
            <p className="text-xs text-gray-500">
              Power-law distribution of author publication frequencies (n ={" "}
              {lotka.n_exponent.toFixed(2)}, C = {lotka.c_constant.toFixed(3)})
            </p>
          </div>
          <span
            className={`px-2.5 py-1 text-xs font-semibold rounded-md ${
              lotka.is_fit
                ? "bg-green-100 dark:bg-green-950/50 text-green-700 dark:text-green-300"
                : "bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300"
            }`}
          >
            {lotka.is_fit ? "Fits Lotka Distribution" : "Deviates (p < 0.05)"}
          </span>
        </div>

        {/* Lotka Table */}
        <div className="rounded-lg border border-gray-200 dark:border-gray-800 overflow-hidden">
          <table className="w-full text-xs text-left">
            <thead className="bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300 font-semibold border-b border-gray-200 dark:border-gray-800">
              <tr>
                <th className="px-4 py-2">Articles Authored (x)</th>
                <th className="px-4 py-2">Observed Authors</th>
                <th className="px-4 py-2">Expected Authors (Lotka)</th>
                <th className="px-4 py-2">Empirical %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
              {lotka.plot.slice(0, 10).map((row) => (
                <tr
                  key={`lotka-${row.papers}`}
                  className="hover:bg-gray-50/50 dark:hover:bg-gray-800/40"
                >
                  <td className="px-4 py-2 font-mono font-medium">
                    {row.papers}
                  </td>
                  <td className="px-4 py-2 font-mono">
                    {row.observed_authors}
                  </td>
                  <td className="px-4 py-2 font-mono text-blue-600 dark:text-blue-400">
                    {row.expected_authors}
                  </td>
                  <td className="px-4 py-2 font-mono text-gray-500">
                    {(row.empirical_freq * 100).toFixed(1)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};
