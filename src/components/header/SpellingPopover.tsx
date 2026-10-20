import React, { useState } from "react";
import { CheckCheck } from "lucide-react";
import { PopoverShell } from "./PopoverShell";

export interface SpellingPopoverProps {
  onClose: () => void;
}

export const SpellingPopover: React.FC<SpellingPopoverProps> = ({
  onClose,
}) => {
  const [selectedLang, setSelectedLang] = useState("en-US");
  const [enableSpellcheck, setEnableSpellcheck] = useState(true);

  const handleApply = (e: React.FormEvent) => {
    e.preventDefault();
    onClose();
  };

  return (
    <PopoverShell
      title="Spelling & Proofing"
      icon={CheckCheck}
      onClose={onClose}
      widthClass="w-72"
    >
      <form onSubmit={handleApply} className="space-y-3 text-xs">
        <div>
          <label className="text-[10px] font-medium text-zinc-500 dark:text-zinc-400 block mb-1">
            Proofing Language
          </label>
          <select
            value={selectedLang}
            onChange={(e) => setSelectedLang(e.target.value)}
            className="w-full px-2 py-1.5 border border-zinc-300 dark:border-zinc-700 rounded bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-xs focus:outline-none focus:border-[#4078f2] dark:focus:border-[#61afef]"
          >
            <option value="en-US">English (United States)</option>
            <option value="en-GB">English (United Kingdom)</option>
            <option value="id-ID">Indonesian (Custom Dict)</option>
            <option value="custom">Custom Dictionary...</option>
          </select>
        </div>

        <div className="flex items-center gap-2 pt-1 border-t border-zinc-200 dark:border-zinc-800">
          <input
            type="checkbox"
            id="spellcheck-toggle"
            checked={enableSpellcheck}
            onChange={(e) => setEnableSpellcheck(e.target.checked)}
            className="rounded border-zinc-300 dark:border-zinc-700 text-[#4078f2] dark:text-[#61afef] focus:ring-0 bg-white dark:bg-zinc-800"
          />
          <label
            htmlFor="spellcheck-toggle"
            className="text-zinc-700 dark:text-zinc-300 cursor-pointer"
          >
            Check spelling as you type
          </label>
        </div>

        <button
          type="submit"
          className="w-full py-1.5 bg-[#4078f2] hover:bg-[#3362c4] dark:bg-[#61afef] dark:hover:bg-[#528bff] text-white dark:text-zinc-950 rounded font-semibold shadow-sm transition-colors"
        >
          Set Language
        </button>
      </form>
    </PopoverShell>
  );
};
