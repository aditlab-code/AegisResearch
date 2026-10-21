import { useState, RefObject } from "react";
import { Doc } from "../types";
import { synctexService } from "../services/synctex";
import { projectService } from "../services/projects";
import { SyncTeXForwardTarget } from "../components/preview/PDFViewer";
import { CodeEditorHandle } from "../components";

export interface UseSyncTeXCoordinationParams {
  projectName: string;
  rootDocument: string;
  activeDoc?: Doc | null;
  editorRef: RefObject<CodeEditorHandle>;
  openOrCreateDoc: (
    name: string,
    kind: "tex" | "md",
    content?: string,
    path?: string,
  ) => void;
  setDocContent: (fileName: string, content: string) => void;
  setSaveStatus: (status: string) => void;
}

export function useSyncTeXCoordination({
  projectName,
  rootDocument,
  activeDoc,
  editorRef,
  openOrCreateDoc,
  setDocContent,
  setSaveStatus,
}: UseSyncTeXCoordinationParams) {
  const [forwardTarget, setForwardTarget] =
    useState<SyncTeXForwardTarget | null>(null);

  const handleInverseSearch = async ({
    page,
    x,
    y,
  }: {
    page: number;
    x: number;
    y: number;
  }) => {
    if (!activeDoc) return;
    const compileTarget = rootDocument || "main.tex";
    const pdfName = compileTarget.replace(/\.tex$/i, ".pdf");
    setSaveStatus(`SyncTeX: Navigating from PDF p.${page}...`);

    try {
      const res = await synctexService.inverseSearch(
        projectName,
        pdfName,
        page,
        x,
        y,
      );
      if (res.success && res.file && res.line) {
        const targetFileName = res.file.split("/").pop() || res.file;
        const isDifferentFile =
          activeDoc.name !== targetFileName &&
          activeDoc.name !== res.file &&
          activeDoc.path !== res.file;

        if (isDifferentFile) {
          const kind = targetFileName.endsWith(".md") ? "md" : "tex";
          openOrCreateDoc(targetFileName, kind, undefined, res.file);
          try {
            const content = await projectService.readFile(
              projectName,
              res.file,
            );
            setDocContent(res.file, content);
          } catch {
            // ignore
          }
        }

        setTimeout(
          () => {
            editorRef.current?.jumpToLineAndHighlight(
              res.line!,
              res.column || 1,
            );
            setSaveStatus(`SyncTeX: Jumped to ${targetFileName}:${res.line}`);
            setTimeout(() => setSaveStatus("Ready"), 3000);
          },
          isDifferentFile ? 100 : 20,
        );
      } else {
        setSaveStatus(
          `SyncTeX: ${res.message || "No source line found for clicked location"}`,
        );
        setTimeout(() => setSaveStatus("Ready"), 3000);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Inverse search error";
      setSaveStatus(`SyncTeX error: ${msg}`);
    }
  };

  const handleForwardSearch = async () => {
    if (!activeDoc || activeDoc.kind !== "tex") {
      setSaveStatus(
        "SyncTeX forward search is only available for LaTeX documents",
      );
      return;
    }

    const cursorPos = editorRef.current?.getCursorPosition() || {
      line: 1,
      column: 1,
    };
    const compileTarget = rootDocument || "main.tex";
    const pdfName = compileTarget.replace(/\.tex$/i, ".pdf");
    const activeFileParam = activeDoc.path || activeDoc.name;
    setSaveStatus(`SyncTeX: Locating line ${cursorPos.line} in PDF...`);

    try {
      const res = await synctexService.forwardSearch(
        projectName,
        pdfName,
        activeFileParam,
        cursorPos.line,
        cursorPos.column,
      );

      if (
        res.success &&
        res.page &&
        res.x !== undefined &&
        res.y !== undefined
      ) {
        setForwardTarget({
          page: res.page,
          x: res.x,
          y: res.y,
          width: res.width || 100,
          height: res.height || 16,
          timestamp: Date.now(),
        });
        setSaveStatus(`✓ SyncTeX: Jumped to PDF page ${res.page}`);
        setTimeout(() => setSaveStatus("✓ Ready"), 3000);
      } else {
        setSaveStatus(
          `⚠️ SyncTeX: ${res.message || "No PDF position found for line " + cursorPos.line}`,
        );
        setTimeout(() => setSaveStatus("✓ Ready"), 3000);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Forward search error";
      setSaveStatus(`✗ SyncTeX error: ${msg}`);
    }
  };

  return {
    forwardTarget,
    setForwardTarget,
    handleInverseSearch,
    handleForwardSearch,
  };
}
