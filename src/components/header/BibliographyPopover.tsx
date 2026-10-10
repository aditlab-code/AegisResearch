import React, { useState } from 'react'
import { BookOpen, Quote, Trash2, Upload } from 'lucide-react'
import { BibEntry, parseBibtex, BibliographyStyleChoice } from '../../utils'
import { PopoverShell } from './PopoverShell'

export interface BibliographyPopoverProps {
  isLatex?: boolean
  entries: BibEntry[]
  onInsertCite: (key: string) => void
  onInsertStyle: (style: BibliographyStyleChoice) => void
  onSaveEntries: (entries: BibEntry[]) => void
  onClose: () => void
}

export const BibliographyPopover: React.FC<BibliographyPopoverProps> = ({
  isLatex = true,
  entries,
  onInsertCite,
  onInsertStyle,
  onSaveEntries,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'list' | 'add' | 'import' | 'style'>('list')

  const [key, setKey] = useState('')
  const [title, setTitle] = useState('')
  const [author, setAuthor] = useState('')
  const [year, setYear] = useState(new Date().getFullYear().toString())
  const [journal, setJournal] = useState('')
  const [type, setType] = useState('article')
  const [customStyle, setCustomStyle] = useState('')

  const [rawBib, setRawBib] = useState('')
  const handleAddEntry = (e: React.FormEvent) => {
    e.preventDefault()
    if (!key.trim() || !title.trim()) return

    const newEntry: BibEntry = {
      id: `bib-${key.trim()}-${Date.now()}`,
      key: key.trim(),
      type,
      title: title.trim(),
      author: author.trim(),
      year: year.trim(),
      journal: journal.trim(),
    }

    onSaveEntries([...entries, newEntry])
    setKey('')
    setTitle('')
    setAuthor('')
    setJournal('')
    setActiveTab('list')
  }

  const handleDeleteEntry = (entryKey: string) => {
    onSaveEntries(entries.filter((e) => e.key !== entryKey))
  }

  const handleImportRaw = () => {
    if (!rawBib.trim()) return
    const imported = parseBibtex(rawBib)
    if (imported.length > 0) {
      onSaveEntries([...entries, ...imported])
      setRawBib('')
      setActiveTab('list')
    }
  }

  return (
    <PopoverShell
      title="Bibliography Manager"
      icon={BookOpen}
      onClose={onClose}
      widthClass="w-96"
    >
      {/* Tabs */}
      <div className="flex border-b border-zinc-200 dark:border-zinc-800 mb-2.5 gap-1 text-[11px]">
        <button
          type="button"
          onClick={() => setActiveTab('list')}
          className={`px-2 py-1 border-b-2 font-medium transition-colors ${
            activeTab === 'list'
              ? 'border-[#4078f2] dark:border-[#61afef] text-[#4078f2] dark:text-[#61afef] font-semibold'
              : 'border-transparent text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200'
          }`}
        >
          Citations ({entries.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('add')}
          className={`px-2 py-1 border-b-2 font-medium transition-colors ${
            activeTab === 'add'
              ? 'border-[#4078f2] dark:border-[#61afef] text-[#4078f2] dark:text-[#61afef] font-semibold'
              : 'border-transparent text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200'
          }`}
        >
          + Add Entry
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('import')}
          className={`px-2 py-1 border-b-2 font-medium transition-colors ${
            activeTab === 'import'
              ? 'border-[#4078f2] dark:border-[#61afef] text-[#4078f2] dark:text-[#61afef] font-semibold'
              : 'border-transparent text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200'
          }`}
        >
          Import
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('style')}
          className={`px-2 py-1 border-b-2 font-medium transition-colors ${
            activeTab === 'style'
              ? 'border-[#4078f2] dark:border-[#61afef] text-[#4078f2] dark:text-[#61afef] font-semibold'
              : 'border-transparent text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200'
          }`}
        >
          Style
        </button>
      </div>

      {/* Citations List */}
      {activeTab === 'list' && (
        <div className="max-h-60 overflow-y-auto space-y-1.5 pr-0.5">
          {entries.length > 0 ? (
            entries.map((entry) => (
              <div
                key={entry.key}
                className="p-2 border border-zinc-200 dark:border-zinc-800 rounded-md hover:border-blue-300 dark:hover:border-blue-600 bg-zinc-50/50 dark:bg-zinc-800/40 flex flex-col gap-1 group"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-[11px] text-[#4078f2] dark:text-[#61afef] bg-blue-50 dark:bg-zinc-800 px-1.5 py-0.5 rounded border border-blue-100 dark:border-zinc-700">
                    @{entry.key}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => onInsertCite(entry.key)}
                      title={isLatex ? `Insert \\cite{${entry.key}}` : `Insert [@${entry.key}]`}
                      className="px-2 py-0.5 bg-[#4078f2] hover:bg-[#3362c4] dark:bg-[#61afef] dark:hover:bg-[#528bff] text-white dark:text-zinc-950 rounded text-[10px] font-semibold flex items-center gap-1 shadow-sm transition-colors"
                    >
                      <Quote className="size-2.5" />
                      Insert {isLatex ? '\\cite' : '[@key]'}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteEntry(entry.key)}
                      title="Delete"
                      className="p-1 text-zinc-400 hover:text-rose-600 rounded hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                    >
                      <Trash2 className="size-3" />
                    </button>
                  </div>
                </div>
                <div className="text-zinc-800 dark:text-zinc-200 font-medium line-clamp-1 text-xs">{entry.title}</div>
                <div className="text-[10px] text-zinc-500 dark:text-zinc-400 truncate">
                  {entry.author} ({entry.year}) {entry.journal ? `· ${entry.journal}` : ''}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-6 text-zinc-400 dark:text-zinc-500 text-xs italic">
              No citation entries in references.bib
            </div>
          )}
        </div>
      )}

      {/* Add Entry Form */}
      {activeTab === 'add' && (
        <form onSubmit={handleAddEntry} className="space-y-2 max-h-64 overflow-y-auto pr-0.5">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] font-medium text-zinc-500 dark:text-zinc-400 block">Citation Key *</label>
              <input
                type="text"
                value={key}
                onChange={(e) => setKey(e.target.value)}
                placeholder="e.g. einstein1905"
                required
                className="w-full px-2 py-1 border border-zinc-300 dark:border-zinc-700 rounded bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 font-mono text-[11px] focus:outline-none focus:border-[#4078f2] dark:focus:border-[#61afef]"
              />
            </div>
            <div>
              <label className="text-[10px] font-medium text-zinc-500 dark:text-zinc-400 block">Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full px-2 py-1 border border-zinc-300 dark:border-zinc-700 rounded bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-[11px] focus:outline-none focus:border-[#4078f2] dark:focus:border-[#61afef]"
              >
                <option value="article">Article (Journal)</option>
                <option value="book">Book</option>
                <option value="inproceedings">Proceedings / Conf</option>
                <option value="misc">Web / Misc</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-[10px] font-medium text-zinc-500 dark:text-zinc-400 block">Title *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Paper or book title..."
              required
              className="w-full px-2 py-1 border border-zinc-300 dark:border-zinc-700 rounded bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 text-[11px] focus:outline-none focus:border-[#4078f2] dark:focus:border-[#61afef]"
            />
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="col-span-2">
              <label className="text-[10px] font-medium text-zinc-500 dark:text-zinc-400 block">Author</label>
              <input
                type="text"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                placeholder="Author names..."
                className="w-full px-2 py-1 border border-zinc-300 dark:border-zinc-700 rounded bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 text-[11px] focus:outline-none focus:border-[#4078f2] dark:focus:border-[#61afef]"
              />
            </div>
            <div>
              <label className="text-[10px] font-medium text-zinc-500 dark:text-zinc-400 block">Year</label>
              <input
                type="text"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                placeholder="2026"
                className="w-full px-2 py-1 border border-zinc-300 dark:border-zinc-700 rounded bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 font-mono text-[11px] focus:outline-none focus:border-[#4078f2] dark:focus:border-[#61afef]"
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] font-medium text-zinc-500 dark:text-zinc-400 block">Journal / Publisher</label>
            <input
              type="text"
              value={journal}
              onChange={(e) => setJournal(e.target.value)}
              placeholder="Nature, IEEE, Springer..."
              className="w-full px-2 py-1 border border-zinc-300 dark:border-zinc-700 rounded bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 text-[11px] focus:outline-none focus:border-[#4078f2] dark:focus:border-[#61afef]"
            />
          </div>

          <button
            type="submit"
            className="w-full mt-1.5 py-1.5 bg-[#4078f2] hover:bg-[#3362c4] dark:bg-[#61afef] dark:hover:bg-[#528bff] text-white dark:text-zinc-950 rounded font-semibold shadow-sm text-xs transition-colors"
          >
            Save to references.bib
          </button>
        </form>
      )}

      {/* Import BibTeX */}
      {activeTab === 'import' && (
        <div className="space-y-2">
          <label className="text-[10px] font-medium text-zinc-500 dark:text-zinc-400 block">
            Paste BibTeX snippet (@article&#123;...&#125;):
          </label>
          <textarea
            value={rawBib}
            onChange={(e) => setRawBib(e.target.value)}
            placeholder={`@article{example,\n  title={Sample Title},\n  author={Author},\n  year={2026}\n}`}
            rows={4}
            className="w-full p-2 border border-zinc-300 dark:border-zinc-700 rounded bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 font-mono text-[11px] focus:outline-none focus:border-[#4078f2] dark:focus:border-[#61afef]"
          />
          <button
            type="button"
            onClick={handleImportRaw}
            disabled={!rawBib.trim()}
            className="w-full py-1.5 bg-[#4078f2] hover:bg-[#3362c4] dark:bg-[#61afef] dark:hover:bg-[#528bff] disabled:opacity-50 text-white dark:text-zinc-950 rounded font-semibold shadow-sm flex items-center justify-center gap-1.5 text-xs transition-colors"
          >
            <Upload className="size-3.5" />
            Import Entry
          </button>
        </div>
      )}

      {/* Style Tab */}
      {activeTab === 'style' && (
        <div className="space-y-2">
          <button
            type="button"
            onClick={() => onInsertStyle('apa')}
            className="w-full p-2 text-left border border-zinc-200 dark:border-zinc-800 rounded hover:bg-blue-50/70 dark:hover:bg-zinc-800 hover:border-blue-300 dark:hover:border-blue-600 transition-colors"
          >
            <div className="font-semibold text-zinc-800 dark:text-zinc-200 text-xs">APA Style (Author, Year)</div>
            <div className="text-[10px] text-zinc-500 dark:text-zinc-400">Includes automatic preamble guard \usepackage&#123;apalike&#125;</div>
            <code className="text-[10px] text-blue-600 dark:text-blue-400 font-mono block mt-0.5">
              \bibliographystyle&#123;apalike&#125; \bibliography&#123;references&#125;
            </code>
          </button>

          <button
            type="button"
            onClick={() => onInsertStyle('ieee')}
            className="w-full p-2 text-left border border-zinc-200 dark:border-zinc-800 rounded hover:bg-blue-50/70 dark:hover:bg-zinc-800 hover:border-blue-300 dark:hover:border-blue-600 transition-colors"
          >
            <div className="font-semibold text-zinc-800 dark:text-zinc-200 text-xs">IEEE Style (Numeric [1])</div>
            <div className="text-[10px] text-zinc-500 dark:text-zinc-400">Standard IEEE transaction numerical format</div>
            <code className="text-[10px] text-blue-600 dark:text-blue-400 font-mono block mt-0.5">
              \bibliographystyle&#123;ieeetr&#125; \bibliography&#123;references&#125;
            </code>
          </button>

          {/* Custom Style */}
          <div className="p-2 border border-zinc-200 dark:border-zinc-800 rounded bg-zinc-50/40 dark:bg-zinc-800/30 space-y-1.5">
            <div className="font-semibold text-zinc-800 dark:text-zinc-200 text-xs">Custom Style</div>
            <div className="flex gap-1.5">
              <input
                type="text"
                value={customStyle}
                onChange={(e) => setCustomStyle(e.target.value)}
                placeholder={isLatex ? "e.g. plain, acm, nature" : "e.g. nature, chicago"}
                className="flex-1 px-2 py-1 border border-zinc-300 dark:border-zinc-700 rounded bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 font-mono text-[11px] focus:outline-none focus:border-[#4078f2] dark:focus:border-[#61afef]"
              />
              <button
                type="button"
                disabled={!customStyle.trim()}
                onClick={() => {
                  if (customStyle.trim()) {
                    onInsertStyle({ custom: customStyle.trim() })
                  }
                }}
                className="px-2.5 py-1 bg-[#4078f2] hover:bg-[#3362c4] dark:bg-[#61afef] dark:hover:bg-[#528bff] disabled:opacity-50 text-white dark:text-zinc-950 rounded text-xs font-semibold shadow-sm transition-colors"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </PopoverShell>
  )
}
