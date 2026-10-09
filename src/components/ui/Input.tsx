import React from 'react'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export const Input: React.FC<InputProps> = ({ className = '', ...props }) => {
  return (
    <input
      className={`border border-stone-300 rounded px-2 py-1 bg-white text-xs outline-none focus:border-indigo-500 ${className}`}
      {...props}
    />
  )
}
