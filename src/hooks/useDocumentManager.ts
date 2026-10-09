import { useState } from 'react'
import { Doc } from '../types'
import { INITIAL_DOCS, SNIPPETS } from '../constants'

export function useDocumentManager(initialDocs: Doc[] = INITIAL_DOCS) {
  const [docs, setDocs] = useState<Doc[]>(initialDocs)
  const [activeDocIndex, setActiveDocIndex] = useState(0)
  const [openDocIndices, setOpenDocIndices] = useState<number[]>([0, 1])

  const activeDoc = docs[activeDocIndex] || docs[0]

  const updateContent = (content: string) => {
    setDocs((prev) =>
      prev.map((d, i) => (i === activeDocIndex ? { ...d, content } : d)),
    )
  }

  const insertSnippet = (snippetKey: string) => {
    if (!activeDoc) return
    const snippet = SNIPPETS[activeDoc.kind]?.[snippetKey]
    if (snippet) {
      updateContent(`${activeDoc.content}\n${snippet}`)
    }
  }

  const openDoc = (index: number) => {
    setActiveDocIndex(index)
    if (!openDocIndices.includes(index)) {
      setOpenDocIndices((prev) => [...prev, index])
    }
  }

  const closeDoc = (index: number) => {
    const nextOpen = openDocIndices.filter((x) => x !== index)
    setOpenDocIndices(nextOpen)
    if (activeDocIndex === index && nextOpen.length > 0) {
      setActiveDocIndex(nextOpen[0])
    }
  }

  return {
    docs,
    activeDoc,
    activeDocIndex,
    openDocIndices,
    setDocs,
    openDoc,
    closeDoc,
    updateContent,
    insertSnippet,
  }
}
