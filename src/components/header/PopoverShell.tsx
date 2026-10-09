import React from 'react'
import { X, type LucideIcon } from 'lucide-react'

export interface PopoverShellProps {
  title: string
  icon: LucideIcon
  onClose: () => void
  widthClass?: string
  children: React.ReactNode
}

export const PopoverShell: React.FC<PopoverShellProps> = ({
  title,
  icon: Icon,
  onClose,
  widthClass = 'w-80',
  children,
}) => {
  return (
    <div
      className={`${widthClass} bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-xl text-zinc-800 dark:text-zinc-200 select-none p-3.5`}
    >
      {/* Standardized Popover Header */}
      <div className="flex items-center justify-between pb-2 border-b border-zinc-200 dark:border-zinc-800 mb-2.5">
        <div className="flex items-center gap-1.5 min-w-0">
          <Icon className="size-4 text-blue-600 dark:text-blue-400 shrink-0" />
          <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-100 truncate">{title}</span>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-1 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors shrink-0"
        >
          <X className="size-3.5" />
        </button>
      </div>

      {/* Popover Content */}
      {children}
    </div>
  )
}
