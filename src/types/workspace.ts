import { DocKind } from './document'

export interface FileNode {
  name: string
  path: string
  kind: DocKind | 'other'
  size?: number
  updatedAt?: string
}

export interface FileTreeNode {
  id: string
  name: string
  path: string
  type: 'file' | 'folder'
  kind?: DocKind | 'other'
  size?: number
  updatedAt?: string
  children?: FileTreeNode[]
}

export interface Project {
  name: string
  rootPath: string
  files: FileNode[]
  activeFile?: string
}
