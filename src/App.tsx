import { useState, useEffect, useRef, useMemo } from "react";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import {
  RibbonTab,
  PanelType,
  ChatMessage,
  FileNode,
  WorkspaceEntry,
} from "./types";
import { DEFAULT_CHAT_MESSAGES } from "./constants";
import { countWords, parseDocumentOutline } from "./utils";
import { projectService } from "./services/projects";
import { compilerService } from "./services/compiler";
import {
  useDocumentManager,
  useCompiler,
  useKeyboardShortcuts,
  useTheme,
  useSyncTeXCoordination,
  useBibliographyActions,
  useEditorFormatting,
  useAnalysisWorkspace,
} from "./hooks";
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
  BibliometricsModal,
} from "./components";

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
    isCompiling: _isCompiling,
    compileResult: _compileResult,
  } = useCompiler(projectName);
  const { theme, toggleTheme } = useTheme();

  const [ribbonTab, setRibbonTab] = useState<RibbonTab>("Home");
  const [panel, setPanel] = useState<PanelType>("files");
  const [chat, setChat] = useState<ChatMessage[]>(DEFAULT_CHAT_MESSAGES);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDirty, setIsDirty] = useState(false);
  const [saveStatus, setSaveStatus] = useState("✓ Ready");
  const editorRef = useRef<CodeEditorHandle>(null);
  const [rootDocument, setRootDocument] = useState<string>("main.tex");

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
      if (activeDoc.kind === "dataset") return;
      try {
        const targetPath = activeDoc.path || activeDoc.name;
        const content = await projectService.readFile(projectName, targetPath);
        if (isMounted) {
          setDocContent(targetPath, content);
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
    ) {
      return;
    }
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
      if (activeDoc.kind === "dataset") return;
      try {
        const targetPath = activeDoc.path || activeDoc.name;
        const updated = await projectService.readFile(projectName, targetPath);
        if (updated !== undefined) {
          setDocContent(targetPath, updated);
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

  // Facade Hook Integrations
  const { forwardTarget, handleInverseSearch, handleForwardSearch } =
    useSyncTeXCoordination({
      projectName,
      rootDocument,
      activeDoc,
      editorRef,
      openOrCreateDoc,
      setDocContent,
      setSaveStatus,
    });

  const {
    bibEntries,
    scannedLabels,
    handleSaveBibEntries,
    handleInsertCite,
    handleInsertStyle,
    handleInsertRef,
    handleInsertTocCode,
  } = useBibliographyActions({
    projectName,
    activeDoc,
    editorRef,
    updateContent,
    setSaveStatus,
  });

  const {
    handleRibbonSnippet,
    handleClipboardAction,
    handleFormatAction,
    handleAlignAction,
    handleStructureAction,
    handlePageAction,
  } = useEditorFormatting({
    activeDoc,
    editorRef,
    insertSnippet,
    updateContent,
    handleSave,
    handleCompile,
    setSaveStatus,
  });

  const {
    analysisDialogOpen,
    setAnalysisDialogOpen,
    selectedAnalysisType,
    analysisResult,
    setAnalysisResult,
    resultModalOpen,
    setResultModalOpen,
    guideModalOpen,
    setGuideModalOpen,
    latexOutputModalOpen,
    setLatexOutputModalOpen,
    tableStyle,
    setTableStyle,
    datasetColumns,
    datasetFilePath,
    bibliometricsModalOpen,
    setBibliometricsModalOpen,
    activeBibFilePath,
    handleOpenAnalysis,
    handleOpenDatasetDoc,
  } = useAnalysisWorkspace({
    projectName,
    docs,
    activeDoc,
    openDoc,
    openOrCreateDoc,
    setSaveStatus,
  });

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
        onOpenDataset={handleOpenDatasetDoc}
        onOpenGuide={() => setGuideModalOpen(true)}
        onOpenLatexOutputModal={() => setLatexOutputModalOpen(true)}
        onOpenBibliometrics={() => setBibliometricsModalOpen(true)}
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
        projectName={projectName}
        filePath={datasetFilePath}
        onInsertLatex={handleInsertLatex}
        onClearAnalysis={() => setAnalysisResult(null)}
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
      <BibliometricsModal
        isOpen={bibliometricsModalOpen}
        onClose={() => setBibliometricsModalOpen(false)}
        workspaceId={projectName}
        filePath={activeBibFilePath}
        onInsertLatex={handleInsertLatex}
      />
    </div>
  );
}
