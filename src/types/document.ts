export type DocKind = "tex" | "md" | "image" | "dataset" | "pdf" | "other";

export interface Doc {
  name: string;
  path?: string;
  kind: DocKind;
  content: string;
}

export type RibbonTab = "Home" | "Insert" | "References" | "Review" | "Data";

export type PanelType =
  "files" | "outline" | "search" | "review" | "git" | "ai";

export interface OutlineNode {
  id: string;
  label: string;
  level: number;
  lineNumber: number;
  kind:
    | "part"
    | "chapter"
    | "section"
    | "subsection"
    | "subsubsection"
    | "paragraph"
    | "h1"
    | "h2"
    | "h3"
    | "h4"
    | "h5"
    | "h6";
  children: OutlineNode[];
}
