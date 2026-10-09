import React, { useState, useEffect, useRef } from 'react'
import { Library, ExternalLink, ListTree, ChevronDown } from 'lucide-react'
import { BibEntry, ScannedLabel } from '../../utils'
import { BibliographyPopover } from './BibliographyPopover'
import { CrossRefPopover } from './CrossRefPopover'
import { TocPopover } from './TocPopover'

export interface ReferencesRibbonGroupProps {
  entries: BibEntry[]
  scannedLabels: ScannedLabel[]
  onInsertCite: (key: string) => void
  onInsertStyle: (style: 'apa' | 'ieee') => void
  onSaveBibEntries: (entries: BibEntry[]) => void
  onInsertRef: (refCode: string) => void
  onInsertTocCode: (code: string) => void
}

export const ReferencesRibbonGroup: React.FC<ReferencesRibbonGroupProps> = ({
  entries,
  scannedLabels,
  onInsertCite,
  onInsertStyle,
  onSaveBibEntries,
  onInsertRef,
  onInsertTocCode,
}) => {
  const [activePopover, setActivePopover] = useState<'bib' | 'crossref' | 'toc' | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const togglePopover = (type: 'bib' | 'crossref' | 'toc') => {
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
      className="h-full flex items-stretch gap-2 select-none overflow-visible relative"
    >
      {/* 1. Sub-panel Citations & Bibliography */}
      <div className="relative h-full flex flex-col items-center justify-between py-1 px-3 border-r border-stone-200">
        <button
          type="button"
          onClick={() => togglePopover('bib')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs transition-colors ${
            activePopover === 'bib'
              ? 'bg-indigo-100 text-indigo-700 font-medium'
              : 'hover:bg-stone-100 text-stone-700'
          }`}
        >
          <Library className="size-4 text-indigo-600" />
          <span>Bibliography</span>
          <ChevronDown className="size-3 text-stone-400" />
        </button>

        <span className="text-[9px] font-semibold text-stone-400 uppercase tracking-wider mt-1">
          Citations ({entries.length})
        </span>

        {activePopover === 'bib' && (
          <div className="absolute top-[calc(100%+6px)] left-0 z-50 shadow-2xl">
            <BibliographyPopover
              entries={entries}
              onInsertCite={onInsertCite}
              onInsertStyle={onInsertStyle}
              onSaveEntries={onSaveBibEntries}
              onClose={() => setActivePopover(null)}
            />
          </div>
        )}
      </div>

      {/* 2. Sub-panel Cross-Reference */}
      <div className="relative h-full flex flex-col items-center justify-between py-1 px-3 border-r border-stone-200">
        <button
          type="button"
          onClick={() => togglePopover('crossref')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs transition-colors ${
            activePopover === 'crossref'
              ? 'bg-indigo-100 text-indigo-700 font-medium'
              : 'hover:bg-stone-100 text-stone-700'
          }`}
        >
          <ExternalLink className="size-4 text-indigo-600" />
          <span>Cross-Reference</span>
          <ChevronDown className="size-3 text-stone-400" />
        </button>

        <span className="text-[9px] font-semibold text-stone-400 uppercase tracking-wider mt-1">
          Labels ({scannedLabels.length})
        </span>

        {activePopover === 'crossref' && (
          <div className="absolute top-[calc(100%+6px)] left-0 z-50 shadow-2xl">
            <CrossRefPopover
              scannedLabels={scannedLabels}
              onInsertRef={onInsertRef}
              onClose={() => setActivePopover(null)}
            />
          </div>
        )}
      </div>

      {/* 3. Sub-panel Table of Contents */}
      <div className="relative h-full flex flex-col items-center justify-between py-1 px-3">
        <button
          type="button"
          onClick={() => togglePopover('toc')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs transition-colors ${
            activePopover === 'toc'
              ? 'bg-indigo-100 text-indigo-700 font-medium'
              : 'hover:bg-stone-100 text-stone-700'
          }`}
        >
          <ListTree className="size-4 text-indigo-600" />
          <span>Table of Contents</span>
          <ChevronDown className="size-3 text-stone-400" />
        </button>

        <span className="text-[9px] font-semibold text-stone-400 uppercase tracking-wider mt-1">
          TOC & Lists
        </span>

        {activePopover === 'toc' && (
          <div className="absolute top-[calc(100%+6px)] left-0 z-50 shadow-2xl">
            <TocPopover
              onInsertCode={onInsertTocCode}
              onClose={() => setActivePopover(null)}
            />
          </div>
        )}
      </div>
    </div>
  )
}
