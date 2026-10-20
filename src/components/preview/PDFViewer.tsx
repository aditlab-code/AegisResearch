import React, { useState, useEffect, useRef, useCallback } from "react";
import * as pdfjsLib from "pdfjs-dist";
import pdfWorker from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import { Loader2 } from "lucide-react";
import "pdfjs-dist/web/pdf_viewer.css";
// Initialize PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

export interface SyncTeXForwardTarget {
  page: number;
  x: number; // in PDF points (72 DPI)
  y: number; // in PDF points (72 DPI)
  width: number;
  height: number;
  timestamp?: number;
}

export interface PDFViewerProps {
  pdfUrl?: string;
  zoom?: number;
  onInverseSearch?: (query: { page: number; x: number; y: number }) => void;
  syncEnabled?: boolean;
  forwardTarget?: SyncTeXForwardTarget | null;
  onPageChange?: (currentPage: number, totalPages: number) => void;
  onFitWidthCalculated?: (scale: number) => void;
  onPageDimensionsLoaded?: (dimensions: {
    width: number;
    height: number;
  }) => void;
}

interface SinglePageProps {
  pdfDoc: pdfjsLib.PDFDocumentProxy;
  pageNumber: number;
  scale: number;
  onDoubleClickHandler?: (
    page: number,
    clientX: number,
    clientY: number,
    rect: DOMRect,
  ) => void;
  syncEnabled?: boolean;
  isForwardTarget: boolean;
  forwardTarget: SyncTeXForwardTarget | null;
}

const SinglePDFPage: React.FC<SinglePageProps> = ({
  pdfDoc,
  pageNumber,
  scale,
  onDoubleClickHandler,
  syncEnabled = true,
  isForwardTarget,
  forwardTarget,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const textLayerRef = useRef<HTMLDivElement>(null);
  const renderTaskRef = useRef<pdfjsLib.RenderTask | null>(null);
  const textLayerTaskRef = useRef<pdfjsLib.TextLayer | null>(null);
  const [dimensions, setDimensions] = useState<{
    width: number;
    height: number;
  }>({ width: 0, height: 0 });

  useEffect(() => {
    let isCancelled = false;

    const renderPage = async () => {
      try {
        const page = await pdfDoc.getPage(pageNumber);
        if (isCancelled) return;

        const viewport = page.getViewport({ scale });
        setDimensions({
          width: Math.floor(viewport.width),
          height: Math.floor(viewport.height),
        });

        const canvas = canvasRef.current;
        if (!canvas) return;
        const context = canvas.getContext("2d");
        if (!context) return;

        // Cancel previous rendering tasks if any
        if (renderTaskRef.current) {
          try {
            renderTaskRef.current.cancel();
          } catch {
            // expected on rapid zoom
          }
        }
        if (textLayerTaskRef.current) {
          try {
            textLayerTaskRef.current.cancel();
          } catch {
            // expected on rapid zoom
          }
        }
        // Support High-DPI screens by configuring transform and buffer
        const dpr = window.devicePixelRatio || 1;
        canvas.width = Math.floor(viewport.width * dpr);
        canvas.height = Math.floor(viewport.height * dpr);
        canvas.style.width = `${Math.floor(viewport.width)}px`;
        canvas.style.height = `${Math.floor(viewport.height)}px`;

        const transform = dpr !== 1 ? [dpr, 0, 0, dpr, 0, 0] : undefined;

        const renderContext = {
          canvasContext: context,
          viewport,
          ...(transform ? { transform } : {}),
        };

        const task = page.render(renderContext);
        renderTaskRef.current = task;
        await task.promise;

        // Render Text Layer for text selection and copying
        if (textLayerRef.current) {
          textLayerRef.current.innerHTML = "";
          const textContent = await page.getTextContent();
          if (isCancelled) return;

          const textLayer = new pdfjsLib.TextLayer({
            textContentSource: textContent,
            container: textLayerRef.current,
            viewport,
          });
          textLayerTaskRef.current = textLayer;
          await textLayer.render();
        }
      } catch (err: unknown) {
        const isCancel = Boolean(
          err &&
          typeof err === "object" &&
          "name" in err &&
          err.name === "RenderingCancelledException",
        );
        if (!isCancel) {
          console.warn(`Error rendering page ${pageNumber}:`, err);
        }
      }
    };

    renderPage();

    return () => {
      isCancelled = true;
      if (renderTaskRef.current) {
        try {
          renderTaskRef.current.cancel();
        } catch {
          // ignore
        }
      }
      if (textLayerTaskRef.current) {
        try {
          textLayerTaskRef.current.cancel();
        } catch {
          // ignore
        }
      }
    };
  }, [pdfDoc, pageNumber, scale]);

  // Scroll into view if this page is targeted by forward search
  useEffect(() => {
    if (isForwardTarget && containerRef.current) {
      containerRef.current.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, [isForwardTarget, forwardTarget?.timestamp]);

  const handleDoubleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // If user has selected text, do not trigger SyncTeX
    const selection = window.getSelection()?.toString().trim();
    if (selection) return;

    if (!syncEnabled || !onDoubleClickHandler || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    onDoubleClickHandler(pageNumber, e.clientX, e.clientY, rect);
  };

  // Calculate forward search highlight box in screen pixels
  const highlightBox =
    isForwardTarget && forwardTarget
      ? {
          left: forwardTarget.x * scale,
          top: forwardTarget.y * scale,
          width: Math.max(forwardTarget.width * scale, 60),
          height: Math.max(forwardTarget.height * scale, 16),
        }
      : null;

  return (
    <div
      ref={containerRef}
      id={`pdf-page-${pageNumber}`}
      onDoubleClick={handleDoubleClick}
      className={`relative mb-6 bg-white shadow-md border border-zinc-300 dark:border-zinc-800 transition-all group shrink-0 ${
        syncEnabled ? "cursor-crosshair" : "cursor-text"
      }`}
      style={{
        width: dimensions.width ? `${dimensions.width}px` : undefined,
        height: dimensions.height ? `${dimensions.height}px` : undefined,
      }}
    >
      <canvas ref={canvasRef} className="block" style={{ display: "block" }} />

      {/* PDF.js Text Layer overlay for selecting and copying text */}
      <div
        ref={textLayerRef}
        className="textLayer absolute inset-0 overflow-hidden leading-none select-text"
        style={{
          width: dimensions.width ? `${dimensions.width}px` : undefined,
          height: dimensions.height ? `${dimensions.height}px` : undefined,
        }}
      />
      {/* Forward Search Animated Highlight Box */}
      {highlightBox && (
        <div
          key={`highlight-${forwardTarget?.timestamp || 0}`}
          className="absolute pointer-events-none rounded border-2 border-blue-500 bg-blue-500/25 animate-pulse z-20 transition-all"
          style={{
            left: `${highlightBox.left}px`,
            top: `${highlightBox.top}px`,
            width: `${highlightBox.width}px`,
            height: `${highlightBox.height}px`,
            boxShadow: "0 0 12px rgba(64, 120, 242, 0.6)",
          }}
        />
      )}

      {/* Page number badge on hover */}
      <div className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded bg-zinc-800/60 text-white text-[10px] font-mono opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
        p. {pageNumber}
      </div>
    </div>
  );
};

export const PDFViewer: React.FC<PDFViewerProps> = ({
  pdfUrl,
  zoom = 1.0,
  onInverseSearch,
  syncEnabled = true,
  forwardTarget = null,
  onPageChange,
  onFitWidthCalculated,
  onPageDimensionsLoaded,
}) => {
  const [pdfDoc, setPdfDoc] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
  const [numPages, setNumPages] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Load PDF Document
  useEffect(() => {
    if (!pdfUrl) {
      setPdfDoc(null);
      setNumPages(0);
      return;
    }

    let isCancelled = false;
    setLoading(true);
    setErrorMsg(null);

    const loadPdf = async () => {
      try {
        const cleanUrl = pdfUrl.split("#")[0];
        const loadingTask = pdfjsLib.getDocument({
          url: cleanUrl,
          cMapUrl: "https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/cmaps/",
          cMapPacked: true,
        });
        const doc = await loadingTask.promise;
        if (isCancelled) return;

        setPdfDoc(doc);
        setNumPages(doc.numPages);
        onPageChange?.(1, doc.numPages);

        // Capture natural page dimensions from first page
        if (doc.numPages > 0) {
          const firstPage = await doc.getPage(1);
          const viewport = firstPage.getViewport({ scale: 1.0 });
          onPageDimensionsLoaded?.({
            width: viewport.width,
            height: viewport.height,
          });

          // Compute fit width scale if container available
          if (onFitWidthCalculated && scrollContainerRef.current) {
            const containerWidth = scrollContainerRef.current.clientWidth - 48;
            if (viewport.width > 0 && containerWidth > 0) {
              const fitScale = Math.min(
                2.0,
                Math.max(0.4, +(containerWidth / viewport.width).toFixed(2)),
              );
              onFitWidthCalculated(fitScale);
            }
          }
        }
      } catch (err: unknown) {
        if (!isCancelled) {
          console.error("Failed to load PDF via pdfjs-dist:", err);
          setErrorMsg("Failed to render PDF preview. Please recompile.");
        }
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    };

    loadPdf();

    return () => {
      isCancelled = true;
    };
  }, [pdfUrl]);

  // Track visible page on scroll
  const handleScroll = useCallback(() => {
    if (!scrollContainerRef.current || numPages <= 1) return;
    const container = scrollContainerRef.current;
    const containerMid = container.scrollTop + container.clientHeight / 3;

    for (let i = 1; i <= numPages; i++) {
      const pageEl = document.getElementById(`pdf-page-${i}`);
      if (pageEl) {
        const top = pageEl.offsetTop;
        const height = pageEl.clientHeight;
        if (containerMid >= top && containerMid <= top + height) {
          onPageChange?.(i, numPages);
          break;
        }
      }
    }
  }, [numPages, onPageChange]);

  // Double click handler for SyncTeX inverse search
  const handlePageDoubleClick = useCallback(
    (page: number, clientX: number, clientY: number, rect: DOMRect) => {
      // Guard against selected text during double click
      const selection = window.getSelection()?.toString().trim();
      if (selection) return;

      if (!syncEnabled || !onInverseSearch) return;

      const clickX = clientX - rect.left;
      const clickY = clientY - rect.top;
      // Convert from screen CSS pixels to 72-DPI big points
      const pdfX = +(clickX / zoom).toFixed(2);
      const pdfY = +(clickY / zoom).toFixed(2);

      onInverseSearch({
        page,
        x: pdfX,
        y: pdfY,
      });
    },
    [syncEnabled, onInverseSearch, zoom],
  );

  if (!pdfUrl) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-zinc-100 dark:bg-zinc-950 text-zinc-400 text-xs font-mono">
        Belum ada PDF terkompilasi.
      </div>
    );
  }

  if (loading) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-200 dark:bg-zinc-950 text-zinc-500 gap-2 text-xs font-mono">
        <Loader2 className="size-6 animate-spin text-blue-500" />
        <span>Memuat PDF Preview...</span>
      </div>
    );
  }

  if (errorMsg) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-zinc-200 dark:bg-zinc-950 text-red-500 text-xs font-mono p-4 text-center">
        {errorMsg}
      </div>
    );
  }

  return (
    <div
      ref={scrollContainerRef}
      onScroll={handleScroll}
      className="w-full h-full bg-zinc-200/90 dark:bg-zinc-950 overflow-y-auto overflow-x-auto p-6 flex flex-col items-center"
      style={{ scrollBehavior: "smooth" }}
    >
      {pdfDoc &&
        Array.from({ length: numPages }, (_, i) => i + 1).map((pageNum) => (
          <SinglePDFPage
            key={`page-${pageNum}-${pdfUrl}`}
            pdfDoc={pdfDoc}
            pageNumber={pageNum}
            scale={zoom}
            onDoubleClickHandler={handlePageDoubleClick}
            syncEnabled={syncEnabled}
            isForwardTarget={forwardTarget?.page === pageNum}
            forwardTarget={forwardTarget}
          />
        ))}
    </div>
  );
};
