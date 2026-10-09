import React, { useState } from 'react'
import { CheckCheck } from 'lucide-react'
import { PopoverShell } from './PopoverShell'

export interface SpellingPopoverProps {
  onClose: () => void
}

export const SpellingPopover: React.FC<SpellingPopoverProps> = ({ onClose }) => {
  const [selectedLang, setSelectedLang] = useState('en-US')
  const [enableSpellcheck, setEnableSpellcheck] = useState(true)

  const handleApply = (e: React.FormEvent) => {
    e.preventDefault()
    onClose()
  }

  return (
    <PopoverShell
      title="Spelling & Proofing"
      icon={CheckCheck}
      onClose={onClose}
      widthClass="w-72"
    >
      <form onSubmit={handleApply} className="space-y-3 text-xs">
        <div>
          <label className="text-[10px] font-medium text-stone-500 block mb-1">
            Proofing Language
          </label>
          <select
            value={selectedLang}
            onChange={(e) => setSelectedLang(e.target.value)}
            className="w-full px-2 py-1.5 border border-stone-300 rounded bg-white text-xs focus:outline-none focus:border-indigo-500"
          >
            <option value="en-US">English (United States)</option>
            <option value="en-GB">English (United Kingdom)</option>
            <option value="id-ID">Indonesian (Custom Dict)</option>
            <option value="custom">Custom Dictionary...</option>
          </select>
        </div>

        <div className="flex items-center gap-2 pt-1 border-t border-stone-100">
          <input
            type="checkbox"
            id="spellcheck-toggle"
            checked={enableSpellcheck}
            onChange={(e) => setEnableSpellcheck(e.target.checked)}
            className="rounded border-stone-300 text-indigo-600 focus:ring-0"
          />
          <label htmlFor="spellcheck-toggle" className="text-stone-700 cursor-pointer">
            Check spelling as you type
          </label>
        </div>

        <button
          type="submit"
          className="w-full py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded font-medium shadow-sm"
        >
          Set Language
        </button>
      </form>
    </PopoverShell>
  )
}
