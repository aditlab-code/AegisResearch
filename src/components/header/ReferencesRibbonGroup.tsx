import React, { useState, useEffect, useRef } from "react";
import { Library, ExternalLink, ListTree, ChevronDown } from "lucide-react";
import { BibEntry, ScannedLabel, BibliographyStyleChoice } from "../../utils";
import { OutlineNode } from "../../types";
import { BibliographyPopover } from "./BibliographyPopover";
import { CrossRefPopover } from "./CrossRefPopover";
import { TocPopover } from "./TocPopover";

export interface ReferencesRibbonGroupProps {
  isLatex?: boolean;
  outline?: OutlineNode[];
  entries: BibEntry[];
  scannedLabels: ScannedLabel[];
  onInsertCite: (key: string) => void;
  onInsertStyle: (style: BibliographyStyleChoice) => void;
  onSaveBibEntries: (entries: BibEntry[]) => void;
  onInsertRef: (refCode: string) => void;
  onInsertTocCode: (code: string) => void;
}
export const ReferencesRibbonGroup: React.FC<ReferencesRibbonGroupProps> = ({
  isLatex = true,
  outline = [],
  entries,
  scannedLabels,
  onInsertCite,
  onInsertStyle,
  onSaveBibEntries,
  onInsertRef,
  onInsertTocCode,
}) => {
  const [activePopover, setActivePopover] = useState<
    "bib" | "crossref" | "toc" | null
  >(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const togglePopover = (type: "bib" | "crossref" | "toc") => {
    setActivePopover((prev) => (prev === type ? null : type));
  };

  // Click-outside listener
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setActivePopover(null);
      }
    };

    if (activePopover) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [activePopover]);

  return (
    <div
      ref={containerRef}
      className="h-full flex items-stretch gap-2 select-none overflow-visible relative text-zinc-700 dark:text-zinc-200"
    >
      {/* 1. Sub-panel Citations & Bibliography */}
      <div className="relative h-full flex flex-col items-center justify-between py-1 px-3 border-r border-zinc-200 dark:border-zinc-800">
        <button
          type="button"
          onClick={() => togglePopover("bib")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs transition-colors ${
            activePopover === "bib"
              ? "bg-blue-50 dark:bg-zinc-800 text-blue-600 dark:text-blue-400 font-medium"
              : "hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-200"
          }`}
        >
          <Library className="size-4 text-blue-600 dark:text-blue-400" />
          <span>Bibliography</span>
          <ChevronDown className="size-3 text-zinc-400 dark:text-zinc-500" />
        </button>

        <span className="text-[9px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mt-1">
          Citations ({entries.length})
        </span>

        {activePopover === "bib" && (
          <div className="absolute top-[calc(100%+6px)] left-0 z-50 shadow-2xl">
            <BibliographyPopover
              isLatex={isLatex}
              entries={entries}
              onInsertCite={onInsertCite}
              onInsertStyle={onInsertStyle}
              onSaveEntries={onSaveBibEntries}
              onClose={() => setActivePopover(null)}
            />
          </div>
        )}
      </div>

      {/* 2. Sub-panel Cross-Reference */}
      <div className="relative h-full flex flex-col items-center justify-between py-1 px-3 border-r border-zinc-200 dark:border-zinc-800">
        <button
          type="button"
          onClick={() => togglePopover("crossref")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs transition-colors ${
            activePopover === "crossref"
              ? "bg-blue-50 dark:bg-zinc-800 text-blue-600 dark:text-blue-400 font-medium"
              : "hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-200"
          }`}
        >
          <ExternalLink className="size-4 text-blue-600 dark:text-blue-400" />
          <span>Cross-Reference</span>
          <ChevronDown className="size-3 text-zinc-400 dark:text-zinc-500" />
        </button>

        <span className="text-[9px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mt-1">
          Labels ({scannedLabels.length})
        </span>

        {activePopover === "crossref" && (
          <div className="absolute top-[calc(100%+6px)] left-0 z-50 shadow-2xl">
            <CrossRefPopover
              isLatex={isLatex}
              scannedLabels={scannedLabels}
              onInsertRef={onInsertRef}
              onClose={() => setActivePopover(null)}
            />
          </div>
        )}
      </div>

      {/* 3. Sub-panel Table of Contents */}
      <div className="relative h-full flex flex-col items-center justify-between py-1 px-3">
        <button
          type="button"
          onClick={() => togglePopover("toc")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs transition-colors ${
            activePopover === "toc"
              ? "bg-blue-50 dark:bg-zinc-800 text-blue-600 dark:text-blue-400 font-medium"
              : "hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-200"
          }`}
        >
          <ListTree className="size-4 text-blue-600 dark:text-blue-400" />
          <span>Table of Contents</span>
          <ChevronDown className="size-3 text-zinc-400 dark:text-zinc-500" />
        </button>

        <span className="text-[9px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mt-1">
          TOC & Lists
        </span>

        {activePopover === "toc" && (
          <div className="absolute top-[calc(100%+6px)] left-0 z-50 shadow-2xl">
            <TocPopover
              isLatex={isLatex}
              outline={outline}
              onInsertCode={onInsertTocCode}
              onClose={() => setActivePopover(null)}
            />
          </div>
        )}
      </div>
    </div>
  );
};
