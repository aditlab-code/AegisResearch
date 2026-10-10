import React, { useState } from 'react'
import { Image as ImageIcon } from 'lucide-react'
import { PopoverShell } from './PopoverShell'

export interface FigureModalPopoverProps {
  isLatex?: boolean
  onInsert: (code: string) => void
  onClose: () => void
}

export const FigureModalPopover: React.FC<FigureModalPopoverProps> = ({ isLatex = true, onInsert, onClose }) => {
  const [filePath, setFilePath] = useState('figures/diagram.png')
  const [caption, setCaption] = useState('System Architecture')
  const [width, setWidth] = useState('0.8\\textwidth')

  const handleInsert = (e: React.FormEvent) => {
    e.preventDefault()
    const safeCaption = caption.trim() || 'Figure Caption'
    const safePath = filePath.trim() || 'figures/image.png'
    const labelKey = safeCaption.toLowerCase().replace(/[^a-z0-9]/g, '-')

    if (!isLatex) {
      const mdWidth = width.includes('0.5') ? ' width=50%' : width.includes('0.8') ? ' width=80%' : width.includes('1.0') ? ' width=100%' : ''
      const mdCode = `\n![${safeCaption}](${safePath}){#fig:${labelKey}${mdWidth}}\n\n`
      onInsert(mdCode)
      onClose()
      return
    }

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
    <PopoverShell title="Insert Figure" icon={ImageIcon} onClose={onClose} widthClass="w-80">
      <form onSubmit={handleInsert} className="space-y-2 text-xs">
        <div>
          <label className="text-[10px] font-medium text-zinc-500 dark:text-zinc-400 block mb-0.5">
            File Path
          </label>
          <input
            type="text"
            value={filePath}
            onChange={(e) => setFilePath(e.target.value)}
            placeholder="figures/sample.png"
            className="w-full px-2 py-1 border border-zinc-300 dark:border-zinc-700 rounded bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 font-mono text-[11px] focus:outline-none focus:border-[#4078f2] dark:focus:border-[#61afef]"
          />
        </div>

        <div>
          <label className="text-[10px] font-medium text-zinc-500 dark:text-zinc-400 block mb-0.5">
            Caption
          </label>
          <input
            type="text"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Figure description..."
            className="w-full px-2 py-1 border border-zinc-300 dark:border-zinc-700 rounded bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 text-[11px] focus:outline-none focus:border-[#4078f2] dark:focus:border-[#61afef]"
          />
        </div>

        <div>
          <label className="text-[10px] font-medium text-zinc-500 dark:text-zinc-400 block mb-0.5">
            Scale / Width
          </label>
          <select
            value={width}
            onChange={(e) => setWidth(e.target.value)}
            className="w-full px-2 py-1 border border-zinc-300 dark:border-zinc-700 rounded bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-mono text-[11px] focus:outline-none focus:border-[#4078f2] dark:focus:border-[#61afef]"
          >
            <option value="0.8\\textwidth">80% Text Width (0.8\textwidth)</option>
            <option value="0.5\\textwidth">50% Text Width (0.5\textwidth)</option>
            <option value="1.0\\textwidth">Full Width (1.0\textwidth)</option>
            <option value="10cm">10 cm (Fixed)</option>
          </select>
        </div>

        <div className="pt-1.5">
          <button
            type="submit"
            className="w-full py-1.5 bg-[#4078f2] hover:bg-[#3362c4] dark:bg-[#61afef] dark:hover:bg-[#528bff] text-white dark:text-zinc-950 rounded text-xs font-semibold shadow-sm transition-colors"
          >
            Insert Figure
          </button>
        </div>
      </form>
    </PopoverShell>
  )
}
