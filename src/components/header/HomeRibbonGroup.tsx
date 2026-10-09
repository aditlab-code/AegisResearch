import React from 'react'
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
  Heading1,
  Heading2,
  ListOrdered,
  List,
  Minus,
  FileText,
  FileMinus,
  Eye,
} from 'lucide-react'

export interface HomeRibbonGroupProps {
  isLatex: boolean
  onClipboardAction: (action: 'copy' | 'cut' | 'paste') => void
  onFormatAction: (type: 'bold' | 'italic' | 'quote' | 'superscript' | 'subscript') => void
  onAlignAction: (type: 'left' | 'center' | 'right' | 'justify') => void
  onStructureAction: (type: 'heading1' | 'heading2' | 'numbering' | 'bullet' | 'line') => void
  onPageAction: (type: 'break' | 'next' | 'preview') => void
}

export const HomeRibbonGroup: React.FC<HomeRibbonGroupProps> = ({
  isLatex,
  onClipboardAction,
  onFormatAction,
  onAlignAction,
  onStructureAction,
  onPageAction,
}) => {
  return (
    <div className="flex items-stretch gap-2 py-0.5 select-none overflow-x-auto">
      {/* 1. Sub-panel Clipboard */}
      <div className="flex flex-col items-center justify-between px-2 border-r border-stone-200">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onClipboardAction('paste')}
            title="Paste (Tempel dari Clipboard)"
            className="flex flex-col items-center justify-center px-2 py-1 rounded hover:bg-stone-200/70 text-stone-700 transition-colors"
          >
            <ClipboardPaste className="size-4 text-indigo-600" />
            <span className="text-[10px] mt-0.5">Paste</span>
          </button>

          <div className="flex flex-col gap-0.5">
            <button
              type="button"
              onClick={() => onClipboardAction('copy')}
              title="Copy (Salin teks)"
              className="flex items-center gap-1.5 px-2 py-0.5 rounded hover:bg-stone-200/70 text-stone-700 text-[11px]"
            >
              <Copy className="size-3 text-stone-500" />
              <span>Copy</span>
            </button>
            <button
              type="button"
              onClick={() => onClipboardAction('cut')}
              title="Cut (Potong teks)"
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
      <div className="flex flex-col items-center justify-between px-2 border-r border-stone-200">
        <div className="flex items-center gap-0.5 pt-1">
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
            title="Quotes (Kutipan Teks)"
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
          Formatting
        </span>
      </div>

      {/* 3. Sub-panel Paragraph Alignment */}
      <div className="flex flex-col items-center justify-between px-2 border-r border-stone-200">
        <div className="flex items-center gap-0.5 pt-1">
          <button
            type="button"
            onClick={() => onAlignAction('left')}
            title="Rata Kiri (Left)"
            className="p-1.5 rounded hover:bg-stone-200/70 text-stone-700 transition-colors"
          >
            <AlignLeft className="size-4" />
          </button>
          <button
            type="button"
            onClick={() => onAlignAction('center')}
            title="Rata Tengah (Center)"
            className="p-1.5 rounded hover:bg-stone-200/70 text-stone-700 transition-colors"
          >
            <AlignCenter className="size-4" />
          </button>
          <button
            type="button"
            onClick={() => onAlignAction('right')}
            title="Rata Kanan (Right)"
            className="p-1.5 rounded hover:bg-stone-200/70 text-stone-700 transition-colors"
          >
            <AlignRight className="size-4" />
          </button>
          <button
            type="button"
            onClick={() => onAlignAction('justify')}
            title="Rata Kiri-Kanan (Justify)"
            className="p-1.5 rounded hover:bg-stone-200/70 text-stone-700 transition-colors"
          >
            <AlignJustify className="size-4" />
          </button>
        </div>
        <span className="text-[9px] font-semibold text-stone-400 uppercase tracking-wider mt-1">
          Alignment
        </span>
      </div>

      {/* 4. Sub-panel Headings & Lists */}
      <div className="flex flex-col items-center justify-between px-2 border-r border-stone-200">
        <div className="flex items-center gap-0.5 pt-1">
          <button
            type="button"
            onClick={() => onStructureAction('heading1')}
            title={isLatex ? 'Heading 1 (\\section{...})' : 'Heading 1 (# ...)'}
            className="p-1.5 rounded hover:bg-stone-200/70 text-stone-700 transition-colors"
          >
            <Heading1 className="size-4" />
          </button>
          <button
            type="button"
            onClick={() => onStructureAction('heading2')}
            title={isLatex ? 'Heading 2 (\\subsection{...})' : 'Heading 2 (## ...)'}
            className="p-1.5 rounded hover:bg-stone-200/70 text-stone-700 transition-colors"
          >
            <Heading2 className="size-4" />
          </button>
          <button
            type="button"
            onClick={() => onStructureAction('numbering')}
            title="Numbered List (Daftar Nomor)"
            className="p-1.5 rounded hover:bg-stone-200/70 text-stone-700 transition-colors"
          >
            <ListOrdered className="size-4" />
          </button>
          <button
            type="button"
            onClick={() => onStructureAction('bullet')}
            title="Bullet / Dot List (Daftar Poin)"
            className="p-1.5 rounded hover:bg-stone-200/70 text-stone-700 transition-colors"
          >
            <List className="size-4" />
          </button>
          <button
            type="button"
            onClick={() => onStructureAction('line')}
            title="Divider / Horizontal Line"
            className="p-1.5 rounded hover:bg-stone-200/70 text-stone-700 transition-colors"
          >
            <Minus className="size-4" />
          </button>
        </div>
        <span className="text-[9px] font-semibold text-stone-400 uppercase tracking-wider mt-1">
          Headings & Lists
        </span>
      </div>

      {/* 5. Sub-panel Page Controls */}
      <div className="flex flex-col items-center justify-between px-2">
        <div className="flex items-center gap-1 pt-1">
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
            title="Next / Clear Page (\\clearpage)"
            className="flex items-center gap-1 px-2 py-1 rounded hover:bg-stone-200/70 text-stone-700 text-xs transition-colors"
          >
            <FileMinus className="size-3.5 text-stone-500" />
            <span className="text-[11px]">Next</span>
          </button>
          <button
            type="button"
            onClick={() => onPageAction('preview')}
            title="Toggle Preview Page"
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
