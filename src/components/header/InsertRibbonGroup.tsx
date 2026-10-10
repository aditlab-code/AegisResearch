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

  // Click-outside listener
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
      className="h-full flex items-stretch gap-2 select-none overflow-visible relative text-zinc-700 dark:text-zinc-200"
    >
      {/* 1. Sub-panel Equations */}
      <div className="relative h-full flex flex-col items-center justify-between py-1 px-3 border-r border-zinc-200 dark:border-zinc-800">
        <button
          type="button"
          onClick={() => togglePopover('equation')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs transition-colors ${
            activePopover === 'equation'
              ? 'bg-blue-50 dark:bg-zinc-800 text-blue-600 dark:text-blue-400 font-medium'
              : 'hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-200'
          }`}
        >
          <Sigma className="size-4 text-blue-600 dark:text-blue-400" />
          <span>Equation Builder</span>
          <ChevronDown className="size-3 text-zinc-400 dark:text-zinc-500" />
        </button>

        <span className="text-[9px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mt-1">
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
      <div className="relative h-full flex flex-col items-center justify-between py-1 px-3 border-r border-zinc-200 dark:border-zinc-800">
        <button
          type="button"
          onClick={() => togglePopover('table')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs transition-colors ${
            activePopover === 'table'
              ? 'bg-blue-50 dark:bg-zinc-800 text-blue-600 dark:text-blue-400 font-medium'
              : 'hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-200'
          }`}
        >
          <Table className="size-4 text-blue-600 dark:text-blue-400" />
          <span>Table Builder</span>
          <ChevronDown className="size-3 text-zinc-400 dark:text-zinc-500" />
        </button>

        <span className="text-[9px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mt-1">
          Tables
        </span>

        {activePopover === 'table' && (
          <div className="absolute top-[calc(100%+6px)] left-0 z-50 shadow-2xl">
            <TableCreatorPopover
              isLatex={isLatex}
              onInsert={onInsertCodeSnippet}
              onClose={() => setActivePopover(null)}
            />
          </div>
        )}
      </div>

      {/* 3. Sub-panel Illustrations / Figures */}
      <div className="relative h-full flex flex-col items-center justify-between py-1 px-3">
        <button
          type="button"
          onClick={() => togglePopover('figure')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs transition-colors ${
            activePopover === 'figure'
              ? 'bg-blue-50 dark:bg-zinc-800 text-blue-600 dark:text-blue-400 font-medium'
              : 'hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-200'
          }`}
        >
          <Image className="size-4 text-blue-600 dark:text-blue-400" />
          <span>Insert Figure</span>
          <ChevronDown className="size-3 text-zinc-400 dark:text-zinc-500" />
        </button>

        <span className="text-[9px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mt-1">
          Illustrations
        </span>

        {activePopover === 'figure' && (
          <div className="absolute top-[calc(100%+6px)] left-0 z-50 shadow-2xl">
            <FigureModalPopover
              isLatex={isLatex}
              onInsert={onInsertCodeSnippet}
              onClose={() => setActivePopover(null)}
            />
          </div>
        )}
      </div>
    </div>
  )
}
