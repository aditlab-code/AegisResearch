import React, { useState } from 'react'
import { BookOpen, Quote, Trash2, Upload } from 'lucide-react'
import { BibEntry, parseBibtex } from '../../utils'
import { PopoverShell } from './PopoverShell'

export interface BibliographyPopoverProps {
  entries: BibEntry[]
  onInsertCite: (key: string) => void
  onInsertStyle: (style: 'apa' | 'ieee') => void
  onSaveEntries: (entries: BibEntry[]) => void
  onClose: () => void
}

export const BibliographyPopover: React.FC<BibliographyPopoverProps> = ({
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
      <div className="flex border-b border-stone-200 mb-2.5 gap-1 text-[11px]">
        <button
          type="button"
          onClick={() => setActiveTab('list')}
          className={`px-2 py-1 border-b-2 font-medium transition-colors ${
            activeTab === 'list'
              ? 'border-indigo-600 text-indigo-600 font-semibold'
              : 'border-transparent text-stone-500 hover:text-stone-800'
          }`}
        >
          Citations ({entries.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('add')}
          className={`px-2 py-1 border-b-2 font-medium transition-colors ${
            activeTab === 'add'
              ? 'border-indigo-600 text-indigo-600 font-semibold'
              : 'border-transparent text-stone-500 hover:text-stone-800'
          }`}
        >
          + Add Entry
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('import')}
          className={`px-2 py-1 border-b-2 font-medium transition-colors ${
            activeTab === 'import'
              ? 'border-indigo-600 text-indigo-600 font-semibold'
              : 'border-transparent text-stone-500 hover:text-stone-800'
          }`}
        >
          Import
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('style')}
          className={`px-2 py-1 border-b-2 font-medium transition-colors ${
            activeTab === 'style'
              ? 'border-indigo-600 text-indigo-600 font-semibold'
              : 'border-transparent text-stone-500 hover:text-stone-800'
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
                className="p-2 border border-stone-200 rounded-md hover:border-indigo-200 bg-stone-50/50 flex flex-col gap-1 group"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-[11px] text-indigo-700 bg-indigo-50 px-1.5 py-0.2 rounded">
                    @{entry.key}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => onInsertCite(entry.key)}
                      title={`Insert \\cite{${entry.key}}`}
                      className="px-2 py-0.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-[10px] font-medium flex items-center gap-1 shadow-sm"
                    >
                      <Quote className="size-2.5" />
                      Insert \cite
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteEntry(entry.key)}
                      title="Delete"
                      className="p-1 text-stone-400 hover:text-rose-600 rounded hover:bg-stone-200"
                    >
                      <Trash2 className="size-3" />
                    </button>
                  </div>
                </div>
                <div className="text-stone-800 font-medium line-clamp-1 text-xs">{entry.title}</div>
                <div className="text-[10px] text-stone-500 truncate">
                  {entry.author} ({entry.year}) {entry.journal ? `· ${entry.journal}` : ''}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-6 text-stone-400 text-xs italic">
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
              <label className="text-[10px] font-medium text-stone-500 block">Citation Key *</label>
              <input
                type="text"
                value={key}
                onChange={(e) => setKey(e.target.value)}
                placeholder="e.g. einstein1905"
                required
                className="w-full px-2 py-1 border border-stone-300 rounded font-mono text-[11px] focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="text-[10px] font-medium text-stone-500 block">Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full px-2 py-1 border border-stone-300 rounded bg-white text-[11px]"
              >
                <option value="article">Article (Journal)</option>
                <option value="book">Book</option>
                <option value="inproceedings">Proceedings / Conf</option>
                <option value="misc">Web / Misc</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-[10px] font-medium text-stone-500 block">Title *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Paper or book title..."
              required
              className="w-full px-2 py-1 border border-stone-300 rounded text-[11px] focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="col-span-2">
              <label className="text-[10px] font-medium text-stone-500 block">Author</label>
              <input
                type="text"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                placeholder="Author names..."
                className="w-full px-2 py-1 border border-stone-300 rounded text-[11px]"
              />
            </div>
            <div>
              <label className="text-[10px] font-medium text-stone-500 block">Year</label>
              <input
                type="text"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                placeholder="2026"
                className="w-full px-2 py-1 border border-stone-300 rounded font-mono text-[11px]"
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] font-medium text-stone-500 block">Journal / Publisher</label>
            <input
              type="text"
              value={journal}
              onChange={(e) => setJournal(e.target.value)}
              placeholder="Nature, IEEE, Springer..."
              className="w-full px-2 py-1 border border-stone-300 rounded text-[11px]"
            />
          </div>

          <button
            type="submit"
            className="w-full mt-1.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded font-medium shadow-sm text-xs"
          >
            Save to references.bib
          </button>
        </form>
      )}

      {/* Import BibTeX */}
      {activeTab === 'import' && (
        <div className="space-y-2">
          <label className="text-[10px] font-medium text-stone-500 block">
            Paste BibTeX snippet (@article&#123;...&#125;):
          </label>
          <textarea
            value={rawBib}
            onChange={(e) => setRawBib(e.target.value)}
            placeholder={`@article{example,\n  title={Sample Title},\n  author={Author},\n  year={2026}\n}`}
            rows={4}
            className="w-full p-2 border border-stone-300 rounded font-mono text-[11px] focus:outline-none focus:border-indigo-500"
          />
          <button
            type="button"
            onClick={handleImportRaw}
            disabled={!rawBib.trim()}
            className="w-full py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded font-medium shadow-sm flex items-center justify-center gap-1.5 text-xs"
          >
            <Upload className="size-3.5" />
            Import Entry
          </button>
        </div>
      )}

      {/* Style Tab */}
      {activeTab === 'style' && (
        <div className="space-y-1.5">
          <button
            type="button"
            onClick={() => onInsertStyle('apa')}
            className="w-full p-2 text-left border border-stone-200 rounded hover:bg-indigo-50 hover:border-indigo-300 transition-colors"
          >
            <div className="font-semibold text-stone-800 text-xs">APA Style (Author, Year)</div>
            <code className="text-[10px] text-indigo-700 font-mono block mt-0.5">
              \bibliographystyle&#123;apalike&#125; \bibliography&#123;references&#125;
            </code>
          </button>

          <button
            type="button"
            onClick={() => onInsertStyle('ieee')}
            className="w-full p-2 text-left border border-stone-200 rounded hover:bg-indigo-50 hover:border-indigo-300 transition-colors"
          >
            <div className="font-semibold text-stone-800 text-xs">IEEE Style (Numeric [1])</div>
            <code className="text-[10px] text-indigo-700 font-mono block mt-0.5">
              \bibliographystyle&#123;ieeetr&#125; \bibliography&#123;references&#125;
            </code>
          </button>
        </div>
      )}
    </PopoverShell>
  )
}
