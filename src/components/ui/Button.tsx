import React from 'react'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'pill'
  size?: 'sm' | 'md' | 'icon'
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'secondary',
  size = 'md',
  className = '',
  children,
  ...props
}) => {
  const base = 'inline-flex items-center justify-center font-medium transition-colors focus:outline-none'
  const variants = {
    primary: 'bg-indigo-600 hover:bg-indigo-700 text-white rounded-md',
    secondary: 'border border-stone-300 bg-white hover:bg-stone-100 text-stone-700 rounded-md',
    ghost: 'hover:bg-indigo-50 text-stone-700 rounded',
    pill: 'rounded-full border border-indigo-200 text-indigo-700 bg-white hover:bg-indigo-50',
  }
  const sizes = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-4 py-1.5',
    icon: 'p-1',
  }

  return (
    <button
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}
