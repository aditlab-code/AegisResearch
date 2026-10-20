import React, { useState, useEffect, useRef } from "react";
import {
  CheckCheck,
  MessageSquare,
  GitCompare,
  ChevronDown,
  Bookmark,
} from "lucide-react";
import { SpellingPopover } from "./SpellingPopover";
import { CommentPopover } from "./CommentPopover";

export interface ReviewRibbonGroupProps {
  isLatex?: boolean;
  onInsertComment: (commentCode: string) => void;
  onOpenReviewPanel?: () => void;
  onOpenGitPanel?: () => void;
}

export const ReviewRibbonGroup: React.FC<ReviewRibbonGroupProps> = ({
  isLatex = true,
  onInsertComment,
  onOpenReviewPanel,
  onOpenGitPanel,
}) => {
  const [activePopover, setActivePopover] = useState<
    "spell" | "comment" | null
  >(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const togglePopover = (type: "spell" | "comment") => {
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
      {/* 1. Sub-panel Proofing */}
      <div className="relative h-full flex flex-col items-center justify-between py-1 px-3 border-r border-zinc-200 dark:border-zinc-800">
        <button
          type="button"
          onClick={() => togglePopover("spell")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs transition-colors ${
            activePopover === "spell"
              ? "bg-blue-50 dark:bg-zinc-800 text-blue-600 dark:text-blue-400 font-medium"
              : "hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-200"
          }`}
        >
          <CheckCheck className="size-4 text-blue-600 dark:text-blue-400" />
          <span>Proofing & Spelling</span>
          <ChevronDown className="size-3 text-zinc-400 dark:text-zinc-500" />
        </button>

        <span className="text-[9px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mt-1">
          Proofing
        </span>

        {activePopover === "spell" && (
          <div className="absolute top-[calc(100%+6px)] left-0 z-50 shadow-2xl">
            <SpellingPopover onClose={() => setActivePopover(null)} />
          </div>
        )}
      </div>

      {/* 2. Sub-panel Comments */}
      <div className="relative h-full flex flex-col items-center justify-between py-1 px-3 border-r border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center gap-1 pt-0.5">
          <button
            type="button"
            onClick={() => togglePopover("comment")}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs transition-colors ${
              activePopover === "comment"
                ? "bg-blue-50 dark:bg-zinc-800 text-blue-600 dark:text-blue-400 font-medium"
                : "hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-200"
            }`}
          >
            <MessageSquare className="size-4 text-blue-600 dark:text-blue-400" />
            <span>New Note</span>
            <ChevronDown className="size-3 text-zinc-400 dark:text-zinc-500" />
          </button>

          <button
            type="button"
            onClick={onOpenReviewPanel}
            title="Open Review Notes in Sidebar"
            className="flex items-center gap-1 px-2 py-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-200 text-xs transition-colors"
          >
            <Bookmark className="size-3.5 text-blue-600 dark:text-blue-400" />
            <span className="text-[11px]">View All Notes</span>
          </button>
        </div>

        <span className="text-[9px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mt-1">
          Comments & Notes
        </span>

        {activePopover === "comment" && (
          <div className="absolute top-[calc(100%+6px)] left-0 z-50 shadow-2xl">
            <CommentPopover
              isLatex={isLatex}
              onInsertComment={onInsertComment}
              onClose={() => setActivePopover(null)}
            />
          </div>
        )}
      </div>

      {/* 3. Sub-panel Track Changes (Git) */}
      <div className="relative h-full flex flex-col items-center justify-between py-1 px-3">
        <button
          type="button"
          onClick={onOpenGitPanel}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-200 transition-colors"
        >
          <GitCompare className="size-4 text-blue-600 dark:text-blue-400" />
          <span>Track Changes (Git)</span>
        </button>

        <span className="text-[9px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mt-1">
          Tracking
        </span>
      </div>
    </div>
  );
};
