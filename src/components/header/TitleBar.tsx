import React from 'react'
import { Search, ShieldCheck, Sun, Moon } from 'lucide-react'

export interface TitleBarProps {
  appName?: string
  avatarText?: string
  statusText?: string
  theme?: 'dark' | 'light'
  onToggleTheme?: () => void
}

const MENU_ITEMS = ['File', 'Edit', 'View', 'Build', 'Help']

export const TitleBar: React.FC<TitleBarProps> = ({
  appName = 'Aegis Research',
  avatarText = 'AR',
  statusText = 'Auto-saved',
  theme = 'light',
  onToggleTheme,
}) => {
  return (
    <header className="h-10 bg-zinc-900 border-b border-zinc-800 text-zinc-100 flex items-center px-4 gap-4 text-sm shrink-0 select-none">
      {/* Brand & Logo */}
      <div className="flex items-center gap-2 font-semibold text-white tracking-tight">
        <div className="size-6 rounded bg-blue-600 text-white flex items-center justify-center shadow-sm">
          <ShieldCheck className="size-3.5" />
        </div>
        <span className="text-sm font-semibold">{appName}</span>
      </div>

      {/* Menu items */}
      <nav className="flex gap-3 text-zinc-400 text-xs">
        {MENU_ITEMS.map((menu) => (
          <button key={menu} className="hover:text-white transition-colors">
            {menu}
          </button>
        ))}
      </nav>

      {/* Command search */}
      <div className="flex-1 flex justify-center">
        <div className="bg-zinc-800/80 border border-zinc-700/60 hover:border-zinc-500 rounded-md px-4 py-1 text-xs text-zinc-400 w-80 text-center flex items-center justify-center gap-1.5 transition-colors cursor-pointer">
          <Search className="size-3.5 text-zinc-400" />
          <span>Search commands — Ctrl+Shift+P</span>
        </div>
      </div>

      {/* Status indicator */}
      <span className="text-xs text-zinc-400">{statusText}</span>

      {/* Theme Toggle Button */}
      {onToggleTheme && (
        <button
          onClick={onToggleTheme}
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} theme`}
          className="size-7 rounded hover:bg-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center transition-colors"
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? (
            <Sun className="size-4 text-amber-400" />
          ) : (
            <Moon className="size-4 text-zinc-400" />
          )}
        </button>
      )}

      {/* User Avatar */}
      <div className="size-7 rounded-full bg-zinc-800 text-zinc-200 border border-zinc-700 grid place-items-center text-xs font-semibold">
        {avatarText}
      </div>
    </header>
  )
}
