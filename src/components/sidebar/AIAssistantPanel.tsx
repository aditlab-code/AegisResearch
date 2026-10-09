import React, { useState } from 'react'
import { Sparkles, Plus, Send } from 'lucide-react'
import { ChatMessage } from '../../types'

export interface AIAssistantPanelProps {
  chat: ChatMessage[]
  onSendMessage: (text: string) => void
  onInsertCodeSnippet: (code: string) => void
}

const QUICK_ACTIONS = ['Ringkas dokumen', 'Buat rumus', 'Cari sitasi', 'Perbaiki kalimat']

export const AIAssistantPanel: React.FC<AIAssistantPanelProps> = ({
  chat,
  onSendMessage,
  onInsertCodeSnippet,
}) => {
  const [query, setQuery] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim()) return
    onSendMessage(query)
    setQuery('')
  }

  return (
    <div className="flex flex-col h-[calc(100%-1.5rem)]">
      <div className="flex flex-wrap gap-1 mb-2">
        {QUICK_ACTIONS.map((action) => (
          <button
            key={action}
            onClick={() => onSendMessage(action)}
            className="text-[11px] px-2 py-0.5 rounded-full border border-indigo-200 text-indigo-700 bg-white hover:bg-indigo-50"
          >
            {action}
          </button>
        ))}
      </div>
      <div className="flex-1 overflow-auto space-y-2 pr-1">
        {chat.map((msg, index) => (
          <div
            key={index}
            className={`rounded-lg px-3 py-2 text-xs leading-5 ${
              msg.role === 'user'
                ? 'bg-indigo-600 text-white ml-6'
                : 'bg-white border border-stone-200 mr-2'
            }`}
          >
            {msg.role === 'ai' && (
              <div className="text-[10px] font-semibold text-amber-600 mb-0.5 flex items-center gap-1">
                <Sparkles className="size-3 text-amber-500" />
                <span>Scholar AI</span>
              </div>
            )}
            {msg.text}
            {msg.code && (
              <>
                <pre className="mt-2 bg-[#1e1e2e] text-amber-200 font-mono text-[11px] p-2 rounded whitespace-pre-wrap">
                  {msg.code}
                </pre>
                <button
                  onClick={() => onInsertCodeSnippet(msg.code!)}
                  className="mt-1 text-[11px] text-indigo-700 font-medium hover:underline flex items-center gap-1"
                >
                  <Plus className="size-3" />
                  Sisipkan ke dokumen
                </button>
              </>
            )}
          </div>
        ))}
      </div>
      <form onSubmit={handleSubmit} className="mt-2 flex gap-1">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Tanya AI…"
          className="flex-1 min-w-0 border border-stone-300 rounded px-2 py-1 bg-white text-xs outline-none focus:border-indigo-500"
        />
        <button
          type="submit"
          className="bg-indigo-600 text-white rounded px-2.5 py-1 text-xs hover:bg-indigo-700 flex items-center justify-center transition-colors"
        >
          <Send className="size-3.5" />
        </button>
      </form>
    </div>
  )
}
