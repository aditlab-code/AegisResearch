import React, { useState } from 'react'
import { ExternalLink, Table, Image, FunctionSquare, Hash } from 'lucide-react'
import { ScannedLabel } from '../../utils'
import { PopoverShell } from './PopoverShell'

export interface CrossRefPopoverProps {
  isLatex?: boolean
  scannedLabels: ScannedLabel[]
  onInsertRef: (refCode: string) => void
  onClose: () => void
}

export const CrossRefPopover: React.FC<CrossRefPopoverProps> = ({
  isLatex = true,
  scannedLabels,
  onInsertRef,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'detected' | 'custom'>('detected')
  const [customKey, setCustomKey] = useState('')
  const [refType, setRefType] = useState<'ref' | 'eqref' | 'label'>('ref')

  const tables = scannedLabels.filter((l) => l.category === 'table')
  const figures = scannedLabels.filter((l) => l.category === 'figure')
  const equations = scannedLabels.filter((l) => l.category === 'equation')
  const others = scannedLabels.filter((l) => l.category === 'custom')

  const handleCustomInsert = (e: React.FormEvent) => {
    e.preventDefault()
    const clean = customKey.trim()
    if (!clean) return

    let code = isLatex ? `\\ref{${clean}}` : `[@${clean}]`
    if (refType === 'eqref') {
      code = isLatex ? `\\eqref{${clean}}` : `(@${clean})`
    } else if (refType === 'label') {
      code = isLatex ? `\\label{${clean}}` : `{#${clean}}`
    }

    onInsertRef(code)
    onClose()
  }

  return (
    <PopoverShell
      title="Cross-Reference"
      icon={ExternalLink}
      onClose={onClose}
      widthClass="w-80"
    >
      {/* Mode Tabs */}
      <div className="flex border-b border-zinc-200 dark:border-zinc-800 mb-2 gap-1 text-[11px]">
        <button
          type="button"
          onClick={() => setActiveTab('detected')}
          className={`px-2 py-1 border-b-2 font-medium transition-colors ${
            activeTab === 'detected'
              ? 'border-[#4078f2] dark:border-[#61afef] text-[#4078f2] dark:text-[#61afef] font-semibold'
              : 'border-transparent text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200'
          }`}
        >
          Labels ({scannedLabels.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('custom')}
          className={`px-2 py-1 border-b-2 font-medium transition-colors ${
            activeTab === 'custom'
              ? 'border-[#4078f2] dark:border-[#61afef] text-[#4078f2] dark:text-[#61afef] font-semibold'
              : 'border-transparent text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200'
          }`}
        >
          + Custom Ref
        </button>
      </div>

      {/* Tab: Detected Labels */}
      {activeTab === 'detected' && (
        <div className="max-h-60 overflow-y-auto space-y-2 pr-0.5 text-xs">
          {scannedLabels.length > 0 ? (
            <>
              {/* Tables */}
              {tables.length > 0 && (
                <div>
                  <div className="flex items-center gap-1 text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1">
                    <Table className="size-3 text-blue-600 dark:text-blue-400" />
                    <span>Tables ({tables.length})</span>
                  </div>
                  <div className="space-y-1">
                    {tables.map((l) => (
                      <button
                        key={l.key}
                        type="button"
                        onClick={() => {
                          onInsertRef(isLatex ? `Table~\\ref{${l.key}}` : `Table @${l.key}`)
                          onClose()
                        }}
                      >
                        <span className="font-mono text-zinc-700 dark:text-zinc-300 group-hover:text-blue-700 dark:group-hover:text-blue-400">
                          {l.key}
                        </span>
                        <span className="text-[10px] text-zinc-400 dark:text-zinc-500 group-hover:text-blue-600 dark:group-hover:text-blue-400 font-mono">
                          :line {l.lineNumber}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Figures */}
              {figures.length > 0 && (
                <div>
                  <div className="flex items-center gap-1 text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1">
                    <Image className="size-3 text-blue-600 dark:text-blue-400" />
                    <span>Figures ({figures.length})</span>
                  </div>
                  <div className="space-y-1">
                    {figures.map((l) => (
                      <button
                        key={l.key}
                        type="button"
                        onClick={() => {
                          onInsertRef(isLatex ? `Figure~\\ref{${l.key}}` : `Figure @${l.key}`)
                          onClose()
                        }}
                      >
                        <span className="font-mono text-zinc-700 dark:text-zinc-300 group-hover:text-blue-700 dark:group-hover:text-blue-400">
                          {l.key}
                        </span>
                        <span className="text-[10px] text-zinc-400 dark:text-zinc-500 group-hover:text-blue-600 dark:group-hover:text-blue-400 font-mono">
                          :line {l.lineNumber}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Equations */}
              {equations.length > 0 && (
                <div>
                  <div className="flex items-center gap-1 text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1">
                    <FunctionSquare className="size-3 text-blue-600 dark:text-blue-400" />
                    <span>Equations ({equations.length})</span>
                  </div>
                  <div className="space-y-1">
                    {equations.map((l) => (
                      <button
                        key={l.key}
                        type="button"
                        onClick={() => {
                          onInsertRef(isLatex ? `\\eqref{${l.key}}` : `(@${l.key})`)
                          onClose()
                        }}
                      >
                        <span className="font-mono text-zinc-700 dark:text-zinc-300 group-hover:text-blue-700 dark:group-hover:text-blue-400">
                          {l.key}
                        </span>
                        <span className="text-[10px] text-zinc-400 dark:text-zinc-500 group-hover:text-blue-600 dark:group-hover:text-blue-400 font-mono">
                          :line {l.lineNumber}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Others */}
              {others.length > 0 && (
                <div>
                  <div className="flex items-center gap-1 text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1">
                    <Hash className="size-3 text-blue-600 dark:text-blue-400" />
                    <span>Other Labels ({others.length})</span>
                  </div>
                  <div className="space-y-1">
                    {others.map((l) => (
                      <button
                        key={l.key}
                        type="button"
                        onClick={() => {
                          onInsertRef(isLatex ? `\\ref{${l.key}}` : `[@${l.key}]`)
                          onClose()
                        }}
                      >
                        <span className="font-mono text-zinc-700 dark:text-zinc-300 group-hover:text-blue-700 dark:group-hover:text-blue-400">{l.key}</span>
                        <span className="text-[10px] text-zinc-400 dark:text-zinc-500 group-hover:text-blue-600 dark:group-hover:text-blue-400 font-mono">
                          :line {l.lineNumber}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-6 text-zinc-400 dark:text-zinc-500 text-xs italic">
              {isLatex ? 'No \\label{...} detected in active document' : 'No {#label} detected in active document'}
            </div>
          )}
        </div>
      )}

      {/* Tab: Custom Ref */}
      {activeTab === 'custom' && (
        <form onSubmit={handleCustomInsert} className="space-y-2 text-xs">
          <div>
            <div className="grid grid-cols-3 gap-1 mb-2">
              <button
                type="button"
                onClick={() => setRefType('ref')}
                className={`py-1 rounded border text-[11px] font-mono text-center transition-colors ${
                  refType === 'ref'
                    ? 'border-[#4078f2] dark:border-[#61afef] bg-blue-50 dark:bg-zinc-800 text-[#4078f2] dark:text-[#61afef] font-bold'
                    : 'border-zinc-300 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                }`}
              >
                {isLatex ? '\\ref{}' : '[@ref]'}
              </button>
              <button
                type="button"
                onClick={() => setRefType('eqref')}
                className={`py-1 rounded border text-[11px] font-mono text-center transition-colors ${
                  refType === 'eqref'
                    ? 'border-[#4078f2] dark:border-[#61afef] bg-blue-50 dark:bg-zinc-800 text-[#4078f2] dark:text-[#61afef] font-bold'
                    : 'border-zinc-300 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                }`}
              >
                {isLatex ? '\\eqref{}' : '(@eqref)'}
              </button>
              <button
                type="button"
                onClick={() => setRefType('label')}
                className={`py-1 rounded border text-[11px] font-mono text-center transition-colors ${
                  refType === 'label'
                    ? 'border-[#4078f2] dark:border-[#61afef] bg-blue-50 dark:bg-zinc-800 text-[#4078f2] dark:text-[#61afef] font-bold'
                    : 'border-zinc-300 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                }`}
              >
                {isLatex ? '\\label{}' : '{#label}'}
              </button>
            </div>

            <input
              type="text"
              value={customKey}
              onChange={(e) => setCustomKey(e.target.value)}
              placeholder="e.g. sec:methods or fig:model"
              required
              className="w-full px-2 py-1.5 border border-zinc-300 dark:border-zinc-700 rounded bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 font-mono text-xs focus:outline-none focus:border-[#4078f2] dark:focus:border-[#61afef]"
            />
          </div>

          <button
            type="submit"
            className="w-full py-1.5 bg-[#4078f2] hover:bg-[#3362c4] dark:bg-[#61afef] dark:hover:bg-[#528bff] text-white dark:text-zinc-950 rounded font-semibold shadow-sm transition-colors"
          >
            Insert Command
          </button>
        </form>
      )}
    </PopoverShell>
  )
}
