export type EngineType = 'pdfLaTeX' | 'XeLaTeX' | 'Pandoc'

export interface CompileError {
  line?: number
  message: string
  raw?: string
}

export interface CompileResult {
  success: boolean
  engine: EngineType
  pdfBlobUrl?: string
  logText?: string
  errors: CompileError[]
  durationMs?: number
}
