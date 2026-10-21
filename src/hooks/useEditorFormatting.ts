import { RefObject } from "react";
import { Doc } from "../types";
import { CodeEditorHandle } from "../components";

export interface UseEditorFormattingParams {
  activeDoc?: Doc | null;
  editorRef: RefObject<CodeEditorHandle>;
  insertSnippet: (label: string) => void;
  updateContent: (content: string) => void;
  handleSave: () => Promise<void>;
  handleCompile: () => Promise<void>;
  setSaveStatus: (status: string) => void;
}

export function useEditorFormatting({
  activeDoc,
  editorRef,
  insertSnippet,
  updateContent,
  handleSave,
  handleCompile,
  setSaveStatus,
}: UseEditorFormattingParams) {
  const handleRibbonSnippet = async (label: string) => {
    if (label === "Save") {
      await handleSave();
      return;
    }
    if (label === "Copy") {
      if (activeDoc?.content) {
        await navigator.clipboard.writeText(activeDoc.content);
        setSaveStatus("✓ Copied document to clipboard");
      }
      return;
    }
    if (label === "Paste") {
      try {
        const text = await navigator.clipboard.readText();
        if (text && activeDoc) {
          updateContent(`${activeDoc.content}\n${text}`);
          setSaveStatus("✓ Pasted from clipboard");
        }
      } catch {
        // Fallback if clipboard permission denied
      }
    }
    insertSnippet(label);
  };

  const handleClipboardAction = async (action: "copy" | "cut" | "paste") => {
    if (action === "copy") {
      const sel =
        editorRef.current?.getSelectedText() || activeDoc?.content || "";
      if (sel) {
        await navigator.clipboard.writeText(sel);
        setSaveStatus("✓ Copied to clipboard");
      }
    } else if (action === "cut") {
      const sel = editorRef.current?.getSelectedText() || "";
      if (sel) {
        await navigator.clipboard.writeText(sel);
        editorRef.current?.wrapSelection("", "", "");
        setSaveStatus("✓ Cut to clipboard");
      }
    } else if (action === "paste") {
      try {
        const text = await navigator.clipboard.readText();
        if (text) {
          editorRef.current?.wrapSelection("", "", text);
          setSaveStatus("✓ Pasted from clipboard");
        }
      } catch {
        // Fallback
      }
    }
  };

  const handleFormatAction = (
    type: "bold" | "italic" | "quote" | "superscript" | "subscript",
  ) => {
    const isLatex = activeDoc?.kind === "tex";
    if (type === "bold") {
      isLatex
        ? editorRef.current?.wrapSelection("\\textbf{", "}", "bold text")
        : editorRef.current?.wrapSelection("**", "**", "bold text");
    } else if (type === "italic") {
      isLatex
        ? editorRef.current?.wrapSelection("\\textit{", "}", "italic text")
        : editorRef.current?.wrapSelection("*", "*", "italic text");
    } else if (type === "quote") {
      isLatex
        ? editorRef.current?.wrapSelection(
            "\\textquotedblleft{}",
            "\\textquotedblright{}",
            "quote",
          )
        : editorRef.current?.wrapSelection('"', '"', "quote");
    } else if (type === "superscript") {
      isLatex
        ? editorRef.current?.wrapSelection("^{", "}", "2")
        : editorRef.current?.wrapSelection("^", "^", "2");
    } else if (type === "subscript") {
      isLatex
        ? editorRef.current?.wrapSelection("_{", "}", "1")
        : editorRef.current?.wrapSelection("~", "~", "1");
    }
  };

  const handleAlignAction = (type: "left" | "center" | "right" | "justify") => {
    const isLatex = activeDoc?.kind === "tex";
    if (isLatex) {
      if (type === "center") {
        editorRef.current?.wrapSelection(
          "\\begin{center}\n",
          "\n\\end{center}",
          "Centered Text",
        );
      } else if (type === "left") {
        editorRef.current?.wrapSelection(
          "\\begin{flushleft}\n",
          "\n\\end{flushleft}",
          "Left Aligned Text",
        );
      } else if (type === "right") {
        editorRef.current?.wrapSelection(
          "\\begin{flushright}\n",
          "\n\\end{flushright}",
          "Right Aligned Text",
        );
      }
    }
  };

  const handleStructureAction = (
    type: "heading1" | "heading2" | "numbering" | "bullet" | "line",
  ) => {
    const isLatex = activeDoc?.kind === "tex";
    if (type === "heading1") {
      isLatex
        ? editorRef.current?.wrapSelection("\\section{", "}\n", "Section Title")
        : editorRef.current?.wrapSelection("# ", "\n", "Section Title");
    } else if (type === "heading2") {
      isLatex
        ? editorRef.current?.wrapSelection(
            "\\subsection{",
            "}\n",
            "Subsection Title",
          )
        : editorRef.current?.wrapSelection("## ", "\n", "Subsection Title");
    } else if (type === "numbering") {
      isLatex
        ? editorRef.current?.wrapSelection(
            "\\begin{enumerate}\n  \\item ",
            "\n\\end{enumerate}",
            "Numbered item",
          )
        : editorRef.current?.wrapSelection("1. ", "\n", "Numbered item");
    } else if (type === "bullet") {
      isLatex
        ? editorRef.current?.wrapSelection(
            "\\begin{itemize}\n  \\item ",
            "\n\\end{itemize}",
            "List item",
          )
        : editorRef.current?.wrapSelection("- ", "\n", "List item");
    } else if (type === "line") {
      isLatex
        ? editorRef.current?.wrapSelection("\n\\hrule\n", "", "")
        : editorRef.current?.wrapSelection("\n---\n", "", "");
    }
  };

  const handlePageAction = (type: "break" | "next" | "preview") => {
    const isLatex = activeDoc?.kind === "tex";
    if (type === "break") {
      isLatex
        ? editorRef.current?.wrapSelection("\n\\newpage\n", "", "")
        : editorRef.current?.wrapSelection(
            '\n\n<div style="page-break-after: always;"></div>\n\n',
            "",
            "",
          );
    } else if (type === "next") {
      isLatex
        ? editorRef.current?.wrapSelection("\n\\clearpage\n", "", "")
        : editorRef.current?.wrapSelection("\n\n---\n\n", "", "");
    } else if (type === "preview") {
      if (activeDoc?.kind === "tex" || activeDoc?.kind === "md") {
        setSaveStatus("⏳ Refreshing document preview...");
        handleCompile();
      } else {
        setSaveStatus(
          "ℹ️ Preview only applies to LaTeX and Markdown documents",
        );
      }
    }
  };

  return {
    handleRibbonSnippet,
    handleClipboardAction,
    handleFormatAction,
    handleAlignAction,
    handleStructureAction,
    handlePageAction,
  };
}
