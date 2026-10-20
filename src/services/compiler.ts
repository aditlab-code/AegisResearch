import { apiClient } from "./api";
import { CompileResult, EngineType } from "../types";

interface BackendCompileResponse {
  success: boolean;
  message: string;
  pdfUrl?: string | null;
  errors: string[];
  logOutput?: string | null;
}

export const compilerService = {
  async compile(
    projectName: string,
    mainFile: string = "main.tex",
    engine: EngineType = "pdfLaTeX",
  ): Promise<CompileResult> {
    const startTime = Date.now();
    const res = await apiClient.post<BackendCompileResponse>(
      `/api/projects/${encodeURIComponent(projectName)}/compile`,
      { mainFile, engine },
    );

    const durationMs = Date.now() - startTime;

    const errors = (res.errors || []).map((err) => ({
      message: err,
      raw: err,
    }));

    const pdfBlobUrl = res.pdfUrl
      ? `http://localhost:8000${res.pdfUrl}?t=${Date.now()}`
      : undefined;

    return {
      success: res.success,
      engine,
      pdfBlobUrl,
      logText: res.logOutput || res.message,
      errors,
      durationMs,
    };
  },

  getDownloadPdfUrl(projectName: string, pdfName: string = "main.pdf"): string {
    return `http://localhost:8000/api/projects/${encodeURIComponent(projectName)}/pdf/${encodeURIComponent(pdfName)}`;
  },

  async checkPdfExists(projectName: string, pdfName: string): Promise<boolean> {
    try {
      const url = this.getDownloadPdfUrl(projectName, pdfName);
      const res = await fetch(url, { method: "HEAD" });
      return res.status === 200;
    } catch {
      return false;
    }
  },

  async resolveProjectPdf(
    projectName: string,
    activeFileName: string = "main.tex",
  ): Promise<string | undefined> {
    const stem = activeFileName.replace(/\.[^/.]+$/, "");
    const exactPdf = `${stem}.pdf`;

    // Priority 1: Exact match with current file
    if (await this.checkPdfExists(projectName, exactPdf)) {
      return `${this.getDownloadPdfUrl(projectName, exactPdf)}?t=${Date.now()}`;
    }

    // Priority 2: Fallback to root main.pdf
    if (await this.checkPdfExists(projectName, "main.pdf")) {
      return `${this.getDownloadPdfUrl(projectName, "main.pdf")}?t=${Date.now()}`;
    }

    return undefined;
  },
};
