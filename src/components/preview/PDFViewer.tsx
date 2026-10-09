import React from 'react'

export interface PDFViewerProps {
  pdfUrl?: string
  scale?: number
}

export const PDFViewer: React.FC<PDFViewerProps> = ({ pdfUrl }) => {
  if (!pdfUrl) {
    return (
      <div className="flex-1 grid place-items-center text-stone-400 text-sm">
        No compiled PDF ready. Click Compile to build.
      </div>
    )
  }

  return (
    <iframe
      src={pdfUrl}
      title="LaTeX PDF Preview"
      className="w-full h-full min-h-[820px] rounded border-0 bg-white shadow-xl"
    />
  )
}
