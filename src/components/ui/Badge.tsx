import React from 'react'
import { DocKind } from '../../types'

export interface BadgeProps {
  kind: DocKind | 'info' | 'warn'
  children: React.ReactNode
  className?: string
}

export const Badge: React.FC<BadgeProps> = ({ kind, children, className = '' }) => {
  const styles: Record<string, string> = {
    tex: 'bg-emerald-600 text-white',
    md: 'bg-sky-600 text-white',
    info: 'bg-indigo-100 text-indigo-800',
    warn: 'bg-amber-100 text-amber-800',
  }

  return (
    <span className={`text-[9px] font-bold px-1 rounded ${styles[kind] || 'bg-stone-500 text-white'} ${className}`}>
      {children}
    </span>
  )
}
