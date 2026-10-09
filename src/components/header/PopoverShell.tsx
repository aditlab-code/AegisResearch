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
      className={`${widthClass} bg-white border border-stone-300 rounded-lg shadow-2xl text-stone-800 select-none p-3.5`}
    >
      {/* Standardized Table Builder Header */}
      <div className="flex items-center justify-between pb-2 border-b border-stone-200 mb-2.5">
        <div className="flex items-center gap-1.5 min-w-0">
          <Icon className="size-4 text-indigo-600 shrink-0" />
          <span className="text-xs font-semibold text-stone-700 truncate">{title}</span>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-1 text-stone-400 hover:text-stone-700 rounded hover:bg-stone-100 transition-colors shrink-0"
        >
          <X className="size-3.5" />
        </button>
      </div>

      {/* Popover Content */}
      {children}
    </div>
  )
}
