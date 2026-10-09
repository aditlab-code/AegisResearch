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
    <header className="h-10 bg-zinc-100 dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-100 flex items-center px-4 gap-4 text-sm shrink-0 select-none">
      {/* Brand & Logo */}
      <div className="flex items-center gap-2 font-semibold text-zinc-900 dark:text-white tracking-tight">
        <div className="size-6 rounded bg-[#4078f2] dark:bg-[#61afef] text-white dark:text-zinc-950 flex items-center justify-center shadow-sm">
          <ShieldCheck className="size-3.5" />
        </div>
        <span className="text-sm font-semibold">{appName}</span>
      </div>

      {/* Menu items */}
      <nav className="flex gap-3 text-zinc-500 dark:text-zinc-400 text-xs">
        {MENU_ITEMS.map((menu) => (
          <button key={menu} className="hover:text-zinc-900 dark:hover:text-white transition-colors">
            {menu}
          </button>
        ))}
      </nav>

      {/* Command search */}
      <div className="flex-1 flex justify-center">
        <div className="bg-white/90 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 hover:border-zinc-400 dark:hover:border-zinc-500 rounded-md px-4 py-1 text-xs text-zinc-600 dark:text-zinc-400 w-80 text-center flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs">
          <Search className="size-3.5 text-zinc-400 dark:text-zinc-500" />
          <span>Search commands — Ctrl+Shift+P</span>
        </div>
      </div>

      {/* Status indicator */}
      <span className="text-xs text-zinc-500 dark:text-zinc-400">{statusText}</span>

      {/* Theme Toggle Button */}
      {onToggleTheme && (
        <button
          onClick={onToggleTheme}
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} theme`}
          className="size-7 rounded hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white flex items-center justify-center transition-colors"
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? (
            <Sun className="size-4 text-[#e5c07b]" />
          ) : (
            <Moon className="size-4 text-zinc-600" />
          )}
        </button>
      )}

      {/* User Avatar */}
      <div className="size-7 rounded-full bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 border border-zinc-300 dark:border-zinc-700 grid place-items-center text-xs font-semibold">
        {avatarText}
      </div>
    </header>
  )
}
