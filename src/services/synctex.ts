import { apiClient } from './api'

export interface SyncTeXInverseResult {
  success: boolean
  file?: string
  line?: number
  column?: number
  message?: string
}

export interface SyncTeXForwardResult {
  success: boolean
  page?: number
  x?: number
  y?: number
  width?: number
  height?: number
  message?: string
}

export const synctexService = {
  async inverseSearch(
    projectName: string,
    pdfName: string,
    page: number,
    x: number,
    y: number,
  ): Promise<SyncTeXInverseResult> {
    try {
      const res = await apiClient.post<SyncTeXInverseResult>(
        `/api/projects/${encodeURIComponent(projectName)}/synctex/inverse`,
        { pdfName, page, x, y },
      )
      return res
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'SyncTeX query failed'
      return {
        success: false,
        message: msg,
      }
    }
  },

  async forwardSearch(
    projectName: string,
    pdfName: string,
    file: string,
    line: number,
    column: number = 1,
  ): Promise<SyncTeXForwardResult> {
    try {
      const res = await apiClient.post<SyncTeXForwardResult>(
        `/api/projects/${encodeURIComponent(projectName)}/synctex/forward`,
        { pdfName, file, line, column },
      )
      return res
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'SyncTeX query failed'
      return {
        success: false,
        message: msg,
      }
    }
  },
}
