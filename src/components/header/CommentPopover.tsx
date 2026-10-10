import React, { useState } from 'react'
import { MessageSquare, Plus } from 'lucide-react'
import { PopoverShell } from './PopoverShell'

export interface CommentPopoverProps {
  isLatex: boolean
  onInsertComment: (commentText: string) => void
  onClose: () => void
}

export const CommentPopover: React.FC<CommentPopoverProps> = ({
  isLatex,
  onInsertComment,
  onClose,
}) => {
  const [commentType, setCommentType] = useState<'todo' | 'note' | 'fixme'>('todo')
  const [text, setText] = useState('')

  const handleInsert = (e: React.FormEvent) => {
    e.preventDefault()
    const clean = text.trim()
    if (!clean) return

    let code = ''
    if (isLatex) {
      if (commentType === 'todo') {
        code = `\n% TODO: ${clean}\n`
      } else if (commentType === 'fixme') {
        code = `\n% FIXME: ${clean}\n`
      } else {
        code = `\n% [NOTE]: ${clean}\n`
      }
    } else {
      code = `\n<!-- ${commentType.toUpperCase()}: ${clean} -->\n`
    }

    onInsertComment(code)
    onClose()
  }

  return (
    <PopoverShell
      title="Add Review Note / TODO"
      icon={MessageSquare}
      onClose={onClose}
      widthClass="w-80"
    >
      <form onSubmit={handleInsert} className="space-y-2.5 text-xs">
        <div>
          <label className="text-[10px] font-medium text-zinc-500 dark:text-zinc-400 block mb-1">Note Type</label>
          <div className="grid grid-cols-3 gap-1">
            <button
              type="button"
              onClick={() => setCommentType('todo')}
              className={`py-1 rounded border text-[11px] font-medium transition-colors ${
                commentType === 'todo'
                  ? 'border-amber-500 dark:border-amber-400 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 font-bold'
                  : 'border-zinc-300 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
              }`}
            >
              % TODO
            </button>
            <button
              type="button"
              onClick={() => setCommentType('note')}
              className={`py-1 rounded border text-[11px] font-medium transition-colors ${
                commentType === 'note'
                  ? 'border-[#4078f2] dark:border-[#61afef] bg-blue-50 dark:bg-zinc-800 text-[#4078f2] dark:text-[#61afef] font-bold'
                  : 'border-zinc-300 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
              }`}
            >
              % NOTE
            </button>
            <button
              type="button"
              onClick={() => setCommentType('fixme')}
              className={`py-1 rounded border text-[11px] font-medium transition-colors ${
                commentType === 'fixme'
                  ? 'border-rose-500 dark:border-rose-400 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 font-bold'
                  : 'border-zinc-300 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
              }`}
            >
              % FIXME
            </button>
          </div>
        </div>

        <div>
          <label className="text-[10px] font-medium text-zinc-500 dark:text-zinc-400 block mb-0.5">Comment Note</label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Reviewer remarks or action item..."
            rows={3}
            required
            className="w-full p-2 border border-zinc-300 dark:border-zinc-700 rounded bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 text-xs focus:outline-none focus:border-[#4078f2] dark:focus:border-[#61afef]"
          />
        </div>

        <button
          type="submit"
          disabled={!text.trim()}
          className="w-full py-1.5 bg-[#4078f2] hover:bg-[#3362c4] dark:bg-[#61afef] dark:hover:bg-[#528bff] disabled:opacity-50 text-white dark:text-zinc-950 rounded font-semibold shadow-sm flex items-center justify-center gap-1.5 transition-colors"
        >
          <Plus className="size-3.5" />
          Insert Review Note
        </button>
      </form>
    </PopoverShell>
  )
}
