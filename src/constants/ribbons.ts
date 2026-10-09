import { RibbonTab } from '../types'

export type RibbonItem = [label: string, icon: string]

export const RIBBONS: Record<RibbonTab, RibbonItem[]> = {
  Home: [
    ['Bold', 'B'],
    ['Italic', 'I'],
    ['Heading', 'H'],
    ['List', '•'],
    ['Quote', '❝'],
  ],
  Insert: [
    ['Equation', '∑'],
    ['Figure', '▣'],
    ['Table', '▦'],
    ['Citation', '[1]'],
    ['Footnote', '¹'],
  ],
  References: [
    ['Bibliography', '📚'],
    ['Cross-ref', '↗'],
    ['TOC', '≡'],
  ],
  Review: [
    ['Spell', 'Aa'],
    ['Comments', '✎'],
    ['Track', '⇄'],
  ],
}
