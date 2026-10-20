import React, { useState } from "react";
import {
  ListTree,
  FileText,
  Table,
  Image,
  PlusCircle,
  Bookmark,
} from "lucide-react";
import { OutlineNode } from "../../types";
import { PopoverShell } from "./PopoverShell";

export interface TocPopoverProps {
  isLatex?: boolean;
  outline?: OutlineNode[];
  onInsertCode: (code: string) => void;
  onClose: () => void;
}

function generateMarkdownToc(nodes: OutlineNode[], baseLevel?: number): string {
  if (!nodes || nodes.length === 0) return "";
  const minLevel = baseLevel ?? Math.min(...nodes.map((n) => n.level));
  let result = "";
  for (const node of nodes) {
    const indent = "  ".repeat(Math.max(0, node.level - minLevel));
    const slug = node.label
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
    result += `${indent}- [${node.label}](#${slug})\n`;
    if (node.children?.length) {
      result += generateMarkdownToc(node.children, minLevel);
    }
  }
  return result;
}

export const TocPopover: React.FC<TocPopoverProps> = ({
  isLatex = true,
  outline = [],
  onInsertCode,
  onClose,
}) => {
  const [customTitle, setCustomTitle] = useState("");
  const [level, setLevel] = useState<"section" | "chapter">("section");

  const handleInsert = (code: string) => {
    onInsertCode(code);
    onClose();
  };

  const handleAddCustomEntry = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = customTitle.trim();
    if (!clean) return;

    if (!isLatex) {
      const slug = clean
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
      const code = `${level === "chapter" ? "- " : "  - "}[${clean}](#${slug})\n`;
      onInsertCode(code);
      onClose();
      return;
    }

    const code = `\\addcontentsline{toc}{${level}}{${clean}}\n`;
    onInsertCode(code);
    onClose();
  };
  return (
    <PopoverShell
      title="Table of Contents & Lists"
      icon={ListTree}
      onClose={onClose}
      widthClass="w-80"
    >
      <div className="space-y-3 text-xs">
        {/* 1. Standard Document Lists */}
        <div>
          <span className="text-[10px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider block mb-1.5">
            Standard Document Lists
          </span>
          <div className="space-y-1">
            <button
              type="button"
              onClick={() => {
                if (isLatex) {
                  handleInsert("\n\\tableofcontents\n\\newpage\n");
                } else {
                  const generatedList = generateMarkdownToc(outline);
                  const tocMd = generatedList
                    ? `\n## Table of Contents\n\n${generatedList}\n`
                    : "\n## Table of Contents\n\n- [Section 1](#section-1)\n- [Section 2](#section-2)\n\n";
                  handleInsert(tocMd);
                }
              }}
              className="w-full p-2 border border-zinc-200 dark:border-zinc-800 rounded-md hover:bg-blue-50/70 dark:hover:bg-zinc-800 hover:border-blue-300 dark:hover:border-blue-600 transition-colors text-left flex items-center gap-2 group"
            >
              <FileText className="size-4 text-blue-600 dark:text-blue-400 shrink-0" />
              <div className="flex flex-col min-w-0">
                <span className="font-semibold text-zinc-800 dark:text-zinc-200 group-hover:text-blue-700 dark:group-hover:text-blue-400 truncate">
                  {isLatex ? "Table of Contents" : "TOC from Document Headings"}
                </span>
                <span className="text-[10px] font-mono text-zinc-400 dark:text-zinc-500">
                  {isLatex ? "\\tableofcontents" : "- [Title](#slug) links"}
                </span>
              </div>
            </button>

            <button
              type="button"
              onClick={() =>
                handleInsert(
                  isLatex
                    ? "\n\\listoffigures\n\\newpage\n"
                    : "\n## List of Figures\n\n",
                )
              }
              className="w-full p-2 border border-zinc-200 dark:border-zinc-800 rounded-md hover:bg-blue-50/70 dark:hover:bg-zinc-800 hover:border-blue-300 dark:hover:border-blue-600 transition-colors text-left flex items-center gap-2 group"
            >
              <Image className="size-4 text-blue-600 dark:text-blue-400 shrink-0" />
              <div className="flex flex-col min-w-0">
                <span className="font-semibold text-zinc-800 dark:text-zinc-200 group-hover:text-blue-700 dark:group-hover:text-blue-400 truncate">
                  List of Figures
                </span>
                <span className="text-[10px] font-mono text-zinc-400 dark:text-zinc-500">
                  {isLatex ? "\\listoffigures" : "## List of Figures"}
                </span>
              </div>
            </button>

            <button
              type="button"
              onClick={() =>
                handleInsert(
                  isLatex
                    ? "\n\\listoftables\n\\newpage\n"
                    : "\n## List of Tables\n\n",
                )
              }
              className="w-full p-2 border border-zinc-200 dark:border-zinc-800 rounded-md hover:bg-blue-50/70 dark:hover:bg-zinc-800 hover:border-blue-300 dark:hover:border-blue-600 transition-colors text-left flex items-center gap-2 group"
            >
              <Table className="size-4 text-blue-600 dark:text-blue-400 shrink-0" />
              <div className="flex flex-col min-w-0">
                <span className="font-semibold text-zinc-800 dark:text-zinc-200 group-hover:text-blue-700 dark:group-hover:text-blue-400 truncate">
                  List of Tables
                </span>
                <span className="text-[10px] font-mono text-zinc-400 dark:text-zinc-500">
                  {isLatex ? "\\listoftables" : "## List of Tables"}
                </span>
              </div>
            </button>

            {!isLatex && (
              <button
                type="button"
                onClick={() => handleInsert("\n[TOC]\n\n")}
                className="w-full p-2 border border-zinc-200 dark:border-zinc-800 rounded-md hover:bg-blue-50/70 dark:hover:bg-zinc-800 hover:border-blue-300 dark:hover:border-blue-600 transition-colors text-left flex items-center gap-2 group"
              >
                <Bookmark className="size-4 text-blue-600 dark:text-blue-400 shrink-0" />
                <div className="flex flex-col min-w-0">
                  <span className="font-semibold text-zinc-800 dark:text-zinc-200 group-hover:text-blue-700 dark:group-hover:text-blue-400 truncate">
                    Pandoc [TOC] Directive
                  </span>
                  <span className="text-[10px] font-mono text-zinc-400 dark:text-zinc-500">
                    [TOC] tag
                  </span>
                </div>
              </button>
            )}
          </div>
        </div>
        {/* 2. Register Custom Section / Appendix to TOC */}
        <div className="border-t border-zinc-200 dark:border-zinc-800 pt-2.5">
          <span className="text-[10px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider block mb-1.5">
            Add Custom Entry to TOC (e.g. Appendix)
          </span>

          <form onSubmit={handleAddCustomEntry} className="space-y-2">
            <div className="flex gap-1">
              <button
                type="button"
                onClick={() => setLevel("section")}
                className={`flex-1 py-1 rounded border text-[11px] font-medium transition-colors ${
                  level === "section"
                    ? "border-[#4078f2] dark:border-[#61afef] bg-blue-50 dark:bg-zinc-800 text-[#4078f2] dark:text-[#61afef] font-semibold"
                    : "border-zinc-300 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                }`}
              >
                Section Level
              </button>
              <button
                type="button"
                onClick={() => setLevel("chapter")}
                className={`flex-1 py-1 rounded border text-[11px] font-medium transition-colors ${
                  level === "chapter"
                    ? "border-[#4078f2] dark:border-[#61afef] bg-blue-50 dark:bg-zinc-800 text-[#4078f2] dark:text-[#61afef] font-semibold"
                    : "border-zinc-300 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                }`}
              >
                Chapter Level
              </button>
            </div>

            <div className="relative">
              <input
                type="text"
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
                placeholder="Title (e.g. Appendices, Glossary)"
                required
                className="w-full px-2.5 py-1.5 border border-zinc-300 dark:border-zinc-700 rounded bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 text-xs focus:outline-none focus:border-[#4078f2] dark:focus:border-[#61afef]"
              />
            </div>

            <button
              type="submit"
              disabled={!customTitle.trim()}
              className="w-full py-1.5 bg-[#4078f2] hover:bg-[#3362c4] dark:bg-[#61afef] dark:hover:bg-[#528bff] disabled:opacity-50 text-white dark:text-zinc-950 rounded font-semibold text-xs shadow-sm flex items-center justify-center gap-1.5 transition-colors"
            >
              <PlusCircle className="size-3.5" />
              Register Entry to TOC
            </button>
          </form>
        </div>
      </div>
    </PopoverShell>
  );
};
