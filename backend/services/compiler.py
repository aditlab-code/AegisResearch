import asyncio
import os
import shutil
import re
from pathlib import Path
from typing import Dict, Any, List, Optional

def find_tex_bin(name: str) -> str:
    path_bin = shutil.which(name)
    if path_bin:
        return path_bin

    candidates = [
        f"/usr/local/texlive/2025/bin/universal-darwin/{name}",
        f"/Library/TeX/texbin/{name}",
        f"/usr/bin/{name}",
        f"/usr/local/bin/{name}",
    ]
    for c in candidates:
        if os.path.exists(c) and os.access(c, os.X_OK):
            return c

    return name


def parse_log_errors(log_text: str) -> List[str]:
    errors: List[str] = []
    lines = log_text.splitlines()
    for i, line in enumerate(lines):
        if line.startswith("!"):
            err_msg = line.strip()
            if i + 1 < len(lines) and lines[i + 1].strip():
                err_msg += f" ({lines[i + 1].strip()})"
            errors.append(err_msg)
    return errors


async def run_cmd(cmd: List[str], cwd: Path, timeout: int = 20):
    proc = await asyncio.create_subprocess_exec(
        *cmd,
        cwd=str(cwd),
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE,
    )
    try:
        stdout, stderr = await asyncio.wait_for(proc.communicate(), timeout=timeout)
        return proc.returncode, stdout, stderr
    except asyncio.TimeoutError:
        proc.kill()
        return -1, b"", b"Timeout"


async def compile_latex(
    project_dir: Path,
    main_file: str = "main.tex",
    engine: str = "pdfLaTeX",
    timeout_sec: int = 40,
) -> Dict[str, Any]:
    target_tex = (project_dir / main_file).resolve()
    try:
        target_tex.relative_to(project_dir.resolve())
    except ValueError:
        return {
            "success": False,
            "message": "Invalid file path. Path traversal is not allowed.",
            "errors": ["Path traversal detected."],
        }

    if not target_tex.exists():
        return {
            "success": False,
            "message": f"Source file '{main_file}' not found.",
            "errors": [f"File {main_file} not found."],
        }

    pdflatex_bin = find_tex_bin("pdflatex")
    bibtex_bin = find_tex_bin("bibtex")
    
    stem = target_tex.stem
    pdf_name = stem + ".pdf"
    log_name = stem + ".log"
    aux_name = stem + ".aux"
    pdf_path = project_dir / pdf_name
    log_path = project_dir / log_name
    aux_path = project_dir / aux_name

    cmd_pdf = [
        pdflatex_bin,
        "-interaction=nonstopmode",
        "-synctex=1",
        "-output-directory=.",
        target_tex.name,
    ]

    try:
        # Pass 1: Initial pdflatex run (writes .aux and .toc)
        code1, out1, _ = await run_cmd(cmd_pdf, project_dir, timeout=20)

        # Check if bibtex is needed (.aux contains \bibdata or \citation)
        if aux_path.exists():
            try:
                aux_content = aux_path.read_text(encoding="utf-8", errors="replace")
                if "\\citation" in aux_content or "\\bibdata" in aux_content:
                    cmd_bib = [bibtex_bin, stem]
                    await run_cmd(cmd_bib, project_dir, timeout=15)
                    # Extra pdflatex pass after bibtex
                    await run_cmd(cmd_pdf, project_dir, timeout=20)
            except Exception:
                pass

        # Pass 2: Final pdflatex run (resolves cross-refs, labels, and TOC page numbers)
        code_final, out_final, _ = await run_cmd(cmd_pdf, project_dir, timeout=20)

        log_content = ""
        if log_path.exists():
            try:
                log_content = log_path.read_text(encoding="utf-8", errors="replace")
            except Exception:
                pass

        errors = parse_log_errors(log_content)

        if code_final == 0 and pdf_path.exists():
            return {
                "success": True,
                "message": f"Compilation successful. Generated '{pdf_name}'.",
                "pdfName": pdf_name,
                "errors": [],
                "logOutput": out_final.decode("utf-8", errors="replace")[:2000],
            }
        else:
            return {
                "success": False,
                "message": f"Compilation failed with exit code {code_final}.",
                "pdfName": None,
                "errors": errors if errors else ["LaTeX compilation error. Check syntax."],
                "logOutput": log_content[-3000:] if log_content else out_final.decode("utf-8", errors="replace")[-2000:],
            }

    except Exception as e:
        return {
            "success": False,
            "message": f"Subprocess execution failed: {str(e)}",
            "errors": [str(e)],
        }
