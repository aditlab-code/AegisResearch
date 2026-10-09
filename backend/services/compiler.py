import asyncio
import os
import shutil
import re
from pathlib import Path
from typing import Dict, Any, List, Optional

def find_pdflatex_bin() -> str:
    # First check standard PATH
    path_bin = shutil.which("pdflatex")
    if path_bin:
        return path_bin

    # Common macOS / Linux TeX Live paths
    candidates = [
        "/usr/local/texlive/2025/bin/universal-darwin/pdflatex",
        "/Library/TeX/texbin/pdflatex",
        "/usr/bin/pdflatex",
        "/usr/local/bin/pdflatex",
    ]
    for c in candidates:
        if os.path.exists(c) and os.access(c, os.X_OK):
            return c

    return "pdflatex"


def parse_log_errors(log_text: str) -> List[str]:
    errors: List[str] = []
    lines = log_text.splitlines()
    for i, line in enumerate(lines):
        if line.startswith("!"):
            # Found error line, capture it and the next line if available
            err_msg = line.strip()
            if i + 1 < len(lines) and lines[i + 1].strip():
                err_msg += f" ({lines[i + 1].strip()})"
            errors.append(err_msg)
    return errors


async def compile_latex(
    project_dir: Path,
    main_file: str = "main.tex",
    engine: str = "pdfLaTeX",
    timeout_sec: int = 30,
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

    pdflatex_bin = find_pdflatex_bin()
    pdf_name = target_tex.stem + ".pdf"
    log_name = target_tex.stem + ".log"
    pdf_path = project_dir / pdf_name
    log_path = project_dir / log_name

    cmd = [
        pdflatex_bin,
        "-interaction=nonstopmode",
        "-output-directory=.",
        target_tex.name,
    ]

    try:
        proc = await asyncio.create_subprocess_exec(
            *cmd,
            cwd=str(project_dir),
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
        )

        try:
            stdout, stderr = await asyncio.wait_for(proc.communicate(), timeout=timeout_sec)
        except asyncio.TimeoutError:
            proc.kill()
            return {
                "success": False,
                "message": f"Compilation timed out after {timeout_sec} seconds.",
                "errors": ["Compilation timeout."],
            }

        return_code = proc.returncode
        log_content = ""
        if log_path.exists():
            try:
                log_content = log_path.read_text(encoding="utf-8", errors="replace")
            except Exception:
                pass

        errors = parse_log_errors(log_content)

        if return_code == 0 and pdf_path.exists():
            return {
                "success": True,
                "message": f"Compilation successful. Generated '{pdf_name}'.",
                "pdfName": pdf_name,
                "errors": [],
                "logOutput": stdout.decode("utf-8", errors="replace")[:2000],
            }
        else:
            return {
                "success": False,
                "message": f"Compilation failed with exit code {return_code}.",
                "pdfName": None,
                "errors": errors if errors else ["LaTeX compilation error. Check syntax."],
                "logOutput": log_content[-3000:] if log_content else stdout.decode("utf-8", errors="replace")[-2000:],
            }

    except Exception as e:
        return {
            "success": False,
            "message": f"Subprocess execution failed: {str(e)}",
            "errors": [str(e)],
        }
