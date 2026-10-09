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

  const setDocContent = (fileName: string, content: string) => {
    setDocs((prev) =>
      prev.map((d) => (d.name === fileName ? { ...d, content } : d)),
    )
  }

  const openOrCreateDoc = (fileName: string, kind: 'tex' | 'md' = 'tex', initialContent?: string) => {
    const existingIndex = docs.findIndex((d) => d.name === fileName)
    if (existingIndex !== -1) {
      if (initialContent !== undefined) {
        setDocs((prev) =>
          prev.map((d, i) => (i === existingIndex ? { ...d, content: initialContent } : d)),
        )
      }
      openDoc(existingIndex)
      return existingIndex
    }
    const newDoc: Doc = {
      name: fileName,
      kind,
      content: initialContent !== undefined
        ? initialContent
        : kind === 'tex'
        ? `\\documentclass{article}\n\\title{${fileName.replace(/\\.tex$/, '')}}\n\\begin{document}\n\\section{Introduction}\n\\end{document}\n`
        : `# ${fileName}\n`,
    }
    const newDocs = [...docs, newDoc]
    const newIndex = newDocs.length - 1
    setDocs(newDocs)
    setActiveDocIndex(newIndex)
    setOpenDocIndices((prev) => (prev.includes(newIndex) ? prev : [...prev, newIndex]))
    return newIndex
  }
  return {
    docs,
    activeDoc,
    activeDocIndex,
    openDocIndices,
    setDocs,
    openDoc,
    openOrCreateDoc,
    setDocContent,
    closeDoc,
    updateContent,
    insertSnippet,
  }
}
