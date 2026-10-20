import React, { useMemo } from "react";
import { MessageSquare, AlertCircle, Bookmark } from "lucide-react";

export interface ReviewNoteItem {
  id: string;
  type: "todo" | "fixme" | "note" | "comment";
  author?: string;
  text: string;
  lineNumber: number;
}

export interface ReviewNotesPanelProps {
  content: string;
  onJumpToLine: (lineNumber: number) => void;
}

export function parseDocumentNotes(content: string): ReviewNoteItem[] {
  if (!content) return [];
  const items: ReviewNoteItem[] = [];
  const lines = content.split("\n");

  lines.forEach((line, idx) => {
    const trimmed = line.trim();
    const lineNum = idx + 1;

    // Match % [Author]: Note or % TODO: Note or % FIXME: Note or \todo{Note}
    const todoMatch = trimmed.match(
      /^%\s*(TODO|FIXME|NOTE|REVIEWER|REVIEW):\s*(.*)$/i,
    );
    if (todoMatch) {
      const tag = todoMatch[1].toUpperCase();
      const text = todoMatch[2].trim() || "No description";
      items.push({
        id: `note-${lineNum}-${idx}`,
        type: tag === "FIXME" ? "fixme" : tag === "TODO" ? "todo" : "note",
        author: tag,
        text,
        lineNumber: lineNum,
      });
      return;
    }

    // Match \todo{...} or \comment{...}
    const macroMatch = trimmed.match(/\\(todo|comment)\{([^}]+)\}/);
    if (macroMatch) {
      items.push({
        id: `macro-${lineNum}-${idx}`,
        type: macroMatch[1] === "todo" ? "todo" : "comment",
        text: macroMatch[2].trim(),
        lineNumber: lineNum,
      });
    }
  });

  return items;
}

export const ReviewNotesPanel: React.FC<ReviewNotesPanelProps> = ({
  content,
  onJumpToLine,
}) => {
  const notes = useMemo(() => parseDocumentNotes(content), [content]);

  return (
    <div className="flex flex-col gap-2 select-none">
      <div className="flex items-center justify-between pb-1.5 border-b border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center gap-1.5 font-semibold text-xs text-zinc-800 dark:text-zinc-200">
          <MessageSquare className="size-3.5 text-blue-600 dark:text-blue-400" />
          <span>Review Notes & TODOs</span>
        </div>
        <span className="text-[10px] bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700 font-mono px-1.5 py-0.2 rounded-full font-bold">
          {notes.length}
        </span>
      </div>

      {notes.length > 0 ? (
        <div className="space-y-1.5 max-h-[calc(100vh-220px)] overflow-y-auto pr-0.5">
          {notes.map((note) => {
            const isFixme = note.type === "fixme";
            const isTodo = note.type === "todo";

            return (
              <button
                key={note.id}
                type="button"
                onClick={() => onJumpToLine(note.lineNumber)}
                className={`w-full p-2 rounded-md border text-left transition-colors flex flex-col gap-1 group ${
                  isFixme
                    ? "bg-rose-50/70 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900/60 hover:border-rose-400"
                    : isTodo
                      ? "bg-amber-50/70 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900/60 hover:border-amber-400"
                      : "bg-white dark:bg-zinc-800/80 border-zinc-200 dark:border-zinc-700 hover:border-blue-400"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    {isFixme ? (
                      <AlertCircle className="size-3 text-rose-600 dark:text-rose-400" />
                    ) : isTodo ? (
                      <Bookmark className="size-3 text-amber-600 dark:text-amber-400" />
                    ) : (
                      <MessageSquare className="size-3 text-blue-600 dark:text-blue-400" />
                    )}
                    <span
                      className={`text-[9px] font-bold uppercase tracking-wider ${
                        isFixme
                          ? "text-rose-700 dark:text-rose-400"
                          : isTodo
                            ? "text-amber-700 dark:text-amber-400"
                            : "text-blue-700 dark:text-blue-400"
                      }`}
                    >
                      {note.author || note.type}
                    </span>
                  </div>

                  <span className="text-[10px] font-mono text-zinc-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 font-medium">
                    :line {note.lineNumber}
                  </span>
                </div>

                <div className="text-xs text-zinc-700 dark:text-zinc-300 line-clamp-2 leading-relaxed">
                  {note.text}
                </div>
              </button>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-8 text-zinc-400 text-xs italic">
          No comments or % TODOs in active file.
        </div>
      )}
    </div>
  );
};
