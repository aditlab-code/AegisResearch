import React, { useState } from 'react'
import { ExternalLink, Table, Image, FunctionSquare, Hash } from 'lucide-react'
import { ScannedLabel } from '../../utils'
import { PopoverShell } from './PopoverShell'

export interface CrossRefPopoverProps {
  scannedLabels: ScannedLabel[]
  onInsertRef: (refCode: string) => void
  onClose: () => void
}

export const CrossRefPopover: React.FC<CrossRefPopoverProps> = ({
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

    let code = `\\ref{${clean}}`
    if (refType === 'eqref') {
      code = `\\eqref{${clean}}`
    } else if (refType === 'label') {
      code = `\\label{${clean}}`
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
      <div className="flex border-b border-stone-200 mb-2 gap-1 text-[11px]">
        <button
          type="button"
          onClick={() => setActiveTab('detected')}
          className={`px-2 py-1 border-b-2 font-medium transition-colors ${
            activeTab === 'detected'
              ? 'border-indigo-600 text-indigo-600 font-semibold'
              : 'border-transparent text-stone-500 hover:text-stone-800'
          }`}
        >
          Labels ({scannedLabels.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('custom')}
          className={`px-2 py-1 border-b-2 font-medium transition-colors ${
            activeTab === 'custom'
              ? 'border-indigo-600 text-indigo-600 font-semibold'
              : 'border-transparent text-stone-500 hover:text-stone-800'
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
                  <div className="flex items-center gap-1 text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-1">
                    <Table className="size-3 text-indigo-600" />
                    <span>Tables ({tables.length})</span>
                  </div>
                  <div className="space-y-1">
                    {tables.map((l) => (
                      <button
                        key={l.key}
                        type="button"
                        onClick={() => {
                          onInsertRef(`Table~\\ref{${l.key}}`)
                          onClose()
                        }}
                        className="w-full flex items-center justify-between p-1.5 rounded hover:bg-indigo-50 border border-stone-200 text-left group"
                      >
                        <span className="font-mono text-stone-700 group-hover:text-indigo-800">
                          {l.key}
                        </span>
                        <span className="text-[10px] text-stone-400 group-hover:text-indigo-600 font-mono">
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
                  <div className="flex items-center gap-1 text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-1">
                    <Image className="size-3 text-emerald-600" />
                    <span>Figures ({figures.length})</span>
                  </div>
                  <div className="space-y-1">
                    {figures.map((l) => (
                      <button
                        key={l.key}
                        type="button"
                        onClick={() => {
                          onInsertRef(`Figure~\\ref{${l.key}}`)
                          onClose()
                        }}
                        className="w-full flex items-center justify-between p-1.5 rounded hover:bg-emerald-50 border border-stone-200 text-left group"
                      >
                        <span className="font-mono text-stone-700 group-hover:text-emerald-800">
                          {l.key}
                        </span>
                        <span className="text-[10px] text-stone-400 group-hover:text-emerald-600 font-mono">
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
                  <div className="flex items-center gap-1 text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-1">
                    <FunctionSquare className="size-3 text-rose-600" />
                    <span>Equations ({equations.length})</span>
                  </div>
                  <div className="space-y-1">
                    {equations.map((l) => (
                      <button
                        key={l.key}
                        type="button"
                        onClick={() => {
                          onInsertRef(`\\eqref{${l.key}}`)
                          onClose()
                        }}
                        className="w-full flex items-center justify-between p-1.5 rounded hover:bg-rose-50 border border-stone-200 text-left group"
                      >
                        <span className="font-mono text-stone-700 group-hover:text-rose-800">
                          {l.key}
                        </span>
                        <span className="text-[10px] text-stone-400 group-hover:text-rose-600 font-mono">
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
                  <div className="flex items-center gap-1 text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-1">
                    <Hash className="size-3 text-stone-600" />
                    <span>Other Labels ({others.length})</span>
                  </div>
                  <div className="space-y-1">
                    {others.map((l) => (
                      <button
                        key={l.key}
                        type="button"
                        onClick={() => {
                          onInsertRef(`\\ref{${l.key}}`)
                          onClose()
                        }}
                        className="w-full flex items-center justify-between p-1.5 rounded hover:bg-stone-100 border border-stone-200 text-left group"
                      >
                        <span className="font-mono text-stone-700">{l.key}</span>
                        <span className="text-[10px] text-stone-400 font-mono">
                          :line {l.lineNumber}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-6 text-stone-400 text-xs italic">
              No \label&#123;...&#125; detected in active document
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
                className={`py-1 rounded border text-[11px] font-mono text-center ${
                  refType === 'ref'
                    ? 'border-indigo-600 bg-indigo-50 text-indigo-700 font-bold'
                    : 'border-stone-300 text-stone-600'
                }`}
              >
                \ref&#123;&#125;
              </button>
              <button
                type="button"
                onClick={() => setRefType('eqref')}
                className={`py-1 rounded border text-[11px] font-mono text-center ${
                  refType === 'eqref'
                    ? 'border-indigo-600 bg-indigo-50 text-indigo-700 font-bold'
                    : 'border-stone-300 text-stone-600'
                }`}
              >
                \eqref&#123;&#125;
              </button>
              <button
                type="button"
                onClick={() => setRefType('label')}
                className={`py-1 rounded border text-[11px] font-mono text-center ${
                  refType === 'label'
                    ? 'border-indigo-600 bg-indigo-50 text-indigo-700 font-bold'
                    : 'border-stone-300 text-stone-600'
                }`}
              >
                \label&#123;&#125;
              </button>
            </div>

            <input
              type="text"
              value={customKey}
              onChange={(e) => setCustomKey(e.target.value)}
              placeholder="e.g. sec:methods or fig:model"
              required
              className="w-full px-2 py-1.5 border border-stone-300 rounded font-mono text-xs focus:outline-none focus:border-indigo-500"
            />
          </div>

          <button
            type="submit"
            className="w-full py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded font-medium shadow-sm"
          >
            Insert Command
          </button>
        </form>
      )}
    </PopoverShell>
  )
}
