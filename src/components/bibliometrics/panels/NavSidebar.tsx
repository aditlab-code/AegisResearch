import React from "react";
import { BibliometricOverview } from "../../../types/bibliometrics";
import { BibliometricsTab } from "../types";

interface NavSidebarProps {
  activeTab: BibliometricsTab;
  onTabChange: (tab: BibliometricsTab) => void;
  overview: BibliometricOverview | null;
  excludedCount: number;
}

const TABS: { id: BibliometricsTab; number: string; title: string }[] = [
  { id: "network", number: "01", title: "Co-Occurrence Network" },
  { id: "thematic", number: "02", title: "Thematic Map" },
  { id: "evolution", number: "03", title: "Thematic Evolution" },
  { id: "laws", number: "04", title: "Scientific Laws" },
  { id: "stopwords", number: "05", title: "SLR Stopwords" },
  { id: "tikz", number: "06", title: "LaTeX TikZ Code" },
];

export const NavSidebar: React.FC<NavSidebarProps> = ({
  activeTab,
  onTabChange,
  overview,
  excludedCount,
}) => {
  return (
    <aside className="w-[220px] flex-shrink-0 flex flex-col justify-between border-r border-gray-200 dark:border-gray-800 bg-gray-50/70 dark:bg-gray-900/70 p-3 select-none">
      {/* Navigation List */}
      <div className="space-y-1">
        <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
          Analyses & Views
        </div>
        <nav className="space-y-0.5">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-medium transition-all text-left ${
                  isActive
                    ? "bg-blue-600 text-white shadow-sm font-semibold"
                    : "text-gray-700 dark:text-gray-300 hover:bg-gray-200/70 dark:hover:bg-gray-800"
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className={`font-mono text-[10px] ${
                      isActive
                        ? "text-blue-100"
                        : "text-gray-500 dark:text-gray-400"
                    }`}
                  >
                    {tab.number}
                  </span>
                  <span className="truncate">{tab.title}</span>
                </div>
                {tab.id === "stopwords" && excludedCount > 0 && (
                  <span
                    className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                      isActive
                        ? "bg-white text-blue-700 font-bold"
                        : "bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300 font-medium"
                    }`}
                  >
                    {excludedCount}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Clean Corpus Stats (Readability-first, no icon clutter) */}
      {overview && (
        <div className="p-3 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/90 space-y-2 text-xs">
          <div className="text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            Corpus Metadata
          </div>
          <div className="space-y-1.5 text-gray-700 dark:text-gray-300 font-medium">
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-gray-400">
                Documents:
              </span>
              <span className="font-semibold text-gray-900 dark:text-gray-100 font-mono">
                {overview.total_documents}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-gray-400">
                Timespan:
              </span>
              <span className="font-semibold text-gray-900 dark:text-gray-100 font-mono">
                {overview.timespan}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-gray-400">Authors:</span>
              <span className="font-semibold text-gray-900 dark:text-gray-100 font-mono">
                {overview.unique_authors}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-gray-400">Sources:</span>
              <span className="font-semibold text-gray-900 dark:text-gray-100 font-mono">
                {overview.unique_sources}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-gray-400">
                Avg Cites:
              </span>
              <span className="font-semibold text-gray-900 dark:text-gray-100 font-mono">
                {overview.avg_citations_per_doc}
              </span>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};
