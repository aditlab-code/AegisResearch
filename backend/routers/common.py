import re
from datetime import datetime
from pathlib import Path

from fastapi import HTTPException, status

from backend.config import WORKSPACE_DIR
from backend.schemas.project_schemas import TreeNodeResponse
from backend.services.workspace_registry import workspace_registry


def get_file_kind(file_name: str) -> str:
    ext = Path(file_name).suffix.lower()
    if ext == ".tex":
        return "tex"
    elif ext in [".md", ".markdown"]:
        return "md"
    elif ext == ".pdf":
        return "pdf"
    elif ext in [
        ".png",
        ".jpg",
        ".jpeg",
        ".svg",
        ".gif",
        ".webp",
        ".eps",
        ".bmp",
        ".tif",
        ".tiff",
    ]:
        return "image"
    elif ext in [".csv", ".tsv", ".parquet", ".pqt"]:
        return "dataset"
    return "other"


TEX_BUILD_ARTIFACT_EXTS = {
    ".aux",
    ".log",
    ".toc",
    ".bbl",
    ".blg",
    ".fls",
    ".fdb_latexmk",
    ".synctex.gz",
    ".out",
    ".lof",
    ".lot",
    ".nav",
    ".snm",
    ".vrb",
    ".idx",
    ".ilg",
    ".ind",
    ".bcf",
    ".run.xml",
}


def is_tex_artifact(file_name: str) -> bool:
    lower = file_name.lower()
    return any(lower.endswith(ext) for ext in TEX_BUILD_ARTIFACT_EXTS)


def resolve_project_dir(name: str) -> Path:
    # 1. Check registered workspaces (external or registered in WorkspaceRegistry)
    entry = workspace_registry.get(name.strip())
    if entry:
        target = Path(entry.path).resolve()
        if target.exists() and target.is_dir():
            return target

    # 2. Fallback to standard WORKSPACE_DIR resolution
    safe_name = re.sub(r"[^a-zA-Z0-9_\-]", "", name.strip())
    if not safe_name:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid project name. Only alphanumeric, dashes, and underscores are allowed.",
        )
    project_dir = (WORKSPACE_DIR / safe_name).resolve()
    try:
        project_dir.relative_to(WORKSPACE_DIR.resolve())
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid project path.",
        )
    return project_dir


def resolve_file_path(project_dir: Path, file_path: str) -> Path:
    target_file = (project_dir / file_path).resolve()
    try:
        target_file.relative_to(project_dir.resolve())
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid file path. Path traversal is not allowed.",
        )
    if not target_file.exists() and "/" not in file_path and "\\" not in file_path:
        for candidate in project_dir.rglob(file_path):
            if candidate.is_file():
                rel_parts = candidate.relative_to(project_dir).parts
                if not any(
                    part.startswith(".")
                    or part in {".venv", "__pycache__", "node_modules"}
                    for part in rel_parts
                ):
                    return candidate
    return target_file


SEARCH_IGNORED_EXTENSIONS = {
    ".pdf",
    ".png",
    ".jpg",
    ".jpeg",
    ".gif",
    ".ico",
    ".svg",
    ".aux",
    ".log",
    ".out",
    ".toc",
    ".gz",
    ".synctex",
    ".fls",
    ".fdb_latexmk",
    ".bbl",
    ".blg",
    ".pyc",
    ".DS_Store",
}


def build_tree_node(item_path: Path, project_root: Path) -> TreeNodeResponse | None:
    rel_path = item_path.relative_to(project_root).as_posix()
    name = item_path.name

    # Ignore hidden files, caches, dot folders, and LaTeX build artifacts
    if (
        name.startswith(".")
        or name in {".git", ".venv", "node_modules", "__pycache__", ".DS_Store"}
        or is_tex_artifact(name)
    ):
        return None

    if item_path.is_dir():
        children: list[TreeNodeResponse] = []
        try:
            for sub_item in sorted(
                item_path.iterdir(), key=lambda p: (p.is_file(), p.name.lower())
            ):
                child_node = build_tree_node(sub_item, project_root)
                if child_node:
                    children.append(child_node)
        except PermissionError:
            pass

        return TreeNodeResponse(
            id=rel_path if rel_path != "." else "root",
            name=name if rel_path != "." else project_root.name,
            path=rel_path if rel_path != "." else "",
            type="folder",
            children=children,
        )
    else:
        stat_res = item_path.stat()
        return TreeNodeResponse(
            id=rel_path,
            name=name,
            path=rel_path,
            type="file",
            kind=get_file_kind(name),
            size=stat_res.st_size,
            updatedAt=datetime.fromtimestamp(stat_res.st_mtime).isoformat(),
        )
