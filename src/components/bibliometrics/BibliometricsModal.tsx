import React, { useState } from "react";
import { ThematicCluster } from "../../types/bibliometrics";
import {
  BibliometricsModalProps,
  BibliometricsTab,
  BibliometricsVisualParams,
} from "./types";
import { useBibliometricsData } from "./hooks/useBibliometricsData";
import { NavSidebar } from "./panels/NavSidebar";
import { ConfigPanel } from "./panels/ConfigPanel";
import { NetworkView } from "./views/NetworkView";
import { ThematicMapView } from "./views/ThematicMapView";
import { ThematicEvolutionView } from "./views/ThematicEvolutionView";
import { BibliometricLawsView } from "./views/BibliometricLawsView";
import { StopwordsView } from "./views/StopwordsView";
import { TikzExportView } from "./views/TikzExportView";

export const BibliometricsModal: React.FC<BibliometricsModalProps> = ({
  isOpen,
  onClose,
  workspaceId,
  filePath,
  onInsertLatex,
}) => {
  const [activeTab, setActiveTab] = useState<BibliometricsTab>("network");
  const [selectedCluster, setSelectedCluster] =
    useState<ThematicCluster | null>(null);

  // Single Source of Truth: Visual layout parameters (client-side 60 FPS)
  const [visualParams, setVisualParams] = useState<BibliometricsVisualParams>({
    spacingScale: 1.0,
    nodeSizeScale: 0.9,
    zoom: 1.0,
  });

  // Single Source of Truth: Backend data parameters & queries
  const {
    dataParams,
    setDataParams,
    overview,
    network,
    thematic,
    evolution,
    laws,
    loading,
    error,
    applyDataParams,
    addStopword,
    removeStopword,
    clearStopwords,
    addAcademicPresets,
  } = useBibliometricsData(workspaceId, filePath, isOpen);

  if (!isOpen) return null;

  const fileName = filePath ? filePath.split("/").pop() : "document.bib";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-3">
      <div className="flex flex-col w-[96vw] max-w-7xl h-[92vh] bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-800 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Top Header */}
        <header className="flex items-center justify-between px-5 py-3 border-b border-gray-200 dark:border-gray-800 bg-gray-50/80 dark:bg-gray-900/80 select-none">
          <div className="flex items-center gap-3">
            <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">
              Bibliometrics Studio
            </h2>
            <span className="px-2 py-0.5 text-xs font-mono rounded bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300">
              {fileName}
            </span>
            <span className="text-xs text-gray-500 hidden sm:inline">
              Native Scientometric Workbench
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab("tikz")}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${
                activeTab === "tikz"
                  ? "bg-blue-600 text-white border-blue-600"
                  : "border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              }`}
            >
              Export TikZ
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-200 dark:hover:bg-gray-800 text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 text-base font-bold transition-colors"
              title="Close modal"
            >
              ✕
            </button>
          </div>
        </header>

        {/* Error Notification Banner */}
        {error && (
          <div className="px-5 py-2 bg-red-50 dark:bg-red-950/50 border-b border-red-200 dark:border-red-900 text-xs text-red-700 dark:text-red-300 flex items-center justify-between">
            <span>{error}</span>
            <button
              type="button"
              onClick={() => applyDataParams()}
              className="font-semibold underline ml-3"
            >
              Retry
            </button>
          </div>
        )}

        {/* Studio 3-Column Body Layout */}
        <div className="flex-1 flex min-h-0 overflow-hidden">
          {/* Column 1: Left Navigation Sidebar */}
          <NavSidebar
            activeTab={activeTab}
            onTabChange={setActiveTab}
            overview={overview}
            excludedCount={dataParams.excludeKeywords.length}
          />

          {/* Column 2: Center Interactive Visual Viewport */}
          <main className="flex-1 flex flex-col min-w-0 bg-white dark:bg-gray-950 overflow-hidden">
            {activeTab === "network" && (
              <NetworkView
                network={network}
                spacingScale={visualParams.spacingScale}
                nodeSizeScale={visualParams.nodeSizeScale}
                zoom={visualParams.zoom}
                setZoom={(updater) =>
                  setVisualParams((prev) => ({
                    ...prev,
                    zoom:
                      typeof updater === "function"
                        ? updater(prev.zoom)
                        : updater,
                  }))
                }
                loading={loading}
              />
            )}

            {activeTab === "thematic" && (
              <ThematicMapView
                thematic={thematic}
                selectedCluster={selectedCluster}
                onSelectCluster={setSelectedCluster}
                nodeSizeScale={visualParams.nodeSizeScale}
                zoom={visualParams.zoom}
                setZoom={(updater) =>
                  setVisualParams((prev) => ({
                    ...prev,
                    zoom:
                      typeof updater === "function"
                        ? updater(prev.zoom)
                        : updater,
                  }))
                }
                loading={loading}
              />
            )}

            {activeTab === "evolution" && (
              <ThematicEvolutionView evolution={evolution} loading={loading} />
            )}

            {activeTab === "laws" && (
              <BibliometricLawsView laws={laws} loading={loading} />
            )}

            {activeTab === "stopwords" && (
              <StopwordsView
                excludeKeywords={dataParams.excludeKeywords}
                onAddStopword={addStopword}
                onRemoveStopword={removeStopword}
                onClearStopwords={clearStopwords}
                onAddAcademicPresets={addAcademicPresets}
                loading={loading}
              />
            )}

            {activeTab === "tikz" && (
              <TikzExportView
                thematic={thematic}
                laws={laws}
                onInsertLatex={onInsertLatex}
                onClose={onClose}
              />
            )}
          </main>

          {/* Column 3: Right Configuration Panel */}
          <ConfigPanel
            activeTab={activeTab}
            dataParams={dataParams}
            setDataParams={setDataParams}
            visualParams={visualParams}
            setVisualParams={setVisualParams}
            onApplyFilter={() => {
              setSelectedCluster(null);
              applyDataParams();
            }}
            onAddStopword={addStopword}
            onRemoveStopword={removeStopword}
            onAddAcademicPresets={addAcademicPresets}
            onClearStopwords={clearStopwords}
            selectedCluster={selectedCluster}
            laws={laws}
            loading={loading}
          />
        </div>
      </div>
    </div>
  );
};
