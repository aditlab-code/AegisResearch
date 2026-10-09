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
          <label className="text-[10px] font-medium text-stone-500 block mb-1">Note Type</label>
          <div className="grid grid-cols-3 gap-1">
            <button
              type="button"
              onClick={() => setCommentType('todo')}
              className={`py-1 rounded border text-[11px] font-medium transition-colors ${
                commentType === 'todo'
                  ? 'border-amber-500 bg-amber-50 text-amber-700 font-bold'
                  : 'border-stone-200 text-stone-600 hover:bg-stone-50'
              }`}
            >
              % TODO
            </button>
            <button
              type="button"
              onClick={() => setCommentType('note')}
              className={`py-1 rounded border text-[11px] font-medium transition-colors ${
                commentType === 'note'
                  ? 'border-indigo-500 bg-indigo-50 text-indigo-700 font-bold'
                  : 'border-stone-200 text-stone-600 hover:bg-stone-50'
              }`}
            >
              % NOTE
            </button>
            <button
              type="button"
              onClick={() => setCommentType('fixme')}
              className={`py-1 rounded border text-[11px] font-medium transition-colors ${
                commentType === 'fixme'
                  ? 'border-rose-500 bg-rose-50 text-rose-700 font-bold'
                  : 'border-stone-200 text-stone-600 hover:bg-stone-50'
              }`}
            >
              % FIXME
            </button>
          </div>
        </div>

        <div>
          <label className="text-[10px] font-medium text-stone-500 block mb-0.5">Comment Note</label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Reviewer remarks or action item..."
            rows={3}
            required
            className="w-full p-2 border border-stone-300 rounded text-xs focus:outline-none focus:border-indigo-500"
          />
        </div>

        <button
          type="submit"
          disabled={!text.trim()}
          className="w-full py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded font-medium shadow-sm flex items-center justify-center gap-1.5"
        >
          <Plus className="size-3.5" />
          Insert Review Note
        </button>
      </form>
    </PopoverShell>
  )
}
