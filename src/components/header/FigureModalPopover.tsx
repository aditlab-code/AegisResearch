import React, { useState } from 'react'
import { X, Image as ImageIcon, FolderOpen } from 'lucide-react'

export interface FigureModalPopoverProps {
  onInsert: (code: string) => void
  onClose: () => void
}

export const FigureModalPopover: React.FC<FigureModalPopoverProps> = ({ onInsert, onClose }) => {
  const [filePath, setFilePath] = useState('figures/diagram.png')
  const [caption, setCaption] = useState('Ilustrasi Kerangka Kerja')
  const [width, setWidth] = useState('0.8\\textwidth')

  const handleInsert = (e: React.FormEvent) => {
    e.preventDefault()
    const safeCaption = caption.trim() || 'Judul Gambar'
    const safePath = filePath.trim() || 'figures/image.png'
    const labelKey = safeCaption.toLowerCase().replace(/[^a-z0-9]/g, '-')

    const latexCode = `\\begin{figure}[htbp]
  \\centering
  \\includegraphics[width=${width}]{${safePath}}
  \\caption{${safeCaption}}
  \\label{fig:${labelKey}}
\\end{figure}\n`

    onInsert(latexCode)
    onClose()
  }

  return (
    <div className="absolute top-full left-0 mt-1 w-80 bg-white border border-stone-300 rounded-lg shadow-2xl z-50 text-stone-800 select-none p-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-stone-200 mb-3">
        <div className="flex items-center gap-1.5">
          <ImageIcon className="size-4 text-indigo-600" />
          <span className="text-xs font-semibold text-stone-700">Sisipkan Gambar (Figure)</span>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-1 text-stone-400 hover:text-stone-700 rounded hover:bg-stone-100"
        >
          <X className="size-3.5" />
        </button>
      </div>

      {/* Form without backdrop overlay */}
      <form onSubmit={handleInsert} className="space-y-2.5 text-xs">
        <div>
          <label className="text-[11px] font-medium text-stone-600 block mb-1">
            Path File Gambar:
          </label>
          <div className="flex gap-1">
            <input
              type="text"
              value={filePath}
              onChange={(e) => setFilePath(e.target.value)}
              placeholder="figures/contoh.png"
              className="flex-1 px-2 py-1 border border-stone-300 rounded font-mono text-[11px] focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        <div>
          <label className="text-[11px] font-medium text-stone-600 block mb-1">
            Keterangan Gambar (Caption):
          </label>
          <input
            type="text"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Deskripsi gambar..."
            className="w-full px-2 py-1 border border-stone-300 rounded focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div>
          <label className="text-[11px] font-medium text-stone-600 block mb-1">
            Skala / Lebar Gambar:
          </label>
          <select
            value={width}
            onChange={(e) => setWidth(e.target.value)}
            className="w-full px-2 py-1 border border-stone-300 rounded bg-white focus:outline-none focus:border-indigo-500 font-mono text-[11px]"
          >
            <option value="0.5\\textwidth">50% Lebar Teks (0.5\textwidth)</option>
            <option value="0.7\\textwidth">70% Lebar Teks (0.7\textwidth)</option>
            <option value="0.8\\textwidth">80% Lebar Teks (0.8\textwidth - Rekomendasi)</option>
            <option value="1.0\\textwidth">100% Lebar Penuh (1.0\textwidth)</option>
            <option value="12cm">12 cm (Tetap)</option>
          </select>
        </div>

        <div className="pt-2">
          <button
            type="submit"
            className="w-full py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-xs font-semibold shadow-sm transition-colors"
          >
            Sisipkan Figure
          </button>
        </div>
      </form>
    </div>
  )
}
