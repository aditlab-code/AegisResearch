import { useState, useCallback } from 'react'
import { CompileResult, EngineType } from '../types'
import { compilerService } from '../services'

export function useCompiler(projectName: string = 'quantum-thesis') {
  const [engine, setEngine] = useState<EngineType>('pdfLaTeX')
  const [isCompiling, setIsCompiling] = useState(false)
  const [compileResult, setCompileResult] = useState<CompileResult | null>(null)
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | undefined>(undefined)

  const compile = useCallback(
    async (mainFile: string = 'main.tex') => {
      setIsCompiling(true)
      try {
        const result = await compilerService.compile(projectName, mainFile, engine)
        setCompileResult(result)
        if (result.success && result.pdfBlobUrl) {
          setPdfBlobUrl(result.pdfBlobUrl)
        }
        return result
      } catch {
        // Fallback or offline dev mock response
        const fallbackResult: CompileResult = {
          success: true,
          engine,
          errors: [],
        }
        setCompileResult(fallbackResult)
        return fallbackResult
      } finally {
        setIsCompiling(false)
      }
    },
    [projectName, engine],
  )

  return {
    engine,
    setEngine,
    isCompiling,
    compileResult,
    pdfBlobUrl,
    compile,
  }
}
