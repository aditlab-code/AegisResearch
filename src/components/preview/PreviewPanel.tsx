import React, { useState, useEffect, useRef, useCallback } from 'react'
import { FileCode, Play } from 'lucide-react'
import { Doc, PaperSize, PAPER_PRESETS } from '../../types'
import { DocPreview } from './DocPreview'
import { PDFViewer } from './PDFViewer'
import { PreviewToolbar } from './PreviewToolbar'
import { PaperSheet } from './PaperSheet'
import { detectLatexPaperSize } from '../../utils'

export interface PreviewPanelProps {
  doc: Doc
  pdfBlobUrl?: string
  usePdfViewer?: boolean
  onCompile?: () => void
}

export const PreviewPanel: React.FC<PreviewPanelProps> = ({
  doc,
  pdfBlobUrl,
  usePdfViewer = false,
  onCompile,
}) => {
  const containerRef = useRef<HTMLDivElement>(null)

  const [paperSize, setPaperSize] = useState<PaperSize>('a4')
  const [zoom, setZoom] = useState<number>(1.0)
  const [currentPage, setCurrentPage] = useState<number>(1)
  const [totalPages, setTotalPages] = useState<number>(1)

  const isLatex = doc.kind === 'tex'

  // Auto-detect paper size from doc content if kind is tex
  useEffect(() => {
    if (doc.kind === 'tex') {
      const detected = detectLatexPaperSize(doc.content)
      setPaperSize(detected)
    } else {
      setPaperSize('a4')
    }
  }, [doc.name, doc.kind, doc.content])

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(2.5, +(prev + 0.15).toFixed(2)))
  }

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(0.4, +(prev - 0.15).toFixed(2)))
  }

  const handleFitWidth = useCallback(() => {
    if (!containerRef.current) return
    const containerWidth = containerRef.current.clientWidth - 64
    const preset = PAPER_PRESETS[paperSize] || PAPER_PRESETS.a4
    const newZoom = Math.min(2.0, Math.max(0.4, containerWidth / preset.baseWidthPx))
    setZoom(+newZoom.toFixed(2))
  }, [paperSize])

  const handleFitPage = useCallback(() => {
    if (!containerRef.current) return
    const containerHeight = containerRef.current.clientHeight - 80
    const preset = PAPER_PRESETS[paperSize] || PAPER_PRESETS.a4
    const newZoom = Math.min(2.0, Math.max(0.4, containerHeight / preset.baseHeightPx))
    setZoom(+newZoom.toFixed(2))
  }, [paperSize])

  // CASE 1: LATEX WITH READY PDF -> 100% FULL-PANEL NATIVE BROWSER VIEWER
  if (isLatex && pdfBlobUrl) {
    return (
      <section className="w-full h-full bg-zinc-200 dark:bg-zinc-950 overflow-hidden">
        <PDFViewer pdfUrl={pdfBlobUrl} />
      </section>
    )
  }

  // CASE 2: LATEX WITHOUT COMPILED PDF -> CLEAN EMPTY STATE WITH COMPILE BUTTON
  if (isLatex && !pdfBlobUrl) {
    return (
      <section className="w-full h-full flex items-center justify-center bg-zinc-100 dark:bg-zinc-950 p-6 select-none">
        <div className="max-w-sm w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-8 flex flex-col items-center text-center shadow-lg">
          <div className="size-14 rounded-full bg-blue-50 dark:bg-zinc-800 flex items-center justify-center text-[#4078f2] dark:text-[#61afef] mb-4 border border-zinc-200 dark:border-zinc-700">
            <FileCode className="size-7" />
          </div>
          <h3 className="text-zinc-900 dark:text-white font-medium text-sm mb-1">PDF Belum Terkompilasi</h3>
          <p className="text-zinc-500 dark:text-zinc-400 text-xs mb-6 leading-relaxed">
            Dokumen LaTeX <span className="font-mono text-zinc-700 dark:text-zinc-300">"{doc.name}"</span> belum
            memiliki file PDF di disk. Klik tombol di bawah untuk mengompilasi dengan pdflatex.
          </p>
          {onCompile && (
            <button
              type="button"
              onClick={onCompile}
              className="flex items-center gap-2 px-4 py-2 bg-[#4078f2] hover:bg-[#3362c4] dark:bg-[#61afef] dark:hover:bg-[#528bff] text-white dark:text-zinc-950 text-xs font-semibold rounded-lg shadow-sm transition-colors"
            >
              <Play className="size-3.5 fill-current" />
              Kompilasi PDF Sekarang
            </button>
          )}
        </div>
      </section>
    )
  }

  // CASE 3: MARKDOWN MODE -> TRUE PRINT SHEET WITH CUSTOM TOOLBAR
  return (
    <section className="w-full h-full flex flex-col bg-zinc-200 dark:bg-zinc-950 overflow-hidden select-none">
      <PreviewToolbar
        currentPage={currentPage}
        totalPages={totalPages}
        zoom={zoom}
        paperSize={paperSize}
        onChangePage={setCurrentPage}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onSetZoom={setZoom}
        onFitWidth={handleFitWidth}
        onFitPage={handleFitPage}
        onChangePaperSize={setPaperSize}
      />

      <div
        ref={containerRef}
        className="flex-1 w-full h-full overflow-auto p-8 flex justify-center items-start"
        style={{ scrollBehavior: 'smooth' }}
      >
        <PaperSheet paperSize={paperSize} zoom={zoom} pageNumber={currentPage}>
          <DocPreview doc={doc} />
        </PaperSheet>
      </div>
    </section>
  )
}
