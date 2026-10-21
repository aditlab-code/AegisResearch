import React, { useState } from "react";
import { ACADEMIC_STOPWORDS_PRESET } from "../types";

interface StopwordsViewProps {
  excludeKeywords: string[];
  onAddStopword: (tag: string) => void;
  onRemoveStopword: (tag: string) => void;
  onClearStopwords: () => void;
  onAddAcademicPresets: () => void;
  loading: boolean;
}

export const StopwordsView: React.FC<StopwordsViewProps> = ({
  excludeKeywords,
  onAddStopword,
  onRemoveStopword,
  onClearStopwords,
  onAddAcademicPresets,
  loading,
}) => {
  const [inputVal, setInputVal] = useState("");
  const [filterQuery, setFilterQuery] = useState("");

  const handleAdd = () => {
    if (!inputVal.trim()) return;
    onAddStopword(inputVal);
    setInputVal("");
  };

  const displayedKeywords = excludeKeywords.filter((k) =>
    k.toLowerCase().includes(filterQuery.toLowerCase()),
  );

  return (
    <div className="flex-1 relative w-full h-full bg-white dark:bg-gray-950 overflow-y-auto p-6 space-y-6 max-w-4xl mx-auto">
      {/* Title & Introduction */}
      <div className="space-y-1">
        <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">
          Systematic Literature Review (SLR) Stopwords Management
        </h3>
        <p className="text-xs text-gray-500 leading-relaxed">
          Excluding generic meta-terms (e.g.{" "}
          <em>paper, review, study, method</em>) prevents super-hub dominance
          and improves community modularity across the VOSviewer Network and
          Callon's Thematic Map.
        </p>
      </div>

      {/* Add Input Card */}
      <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50 space-y-3">
        <div className="text-xs font-semibold text-gray-700 dark:text-gray-300">
          Add Stopwords
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Type terms separated by commas (e.g. paper, methodology, empirical evaluation)..."
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            className="flex-1 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <button
            type="button"
            onClick={handleAdd}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold shadow-sm transition-all"
          >
            Add Terms
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-1">
          <button
            type="button"
            onClick={onAddAcademicPresets}
            disabled={loading}
            className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
          >
            + Add Standard SLR Academic Presets (
            {ACADEMIC_STOPWORDS_PRESET.length} terms)
          </button>
          {excludeKeywords.length > 0 && (
            <button
              type="button"
              onClick={onClearStopwords}
              disabled={loading}
              className="text-xs font-semibold text-red-600 hover:underline"
            >
              Clear All ({excludeKeywords.length})
            </button>
          )}
        </div>
      </div>

      {/* Table of Active Excluded Keywords */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="text-xs font-semibold text-gray-700 dark:text-gray-300">
            Active Excluded Terms ({excludeKeywords.length})
          </div>
          {excludeKeywords.length > 6 && (
            <input
              type="text"
              placeholder="Search active stopwords..."
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              className="px-2.5 py-1 text-xs rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200"
            />
          )}
        </div>

        {excludeKeywords.length === 0 ? (
          <div className="p-8 text-center rounded-xl border border-dashed border-gray-200 dark:border-gray-800 text-xs text-gray-500">
            No keywords excluded. All extracted author and article keywords will
            be analyzed.
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {displayedKeywords.map((tag) => (
              <div
                key={tag}
                className="flex items-center justify-between px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-xs font-medium text-gray-800 dark:text-gray-200 shadow-2xs"
              >
                <span className="truncate">{tag}</span>
                <button
                  type="button"
                  onClick={() => onRemoveStopword(tag)}
                  className="text-gray-400 hover:text-red-500 font-bold ml-2 text-sm"
                  title="Remove from exclusion list"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
