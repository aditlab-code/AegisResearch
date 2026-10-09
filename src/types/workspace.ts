import { DocKind } from './document'

export interface FileNode {
  name: string
  path: string
  kind: DocKind | 'other'
  size?: number
  updatedAt?: string
}

export interface Project {
  name: string
  rootPath: string
  files: FileNode[]
  activeFile?: string
}
