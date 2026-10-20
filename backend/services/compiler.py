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
        f"/usr/bin/vendor_perl/{name}",
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
        rel_target = target_tex.relative_to(project_dir.resolve()).as_posix()
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

    stem = target_tex.stem
    pdf_name = stem + ".pdf"
    log_name = stem + ".log"
    aux_name = stem + ".aux"
    bcf_name = stem + ".bcf"
    pdf_path = project_dir / pdf_name
    log_path = project_dir / log_name
    aux_path = project_dir / aux_name
    bcf_path = project_dir / bcf_name

    # Pandoc Engine execution path for Markdown or Pandoc selection
    if engine.lower() == "pandoc" or target_tex.suffix.lower() == ".md":
        pandoc_bin = find_tex_bin("pandoc")
        is_pandoc_available = shutil.which(pandoc_bin) is not None or (
            os.path.exists(pandoc_bin) and os.access(pandoc_bin, os.X_OK)
        )
        if not is_pandoc_available:
            return {
                "success": False,
                "message": (
                    "Pandoc CLI not found on system PATH. Please install pandoc "
                    "(e.g. 'brew install pandoc') to compile Markdown files into PDF."
                ),
                "pdfName": None,
                "errors": [
                    "Pandoc executable not found. Install pandoc or use the live preview."
                ],
                "logOutput": "Pandoc CLI is not available in the current environment.",
            }

        cmd_pandoc = [pandoc_bin, target_tex.name, "-o", pdf_name]
        bib_files = list(project_dir.glob("*.bib"))
        if bib_files:
            cmd_pandoc.extend(["--citeproc", f"--bibliography={bib_files[0].name}"])
        cmd_pandoc.extend(["--toc", "-N"])

        code_p, out_p, err_p = await run_cmd(
            cmd_pandoc, project_dir, timeout=timeout_sec
        )
        log_p = (out_p + b"\n" + err_p).decode("utf-8", errors="replace")

        if code_p == 0 and pdf_path.exists():
            return {
                "success": True,
                "message": f"Compilation successful. Generated '{pdf_name}'.",
                "pdfName": pdf_name,
                "errors": [],
                "logOutput": log_p[:2000],
            }
        else:
            err_msg = err_p.decode("utf-8", errors="replace").strip()
            return {
                "success": False,
                "message": f"Pandoc compilation failed with exit code {code_p}.",
                "pdfName": None,
                "errors": [err_msg]
                if err_msg
                else ["Pandoc compilation failed. Check markdown syntax."],
                "logOutput": log_p[-3000:],
            }

    tex_bin = find_tex_bin("xelatex" if engine.lower() == "xelatex" else "pdflatex")
    bibtex_bin = find_tex_bin("bibtex")
    biber_bin = find_tex_bin("biber")
    is_biber_available = shutil.which(biber_bin) is not None or (
        os.path.exists(biber_bin) and os.access(biber_bin, os.X_OK)
    )

    cmd_pdf = [
        tex_bin,
        "-interaction=nonstopmode",
        "-synctex=1",
        "-output-directory=.",
        rel_target,
    ]
    try:
        # Pass 1: Initial pdflatex/xelatex run (writes .aux, .bcf, and .toc)
        code1, out1, _ = await run_cmd(cmd_pdf, project_dir, timeout=25)

        # Check if biber or bibtex is needed
        ran_bib = False
        if bcf_path.exists() and is_biber_available:
            cmd_biber = [biber_bin, stem]
            await run_cmd(cmd_biber, project_dir, timeout=25)
            ran_bib = True
        elif aux_path.exists():
            try:
                aux_content = aux_path.read_text(encoding="utf-8", errors="replace")
                if "\\citation" in aux_content or "\\bibdata" in aux_content:
                    cmd_bib = [bibtex_bin, stem]
                    await run_cmd(cmd_bib, project_dir, timeout=15)
                    ran_bib = True
            except Exception:
                pass

        if ran_bib:
            # Extra pass after bibliography tool
            await run_cmd(cmd_pdf, project_dir, timeout=25)

        # Pass 2: Final pdflatex/xelatex run (resolves cross-refs, labels, and TOC page numbers)
        code_final, out_final, _ = await run_cmd(cmd_pdf, project_dir, timeout=25)

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
                "errors": errors
                if errors
                else ["LaTeX compilation error. Check syntax."],
                "logOutput": log_content[-3000:]
                if log_content
                else out_final.decode("utf-8", errors="replace")[-2000:],
            }

    except Exception as e:
        return {
            "success": False,
            "message": f"Subprocess execution failed: {str(e)}",
            "errors": [str(e)],
        }
