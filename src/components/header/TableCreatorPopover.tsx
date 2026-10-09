import React, { useState } from 'react'
import { Table as TableIcon } from 'lucide-react'
import { PopoverShell } from './PopoverShell'

export interface TableCreatorPopoverProps {
  onInsert: (code: string) => void
  onClose: () => void
}

export const TableCreatorPopover: React.FC<TableCreatorPopoverProps> = ({ onInsert, onClose }) => {
  const [rows, setRows] = useState(3)
  const [cols, setCols] = useState(3)
  const [caption, setCaption] = useState('Experiment Results')
  const [hovered, setHovered] = useState<{ r: number; c: number } | null>(null)

  const maxGrid = 6

  const handleGenerateTable = (targetRows = rows, targetCols = cols) => {
    const colAlign = Array(targetCols).fill('c').join('|')
    const headerRow = Array.from({ length: targetCols }, (_, i) => `Col ${i + 1}`).join(' & ')

    let bodyRows = ''
    for (let r = 1; r < targetRows; r++) {
      const rowData = Array.from({ length: targetCols }, (_, c) => `Val ${r},${c + 1}`).join(' & ')
      bodyRows += `    ${rowData} \\\\\n`
    }

    const latexCode = `\\begin{table}[htbp]
  \\centering
  \\caption{${caption || 'Table Caption'}}
  \\label{tab:${(caption || 'table').toLowerCase().replace(/[^a-z0-9]/g, '-')}}
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
    <PopoverShell title="Table Builder" icon={TableIcon} onClose={onClose} widthClass="w-72">
      {/* Visual Grid Selector */}
      <div className="flex flex-col items-center mb-2.5">
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
          {hovered ? `${hovered.r} Rows × ${hovered.c} Cols` : `${rows} Rows × ${cols} Cols`}
        </span>
      </div>

      {/* Caption Input */}
      <div className="mb-2.5">
        <input
          type="text"
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          placeholder="Table caption..."
          className="w-full text-xs px-2 py-1 border border-stone-300 rounded focus:outline-none focus:border-indigo-500"
        />
      </div>

      {/* Action Button */}
      <button
        type="button"
        onClick={() => handleGenerateTable(rows, cols)}
        className="w-full py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-xs font-semibold shadow-sm transition-colors"
      >
        Insert Table ({rows}×{cols})
      </button>
    </PopoverShell>
  )
}
