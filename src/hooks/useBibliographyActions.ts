import { useState, useEffect, useMemo, RefObject } from "react";
import { Doc } from "../types";
import {
  parseBibtex,
  serializeBibtex,
  scanDocumentLabels,
  BibEntry,
  BibliographyStyleChoice,
  applyLatexBibliographyStyle,
  applyMarkdownBibliographyStyle,
} from "../utils";
import { projectService } from "../services/projects";
import { CodeEditorHandle } from "../components";

export interface UseBibliographyActionsParams {
  projectName: string;
  activeDoc?: Doc | null;
  editorRef: RefObject<CodeEditorHandle>;
  updateContent: (content: string) => void;
  setSaveStatus: (status: string) => void;
}

export function useBibliographyActions({
  projectName,
  activeDoc,
  editorRef,
  updateContent,
  setSaveStatus,
}: UseBibliographyActionsParams) {
  const [bibEntries, setBibEntries] = useState<BibEntry[]>([]);

  // Load references.bib on project load / change
  useEffect(() => {
    const loadBib = async () => {
      try {
        const rawBib = await projectService.readFile(
          projectName,
          "references.bib",
        );
        if (rawBib) {
          setBibEntries(parseBibtex(rawBib));
        }
      } catch {
        // ignore if references.bib not found
      }
    };
    loadBib();
  }, [projectName]);

  const scannedLabels = useMemo(() => {
    if (
      !activeDoc?.content ||
      (activeDoc.kind !== "tex" && activeDoc.kind !== "md")
    ) {
      return [];
    }
    return scanDocumentLabels(activeDoc.content);
  }, [activeDoc?.content, activeDoc?.kind]);

  const handleSaveBibEntries = async (newEntries: BibEntry[]) => {
    setBibEntries(newEntries);
    const serialized = serializeBibtex(newEntries);
    try {
      await projectService.saveFile(projectName, "references.bib", serialized);
      setSaveStatus("✓ references.bib saved");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error";
      setSaveStatus(`✗ Failed to save .bib: ${msg}`);
    }
  };

  const handleInsertCite = (citationKey: string) => {
    const isLatex = activeDoc?.kind === "tex";
    const code = isLatex ? `\\cite{${citationKey}}` : `[@${citationKey}]`;
    editorRef.current?.wrapSelection(code, "", "");
  };

  const handleInsertStyle = (style: BibliographyStyleChoice) => {
    if (!activeDoc) return;
    const isLatex = activeDoc.kind === "tex";
    const currentContent = activeDoc.content || "";

    if (isLatex) {
      const result = applyLatexBibliographyStyle(
        currentContent,
        style,
        "references",
      );
      if (result.changed) {
        updateContent(result.content);
        const styleLabel =
          typeof style === "string"
            ? style.toUpperCase()
            : `Custom (${style.custom})`;
        setSaveStatus(`✓ Applied ${styleLabel} style with preamble guard`);
      }
    } else {
      const result = applyMarkdownBibliographyStyle(
        currentContent,
        style,
        "references.bib",
      );
      if (result.changed) {
        updateContent(result.content);
        const styleLabel =
          typeof style === "string"
            ? style.toUpperCase()
            : `Custom (${style.custom})`;
        setSaveStatus(`✓ Applied ${styleLabel} style in frontmatter`);
      }
    }
  };

  const handleInsertRef = (refCode: string) => {
    editorRef.current?.wrapSelection(refCode, "", "");
  };

  const handleInsertTocCode = (tocCode: string) => {
    editorRef.current?.wrapSelection(tocCode, "", "");
  };

  return {
    bibEntries,
    setBibEntries,
    scannedLabels,
    handleSaveBibEntries,
    handleInsertCite,
    handleInsertStyle,
    handleInsertRef,
    handleInsertTocCode,
  };
}
