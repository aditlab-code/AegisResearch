import asyncio
import os
import re
from pathlib import Path
from typing import Dict, Any, Optional

from backend.services.compiler import find_tex_bin, run_cmd


def parse_synctex_edit_output(output_text: str, project_dir: Optional[Path] = None) -> Dict[str, Any]:
    """
    Parses the stdout from `synctex edit -o page:x:y:file.pdf`.
    Extracts Input, Line, and Column.
    """
    if "SyncTeX result begin" not in output_text:
        return {"success": False, "message": "No SyncTeX data found in output."}

    input_match = re.search(r"^Input:(.+)$", output_text, re.MULTILINE)
    line_match = re.search(r"^Line:(\d+)$", output_text, re.MULTILINE)
    col_match = re.search(r"^Column:(-?\d+)$", output_text, re.MULTILINE)

    if not input_match or not line_match:
        return {"success": False, "message": "Could not resolve source location from SyncTeX."}

    raw_path = input_match.group(1).strip()
    line = int(line_match.group(1))
    col = int(col_match.group(1)) if col_match else 1
    if col < 1:
        col = 1

    # Normalize file path relative to project_dir
    file_path = raw_path
    if project_dir:
        try:
            resolved_file = Path(raw_path).resolve()
            resolved_proj = project_dir.resolve()
            file_path = resolved_file.relative_to(resolved_proj).as_posix()
        except ValueError:
            # Fallback to file name if outside or not relative
            file_path = Path(raw_path).name

    return {
        "success": True,
        "file": file_path,
        "line": line,
        "column": col,
    }


def parse_synctex_view_output(output_text: str) -> Dict[str, Any]:
    """
    Parses the stdout from `synctex view -i line:col:file.tex -o file.pdf`.
    Extracts Page, x, y, width (W), and height (H).
    """
    if "SyncTeX result begin" not in output_text:
        return {"success": False, "message": "No SyncTeX data found in output."}

    page_match = re.search(r"^Page:(\d+)$", output_text, re.MULTILINE)
    x_match = re.search(r"^x:([\d.]+)$", output_text, re.MULTILINE)
    y_match = re.search(r"^y:([\d.]+)$", output_text, re.MULTILINE)
    w_match = re.search(r"^W:([\d.]+)$", output_text, re.MULTILINE)
    h_match = re.search(r"^H:([\d.]+)$", output_text, re.MULTILINE)

    if not page_match or not x_match or not y_match:
        return {"success": False, "message": "Could not resolve PDF position from SyncTeX."}

    page = int(page_match.group(1))
    x = float(x_match.group(1))
    y = float(y_match.group(1))
    width = float(w_match.group(1)) if w_match else 100.0
    height = float(h_match.group(1)) if h_match else 12.0

    return {
        "success": True,
        "page": page,
        "x": x,
        "y": y,
        "width": width,
        "height": height,
    }


async def synctex_inverse_search(
    project_dir: Path,
    pdf_name: str,
    page: int,
    x: float,
    y: float,
    timeout: int = 5,
) -> Dict[str, Any]:
    """
    Performs inverse synchronization (PDF coordinates -> LaTeX source line).
    """
    pdf_path = project_dir / pdf_name
    if not pdf_path.exists():
        return {
            "success": False,
            "message": f"PDF file '{pdf_name}' not found. Please compile the document first.",
        }

    # Verify that .synctex or .synctex.gz exists
    stem = pdf_path.stem
    synctex_gz = project_dir / f"{stem}.synctex.gz"
    synctex_plain = project_dir / f"{stem}.synctex"
    if not synctex_gz.exists() and not synctex_plain.exists():
        return {
            "success": False,
            "message": f"SyncTeX data '{stem}.synctex.gz' not found. Please recompile with SyncTeX enabled.",
        }

    synctex_bin = find_tex_bin("synctex")
    cmd = [
        synctex_bin,
        "edit",
        "-o",
        f"{page}:{x}:{y}:{pdf_name}",
        "-d",
        str(project_dir),
    ]

    try:
        code, stdout, stderr = await run_cmd(cmd, project_dir, timeout=timeout)
        out_str = stdout.decode("utf-8", errors="replace")
        if code != 0 or not out_str:
            err_str = stderr.decode("utf-8", errors="replace")
            return {
                "success": False,
                "message": f"SyncTeX edit query failed: {err_str or 'No result'}",
            }

        return parse_synctex_edit_output(out_str, project_dir)
    except Exception as e:
        return {
            "success": False,
            "message": f"SyncTeX execution error: {str(e)}",
        }


async def synctex_forward_search(
    project_dir: Path,
    pdf_name: str,
    file: str,
    line: int,
    column: int = 1,
    timeout: int = 5,
) -> Dict[str, Any]:
    """
    Performs forward synchronization (LaTeX source line -> PDF page coordinates).
    """
    pdf_path = project_dir / pdf_name
    if not pdf_path.exists():
        return {
            "success": False,
            "message": f"PDF file '{pdf_name}' not found. Please compile the document first.",
        }

    stem = pdf_path.stem
    synctex_gz = project_dir / f"{stem}.synctex.gz"
    synctex_plain = project_dir / f"{stem}.synctex"
    if not synctex_gz.exists() and not synctex_plain.exists():
        return {
            "success": False,
            "message": f"SyncTeX data '{stem}.synctex.gz' not found. Please recompile with SyncTeX enabled.",
        }

    synctex_bin = find_tex_bin("synctex")
    # synctex view -i line:col:file -o pdf_name
    cmd = [
        synctex_bin,
        "view",
        "-i",
        f"{line}:{column}:{file}",
        "-o",
        pdf_name,
        "-d",
        str(project_dir),
    ]

    try:
        code, stdout, stderr = await run_cmd(cmd, project_dir, timeout=timeout)
        out_str = stdout.decode("utf-8", errors="replace")
        if code != 0 or not out_str:
            err_str = stderr.decode("utf-8", errors="replace")
            return {
                "success": False,
                "message": f"SyncTeX view query failed: {err_str or 'No result'}",
            }

        return parse_synctex_view_output(out_str)
    except Exception as e:
        return {
            "success": False,
            "message": f"SyncTeX execution error: {str(e)}",
        }
