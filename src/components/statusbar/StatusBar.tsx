import React from 'react'
import { DocKind } from '../../types'

export interface StatusBarProps {
  branch?: string
  statusMessage?: string
  wordCount: number
  docKind: DocKind
  encoding?: string
  language?: string
}

export const StatusBar: React.FC<StatusBarProps> = ({
  branch = 'main',
  statusMessage = '✓ Compiled 0 errors',
  wordCount,
  docKind,
  encoding = 'UTF-8',
  language = 'English (UK)',
}) => {
  return (
    <footer className="h-6 bg-indigo-700 text-indigo-100 text-[11px] flex items-center px-3 gap-4 shrink-0 select-none">
      <span>⎇ {branch}</span>
      <span>{statusMessage}</span>
      <span className="ml-auto">{wordCount} words</span>
      <span>{docKind === 'tex' ? 'LaTeX' : 'Markdown'}</span>
      <span>{encoding}</span>
      <span>{language}</span>
    </footer>
  )
}
