export interface BibEntry {
  id: string
  key: string
  type: string // 'article' | 'book' | 'inproceedings' | 'misc'
  title: string
  author: string
  year: string
  journal?: string
  publisher?: string
}

export function parseBibtex(content: string): BibEntry[] {
  if (!content) return []
  const entries: BibEntry[] = []

  // Regex to match @type{key, ...}
  const entryRegex = /@(\w+)\s*\{\s*([^,]+),([\s\S]*?)(?=\n@|\n*$)/g
  let match: RegExpExecArray | null

  while ((match = entryRegex.exec(content)) !== null) {
    const type = match[1].toLowerCase()
    const key = match[2].trim()
    const body = match[3]

    const getField = (field: string): string => {
      const fieldRegex = new RegExp(`${field}\\s*=\\s*[{"]?([^}"]*)[}"]?`, 'i')
      const fm = body.match(fieldRegex)
      return fm ? fm[1].trim() : ''
    }

    entries.push({
      id: `bib-${key}-${Date.now()}`,
      key,
      type,
      title: getField('title'),
      author: getField('author'),
      year: getField('year'),
      journal: getField('journal') || getField('booktitle'),
      publisher: getField('publisher'),
    })
  }

  return entries
}

export function serializeBibtex(entries: BibEntry[]): string {
  return entries
    .map((e) => {
      const fields: string[] = []
      if (e.title) fields.push(`  title={${e.title}}`)
      if (e.author) fields.push(`  author={${e.author}}`)
      if (e.year) fields.push(`  year={${e.year}}`)
      if (e.journal) fields.push(`  journal={${e.journal}}`)
      if (e.publisher) fields.push(`  publisher={${e.publisher}}`)

      return `@${e.type || 'article'}{${e.key},\n${fields.join(',\n')}\n}`
    })
    .join('\n\n')
}
