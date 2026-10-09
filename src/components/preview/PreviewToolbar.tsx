import React from 'react'
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  ChevronLeft,
  ChevronRight,
  FileSpreadsheet,
} from 'lucide-react'
import { PaperSize } from '../../types'

export interface PreviewToolbarProps {
  currentPage: number
  totalPages: number
  zoom: number // 1.0 = 100%
  paperSize: PaperSize
  onChangePage?: (page: number) => void
  onZoomIn: () => void
  onZoomOut: () => void
  onSetZoom: (zoom: number) => void
  onFitWidth: () => void
  onFitPage: () => void
  onChangePaperSize: (size: PaperSize) => void
}

const ZOOM_OPTIONS = [0.5, 0.75, 1.0, 1.25, 1.5, 2.0]

export const PreviewToolbar: React.FC<PreviewToolbarProps> = ({
  currentPage,
  totalPages,
  zoom,
  paperSize,
  onChangePage,
  onZoomIn,
  onZoomOut,
  onSetZoom,
  onFitWidth,
  onFitPage,
  onChangePaperSize,
}) => {
  const zoomPercent = Math.round(zoom * 100)

  return (
    <div className="flex items-center justify-between px-3 py-1.5 bg-zinc-100 dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 text-xs border-b border-zinc-200 dark:border-zinc-800 select-none shrink-0 shadow-xs">
      {/* Page Navigation */}
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => onChangePage?.(Math.max(1, currentPage - 1))}
          disabled={currentPage <= 1}
          title="Halaman Sebelumnya"
          className="p-1 rounded hover:bg-zinc-200/70 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
        >
          <ChevronLeft className="size-4" />
        </button>
        <div className="flex items-center gap-1 font-mono text-[11px]">
          <span className="bg-white dark:bg-zinc-800 px-2 py-0.5 rounded border border-zinc-200 dark:border-zinc-700 text-center min-w-[28px] text-zinc-800 dark:text-zinc-200">
            {currentPage}
          </span>
          <span className="text-zinc-400">/</span>
          <span className="text-zinc-500 dark:text-zinc-400">{totalPages}</span>
        </div>
        <button
          type="button"
          onClick={() => onChangePage?.(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage >= totalPages}
          title="Halaman Selanjutnya"
          className="p-1 rounded hover:bg-zinc-200/70 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
        >
          <ChevronRight className="size-4" />
        </button>
      </div>

      {/* Middle: Zoom Controls */}
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={onZoomOut}
          title="Perkecil (Zoom Out)"
          className="p-1 rounded hover:bg-zinc-200/70 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 transition-colors"
        >
          <ZoomOut className="size-4" />
        </button>

        <select
          value={zoomPercent}
          onChange={(e) => onSetZoom(Number(e.target.value) / 100)}
          aria-label="Persentase Zoom"
          className="bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 rounded px-1.5 py-0.5 text-[11px] font-mono focus:outline-none focus:border-blue-500 cursor-pointer"
        >
          {ZOOM_OPTIONS.map((val) => {
            const p = Math.round(val * 100)
            return (
              <option key={p} value={p}>
                {p}%
              </option>
            )
          })}
          {!ZOOM_OPTIONS.some((v) => Math.round(v * 100) === zoomPercent) && (
            <option value={zoomPercent}>{zoomPercent}%</option>
          )}
        </select>

        <button
          type="button"
          onClick={onZoomIn}
          title="Perbesar (Zoom In)"
          className="p-1 rounded hover:bg-zinc-200/70 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 transition-colors"
        >
          <ZoomIn className="size-4" />
        </button>

        <div className="w-[1px] h-4 bg-zinc-200 dark:bg-zinc-700 mx-1" />

        <button
          type="button"
          onClick={onFitWidth}
          title="Sesuaikan Lebar (Fit to Width)"
          className="p-1 rounded hover:bg-zinc-200/70 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 transition-colors flex items-center gap-1 text-[11px]"
        >
          <Maximize2 className="size-3.5" />
          <span className="hidden sm:inline">Fit Lebar</span>
        </button>

        <button
          type="button"
          onClick={onFitPage}
          title="Sesuaikan Halaman (Fit to Page)"
          className="p-1 rounded hover:bg-zinc-200/70 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 transition-colors flex items-center gap-1 text-[11px]"
        >
          <Minimize2 className="size-3.5" />
          <span className="hidden sm:inline">Fit Halaman</span>
        </button>
      </div>

      {/* Right: Paper Layout Preset Selector */}
      <div className="flex items-center gap-1.5">
        <FileSpreadsheet className="size-3.5 text-zinc-400" />
        <select
          value={paperSize}
          onChange={(e) => onChangePaperSize(e.target.value as PaperSize)}
          aria-label="Pilih Ukuran Kertas"
          className="bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 rounded px-2 py-0.5 text-[11px] focus:outline-none focus:border-blue-500 cursor-pointer"
        >
          <option value="a4">A4 (210×297)</option>
          <option value="f4">F4 (215×330)</option>
          <option value="letter">Letter</option>
          <option value="custom">Custom .tex</option>
        </select>
      </div>
    </div>
  )
}
