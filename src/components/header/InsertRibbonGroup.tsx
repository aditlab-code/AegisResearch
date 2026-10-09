import React, { useState, useEffect, useRef } from 'react'
import { Sigma, Table, Image, ChevronDown } from 'lucide-react'
import { MathPalettePopover } from './MathPalettePopover'
import { TableCreatorPopover } from './TableCreatorPopover'
import { FigureModalPopover } from './FigureModalPopover'

export interface InsertRibbonGroupProps {
  isLatex?: boolean
  onInsertCodeSnippet: (code: string) => void
}

export const InsertRibbonGroup: React.FC<InsertRibbonGroupProps> = ({ isLatex = true, onInsertCodeSnippet }) => {
  const [activePopover, setActivePopover] = useState<'equation' | 'table' | 'figure' | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const togglePopover = (type: 'equation' | 'table' | 'figure') => {
    setActivePopover((prev) => (prev === type ? null : type))
  }

  // Click-outside listener to dismiss popover cleanly
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setActivePopover(null)
      }
    }

    if (activePopover) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [activePopover])

  return (
    <div
      ref={containerRef}
      className="flex items-stretch gap-2 py-0.5 select-none overflow-visible relative"
    >
      {/* 1. Sub-panel Equations */}
      <div className="relative flex flex-col items-center justify-between px-3 border-r border-stone-200">
        <button
          type="button"
          onClick={() => togglePopover('equation')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs transition-colors ${
            activePopover === 'equation'
              ? 'bg-indigo-100 text-indigo-700 font-medium'
              : 'hover:bg-stone-100 text-stone-700'
          }`}
        >
          <Sigma className="size-4 text-indigo-600" />
          <span>Equation Builder</span>
          <ChevronDown className="size-3 text-stone-400" />
        </button>

        <span className="text-[9px] font-semibold text-stone-400 uppercase tracking-wider mt-1">
          Equations
        </span>

        {activePopover === 'equation' && (
          <div className="absolute top-[calc(100%+6px)] left-0 z-50 shadow-2xl">
            <MathPalettePopover
              isLatex={isLatex}
              onInsert={onInsertCodeSnippet}
              onClose={() => setActivePopover(null)}
            />
          </div>
        )}
      </div>

      {/* 2. Sub-panel Tables */}
      <div className="relative flex flex-col items-center justify-between px-3 border-r border-stone-200">
        <button
          type="button"
          onClick={() => togglePopover('table')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs transition-colors ${
            activePopover === 'table'
              ? 'bg-indigo-100 text-indigo-700 font-medium'
              : 'hover:bg-stone-100 text-stone-700'
          }`}
        >
          <Table className="size-4 text-indigo-600" />
          <span>Table Generator</span>
          <ChevronDown className="size-3 text-stone-400" />
        </button>

        <span className="text-[9px] font-semibold text-stone-400 uppercase tracking-wider mt-1">
          Tables
        </span>

        {activePopover === 'table' && (
          <div className="absolute top-[calc(100%+6px)] left-0 z-50 shadow-2xl">
            <TableCreatorPopover
              onInsert={onInsertCodeSnippet}
              onClose={() => setActivePopover(null)}
            />
          </div>
        )}
      </div>

      {/* 3. Sub-panel Illustrations / Figures */}
      <div className="relative flex flex-col items-center justify-between px-3">
        <button
          type="button"
          onClick={() => togglePopover('figure')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs transition-colors ${
            activePopover === 'figure'
              ? 'bg-indigo-100 text-indigo-700 font-medium'
              : 'hover:bg-stone-100 text-stone-700'
          }`}
        >
          <Image className="size-4 text-indigo-600" />
          <span>Sisipkan Gambar</span>
          <ChevronDown className="size-3 text-stone-400" />
        </button>

        <span className="text-[9px] font-semibold text-stone-400 uppercase tracking-wider mt-1">
          Illustrations
        </span>

        {activePopover === 'figure' && (
          <div className="absolute top-[calc(100%+6px)] left-0 z-50 shadow-2xl">
            <FigureModalPopover
              onInsert={onInsertCodeSnippet}
              onClose={() => setActivePopover(null)}
            />
          </div>
        )}
      </div>
    </div>
  )
}
