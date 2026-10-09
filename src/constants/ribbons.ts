import { RibbonTab } from '../types'
import {
  Save,
  Copy,
  ClipboardPaste,
  Bold,
  Italic,
  Heading,
  List,
  Quote,
  Sigma,
  Image,
  Table,
  BookOpen,
  Superscript,
  Library,
  ExternalLink,
  ListTree,
  CheckCheck,
  MessageSquare,
  GitCompare,
  type LucideIcon,
} from 'lucide-react'

export type RibbonItem = [label: string, icon: LucideIcon]

export const RIBBONS: Record<RibbonTab, RibbonItem[]> = {
  Home: [
    ['Save', Save],
    ['Copy', Copy],
    ['Paste', ClipboardPaste],
    ['Bold', Bold],
    ['Italic', Italic],
    ['Heading', Heading],
    ['List', List],
    ['Quote', Quote],
  ],
  Insert: [
    ['Equation', Sigma],
    ['Figure', Image],
    ['Table', Table],
    ['Citation', BookOpen],
    ['Footnote', Superscript],
  ],
  References: [
    ['Bibliography', Library],
    ['Cross-ref', ExternalLink],
    ['TOC', ListTree],
  ],
  Review: [
    ['Spell', CheckCheck],
    ['Comments', MessageSquare],
    ['Track', GitCompare],
  ],
}
