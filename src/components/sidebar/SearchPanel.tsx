import React from 'react'

export interface SearchPanelProps {
  value?: string
  onChange?: (val: string) => void
  placeholder?: string
}

export const SearchPanel: React.FC<SearchPanelProps> = ({
  value,
  onChange,
  placeholder = 'Search in project…',
}) => {
  return (
    <input
      value={value}
      onChange={(e) => onChange?.(e.target.value)}
      placeholder={placeholder}
      className="w-full border border-stone-300 rounded px-2 py-1 bg-white text-xs outline-none focus:border-indigo-500"
    />
  )
}
