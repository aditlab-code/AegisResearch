import { apiClient } from './api'
import { CompileResult, EngineType } from '../types'

export const compilerService = {
  async compile(
    projectName: string,
    mainFile: string = 'main.tex',
    engine: EngineType = 'pdfLaTeX',
  ): Promise<CompileResult> {
    return apiClient.post<CompileResult>(
      `/api/projects/${encodeURIComponent(projectName)}/compile`,
      { mainFile, engine },
    )
  },

  getDownloadPdfUrl(projectName: string, pdfName: string = 'main.pdf'): string {
    return `http://localhost:8000/api/projects/${encodeURIComponent(projectName)}/pdf/${encodeURIComponent(pdfName)}`
  },
}
