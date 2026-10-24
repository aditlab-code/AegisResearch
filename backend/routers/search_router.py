import os
import re
from pathlib import Path

from fastapi import APIRouter, HTTPException, status

from backend.routers.common import (
    SEARCH_IGNORED_EXTENSIONS,
    get_file_kind,
    is_tex_artifact,
    resolve_file_path,
    resolve_project_dir,
)
from backend.schemas.project_schemas import (
    SearchFileItem,
    SearchMatchItem,
    SearchProjectResponse,
    SearchReplaceRequest,
    SearchReplaceResponse,
)

router = APIRouter()


@router.get(
    "/api/projects/{name}/search",
    response_model=SearchProjectResponse,
    tags=["Search"],
)
async def search_project(
    name: str,
    q: str,
    case_sensitive: bool = False,
):
    stripped_query = q.strip()
    if len(stripped_query) < 5:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Query pencarian minimal harus 5 karakter.",
        )

    project_dir = resolve_project_dir(name)
    if not project_dir.exists() or not project_dir.is_dir():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Project '{name}' not found.",
        )

    flags = 0 if case_sensitive else re.IGNORECASE
    try:
        pattern = re.compile(stripped_query, flags)
    except re.error:
        # Fallback to escaped literal if user entered raw symbols
        pattern = re.compile(re.escape(stripped_query), flags)

    file_results: list[SearchFileItem] = []
    total_matches = 0

    for root, dirs, files in os.walk(project_dir):
        # Skip hidden/cache directories
        dirs[:] = [
            d
            for d in dirs
            if not d.startswith(".")
            and d not in {".git", ".venv", "node_modules", "__pycache__"}
        ]

        for file in files:
            if file.startswith("."):
                continue
            file_path = Path(root) / file
            ext = file_path.suffix.lower()
            if ext in SEARCH_IGNORED_EXTENSIONS:
                continue

            # Max file size 3MB
            try:
                if file_path.stat().st_size > 3 * 1024 * 1024:
                    continue
                content = file_path.read_text(encoding="utf-8", errors="replace")
            except Exception:  # noqa: BLE001, S112
                continue

            lines = content.splitlines()
            file_matches: list[SearchMatchItem] = []

            for line_idx, line in enumerate(lines, start=1):
                for match in pattern.finditer(line):
                    file_matches.append(
                        SearchMatchItem(
                            lineNumber=line_idx,
                            lineText=line.strip(),
                            matchStart=match.start(),
                            matchEnd=match.end(),
                        )
                    )
                    total_matches += 1

            if file_matches:
                rel_path = file_path.relative_to(project_dir).as_posix()
                file_results.append(
                    SearchFileItem(
                        filePath=rel_path,
                        fileName=file,
                        kind=get_file_kind(file),
                        matchCount=len(file_matches),
                        matches=file_matches,
                    )
                )

    return SearchProjectResponse(
        query=stripped_query,
        totalMatches=total_matches,
        fileCount=len(file_results),
        results=file_results,
    )


@router.post(
    "/api/projects/{name}/search/replace",
    response_model=SearchReplaceResponse,
    tags=["Search"],
)
async def replace_project_matches(name: str, payload: SearchReplaceRequest):
    stripped_query = payload.query
    if not stripped_query:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Query string cannot be empty.",
        )

    project_dir = resolve_project_dir(name)
    if not project_dir.exists() or not project_dir.is_dir():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Project '{name}' not found.",
        )

    flags = 0 if payload.caseSensitive else re.IGNORECASE
    pattern = re.compile(re.escape(stripped_query), flags)

    total_replaced = 0
    modified_files: list[str] = []

    # Case A: Single file replacement
    if payload.filePath:
        target_file = resolve_file_path(project_dir, payload.filePath)
        if not target_file.exists() or not target_file.is_file():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"File '{payload.filePath}' not found.",
            )

        try:
            content = target_file.read_text(encoding="utf-8")
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Failed to read file: {e!s}",
            ) from e

        if payload.lineNumber is not None:
            lines = content.splitlines(keepends=True)
            target_idx = payload.lineNumber - 1
            if 0 <= target_idx < len(lines):
                orig_line = lines[target_idx]
                new_line, count = pattern.subn(payload.replaceWith, orig_line, count=1)
                if count > 0:
                    lines[target_idx] = new_line
                    target_file.write_text("".join(lines), encoding="utf-8")
                    total_replaced = count
                    modified_files.append(payload.filePath)
        else:
            new_content, count = pattern.subn(payload.replaceWith, content)
            if count > 0:
                target_file.write_text(new_content, encoding="utf-8")
                total_replaced = count
                modified_files.append(payload.filePath)

    # Case B: Multi-file replacement across project
    else:
        for root, dirs, files in os.walk(project_dir):
            dirs[:] = [
                d
                for d in dirs
                if not d.startswith(".")
                and d not in {".git", ".venv", "node_modules", "__pycache__"}
            ]

            for file in files:
                ext = Path(file).suffix.lower()
                if ext in SEARCH_IGNORED_EXTENSIONS or is_tex_artifact(file):
                    continue

                file_path = Path(root) / file
                try:
                    content = file_path.read_text(encoding="utf-8", errors="ignore")
                except Exception:  # noqa: BLE001, S112
                    continue

                new_content, count = pattern.subn(payload.replaceWith, content)
                if count > 0:
                    try:
                        file_path.write_text(new_content, encoding="utf-8")
                        total_replaced += count
                        rel = file_path.relative_to(project_dir).as_posix()
                        modified_files.append(rel)
                    except Exception:  # noqa: BLE001, S110
                        pass

    return SearchReplaceResponse(
        success=True,
        message=f"Replaced {total_replaced} occurrences across {len(modified_files)} file(s).",
        replacedCount=total_replaced,
        modifiedFiles=modified_files,
    )
