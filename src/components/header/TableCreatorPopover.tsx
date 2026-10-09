import React, { useState } from 'react'
import { X, Table as TableIcon } from 'lucide-react'

export interface TableCreatorPopoverProps {
  onInsert: (code: string) => void
  onClose: () => void
}

export const TableCreatorPopover: React.FC<TableCreatorPopoverProps> = ({ onInsert, onClose }) => {
  const [rows, setRows] = useState(3)
  const [cols, setCols] = useState(3)
  const [caption, setCaption] = useState('Data Penelitian')
  const [hovered, setHovered] = useState<{ r: number; c: number } | null>(null)

  const maxGrid = 6

  const handleGenerateTable = (targetRows = rows, targetCols = cols) => {
    const colAlign = Array(targetCols).fill('c').join('|')
    const headerRow = Array.from({ length: targetCols }, (_, i) => `Kolom ${i + 1}`).join(' & ')

    let bodyRows = ''
    for (let r = 1; r < targetRows; r++) {
      const rowData = Array.from({ length: targetCols }, (_, c) => `Data ${r},${c + 1}`).join(' & ')
      bodyRows += `    ${rowData} \\\\\n`
    }

    const latexCode = `\\begin{table}[htbp]
  \\centering
  \\caption{${caption || 'Judul Tabel'}}
  \\label{tab:${(caption || 'tabel').toLowerCase().replace(/\\s+/g, '-')}}
  \\begin{tabular}{|${colAlign}|}
    \\hline
    ${headerRow} \\\\
    \\hline
${bodyRows}    \\hline
  \\end{tabular}
\\end{table}\n`

    onInsert(latexCode)
    onClose()
  }

  return (
    <div className="absolute top-full left-0 mt-1 w-72 bg-white border border-stone-300 rounded-lg shadow-xl z-50 text-stone-800 select-none p-3">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-stone-200 mb-3">
        <div className="flex items-center gap-1.5">
          <TableIcon className="size-4 text-indigo-600" />
          <span className="text-xs font-semibold text-stone-700">Buat Tabel Interaktif</span>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-1 text-stone-400 hover:text-stone-700 rounded hover:bg-stone-100"
        >
          <X className="size-3.5" />
        </button>
      </div>

      {/* Visual Grid Selector */}
      <div className="flex flex-col items-center mb-3">
        <div className="grid grid-cols-6 gap-1 p-2 bg-stone-50 border border-stone-200 rounded">
          {Array.from({ length: maxGrid }).map((_, rIdx) =>
            Array.from({ length: maxGrid }).map((_, cIdx) => {
              const r = rIdx + 1
              const c = cIdx + 1
              const isSelected = hovered
                ? r <= hovered.r && c <= hovered.c
                : r <= rows && c <= cols

              return (
                <div
                  key={`${r}-${c}`}
                  onMouseEnter={() => setHovered({ r, c })}
                  onMouseLeave={() => setHovered(null)}
                  onClick={() => {
                    setRows(r)
                    setCols(c)
                    handleGenerateTable(r, c)
                  }}
                  className={`size-5 rounded border cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-indigo-500 border-indigo-600'
                      : 'bg-white border-stone-300 hover:border-indigo-400'
                  }`}
                />
              )
            }),
          )}
        </div>
        <span className="text-[11px] font-mono text-stone-500 mt-1">
          {hovered ? `${hovered.r} Baris × ${hovered.c} Kolom` : `${rows} Baris × ${cols} Kolom`}
        </span>
      </div>

      {/* Inputs for manual rows/cols & caption */}
      <div className="space-y-2 mb-3">
        <div>
          <label className="text-[10px] font-medium text-stone-500 block mb-0.5">Judul Tabel (Caption)</label>
          <input
            type="text"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Deskripsi tabel..."
            className="w-full text-xs px-2 py-1 border border-stone-300 rounded focus:outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Action Button */}
      <button
        type="button"
        onClick={() => handleGenerateTable(rows, cols)}
        className="w-full py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-xs font-semibold shadow-sm transition-colors"
      >
        Sisipkan Tabel ({rows}×{cols})
      </button>
    </div>
  )
}
