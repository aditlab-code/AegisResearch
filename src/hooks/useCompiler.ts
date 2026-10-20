import { useState, useCallback } from "react";
import { CompileResult, EngineType } from "../types";
import { compilerService } from "../services";

export function useCompiler(projectName: string = "template-thesis") {
  const [engine, setEngine] = useState<EngineType>("pdfLaTeX");
  const [isCompiling, setIsCompiling] = useState(false);
  const [compileResult, setCompileResult] = useState<CompileResult | null>(
    null,
  );
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | undefined>(undefined);

  const compile = useCallback(
    async (mainFile: string = "main.tex") => {
      setIsCompiling(true);
      try {
        const result = await compilerService.compile(
          projectName,
          mainFile,
          engine,
        );
        setCompileResult(result);
        if (result.success && result.pdfBlobUrl) {
          setPdfBlobUrl(result.pdfBlobUrl);
        }
        return result;
      } catch (err: unknown) {
        const msg =
          err instanceof Error ? err.message : "Backend compilation failed.";
        const failedResult: CompileResult = {
          success: false,
          engine,
          errors: [{ message: msg }],
        };
        setCompileResult(failedResult);
        return failedResult;
      } finally {
        setIsCompiling(false);
      }
    },
    [projectName, engine],
  );

  return {
    engine,
    setEngine,
    isCompiling,
    compileResult,
    pdfBlobUrl,
    setPdfBlobUrl,
    compile,
  };
}
