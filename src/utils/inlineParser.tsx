import React from 'react'

export function renderInlineFormatted(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|\$[^$]+\$)/g)
  return parts.map((part, index) => {
    if (part.startsWith('**')) {
      return <strong key={index}>{part.slice(2, -2)}</strong>
    }
    if (part.startsWith('$')) {
      return (
        <em key={index} className="font-serif italic text-indigo-900">
          {part.slice(1, -1)}
        </em>
      )
    }
    if (part.startsWith('*')) {
      return <em key={index}>{part.slice(1, -1)}</em>
    }
    return part
  })
}
