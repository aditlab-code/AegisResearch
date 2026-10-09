import os
import re
from datetime import datetime
from pathlib import Path
from typing import List, Optional, Union
from fastapi import FastAPI, HTTPException, status, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from backend.config import WORKSPACE_DIR, CORS_ORIGINS, HOST, PORT
from backend.watcher import workspace_watcher


app = FastAPI(
    title="Scholarly LaTeX Backend",
    version="0.1.0",
    description="Backend API for Scholarly LaTeX IDE",
)

# CORS middleware configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class ProjectCreateRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=120, description="Project directory name")


class FileNodeResponse(BaseModel):
    name: str
    path: str
    kind: str = "other"
    size: int = 0
    updatedAt: Optional[str] = None


class TreeNodeResponse(BaseModel):
    id: str
    name: str
    path: str
    type: str  # "file" or "folder"
    kind: Optional[str] = None
    size: Optional[int] = 0
    updatedAt: Optional[str] = None
    children: Optional[List["TreeNodeResponse"]] = None

class FolderCreateRequest(BaseModel):
    path: str = Field(..., min_length=1, description="Relative path for the new folder")

class FileCreateRequest(BaseModel):
    path: str = Field(..., min_length=1, description="Relative path for the new file")
    content: Optional[str] = ""

class FileContentResponse(BaseModel):
    name: str
    path: str
    content: str
    size: int
    updatedAt: Optional[str] = None


class FileSaveRequest(BaseModel):
    content: str


class FileSaveResponse(BaseModel):
    success: bool
    message: str
    path: str
    size: int
    updatedAt: str

class ProjectResponse(BaseModel):
    name: str
    rootPath: str
    files: List[FileNodeResponse] = []
    activeFile: Optional[str] = None


def get_file_kind(file_name: str) -> str:
    ext = Path(file_name).suffix.lower()
    if ext == ".tex":
        return "tex"
    elif ext in [".md", ".markdown"]:
        return "md"
    return "other"


def resolve_project_dir(name: str) -> Path:
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
    return target_file

@app.api_route("/", methods=["GET", "HEAD"], tags=["General"])
async def root():
    return {
        "status": "ok",
        "message": "Scholarly LaTeX IDE Backend",
        "version": "0.1.0",
    }


@app.api_route("/api/health", methods=["GET", "HEAD"], tags=["General"])
async def health_check():
    return {
        "status": "healthy",
        "cors": True,
        "workspace_dir": str(WORKSPACE_DIR),
        "allowed_origins": CORS_ORIGINS,
    }

@app.get("/api/projects", response_model=List[str], tags=["Projects"])
async def list_projects():
    if not WORKSPACE_DIR.exists():
        return []
    projects = [
        item.name
        for item in WORKSPACE_DIR.iterdir()
        if item.is_dir() and not item.name.startswith(".")
    ]
    projects.sort()
    return projects


@app.post("/api/projects", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED, tags=["Projects"])
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
            f"\\documentclass{{article}}\n\\title{{{safe_name}}}\n\\author{{User}}\n\\begin{{document}}\n\\maketitle\n\\section{{Introduction}}\n\\end{{document}}\n",
            encoding="utf-8",
        )
        stat_result = default_tex.stat()
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create project directory: {str(e)}",
        )

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


@app.get(
    "/api/projects/{name}/files",
    response_model=List[FileNodeResponse],
    tags=["Projects"],
)
async def get_project_files(name: str):
    project_dir = resolve_project_dir(name)
    if not project_dir.exists() or not project_dir.is_dir():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Project '{name}' not found.",
        )

    file_nodes: List[FileNodeResponse] = []
    for item in sorted(project_dir.rglob("*")):
        if item.is_file() and not item.name.startswith("."):
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


@app.get(
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
                detail=f"Failed to read file encoding: {str(e)}",
            )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to read file: {str(e)}",
        )

    stat_result = target_file.stat()
    return FileContentResponse(
        name=target_file.name,
        path=target_file.relative_to(project_dir).as_posix(),
        content=content,
        size=stat_result.st_size,
        updatedAt=datetime.fromtimestamp(stat_result.st_mtime).isoformat(),
    )


@app.put(
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
            detail=f"Failed to write file: {str(e)}",
        )

    return FileSaveResponse(
        success=True,
        message=f"File '{file_path}' successfully saved.",
        path=target_file.relative_to(project_dir).as_posix(),
        size=stat_result.st_size,
        updatedAt=datetime.fromtimestamp(stat_result.st_mtime).isoformat(),
    )

def build_tree_node(item_path: Path, project_root: Path) -> Optional[TreeNodeResponse]:
    rel_path = item_path.relative_to(project_root).as_posix()
    name = item_path.name

    # Ignore hidden files, caches, and dot folders
    if name.startswith(".") or name in {".git", ".venv", "node_modules", "__pycache__", ".DS_Store"}:
        return None

    if item_path.is_dir():
        children: List[TreeNodeResponse] = []
        try:
            for sub_item in sorted(item_path.iterdir(), key=lambda p: (p.is_file(), p.name.lower())):
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


@app.get(
    "/api/projects/{name}/tree",
    response_model=List[TreeNodeResponse],
    tags=["Projects"],
)
async def get_project_tree(name: str):
    project_dir = resolve_project_dir(name)
    if not project_dir.exists() or not project_dir.is_dir():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Project '{name}' not found.",
        )

    tree_nodes: List[TreeNodeResponse] = []
    for item in sorted(project_dir.iterdir(), key=lambda p: (p.is_file(), p.name.lower())):
        node = build_tree_node(item, project_dir)
        if node:
            tree_nodes.append(node)

    return tree_nodes


@app.post(
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
            detail=f"Failed to create folder: {str(e)}",
        )

    return {
        "success": True,
        "message": f"Folder '{payload.path}' created successfully.",
        "path": target_dir.relative_to(project_dir).as_posix(),
    }


@app.post(
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
            detail=f"Failed to create file: {str(e)}",
        )

    return {
        "success": True,
        "message": f"File '{payload.path}' created successfully.",
        "path": target_file.relative_to(project_dir).as_posix(),
        "size": stat_res.st_size,
        "updatedAt": datetime.fromtimestamp(stat_res.st_mtime).isoformat(),
    }


@app.websocket("/api/ws/workspace/{name}")
async def workspace_ws(websocket: WebSocket, name: str):
    try:
        project_dir = resolve_project_dir(name)
    except HTTPException:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    if not project_dir.exists() or not project_dir.is_dir():
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    await workspace_watcher.connect(name, websocket)
    await workspace_watcher.start_watcher_if_needed(name, project_dir)

    try:
        while True:
            data = await websocket.receive_text()
            # Heartbeat ping/pong support
            if data == "ping":
                await websocket.send_text("pong")
    except WebSocketDisconnect:
        workspace_watcher.disconnect(name, websocket)
    except Exception:
        workspace_watcher.disconnect(name, websocket)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host=HOST, port=PORT, reload=True)
