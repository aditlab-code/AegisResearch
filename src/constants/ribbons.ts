import { RibbonTab } from "../types";
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
  BarChart3,
  Sliders,
  Layers,
  CheckCircle2,
  Database,
  type LucideIcon,
} from "lucide-react";

export type RibbonItem = [label: string, icon: LucideIcon];

export const RIBBONS: Record<RibbonTab, RibbonItem[]> = {
  Home: [
    ["Save", Save],
    ["Copy", Copy],
    ["Paste", ClipboardPaste],
    ["Bold", Bold],
    ["Italic", Italic],
    ["Heading", Heading],
    ["List", List],
    ["Quote", Quote],
  ],
  Insert: [
    ["Equation", Sigma],
    ["Table", Table],
    ["Figure", Image],
  ],
  References: [
    ["Citation", BookOpen],
    ["Footnote", Superscript],
    ["Bibliography", Library],
    ["Cross-ref", ExternalLink],
    ["TOC", ListTree],
  ],
  Data: [
    ["Import", Database],
    ["Regression", Sliders],
    ["Descriptives", BarChart3],
    ["Reliability", CheckCircle2],
    ["MANOVA", GitCompare],
    ["PCA", Layers],
  ],
  Review: [
    ["Spell", CheckCheck],
    ["Comments", MessageSquare],
    ["Track", GitCompare],
  ],
};
