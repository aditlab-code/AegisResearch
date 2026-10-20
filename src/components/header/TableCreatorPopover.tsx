import React, { useState } from "react";
import { Table as TableIcon } from "lucide-react";
import { PopoverShell } from "./PopoverShell";

export interface TableCreatorPopoverProps {
  isLatex?: boolean;
  onInsert: (code: string) => void;
  onClose: () => void;
}

export const TableCreatorPopover: React.FC<TableCreatorPopoverProps> = ({
  isLatex = true,
  onInsert,
  onClose,
}) => {
  const [rows, setRows] = useState(3);
  const [cols, setCols] = useState(3);
  const [caption, setCaption] = useState("Experiment Results");
  const [hovered, setHovered] = useState<{ r: number; c: number } | null>(null);

  const maxGrid = 6;

  const handleGenerateTable = (targetRows = rows, targetCols = cols) => {
    const cleanCaption = caption?.trim() || "Table Caption";
    const labelKey = cleanCaption.toLowerCase().replace(/[^a-z0-9]/g, "-");

    if (!isLatex) {
      const mdHeader =
        "| " +
        Array.from({ length: targetCols }, (_, i) => `Col ${i + 1}`).join(
          " | ",
        ) +
        " |";
      const mdSeparator =
        "| " +
        Array.from({ length: targetCols }, () => "---").join(" | ") +
        " |";
      const mdRows: string[] = [];
      for (let r = 1; r < targetRows; r++) {
        const rowData = Array.from(
          { length: targetCols },
          (_, c) => `Val ${r},${c + 1}`,
        ).join(" | ");
        mdRows.push(`| ${rowData} |`);
      }
      const mdTableCode = `\n${mdHeader}\n${mdSeparator}\n${mdRows.join("\n")}\n: ${cleanCaption} {#tbl:${labelKey}}\n\n`;
      onInsert(mdTableCode);
      onClose();
      return;
    }

    const colAlign = Array(targetCols).fill("c").join("|");
    const headerRow = Array.from(
      { length: targetCols },
      (_, i) => `Col ${i + 1}`,
    ).join(" & ");

    let bodyRows = "";
    for (let r = 1; r < targetRows; r++) {
      const rowData = Array.from(
        { length: targetCols },
        (_, c) => `Val ${r},${c + 1}`,
      ).join(" & ");
      bodyRows += `    ${rowData} \\\\\n`;
    }

    const latexCode = `\\begin{table}[htbp]
  \\centering
  \\caption{${cleanCaption}}
  \\label{tab:${labelKey}}
  \\begin{tabular}{|${colAlign}|}
    \\hline
    ${headerRow} \\\\
    \\hline
${bodyRows}    \\hline
  \\end{tabular}
\\end{table}\n`;

    onInsert(latexCode);
    onClose();
  };

  return (
    <PopoverShell
      title="Table Builder"
      icon={TableIcon}
      onClose={onClose}
      widthClass="w-72"
    >
      {/* Visual Grid Selector */}
      <div className="flex flex-col items-center mb-2.5">
        <div className="grid grid-cols-6 gap-1 p-2 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded">
          {Array.from({ length: maxGrid }).map((_, rIdx) =>
            Array.from({ length: maxGrid }).map((_, cIdx) => {
              const r = rIdx + 1;
              const c = cIdx + 1;
              const isSelected = hovered
                ? r <= hovered.r && c <= hovered.c
                : r <= rows && c <= cols;

              return (
                <div
                  key={`${r}-${c}`}
                  onMouseEnter={() => setHovered({ r, c })}
                  onMouseLeave={() => setHovered(null)}
                  onClick={() => {
                    setRows(r);
                    setCols(c);
                    handleGenerateTable(r, c);
                  }}
                  className={`size-5 rounded border cursor-pointer transition-colors ${
                    isSelected
                      ? "bg-[#4078f2] dark:bg-[#61afef] border-[#4078f2] dark:border-[#61afef]"
                      : "bg-white dark:bg-zinc-900 border-zinc-300 dark:border-zinc-700 hover:border-blue-400 dark:hover:border-blue-500"
                  }`}
                />
              );
            }),
          )}
        </div>
        <span className="text-[11px] font-mono text-zinc-500 dark:text-zinc-400 mt-1">
          {hovered
            ? `${hovered.r} Rows × ${hovered.c} Cols`
            : `${rows} Rows × ${cols} Cols`}
        </span>
      </div>

      {/* Caption Input */}
      <div className="mb-2.5">
        <input
          type="text"
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          placeholder="Table caption..."
          className="w-full text-xs px-2 py-1 border border-zinc-300 dark:border-zinc-700 rounded bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:border-[#4078f2] dark:focus:border-[#61afef]"
        />
      </div>

      {/* Action Button */}
      <button
        type="button"
        onClick={() => handleGenerateTable(rows, cols)}
        className="w-full py-1.5 bg-[#4078f2] hover:bg-[#3362c4] dark:bg-[#61afef] dark:hover:bg-[#528bff] text-white dark:text-zinc-950 rounded text-xs font-semibold shadow-sm transition-colors"
      >
        Insert Table ({rows}×{cols})
      </button>
    </PopoverShell>
  );
};
