export function countWords(text: string): number {
  return text.split(/\s+/).filter(Boolean).length;
}

export function extractOutline(content: string): string[] {
  return content
    .split("\n")
    .filter((l) => /^(#|\\section|\\subsection)/.test(l));
}
