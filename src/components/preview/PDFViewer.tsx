import React from 'react'

export interface PDFViewerProps {
  pdfUrl?: string
}

export const PDFViewer: React.FC<PDFViewerProps> = ({ pdfUrl }) => {
  if (!pdfUrl) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-stone-100 text-stone-400 text-xs font-mono">
        Belum ada PDF terkompilasi.
      </div>
    )
  }

  // view=FitH automatically fits PDF width nicely in browser viewer
  const formattedUrl = pdfUrl.includes('#') ? pdfUrl : `${pdfUrl}#view=FitH`

  return (
    <div className="w-full h-full bg-[#525659] relative overflow-hidden">
      <iframe
        src={formattedUrl}
        title="LaTeX PDF Preview"
        className="w-full h-full border-0 bg-white block"
      />
    </div>
  )
}
