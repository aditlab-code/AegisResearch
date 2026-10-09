export type DocKind = 'tex' | 'md'

export interface Doc {
  name: string
  kind: DocKind
  content: string
}

export type RibbonTab = 'Home' | 'Insert' | 'References' | 'Review'

export type PanelType = 'files' | 'outline' | 'search' | 'ai'
