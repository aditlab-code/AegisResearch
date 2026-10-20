import { useState } from "react";
import { Doc } from "../types";
import { INITIAL_DOCS, SNIPPETS } from "../constants";

export function useDocumentManager(initialDocs: Doc[] = INITIAL_DOCS) {
  const [docs, setDocs] = useState<Doc[]>(initialDocs);
  const [activeDocIndex, setActiveDocIndex] = useState(0);
  // Initially open only unique valid document index
  const [openDocIndices, setOpenDocIndices] = useState<number[]>([0]);

  const activeDoc =
    activeDocIndex >= 0 && activeDocIndex < docs.length
      ? docs[activeDocIndex]
      : undefined;

  const updateContent = (content: string) => {
    if (activeDocIndex < 0) return;
    setDocs((prev) =>
      prev.map((d, i) => (i === activeDocIndex ? { ...d, content } : d)),
    );
  };

  const insertSnippet = (snippetKey: string) => {
    if (!activeDoc) return;
    const snippet = SNIPPETS[activeDoc.kind]?.[snippetKey];
    if (snippet) {
      updateContent(`${activeDoc.content}\n${snippet}`);
    }
  };

  const openDoc = (index: number) => {
    if (index < 0 || index >= docs.length) return;
    setActiveDocIndex(index);
    setOpenDocIndices((prev) =>
      prev.includes(index) ? prev : [...prev, index],
    );
  };

  const closeDoc = (index: number) => {
    setOpenDocIndices((prev) => {
      const currentPosition = prev.indexOf(index);
      const nextOpen = prev.filter((x) => x !== index);

      if (activeDocIndex === index) {
        if (nextOpen.length === 0) {
          setActiveDocIndex(-1);
        } else {
          // Transition to neighbor tab (prefer previous tab, else next tab)
          const nextTargetIndex =
            currentPosition > 0
              ? prev[currentPosition - 1]
              : (prev[currentPosition + 1] ?? nextOpen[0]);
          setActiveDocIndex(nextTargetIndex);
        }
      }

      return nextOpen;
    });
  };

  const setDocContent = (identifier: string, content: string) => {
    setDocs((prev) =>
      prev.map((d) =>
        (d.path && d.path === identifier) || d.name === identifier
          ? { ...d, content }
          : d,
      ),
    );
  };

  const openOrCreateDoc = (
    fileName: string,
    kind: Doc["kind"] = "tex",
    initialContent?: string,
    filePath?: string,
  ) => {
    const targetPath = filePath || fileName;
    const existingIndex = docs.findIndex(
      (d) => (d.path && d.path === targetPath) || d.name === fileName,
    );
    if (existingIndex !== -1) {
      if (initialContent !== undefined) {
        setDocs((prev) =>
          prev.map((d, i) =>
            i === existingIndex
              ? { ...d, content: initialContent, path: d.path || targetPath }
              : d,
          ),
        );
      }
      openDoc(existingIndex);
      return existingIndex;
    }

    const newDoc: Doc = {
      name: fileName,
      path: targetPath,
      kind,
      content:
        initialContent !== undefined
          ? initialContent
          : kind === "tex"
            ? `\\documentclass{article}\n\\title{${fileName.replace(/\.tex$/, "")}}\n\\begin{document}\n\\section{Introduction}\n\\end{document}\n`
            : kind === "image" || kind === "dataset"
              ? ""
              : `# ${fileName}\n`,
    };

    const newIndex = docs.length;
    setDocs((prev) => [...prev, newDoc]);
    setActiveDocIndex(newIndex);
    setOpenDocIndices((prev) =>
      prev.includes(newIndex) ? prev : [...prev, newIndex],
    );
    return newIndex;
  };

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
  };
}
