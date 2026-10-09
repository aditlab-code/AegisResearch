import React, { useState, useEffect, useRef } from 'react'
import {
  Copy,
  Scissors,
  ClipboardPaste,
  Bold,
  Italic,
  Quote,
  Superscript,
  Subscript,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Heading,
  ListOrdered,
  List,
  Minus,
  FileMinus,
  Eye,
  ChevronDown,
} from 'lucide-react'
import { HeadingStylePopover } from './HeadingStylePopover'

export interface HomeRibbonGroupProps {
  isLatex: boolean
  onClipboardAction: (action: 'copy' | 'cut' | 'paste') => void
  onFormatAction: (type: 'bold' | 'italic' | 'quote' | 'superscript' | 'subscript') => void
  onAlignAction: (type: 'left' | 'center' | 'right' | 'justify') => void
  onStructureAction: (type: 'heading1' | 'heading2' | 'numbering' | 'bullet' | 'line') => void
  onSelectHeadingStyle?: (styleCode: string) => void
  onPageAction: (type: 'break' | 'next' | 'preview') => void
}

export const HomeRibbonGroup: React.FC<HomeRibbonGroupProps> = ({
  isLatex,
  onClipboardAction,
  onFormatAction,
  onAlignAction,
  onStructureAction,
  onSelectHeadingStyle = () => {},
  onPageAction,
}) => {
  const [showHeadingPopover, setShowHeadingPopover] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // Click-outside listener
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowHeadingPopover(false)
      }
    }

    if (showHeadingPopover) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showHeadingPopover])

  return (
    <div
      ref={containerRef}
      className="h-full flex items-stretch gap-2 select-none overflow-visible relative"
    >
      {/* 1. Sub-panel Clipboard */}
      <div className="h-full flex flex-col items-center justify-between py-1 px-2 border-r border-stone-200">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onClipboardAction('paste')}
            title="Paste (Ctrl+V)"
            className="flex flex-col items-center justify-center px-2 py-1 rounded hover:bg-stone-200/70 text-stone-700 transition-colors"
          >
            <ClipboardPaste className="size-4 text-indigo-600" />
            <span className="text-[10px] mt-0.5">Paste</span>
          </button>

          <div className="flex flex-col gap-0.5">
            <button
              type="button"
              onClick={() => onClipboardAction('copy')}
              title="Copy (Ctrl+C)"
              className="flex items-center gap-1.5 px-2 py-0.5 rounded hover:bg-stone-200/70 text-stone-700 text-[11px]"
            >
              <Copy className="size-3 text-stone-500" />
              <span>Copy</span>
            </button>
            <button
              type="button"
              onClick={() => onClipboardAction('cut')}
              title="Cut (Ctrl+X)"
              className="flex items-center gap-1.5 px-2 py-0.5 rounded hover:bg-stone-200/70 text-stone-700 text-[11px]"
            >
              <Scissors className="size-3 text-stone-500" />
              <span>Cut</span>
            </button>
          </div>
        </div>
        <span className="text-[9px] font-semibold text-stone-400 uppercase tracking-wider mt-1">
          Clipboard
        </span>
      </div>

      {/* 2. Sub-panel Text Formatting */}
      <div className="h-full flex flex-col items-center justify-between py-1 px-2 border-r border-stone-200">
        <div className="flex items-center gap-0.5 pt-0.5">
          <button
            type="button"
            onClick={() => onFormatAction('bold')}
            title={isLatex ? 'Bold (\\textbf{...})' : 'Bold (**...**)'}
            className="p-1.5 rounded hover:bg-stone-200/70 text-stone-700 font-bold transition-colors"
          >
            <Bold className="size-4" />
          </button>
          <button
            type="button"
            onClick={() => onFormatAction('italic')}
            title={isLatex ? 'Italic (\\textit{...})' : 'Italic (*...*)'}
            className="p-1.5 rounded hover:bg-stone-200/70 text-stone-700 italic transition-colors"
          >
            <Italic className="size-4" />
          </button>
          <button
            type="button"
            onClick={() => onFormatAction('quote')}
            title="Quote"
            className="p-1.5 rounded hover:bg-stone-200/70 text-stone-700 transition-colors"
          >
            <Quote className="size-4" />
          </button>
          <button
            type="button"
            onClick={() => onFormatAction('superscript')}
            title={isLatex ? 'Superscript (^{...})' : 'Superscript (^...^)'}
            className="p-1.5 rounded hover:bg-stone-200/70 text-stone-700 transition-colors"
          >
            <Superscript className="size-4" />
          </button>
          <button
            type="button"
            onClick={() => onFormatAction('subscript')}
            title={isLatex ? 'Subscript (_{...})' : 'Subscript (~...~)'}
            className="p-1.5 rounded hover:bg-stone-200/70 text-stone-700 transition-colors"
          >
            <Subscript className="size-4" />
          </button>
        </div>
        <span className="text-[9px] font-semibold text-stone-400 uppercase tracking-wider mt-1">
          Font
        </span>
      </div>

      {/* 3. Sub-panel Paragraph Alignment */}
      <div className="h-full flex flex-col items-center justify-between py-1 px-2 border-r border-stone-200">
        <div className="flex items-center gap-0.5 pt-0.5">
          <button
            type="button"
            onClick={() => onAlignAction('left')}
            title="Align Left"
            className="p-1.5 rounded hover:bg-stone-200/70 text-stone-700 transition-colors"
          >
            <AlignLeft className="size-4" />
          </button>
          <button
            type="button"
            onClick={() => onAlignAction('center')}
            title="Center"
            className="p-1.5 rounded hover:bg-stone-200/70 text-stone-700 transition-colors"
          >
            <AlignCenter className="size-4" />
          </button>
          <button
            type="button"
            onClick={() => onAlignAction('right')}
            title="Align Right"
            className="p-1.5 rounded hover:bg-stone-200/70 text-stone-700 transition-colors"
          >
            <AlignRight className="size-4" />
          </button>
          <button
            type="button"
            onClick={() => onAlignAction('justify')}
            title="Justify"
            className="p-1.5 rounded hover:bg-stone-200/70 text-stone-700 transition-colors"
          >
            <AlignJustify className="size-4" />
          </button>
        </div>
        <span className="text-[9px] font-semibold text-stone-400 uppercase tracking-wider mt-1">
          Paragraph
        </span>
      </div>

      {/* 4. Sub-panel Headings & Styles Gallery */}
      <div className="relative h-full flex flex-col items-center justify-between py-1 px-2 border-r border-stone-200">
        <div className="flex items-center gap-1 pt-0.5">
          {/* Word-like Styles Dropdown */}
          <button
            type="button"
            onClick={() => setShowHeadingPopover(!showHeadingPopover)}
            title="Heading & Document Styles Gallery"
            className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors ${
              showHeadingPopover
                ? 'bg-indigo-100 text-indigo-700 font-medium'
                : 'hover:bg-stone-200/70 text-stone-700'
            }`}
          >
            <Heading className="size-4 text-indigo-600" />
            <span className="text-xs font-medium">Styles</span>
            <ChevronDown className="size-3 text-stone-400" />
          </button>

          <div className="w-[1px] h-4 bg-stone-300 mx-0.5" />

          {/* Quick List & Line buttons */}
          <button
            type="button"
            onClick={() => onStructureAction('numbering')}
            title="Numbered List"
            className="p-1.5 rounded hover:bg-stone-200/70 text-stone-700 transition-colors"
          >
            <ListOrdered className="size-4" />
          </button>
          <button
            type="button"
            onClick={() => onStructureAction('bullet')}
            title="Bulleted List"
            className="p-1.5 rounded hover:bg-stone-200/70 text-stone-700 transition-colors"
          >
            <List className="size-4" />
          </button>
          <button
            type="button"
            onClick={() => onStructureAction('line')}
            title="Horizontal Divider"
            className="p-1.5 rounded hover:bg-stone-200/70 text-stone-700 transition-colors"
          >
            <Minus className="size-4" />
          </button>
        </div>

        <span className="text-[9px] font-semibold text-stone-400 uppercase tracking-wider mt-1">
          Styles
        </span>

        {showHeadingPopover && (
          <div className="absolute top-[calc(100%+6px)] left-0 z-50 shadow-2xl">
            <HeadingStylePopover
              isLatex={isLatex}
              onSelectStyle={onSelectHeadingStyle}
              onClose={() => setShowHeadingPopover(false)}
            />
          </div>
        )}
      </div>

      {/* 5. Sub-panel Page Controls */}
      <div className="h-full flex flex-col items-center justify-between py-1 px-2">
        <div className="flex items-center gap-1 pt-0.5">
          <button
            type="button"
            onClick={() => onPageAction('break')}
            title="Page Break (\\newpage)"
            className="flex items-center gap-1 px-2 py-1 rounded hover:bg-stone-200/70 text-stone-700 text-xs transition-colors"
          >
            <FileBreakIcon className="size-3.5 text-indigo-500" />
            <span className="text-[11px]">Break</span>
          </button>
          <button
            type="button"
            onClick={() => onPageAction('next')}
            title="Clear Page (\\clearpage)"
            className="flex items-center gap-1 px-2 py-1 rounded hover:bg-stone-200/70 text-stone-700 text-xs transition-colors"
          >
            <FileMinus className="size-3.5 text-stone-500" />
            <span className="text-[11px]">Next</span>
          </button>
          <button
            type="button"
            onClick={() => onPageAction('preview')}
            title="Refresh Preview"
            className="flex items-center gap-1 px-2 py-1 rounded hover:bg-stone-200/70 text-stone-700 text-xs transition-colors"
          >
            <Eye className="size-3.5 text-stone-500" />
            <span className="text-[11px]">Preview</span>
          </button>
        </div>
        <span className="text-[9px] font-semibold text-stone-400 uppercase tracking-wider mt-1">
          Page
        </span>
      </div>
    </div>
  )
}

function FileBreakIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M14 2H6a2 2 0 0 0-2 2v6" />
      <path d="M4 14v6a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-6" />
      <path d="M14 2v6h6" />
      <path d="M2 12h20" strokeDasharray="3 3" />
    </svg>
  )
}
