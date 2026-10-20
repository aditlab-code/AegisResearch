import { DocKind } from "./document";

export interface FileNode {
  name: string;
  path: string;
  kind: DocKind | "pdf" | "other";
  size?: number;
  updatedAt?: string;
}

export interface FileTreeNode {
  id: string;
  name: string;
  path: string;
  type: "file" | "folder";
  kind?: DocKind | "pdf" | "other";
  size?: number;
  updatedAt?: string;
  children?: FileTreeNode[];
}

export interface Project {
  name: string;
  rootPath: string;
  files: FileNode[];
  activeFile?: string;
}

export interface WorkspaceEntry {
  id: string;
  name: string;
  path: string;
  root_file?: string | null;
  last_opened: number;
}

export interface OpenDialogResult {
  selected_path?: string | null;
  cancelled: boolean;
  requires_manual_input: boolean;
}
