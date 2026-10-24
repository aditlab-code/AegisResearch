import os
import shutil
import sys
from datetime import datetime
from pathlib import Path

from fastapi import APIRouter, HTTPException, status
from fastapi.responses import FileResponse

from backend.config import WORKSPACE_DIR
from backend.routers.common import (
    build_tree_node,
    get_file_kind,
    is_tex_artifact,
    resolve_file_path,
    resolve_project_dir,
)
from backend.routers.dataset_router import router as dataset_router
from backend.routers.search_router import router as search_router
from backend.schemas.project_schemas import (
    FileContentResponse,
    FileCreateRequest,
    FileNodeResponse,
    FileSaveRequest,
    FileSaveResponse,
    FolderCreateRequest,
    OpenDialogResponse,
    OpenWorkspaceRequest,
    ProjectCreateRequest,
    ProjectResponse,
    TreeNodeResponse,
    WorkspaceDetailResponse,
)
from backend.services.os_dialog import pick_directory_native
from backend.services.workspace_registry import workspace_registry

router = APIRouter()
router.include_router(dataset_router)
router.include_router(search_router)


@router.get("/api/projects", response_model=list[str], tags=["Projects"])
async def list_projects():
    projects_set = set()
    if WORKSPACE_DIR.exists():
        for item in WORKSPACE_DIR.iterdir():
            if item.is_dir() and not item.name.startswith("."):
                projects_set.add(item.name)

    # Include all registered workspaces (by id)
    for ws in workspace_registry.list_recent():
        if Path(ws.path).exists():
            projects_set.add(ws.id)

    projects = sorted(projects_set)
    return projects


@router.post(
    "/api/workspaces/open-dialog",
    response_model=OpenDialogResponse,
    tags=["Workspaces"],
)
async def open_workspace_dialog():
    """Trigger native OS directory picker dialog (zenity/tkinter) or report fallback requirement."""
    main_mod = sys.modules.get("backend.main")
    picker = (
        getattr(main_mod, "pick_directory_native", pick_directory_native)
        if main_mod
        else pick_directory_native
    )
    selected = await picker()
    if selected:
        return OpenDialogResponse(
            selected_path=selected, cancelled=False, requires_manual_input=False
        )

    zenity_bin = shutil.which("zenity")
    has_display = bool(os.getenv("DISPLAY") or os.getenv("WAYLAND_DISPLAY"))
    if not zenity_bin and not has_display:
        return OpenDialogResponse(
            selected_path=None, cancelled=False, requires_manual_input=True
        )

    return OpenDialogResponse(
        selected_path=None, cancelled=True, requires_manual_input=False
    )


@router.post(
    "/api/workspaces/open",
    response_model=WorkspaceDetailResponse,
    tags=["Workspaces"],
)
async def open_workspace_by_path(payload: OpenWorkspaceRequest):
    """Register and open an existing folder in-place as a workspace."""
    try:
        entry = workspace_registry.register(payload.path, payload.custom_root)
        return WorkspaceDetailResponse(
            id=entry.id,
            name=entry.name,
            path=entry.path,
            root_file=entry.root_file,
            last_opened=entry.last_opened,
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        ) from e


@router.get(
    "/api/workspaces/recent",
    response_model=list[WorkspaceDetailResponse],
    tags=["Workspaces"],
)
async def get_recent_workspaces():
    """Return all known workspaces sorted by recency."""
    recent = workspace_registry.list_recent()
    return [
        WorkspaceDetailResponse(
            id=w.id,
            name=w.name,
            path=w.path,
            root_file=w.root_file,
            last_opened=w.last_opened,
        )
        for w in recent
    ]


@router.delete("/api/workspaces/{workspace_id}", tags=["Workspaces"])
async def remove_recent_workspace(workspace_id: str):
    """Remove a workspace from the recent workspaces list."""
    removed = workspace_registry.remove(workspace_id)
    if not removed:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Workspace not found"
        )
    return {"status": "ok", "removed_id": workspace_id}


@router.post(
    "/api/projects",
    response_model=ProjectResponse,
    status_code=status.HTTP_201_CREATED,
    tags=["Projects"],
)
async def create_project(payload: ProjectCreateRequest):
    project_dir = resolve_project_dir(payload.name)
    safe_name = project_dir.name
    if project_dir.exists():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Project '{safe_name}' already exists.",
        )

    try:
        project_dir.mkdir(parents=True, exist_ok=False)
        default_tex = project_dir / "main.tex"
        default_tex.write_text(
            f"\\documentclass{{article}}\n\\usepackage{{amsmath,amssymb}}\n\\title{{{safe_name}}}\n\\author{{User}}\n\\begin{{document}}\n\\maketitle\n\\section{{Introduction}}\n\\end{{document}}\n",
            encoding="utf-8",
        )
        stat_result = default_tex.stat()
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create project directory: {e!s}",
        ) from e

    return ProjectResponse(
        name=safe_name,
        rootPath=str(project_dir),
        files=[
            FileNodeResponse(
                name="main.tex",
                path="main.tex",
                kind="tex",
                size=stat_result.st_size,
                updatedAt=datetime.fromtimestamp(stat_result.st_mtime).isoformat(),
            )
        ],
        activeFile="main.tex",
    )


@router.get(
    "/api/projects/{name}/files",
    response_model=list[FileNodeResponse],
    tags=["Projects"],
)
async def get_project_files(name: str):
    project_dir = resolve_project_dir(name)
    if not project_dir.exists() or not project_dir.is_dir():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Project '{name}' not found.",
        )

    file_nodes: list[FileNodeResponse] = []
    for item in sorted(project_dir.rglob("*")):
        rel_parts = item.relative_to(project_dir).parts
        if any(
            part.startswith(".")
            or part in {".git", ".venv", "node_modules", "__pycache__"}
            for part in rel_parts
        ):
            continue
        if item.is_file() and not is_tex_artifact(item.name):
            rel_path = item.relative_to(project_dir).as_posix()
            stat_result = item.stat()
            file_nodes.append(
                FileNodeResponse(
                    name=item.name,
                    path=rel_path,
                    kind=get_file_kind(item.name),
                    size=stat_result.st_size,
                    updatedAt=datetime.fromtimestamp(stat_result.st_mtime).isoformat(),
                )
            )

    return file_nodes


@router.get(
    "/api/projects/{name}/files/{file_path:path}",
    response_model=FileContentResponse,
    tags=["Projects"],
)
async def read_file(name: str, file_path: str):
    project_dir = resolve_project_dir(name)
    if not project_dir.exists() or not project_dir.is_dir():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Project '{name}' not found.",
        )

    target_file = resolve_file_path(project_dir, file_path)
    if not target_file.exists() or not target_file.is_file():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"File '{file_path}' not found in project '{name}'.",
        )

    try:
        content = target_file.read_text(encoding="utf-8")
    except UnicodeDecodeError:
        try:
            content = target_file.read_text(encoding="latin-1")
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to read file encoding: {e!s}",
            ) from e
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to read file: {e!s}",
        ) from e

    stat_result = target_file.stat()
    return FileContentResponse(
        name=target_file.name,
        path=target_file.relative_to(project_dir).as_posix(),
        content=content,
        size=stat_result.st_size,
        updatedAt=datetime.fromtimestamp(stat_result.st_mtime).isoformat(),
    )


@router.get(
    "/api/projects/{name}/raw/{file_path:path}",
    tags=["Projects"],
)
async def get_raw_file(name: str, file_path: str):
    project_dir = resolve_project_dir(name)
    if not project_dir.exists() or not project_dir.is_dir():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Project '{name}' not found.",
        )

    target_file = resolve_file_path(project_dir, file_path)
    if not target_file.exists() or not target_file.is_file():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"File '{file_path}' not found in project '{name}'.",
        )

    ext = target_file.suffix.lower()
    media_types = {
        ".png": "image/png",
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".svg": "image/svg+xml",
        ".webp": "image/webp",
        ".gif": "image/gif",
        ".bmp": "image/bmp",
        ".pdf": "application/pdf",
        ".txt": "text/plain",
        ".tex": "text/x-tex",
        ".bib": "text/plain",
    }
    media_type = media_types.get(ext, "application/octet-stream")

    return FileResponse(
        path=str(target_file),
        media_type=media_type,
        filename=target_file.name,
        headers={"Content-Disposition": f"inline; filename={target_file.name}"},
    )


@router.put(
    "/api/projects/{name}/files/{file_path:path}",
    response_model=FileSaveResponse,
    tags=["Projects"],
)
async def save_file(name: str, file_path: str, payload: FileSaveRequest):
    project_dir = resolve_project_dir(name)
    if not project_dir.exists() or not project_dir.is_dir():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Project '{name}' not found.",
        )

    target_file = resolve_file_path(project_dir, file_path)
    try:
        target_file.parent.mkdir(parents=True, exist_ok=True)
        target_file.write_text(payload.content, encoding="utf-8")
        stat_result = target_file.stat()
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to write file: {e!s}",
        ) from e

    return FileSaveResponse(
        success=True,
        message=f"File '{file_path}' successfully saved.",
        path=target_file.relative_to(project_dir).as_posix(),
        size=stat_result.st_size,
        updatedAt=datetime.fromtimestamp(stat_result.st_mtime).isoformat(),
    )


@router.get(
    "/api/projects/{name}/tree",
    response_model=list[TreeNodeResponse],
    tags=["Projects"],
)
async def get_project_tree(name: str):
    project_dir = resolve_project_dir(name)
    if not project_dir.exists() or not project_dir.is_dir():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Project '{name}' not found.",
        )

    tree_nodes: list[TreeNodeResponse] = []
    for item in sorted(
        project_dir.iterdir(), key=lambda p: (p.is_file(), p.name.lower())
    ):
        node = build_tree_node(item, project_dir)
        if node:
            tree_nodes.append(node)

    return tree_nodes


@router.post(
    "/api/projects/{name}/folders",
    response_model=dict,
    status_code=status.HTTP_201_CREATED,
    tags=["Projects"],
)
async def create_folder(name: str, payload: FolderCreateRequest):
    project_dir = resolve_project_dir(name)
    if not project_dir.exists() or not project_dir.is_dir():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Project '{name}' not found.",
        )

    target_dir = resolve_file_path(project_dir, payload.path)
    if target_dir.exists():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Folder or file already exists at '{payload.path}'.",
        )

    try:
        target_dir.mkdir(parents=True, exist_ok=True)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create folder: {e!s}",
        ) from e

    return {
        "success": True,
        "message": f"Folder '{payload.path}' created successfully.",
        "path": target_dir.relative_to(project_dir).as_posix(),
    }


@router.post(
    "/api/projects/{name}/files",
    response_model=dict,
    status_code=status.HTTP_201_CREATED,
    tags=["Projects"],
)
async def create_file(name: str, payload: FileCreateRequest):
    project_dir = resolve_project_dir(name)
    if not project_dir.exists() or not project_dir.is_dir():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Project '{name}' not found.",
        )

    target_file = resolve_file_path(project_dir, payload.path)
    if target_file.exists():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"File already exists at '{payload.path}'.",
        )

    try:
        target_file.parent.mkdir(parents=True, exist_ok=True)
        target_file.write_text(payload.content or "", encoding="utf-8")
        stat_res = target_file.stat()
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create file: {e!s}",
        ) from e

    return {
        "success": True,
        "message": f"File '{payload.path}' created successfully.",
        "path": target_file.relative_to(project_dir).as_posix(),
        "size": stat_res.st_size,
        "updatedAt": datetime.fromtimestamp(stat_res.st_mtime).isoformat(),
    }


@router.delete(
    "/api/projects/{name}/files/{file_path:path}",
    response_model=dict,
    tags=["Projects"],
)
async def delete_project_file(name: str, file_path: str):
    project_dir = resolve_project_dir(name)
    if not project_dir.exists() or not project_dir.is_dir():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Project '{name}' not found.",
        )

    target = resolve_file_path(project_dir, file_path)
    if not target.exists():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Path '{file_path}' not found.",
        )

    try:
        if target.is_file() or target.is_symlink():
            target.unlink()
        elif target.is_dir():
            shutil.rmtree(target)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete '{file_path}': {e!s}",
        ) from e

    return {
        "success": True,
        "message": f"Successfully deleted '{file_path}'.",
        "path": file_path,
    }
