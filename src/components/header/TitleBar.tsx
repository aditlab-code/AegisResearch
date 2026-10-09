import React from 'react'

export interface TitleBarProps {
  appName?: string
  avatarText?: string
  statusText?: string
}

const MENU_ITEMS = ['File', 'Edit', 'View', 'Build', 'Help']

export const TitleBar: React.FC<TitleBarProps> = ({
  appName = 'Scholarly',
  avatarText = 'AR',
  statusText = 'Auto-saved',
}) => {
  return (
    <header className="h-10 bg-indigo-950 text-indigo-100 flex items-center px-4 gap-4 text-sm shrink-0">
      <div className="flex items-center gap-2 font-serif font-semibold text-white">
        <span className="size-6 rounded bg-amber-400 text-indigo-950 grid place-items-center text-xs font-bold">
          ∂
        </span>
        {appName}
      </div>
      <nav className="flex gap-3 text-indigo-300 text-xs">
        {MENU_ITEMS.map((menu) => (
          <button key={menu} className="hover:text-white">
            {menu}
          </button>
        ))}
      </nav>
      <div className="flex-1 flex justify-center">
        <div className="bg-indigo-900/70 rounded-md px-4 py-1 text-xs text-indigo-300 w-80 text-center">
          ⌕ Search commands — Ctrl+Shift+P
        </div>
      </div>
      <span className="text-xs text-indigo-300">{statusText}</span>
      <div className="size-7 rounded-full bg-amber-400 text-indigo-950 grid place-items-center text-xs font-semibold">
        {avatarText}
      </div>
    </header>
  )
}
