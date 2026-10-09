import React from 'react'
import { Doc } from '../../types'
import { DocPreview } from './DocPreview'
import { PDFViewer } from './PDFViewer'

export interface PreviewPanelProps {
  doc: Doc
  pdfBlobUrl?: string
  usePdfViewer?: boolean
}

export const PreviewPanel: React.FC<PreviewPanelProps> = ({
  doc,
  pdfBlobUrl,
  usePdfViewer = false,
}) => {
  return (
    <section className="w-full h-full bg-stone-200 overflow-auto p-8">
      <div className="flex justify-between text-xs text-stone-500 mb-3 max-w-[640px] mx-auto">
        <span>Preview · {doc.kind === 'tex' ? 'PDF' : 'HTML'}</span>
        <span>Page 1 of 1 · 100%</span>
      </div>
      {usePdfViewer && pdfBlobUrl ? (
        <div className="max-w-[640px] mx-auto min-h-[820px]">
          <PDFViewer pdfUrl={pdfBlobUrl} />
        </div>
      ) : (
        <article className="bg-white shadow-xl shadow-stone-400/30 max-w-[640px] mx-auto min-h-[820px] px-16 py-14 font-serif text-[15px] leading-7 text-stone-900">
          <DocPreview doc={doc} />
        </article>
      )}
    </section>
  )
}
