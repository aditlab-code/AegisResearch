import { useState, useEffect, useRef, useMemo } from "react";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import {
  RibbonTab,
  PanelType,
  ChatMessage,
  FileNode,
  WorkspaceEntry,
  AnalysisType,
  AnalysisResult,
  TableStyle,
} from "./src/types";
import { buildApiUrl } from "./src/services/api";
import { DEFAULT_CHAT_MESSAGES } from "./src/constants";
import {
  countWords,
  parseDocumentOutline,
  parseBibtex,
  serializeBibtex,
  scanDocumentLabels,
  BibEntry,
  BibliographyStyleChoice,
  applyLatexBibliographyStyle,
  applyMarkdownBibliographyStyle,
} from "./src/utils";
import { projectService } from "./src/services/projects";
import { compilerService } from "./src/services/compiler";
import { synctexService } from "./src/services/synctex";
import { SyncTeXForwardTarget } from "./src/components/preview/PDFViewer";
import {
  useDocumentManager,
  useCompiler,
  useKeyboardShortcuts,
  useTheme,
} from "./src/hooks";
import {
  TitleBar,
  RibbonBar,
  ActivityBar,
  Sidebar,
  Editor,
  CodeEditorHandle,
  PreviewPanel,
  StatusBar,
  AnalysisDialog,
  ResultsViewerModal,
  StatisticalGuideModal,
  LatexOutputModal,
} from "./src/components";

export default function App() {
  const {
    docs,
    activeDoc,
    activeDocIndex,
    openDocIndices,
    openDoc,
    closeDoc,
    updateContent,
    setDocContent,
    insertSnippet,
    openOrCreateDoc,
  } = useDocumentManager();
  const [projectName, setProjectName] = useState("template-thesis");
  const {
    engine,
    setEngine,
    compile,
    pdfBlobUrl,
    setPdfBlobUrl,
    isCompiling,
    compileResult,
  } = useCompiler(projectName);
  const { theme, toggleTheme } = useTheme();

  const [ribbonTab, setRibbonTab] = useState<RibbonTab>("Home");
  const [panel, setPanel] = useState<PanelType>("files");
  const [chat, setChat] = useState<ChatMessage[]>(DEFAULT_CHAT_MESSAGES);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDirty, setIsDirty] = useState(false);
  const [saveStatus, setSaveStatus] = useState("✓ Ready");
  const editorRef = useRef<CodeEditorHandle>(null);
  const [forwardTarget, setForwardTarget] =
    useState<SyncTeXForwardTarget | null>(null);

  const [rootDocument, setRootDocument] = useState<string>("main.tex");
  const [bibEntries, setBibEntries] = useState<BibEntry[]>([]);

  const isOutlineSupported = Boolean(
    activeDoc && (activeDoc.kind === "tex" || activeDoc.kind === "md"),
  );

  const isPreviewSupported = Boolean(
    activeDoc && (activeDoc.kind === "tex" || activeDoc.kind === "md"),
  );

  // Auto-close Outline panel if active doc is not .tex or .md (or no file open)
  useEffect(() => {
    if (panel === "outline" && !isOutlineSupported) {
      setPanel("files");
    }
  }, [panel, isOutlineSupported]);

  // Load references.bib on project load
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
    )
      return [];
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
  const outlineTree = useMemo(() => {
    if (!activeDoc?.content) return [];
    const isLatex = activeDoc.kind === "tex";
    return parseDocumentOutline(activeDoc.content, isLatex);
  }, [activeDoc?.content, activeDoc?.kind]);

  const words = countWords(activeDoc?.content || "");
  // Sync initial file content on project load / switch
  useEffect(() => {
    let isMounted = true;
    const loadInitialFile = async () => {
      if (!activeDoc) return;
      try {
        const content = await projectService.readFile(
          projectName,
          activeDoc.name,
        );
        if (isMounted) {
          setDocContent(activeDoc.name, content);
          setSaveStatus(`✓ Loaded ${activeDoc.name}`);
          setIsDirty(false);
        }
      } catch {
        // Fallback to local cache
      }
    };
    loadInitialFile();
    return () => {
      isMounted = false;
    };
  }, [projectName]);

  // Auto-fetch paired PDF when opening or switching to a .tex document
  useEffect(() => {
    let isMounted = true;
    const tryFetchPdf = async () => {
      if (!activeDoc || activeDoc.kind !== "tex") return;
      try {
        const resolvedUrl = await compilerService.resolveProjectPdf(
          projectName,
          activeDoc.name,
        );
        if (isMounted && resolvedUrl) {
          setPdfBlobUrl(resolvedUrl);
        }
      } catch {
        // Ignore offline check
      }
    };
    tryFetchPdf();
    return () => {
      isMounted = false;
    };
  }, [projectName, activeDoc?.name, activeDoc?.kind, setPdfBlobUrl]);

  const handleSelectFile = async (file: FileNode) => {
    // Direct opening if a .pdf file is clicked in the file explorer
    if (
      file.name.toLowerCase().endsWith(".pdf") ||
      (file.kind as string) === "pdf"
    ) {
      const pdfUrl = `${compilerService.getDownloadPdfUrl(projectName, file.name)}?t=${Date.now()}`;
      setPdfBlobUrl(pdfUrl);
      setSaveStatus(`✓ Viewing PDF: ${file.name}`);
      return;
    }

    // Direct preview if an image asset is clicked in the file explorer
    if (
      file.kind === "image" ||
      /\.(png|jpe?g|svg|webp|gif|bmp)$/i.test(file.name)
    ) {
      openOrCreateDoc(file.name, "image", "", file.path || file.name);
      setSaveStatus(`✓ Viewing Image: ${file.name}`);
      return;
    }

    // Direct preview if a dataset file is clicked (.csv, .tsv, .parquet)
    if (
      (file.kind as string) === "dataset" ||
      /\.(csv|tsv|parquet|pqt)$/i.test(file.name)
    ) {
      openOrCreateDoc(file.name, "dataset", "", file.path || file.name);
      setSaveStatus(`✓ Viewing Dataset: ${file.name}`);
      return;
    }

    const kind = file.kind === "md" ? "md" : "tex";
    openOrCreateDoc(file.name, kind, undefined, file.path);
    setSaveStatus(`Loading ${file.name}...`);
    try {
      const content = await projectService.readFile(projectName, file.path);
      setDocContent(file.path, content);
      setSaveStatus(`✓ Loaded ${file.name}`);
      setIsDirty(false);
    } catch (err) {
      console.warn(
        `Could not fetch ${file.name} from backend, keeping local version:`,
        err,
      );
      setSaveStatus(`⚠️ Offline mode: ${file.name}`);
    }
  };

  const handleContentChange = (content: string) => {
    updateContent(content);
    setIsDirty(true);
    setSaveStatus("● Unsaved changes (Ctrl+S to save)");
  };

  const handleSelectSearchResult = async (
    filePath: string,
    lineNumber: number,
  ) => {
    const fileName = filePath.split("/").pop() || filePath;
    const kind = fileName.endsWith(".md") ? "md" : "tex";
    openOrCreateDoc(fileName, kind, undefined, filePath);

    try {
      const content = await projectService.readFile(projectName, filePath);
      setDocContent(filePath, content);
      setSaveStatus(`✓ Jumped to ${fileName}:${lineNumber}`);
    } catch {
      // ignore load error
    }

    setTimeout(() => {
      editorRef.current?.jumpToLine(lineNumber);
    }, 100);
  };

  const handleOpenWorkspace = async (workspace: WorkspaceEntry) => {
    setProjectName(workspace.id);
    const mainTarget = workspace.root_file || "main.tex";
    setRootDocument(mainTarget);
    if (workspace.root_file) {
      try {
        const content = await projectService.readFile(
          workspace.id,
          workspace.root_file,
        );
        openOrCreateDoc(
          workspace.root_file,
          "tex",
          content,
          workspace.root_file,
        );
        setSaveStatus(`✓ Opened workspace: ${workspace.name}`);
      } catch {
        openOrCreateDoc(
          workspace.root_file,
          "tex",
          undefined,
          workspace.root_file,
        );
      }
    }
  };

  const handleSave = async () => {
    if (
      !activeDoc ||
      activeDoc.kind === "image" ||
      activeDoc.kind === "dataset"
    )
      return;
    const targetPath = activeDoc.path || activeDoc.name;
    setSaveStatus(`Saving ${activeDoc.name}...`);
    try {
      await projectService.saveFile(projectName, targetPath, activeDoc.content);
      setIsDirty(false);
      setSaveStatus(`✓ Saved ${activeDoc.name}`);
      setTimeout(() => {
        setSaveStatus("✓ All files saved");
      }, 3000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error";
      setSaveStatus(`✗ Save failed: ${msg}`);
    }
  };

  const handleCompile = async () => {
    if (!activeDoc) return;
    const compileTarget = rootDocument || "main.tex";
    setSaveStatus(`⚙️ Compiling ${compileTarget} with ${engine}...`);
    // Auto-save active file before compile
    try {
      const targetPath = activeDoc.path || activeDoc.name;
      await projectService.saveFile(projectName, targetPath, activeDoc.content);
      setIsDirty(false);
    } catch {
      // ignore save failure
    }

    const res = await compile(compileTarget);
    if (res.success) {
      setSaveStatus(`✓ Compiled in ${res.durationMs || 0}ms · PDF Ready`);
    } else {
      const errDetail = res.errors?.[0]?.message || "Compilation error";
      setSaveStatus(`✗ Compile failed: ${errDetail}`);
    }
  };

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
          handleContentChange(`${activeDoc.content}\n${text}`);
          setSaveStatus("✓ Pasted from clipboard");
        }
      } catch {
        // Fallback if clipboard permission denied
      }
    }
    insertSnippet(label);
  };

  // Ribbon Home Action Handlers
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

  const handleAskAI = (text: string) => {
    if (!text.trim()) return;
    const t = text.toLowerCase();
    const response =
      t.includes("rumus") || t.includes("equation")
        ? {
            text: "Here is the Lindblad master equation:",
            code:
              activeDoc?.kind === "tex"
                ? "$\\dot{\\rho} = -i[H,\\rho] + \\sum_k \\gamma_k L_k \\rho L_k^\\dagger$"
                : "$\\dot{\\rho} = -i[H,\\rho]$",
          }
        : t.includes("sitasi") || t.includes("cite")
          ? {
              text: "Relevant reference: Engel et al. (2007), Nature 446.",
              code:
                activeDoc?.kind === "tex"
                  ? "\\cite{engel2007}"
                  : "[@engel2007]",
            }
          : t.includes("ringkas") || t.includes("summar")
            ? {
                text: `Summary: Document "${activeDoc?.name || "Document"}" contains ${outlineTree.length} main sections with ${words} words, discussing quantum coherence in biological systems.`,
              }
            : {
                text: "Academic sentence improvement suggestion:",
                code: "Recent evidence indicates that quantum coherence persists in photosynthetic complexes.",
              };

    setChat((prev) => [
      ...prev,
      { role: "user", text },
      { role: "ai", ...response },
    ]);
  };

  const handleDeleteFile = (filePath: string) => {
    const matchingIndices = docs
      .map((d, idx) => ({ d, idx }))
      .filter(
        ({ d }) =>
          d.name === filePath ||
          d.name.endsWith("/" + filePath) ||
          filePath.endsWith("/" + d.name),
      );

    matchingIndices.forEach(({ idx }) => {
      closeDoc(idx);
    });
  };

  const handleRefreshDocs = async () => {
    if (activeDoc) {
      try {
        const updated = await projectService.readFile(
          projectName,
          activeDoc.name,
        );
        if (updated !== undefined) {
          setDocContent(activeDoc.name, updated);
        }
      } catch {
        // ignore
      }
    }
  };

  const handleInsertLatex = (tableCode: string) => {
    if (activeDoc && activeDoc.kind === "tex") {
      editorRef.current?.wrapSelection("", "", `\n\n${tableCode}\n\n`);
      updateContent(`${activeDoc.content}\n\n${tableCode}\n`);
      setSaveStatus("LaTeX table inserted from Data Studio");
    } else {
      const texDocIndex = docs.findIndex((d) => d.kind === "tex");
      if (texDocIndex !== -1) {
        const texDoc = docs[texDocIndex];
        const updated = `${texDoc.content}\n\n${tableCode}\n`;
        setDocContent(texDoc.path || texDoc.name, updated);
        openDoc(texDocIndex);
        setSaveStatus(`LaTeX table inserted into ${texDoc.name}`);
      }
    }
  };

  // Global statistical analysis suite state
  const [analysisDialogOpen, setAnalysisDialogOpen] = useState(false);
  const [selectedAnalysisType, setSelectedAnalysisType] =
    useState<AnalysisType>("regression");
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(
    null,
  );
  const [resultModalOpen, setResultModalOpen] = useState(false);
  const [guideModalOpen, setGuideModalOpen] = useState(false);
  const [latexOutputModalOpen, setLatexOutputModalOpen] = useState(false);
  const [tableStyle, setTableStyle] = useState<TableStyle>("apa");
  const [datasetColumns, setDatasetColumns] = useState<string[]>([]);
  const [datasetFilePath, setDatasetFilePath] = useState<string>("");

  const handleOpenAnalysis = async (type: AnalysisType) => {
    let targetDataset =
      activeDoc && activeDoc.kind === "dataset"
        ? activeDoc
        : docs.find((d) => d.kind === "dataset");

    // Auto-detect dataset from project files if not yet opened in editor tabs
    if (!targetDataset) {
      try {
        const files = await projectService.getProjectFiles(projectName);
        const datasetFile = files.find((f) =>
          /\.(csv|tsv|parquet|pqt)$/i.test(f.name),
        );
        if (datasetFile) {
          const targetPath = datasetFile.path || datasetFile.name;
          openOrCreateDoc(datasetFile.name, "dataset", "", targetPath);
          targetDataset = {
            name: datasetFile.name,
            path: targetPath,
            kind: "dataset",
            content: "",
          };
          setSaveStatus(`✓ Loaded dataset: ${datasetFile.name}`);
        }
      } catch {
        // ignore
      }
    }

    if (!targetDataset) {
      setSaveStatus(
        "No dataset (.csv/.tsv/.parquet) found. Open or add a dataset to run statistical analysis.",
      );
      return;
    }

    const path = targetDataset.path || targetDataset.name;
    setDatasetFilePath(path);
    setSelectedAnalysisType(type);

    try {
      const url = buildApiUrl(
        `/api/projects/${encodeURIComponent(projectName)}/dataset/schema`,
        { path },
      );
      const res = await fetch(url);
      if (res.ok) {
        const schema = await res.json();
        setDatasetColumns(schema.columns.map((c: any) => c.name));
      } else {
        setDatasetColumns([]);
      }
    } catch {
      setDatasetColumns([]);
    }

    setAnalysisDialogOpen(true);
  };

  useKeyboardShortcuts({
    onSave: handleSave,
    onCompile: () => {
      compile();
    },
    onSyncToPdf: handleForwardSearch,
  });

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-zinc-100 dark:bg-zinc-950 text-zinc-800 dark:text-zinc-100">
      {/* Title bar */}
      <TitleBar
        appName="Aegis Research"
        theme={theme}
        onToggleTheme={toggleTheme}
      />

      {/* Ribbon */}
      <RibbonBar
        currentTab={ribbonTab}
        isLatex={activeDoc?.kind === "tex"}
        onSelectTab={setRibbonTab}
        onInsertSnippet={handleRibbonSnippet}
        engine={engine}
        onChangeEngine={setEngine}
        onCompile={handleCompile}
        onSyncToPdf={handleForwardSearch}
        onInsertCodeSnippet={(code) =>
          editorRef.current?.wrapSelection("", "", code)
        }
        onClipboardAction={handleClipboardAction}
        onFormatAction={handleFormatAction}
        onAlignAction={handleAlignAction}
        onStructureAction={handleStructureAction}
        onSelectHeadingStyle={(styleCode) =>
          editorRef.current?.wrapSelection(styleCode, "", "")
        }
        onPageAction={handlePageAction}
        outline={outlineTree}
        bibEntries={bibEntries}
        scannedLabels={scannedLabels}
        onInsertCite={handleInsertCite}
        onInsertStyle={handleInsertStyle}
        onSaveBibEntries={handleSaveBibEntries}
        onInsertRef={handleInsertRef}
        onInsertTocCode={handleInsertTocCode}
        onInsertComment={(commentCode) =>
          editorRef.current?.wrapSelection(commentCode, "", "")
        }
        onOpenReviewPanel={() => setPanel("review")}
        onOpenGitPanel={() => setPanel("git")}
        onOpenAnalysis={handleOpenAnalysis}
        onOpenDataset={() => {
          const datasetDocIndex = docs.findIndex((d) => d.kind === "dataset");
          if (datasetDocIndex !== -1) {
            openDoc(datasetDocIndex);
          }
        }}
        onOpenGuide={() => setGuideModalOpen(true)}
        onOpenLatexOutputModal={() => setLatexOutputModalOpen(true)}
        selectedTableStyle={tableStyle}
        hasResults={Boolean(analysisResult)}
      />

      <div className="flex flex-1 min-h-0">
        {/* Activity bar */}
        <ActivityBar
          activePanel={panel}
          onSelectPanel={setPanel}
          isOutlineDisabled={!isOutlineSupported}
        />

        {/* Resizable 3-panel layout */}
        <PanelGroup direction="horizontal" className="flex-1 h-full min-h-0">
          {/* Column 1: Sidebar */}
          <Panel
            id="sidebar-panel"
            defaultSize={20}
            minSize={15}
            maxSize={40}
            className="min-w-0 h-full"
          >
            <Sidebar
              panel={panel}
              docs={docs}
              activeDocIndex={activeDocIndex}
              activeDocName={activeDoc?.name}
              outlineTree={outlineTree}
              onNavigateOutline={(line) => editorRef.current?.jumpToLine(line)}
              chat={chat}
              searchQuery={searchQuery}
              projectName={projectName}
              onSelectProject={setProjectName}
              onSelectFile={handleSelectFile}
              onSelectDoc={openDoc}
              onSendMessage={handleAskAI}
              onInsertCodeSnippet={(code) =>
                updateContent(`${activeDoc?.content || ""}\n${code}`)
              }
              onChangeSearch={setSearchQuery}
              onSelectSearchResult={handleSelectSearchResult}
              activeDocContent={activeDoc?.content || ""}
              onJumpToNoteLine={(line) => editorRef.current?.jumpToLine(line)}
              onDeleteFile={handleDeleteFile}
              onRefreshDocs={handleRefreshDocs}
              onOpenWorkspace={handleOpenWorkspace}
              rootDocument={rootDocument}
              onSetRootDocument={setRootDocument}
            />
          </Panel>

          <PanelResizeHandle className="w-1 bg-zinc-200 dark:bg-zinc-800 hover:bg-blue-500 transition-colors cursor-col-resize active:bg-blue-600 focus:outline-none" />

          {/* Column 2: Editor Teks */}
          <Panel
            id="editor-panel"
            defaultSize={48}
            minSize={30}
            className="min-w-0 h-full"
          >
            <Editor
              ref={editorRef}
              docs={docs}
              openDocIndices={openDocIndices}
              activeDocIndex={activeDocIndex}
              onSelectTab={openDoc}
              onCloseTab={closeDoc}
              isDirty={isDirty}
              onSave={handleSave}
              onSyncToPdf={handleForwardSearch}
              onChangeContent={handleContentChange}
              theme={theme}
              projectName={projectName}
              onInsertLatex={handleInsertLatex}
            />
          </Panel>

          {isPreviewSupported && (
            <>
              <PanelResizeHandle className="w-1 bg-zinc-200 dark:bg-zinc-800 hover:bg-blue-500 transition-colors cursor-col-resize active:bg-blue-600 focus:outline-none" />

              {/* Column 3: Preview PDF */}
              <Panel
                id="preview-panel"
                defaultSize={32}
                minSize={20}
                className="min-w-0 h-full"
              >
                {activeDoc ? (
                  <PreviewPanel
                    doc={activeDoc}
                    bibEntries={bibEntries}
                    pdfBlobUrl={pdfBlobUrl}
                    usePdfViewer={Boolean(
                      pdfBlobUrl && activeDoc.kind === "tex",
                    )}
                    onCompile={handleCompile}
                    onInverseSearch={handleInverseSearch}
                    forwardTarget={forwardTarget}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-zinc-100 dark:bg-zinc-950 text-zinc-400 text-xs font-mono">
                    No active document
                  </div>
                )}
              </Panel>
            </>
          )}
        </PanelGroup>
      </div>

      {/* Status bar */}
      <StatusBar
        wordCount={words}
        docKind={activeDoc?.kind || "tex"}
        statusMessage={saveStatus}
      />

      {/* Global Statistical Analysis Dialog & Results Viewer */}
      <AnalysisDialog
        isOpen={analysisDialogOpen}
        onClose={() => setAnalysisDialogOpen(false)}
        columns={datasetColumns}
        filePath={datasetFilePath}
        projectName={projectName}
        analysisType={selectedAnalysisType}
        onAnalysisComplete={(res) => {
          setAnalysisResult(res);
          setResultModalOpen(true);
        }}
        onOpenGuide={() => setGuideModalOpen(true)}
      />
      <ResultsViewerModal
        isOpen={resultModalOpen}
        onClose={() => setResultModalOpen(false)}
        result={analysisResult}
        onInsertLatex={handleInsertLatex}
      />
      <StatisticalGuideModal
        isOpen={guideModalOpen}
        onClose={() => setGuideModalOpen(false)}
        onSelectAnalysis={(type) => {
          setGuideModalOpen(false);
          handleOpenAnalysis(type);
        }}
      />
      <LatexOutputModal
        isOpen={latexOutputModalOpen}
        onClose={() => setLatexOutputModalOpen(false)}
        selectedStyle={tableStyle}
        onSelectStyle={setTableStyle}
        onInsertSample={handleInsertLatex}
        onOpenLatestResults={() => {
          if (analysisResult) {
            setResultModalOpen(true);
          }
        }}
        hasLatestResults={Boolean(analysisResult)}
      />
    </div>
  );
}
