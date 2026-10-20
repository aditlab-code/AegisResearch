import React, { useState } from "react";
import { Sparkles, Plus, Send } from "lucide-react";
import { ChatMessage } from "../../types";

export interface AIAssistantPanelProps {
  chat: ChatMessage[];
  onSendMessage: (text: string) => void;
  onInsertCodeSnippet: (code: string) => void;
}

const QUICK_ACTIONS = [
  "Summarize document",
  "Insert equation",
  "Find citation",
  "Improve wording",
];

export const AIAssistantPanel: React.FC<AIAssistantPanelProps> = ({
  chat,
  onSendMessage,
  onInsertCodeSnippet,
}) => {
  const [query, setQuery] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    onSendMessage(query);
    setQuery("");
  };

  return (
    <div className="flex flex-col h-[calc(100%-1.5rem)] text-zinc-800 dark:text-zinc-200">
      <div className="flex flex-wrap gap-1 mb-2">
        {QUICK_ACTIONS.map((action) => (
          <button
            key={action}
            onClick={() => onSendMessage(action)}
            className="text-[11px] px-2 py-0.5 rounded-full border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 bg-white dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
          >
            {action}
          </button>
        ))}
      </div>
      <div className="flex-1 overflow-auto space-y-2 pr-1">
        {chat.map((msg, index) => (
          <div
            key={index}
            className={`rounded-lg px-3 py-2 text-xs leading-5 shadow-xs ${
              msg.role === "user"
                ? "bg-blue-600 text-white ml-6"
                : "bg-white dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-750 text-zinc-800 dark:text-zinc-200 mr-2"
            }`}
          >
            {msg.role === "ai" && (
              <div className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 mb-0.5 flex items-center gap-1">
                <Sparkles className="size-3 text-amber-500" />
                <span>Aegis AI</span>
              </div>
            )}
            {msg.text}
            {msg.code && (
              <>
                <pre className="mt-2 bg-zinc-900 text-amber-300 font-mono text-[11px] p-2 rounded border border-zinc-700/60 whitespace-pre-wrap">
                  {msg.code}
                </pre>
                <button
                  onClick={() => onInsertCodeSnippet(msg.code!)}
                  className="mt-1 text-[11px] text-blue-600 dark:text-blue-400 font-medium hover:underline flex items-center gap-1"
                >
                  <Plus className="size-3" />
                  Insert into document
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
          placeholder="Ask Aegis AI…"
          className="flex-1 min-w-0 border border-zinc-300 dark:border-zinc-700 rounded px-2 py-1 bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-100 text-xs outline-none focus:border-blue-500"
        />
        <button
          type="submit"
          className="bg-blue-600 text-white rounded px-2.5 py-1 text-xs hover:bg-blue-700 flex items-center justify-center transition-colors"
        >
          <Send className="size-3.5" />
        </button>
      </form>
    </div>
  );
};
