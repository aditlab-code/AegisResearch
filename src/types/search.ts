export interface SearchMatch {
  lineNumber: number
  lineText: string
  matchStart: number
  matchEnd: number
}

export interface SearchFileResult {
  filePath: string
  fileName: string
  kind: string
  matchCount: number
  matches: SearchMatch[]
}

export interface SearchResponse {
  query: string
  totalMatches: number
  fileCount: number
  results: SearchFileResult[]
}

export interface SearchReplaceRequest {
  query: string
  replaceWith?: string
  caseSensitive?: boolean
  filePath?: string
  lineNumber?: number
  matchStart?: number
  matchEnd?: number
}

export interface SearchReplaceResponse {
  success: boolean
  message: string
  replacedCount: number
  modifiedFiles: string[]
}
