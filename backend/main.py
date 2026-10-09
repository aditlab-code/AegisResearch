import os
import shutil
import asyncio
import re
from datetime import datetime
from pathlib import Path
from typing import List, Optional, Union, Dict, Any
from fastapi import FastAPI, HTTPException, status, WebSocket, WebSocketDisconnect
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from backend.config import WORKSPACE_DIR, CORS_ORIGINS, HOST, PORT
from backend.watcher import workspace_watcher
from backend.services.compiler import compile_latex


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

class CompileRequest(BaseModel):
    mainFile: str = "main.tex"
    engine: str = "pdfLaTeX"

class CompileResponse(BaseModel):
    success: bool
    message: str
    pdfUrl: Optional[str] = None
    errors: List[str] = []
    logOutput: Optional[str] = None

class SearchMatchItem(BaseModel):
    lineNumber: int
    lineText: str
    matchStart: int
    matchEnd: int

class SearchFileItem(BaseModel):
    filePath: str
    fileName: str
    kind: str
    matchCount: int
    matches: List[SearchMatchItem]

class SearchProjectResponse(BaseModel):
    query: str
    totalMatches: int
    fileCount: int
    results: List[SearchFileItem]

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
    elif ext == ".pdf":
        return "pdf"
    return "other"

TEX_BUILD_ARTIFACT_EXTS = {
    ".aux", ".log", ".toc", ".bbl", ".blg", ".fls",
    ".fdb_latexmk", ".synctex.gz", ".out", ".lof", ".lot",
    ".nav", ".snm", ".vrb", ".idx", ".ilg", ".ind"
}

def is_tex_artifact(file_name: str) -> bool:
    lower = file_name.lower()
    return any(lower.endswith(ext) for ext in TEX_BUILD_ARTIFACT_EXTS)


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
            f"\\documentclass{{article}}\n\\usepackage{{amsmath,amssymb}}\n\\title{{{safe_name}}}\n\\author{{User}}\n\\begin{{document}}\n\\maketitle\n\\section{{Introduction}}\n\\end{{document}}\n",
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
        rel_parts = item.relative_to(project_dir).parts
        if any(part.startswith(".") or part in {".git", ".venv", "node_modules", "__pycache__"} for part in rel_parts):
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

    # Ignore hidden files, caches, dot folders, and LaTeX build artifacts
    if name.startswith(".") or name in {".git", ".venv", "node_modules", "__pycache__", ".DS_Store"} or is_tex_artifact(name):
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


@app.delete(
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
            detail=f"Failed to delete '{file_path}': {str(e)}",
        )

    return {
        "success": True,
        "message": f"Successfully deleted '{file_path}'.",
        "path": file_path,
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


@app.post(
    "/api/projects/{name}/compile",
    response_model=CompileResponse,
    tags=["Compiler"],
)
async def compile_project(name: str, payload: CompileRequest):
    project_dir = resolve_project_dir(name)
    if not project_dir.exists() or not project_dir.is_dir():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Project '{name}' not found.",
        )

    result = await compile_latex(
        project_dir=project_dir,
        main_file=payload.mainFile,
        engine=payload.engine,
    )

    pdf_url = None
    if result.get("success") and result.get("pdfName"):
        pdf_url = f"/api/projects/{name}/pdf/{result['pdfName']}"

    return CompileResponse(
        success=result["success"],
        message=result["message"],
        pdfUrl=pdf_url,
        errors=result.get("errors", []),
        logOutput=result.get("logOutput"),
    )


@app.api_route(
    "/api/projects/{name}/pdf/{pdf_name}",
    methods=["GET", "HEAD"],
    tags=["Compiler"],
)
async def get_project_pdf(name: str, pdf_name: str):
    project_dir = resolve_project_dir(name)
    if not project_dir.exists() or not project_dir.is_dir():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Project '{name}' not found.",
        )

    target_pdf = resolve_file_path(project_dir, pdf_name)
    if not target_pdf.exists() or not target_pdf.is_file():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"PDF file '{pdf_name}' not found. Please compile first.",
        )

    return FileResponse(
        path=str(target_pdf),
        media_type="application/pdf",
        filename=target_pdf.name,
        headers={"Content-Disposition": f"inline; filename={target_pdf.name}"},
    )

SEARCH_IGNORED_EXTENSIONS = {
    ".pdf", ".png", ".jpg", ".jpeg", ".gif", ".ico", ".svg",
    ".aux", ".log", ".out", ".toc", ".gz", ".synctex", ".fls",
    ".fdb_latexmk", ".bbl", ".blg", ".pyc", ".DS_Store"
}

@app.get(
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

    file_results: List[SearchFileItem] = []
    total_matches = 0

    for root, dirs, files in os.walk(project_dir):
        # Skip hidden/cache directories
        dirs[:] = [
            d for d in dirs
            if not d.startswith(".") and d not in {".git", ".venv", "node_modules", "__pycache__"}
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
            except Exception:
                continue

            lines = content.splitlines()
            file_matches: List[SearchMatchItem] = []

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


class SearchReplaceRequest(BaseModel):
    query: str
    replaceWith: str = ""
    caseSensitive: bool = False
    filePath: Optional[str] = None
    lineNumber: Optional[int] = None
    matchStart: Optional[int] = None
    matchEnd: Optional[int] = None


class SearchReplaceResponse(BaseModel):
    success: bool
    message: str
    replacedCount: int
    modifiedFiles: List[str]


@app.post(
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
    modified_files: List[str] = []

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
                detail=f"Failed to read file: {str(e)}",
            )

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
                d for d in dirs
                if not d.startswith(".") and d not in {".git", ".venv", "node_modules", "__pycache__"}
            ]

            for file in files:
                ext = Path(file).suffix.lower()
                if ext in SEARCH_IGNORED_EXTENSIONS or is_tex_artifact(file):
                    continue

                file_path = Path(root) / file
                try:
                    content = file_path.read_text(encoding="utf-8", errors="ignore")
                except Exception:
                    continue

                new_content, count = pattern.subn(payload.replaceWith, content)
                if count > 0:
                    try:
                        file_path.write_text(new_content, encoding="utf-8")
                        total_replaced += count
                        rel = file_path.relative_to(project_dir).as_posix()
                        modified_files.append(rel)
                    except Exception:
                        pass

    return SearchReplaceResponse(
        success=True,
        message=f"Replaced {total_replaced} occurrences across {len(modified_files)} file(s).",
        replacedCount=total_replaced,
        modifiedFiles=modified_files,
    )


class GitFileChange(BaseModel):
    status: str
    path: str
    staged: bool = False

class GitStatusResponse(BaseModel):
    isGitRepo: bool
    branch: Optional[str] = None
    modifiedCount: int
    files: List[GitFileChange] = []
    staged: List[GitFileChange] = []
    unstaged: List[GitFileChange] = []

class GitStageRequest(BaseModel):
    file: Optional[str] = None
    all: bool = False

class GitUnstageRequest(BaseModel):
    file: Optional[str] = None
    all: bool = False

class GitDiscardRequest(BaseModel):
    file: str

class GitCommitRequest(BaseModel):
    message: str
    smartCommit: bool = True

class GitCheckoutRequest(BaseModel):
    branch: str

class GitCreateBranchRequest(BaseModel):
    name: str
    checkout: bool = True

@app.get(
    "/api/projects/{name}/git/status",
    response_model=GitStatusResponse,
    tags=["Git"],
)
async def get_project_git_status(name: str):
    project_dir = resolve_project_dir(name)
    if not project_dir.exists() or not project_dir.is_dir():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Project '{name}' not found.",
        )

    git_dir = project_dir / ".git"
    if not git_dir.exists() or not git_dir.is_dir():
        return GitStatusResponse(
            isGitRepo=False,
            branch=None,
            modifiedCount=0,
            files=[],
            staged=[],
            unstaged=[],
        )

    try:
        branch_proc = await asyncio.create_subprocess_exec(
            "git", "branch", "--show-current",
            cwd=str(project_dir),
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
        )
        branch_out, _ = await branch_proc.communicate()
        branch_name = branch_out.decode("utf-8").strip() or "main"

        status_proc = await asyncio.create_subprocess_exec(
            "git", "status", "-s",
            cwd=str(project_dir),
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
        )
        status_out, _ = await status_proc.communicate()
        status_lines = status_out.decode("utf-8").splitlines()

        staged_files: List[GitFileChange] = []
        unstaged_files: List[GitFileChange] = []
        all_changed_files: List[GitFileChange] = []
        seen_paths = set()

        for line in status_lines:
            if len(line) < 3:
                continue
            index_char = line[0]
            worktree_char = line[1]
            raw_path = line[3:].strip().strip('"')

            if is_tex_artifact(raw_path):
                continue

            # Staged changes (index)
            if index_char in {'M', 'A', 'D', 'R', 'C'}:
                staged_files.append(GitFileChange(status=index_char, path=raw_path, staged=True))

            # Unstaged / Untracked changes (working tree)
            if worktree_char in {'M', 'D'} or line.startswith("??"):
                u_status = worktree_char if worktree_char in {'M', 'D'} else '?'
                unstaged_files.append(GitFileChange(status=u_status, path=raw_path, staged=False))

            if raw_path not in seen_paths:
                seen_paths.add(raw_path)
                combined_status = line[:2].strip()
                all_changed_files.append(
                    GitFileChange(
                        status=combined_status,
                        path=raw_path,
                        staged=index_char in {'M', 'A', 'D'},
                    )
                )

        return GitStatusResponse(
            isGitRepo=True,
            branch=branch_name,
            modifiedCount=len(seen_paths),
            files=all_changed_files,
            staged=staged_files,
            unstaged=unstaged_files,
        )
    except Exception:
        return GitStatusResponse(
            isGitRepo=False,
            branch=None,
            modifiedCount=0,
            files=[],
            staged=[],
            unstaged=[],
        )


@app.post(
    "/api/projects/{name}/git/init",
    status_code=status.HTTP_201_CREATED,
    tags=["Git"],
)
async def init_project_git(name: str):
    project_dir = resolve_project_dir(name)
    if not project_dir.exists() or not project_dir.is_dir():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Project '{name}' not found.",
        )

    # Create .gitignore for LaTeX build artifacts if it doesn't exist
    gitignore_path = project_dir / ".gitignore"
    if not gitignore_path.exists():
        gitignore_content = """# LaTeX build artifacts
*.aux
*.log
*.toc
*.bbl
*.blg
*.fls
*.fdb_latexmk
*.synctex.gz
*.out
*.lof
*.lot
.DS_Store
"""
        gitignore_path.write_text(gitignore_content, encoding="utf-8")

    # Run git init
    init_proc = await asyncio.create_subprocess_exec(
        "git", "init",
        cwd=str(project_dir),
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE,
    )
    await init_proc.communicate()

    # Run git add .
    add_proc = await asyncio.create_subprocess_exec(
        "git", "add", ".",
        cwd=str(project_dir),
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE,
    )
    await add_proc.communicate()

    # Initial commit (fallback if already committed or empty)
    commit_proc = await asyncio.create_subprocess_exec(
        "git", "commit", "-m", "Initial commit",
        cwd=str(project_dir),
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE,
    )
    await commit_proc.communicate()

    return {
        "success": True,
        "branch": "main",
        "message": "Git repository initialized successfully with LaTeX .gitignore.",
    }


@app.post(
    "/api/projects/{name}/git/stage",
    tags=["Git"],
)
async def stage_project_git_files(name: str, req: GitStageRequest):
    project_dir = resolve_project_dir(name)
    if not (project_dir / ".git").exists():
        raise HTTPException(status_code=400, detail="Not a git repository.")

    if req.all or not req.file:
        cmd = ["git", "add", "."]
    else:
        safe_file = resolve_file_path(project_dir, req.file)
        rel_path = str(safe_file.relative_to(project_dir))
        cmd = ["git", "add", rel_path]

    proc = await asyncio.create_subprocess_exec(
        *cmd,
        cwd=str(project_dir),
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE,
    )
    _, stderr = await proc.communicate()
    if proc.returncode != 0:
        raise HTTPException(status_code=400, detail=stderr.decode("utf-8", errors="replace") or "Git add failed.")
    return {"success": True, "message": "File(s) staged successfully."}


@app.post(
    "/api/projects/{name}/git/unstage",
    tags=["Git"],
)
async def unstage_project_git_files(name: str, req: GitUnstageRequest):
    project_dir = resolve_project_dir(name)
    if not (project_dir / ".git").exists():
        raise HTTPException(status_code=400, detail="Not a git repository.")

    if req.all or not req.file:
        cmd = ["git", "restore", "--staged", "."]
    else:
        safe_file = resolve_file_path(project_dir, req.file)
        rel_path = str(safe_file.relative_to(project_dir))
        cmd = ["git", "restore", "--staged", rel_path]

    proc = await asyncio.create_subprocess_exec(
        *cmd,
        cwd=str(project_dir),
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE,
    )
    _, stderr = await proc.communicate()
    if proc.returncode != 0:
        # Fallback to git reset HEAD
        fallback_target = "." if (req.all or not req.file) else str(resolve_file_path(project_dir, req.file).relative_to(project_dir))
        f_proc = await asyncio.create_subprocess_exec(
            "git", "reset", "HEAD", fallback_target,
            cwd=str(project_dir),
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
        )
        _, f_err = await f_proc.communicate()
        if f_proc.returncode != 0:
            raise HTTPException(status_code=400, detail=f_err.decode("utf-8", errors="replace") or "Git unstage failed.")

    return {"success": True, "message": "File(s) unstaged successfully."}


@app.post(
    "/api/projects/{name}/git/discard",
    tags=["Git"],
)
async def discard_project_git_file(name: str, req: GitDiscardRequest):
    project_dir = resolve_project_dir(name)
    if not (project_dir / ".git").exists():
        raise HTTPException(status_code=400, detail="Not a git repository.")

    safe_file = resolve_file_path(project_dir, req.file)
    rel_path = str(safe_file.relative_to(project_dir))

    # Check status of file to see if untracked
    status_proc = await asyncio.create_subprocess_exec(
        "git", "status", "-s", rel_path,
        cwd=str(project_dir),
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE,
    )
    s_out, _ = await status_proc.communicate()
    s_text = s_out.decode("utf-8").strip()

    if s_text.startswith("??"):
        if safe_file.exists():
            if safe_file.is_file():
                safe_file.unlink()
            elif safe_file.is_dir():
                shutil.rmtree(safe_file)
    else:
        restore_proc = await asyncio.create_subprocess_exec(
            "git", "restore", rel_path,
            cwd=str(project_dir),
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
        )
        _, r_err = await restore_proc.communicate()
        if restore_proc.returncode != 0:
            # Fallback to git checkout --
            co_proc = await asyncio.create_subprocess_exec(
                "git", "checkout", "--", rel_path,
                cwd=str(project_dir),
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
            )
            await co_proc.communicate()

    return {"success": True, "message": f"Changes in '{req.file}' discarded."}


@app.post(
    "/api/projects/{name}/git/commit",
    tags=["Git"],
)
async def commit_project_git(name: str, req: GitCommitRequest):
    project_dir = resolve_project_dir(name)
    if not (project_dir / ".git").exists():
        raise HTTPException(status_code=400, detail="Not a git repository.")

    msg = req.message.strip()
    if not msg:
        raise HTTPException(status_code=400, detail="Commit message cannot be empty.")

    # Check if there are staged changes
    diff_proc = await asyncio.create_subprocess_exec(
        "git", "diff", "--cached", "--name-only",
        cwd=str(project_dir),
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE,
    )
    diff_out, _ = await diff_proc.communicate()
    has_staged = bool(diff_out.decode("utf-8").strip())

    if not has_staged:
        if req.smartCommit:
            add_proc = await asyncio.create_subprocess_exec(
                "git", "add", ".",
                cwd=str(project_dir),
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
            )
            await add_proc.communicate()
        else:
            raise HTTPException(status_code=400, detail="No staged changes to commit.")

    commit_proc = await asyncio.create_subprocess_exec(
        "git", "commit", "-m", msg,
        cwd=str(project_dir),
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE,
    )
    c_out, c_err = await commit_proc.communicate()
    if commit_proc.returncode != 0:
        err_msg = c_err.decode("utf-8", errors="replace") or c_out.decode("utf-8", errors="replace") or "Commit failed."
        raise HTTPException(status_code=400, detail=err_msg)

    return {"success": True, "message": f"Committed: {msg}"}


@app.get(
    "/api/projects/{name}/git/branches",
    tags=["Git"],
)
async def list_project_git_branches(name: str):
    project_dir = resolve_project_dir(name)
    if not (project_dir / ".git").exists():
        raise HTTPException(status_code=400, detail="Not a git repository.")

    proc = await asyncio.create_subprocess_exec(
        "git", "branch", "--list",
        cwd=str(project_dir),
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE,
    )
    out, _ = await proc.communicate()
    lines = out.decode("utf-8").splitlines()

    branches = []
    current_branch = "main"
    for line in lines:
        cleaned = line.strip()
        if not cleaned:
            continue
        if cleaned.startswith("*"):
            b_name = cleaned.lstrip("* ").strip()
            current_branch = b_name
            branches.append(b_name)
        else:
            branches.append(cleaned)

    return {"branches": branches, "current": current_branch}


@app.post(
    "/api/projects/{name}/git/checkout",
    tags=["Git"],
)
async def checkout_project_git_branch(name: str, req: GitCheckoutRequest):
    project_dir = resolve_project_dir(name)
    if not (project_dir / ".git").exists():
        raise HTTPException(status_code=400, detail="Not a git repository.")

    branch = req.branch.strip()
    if not branch or not re.match(r"^[a-zA-Z0-9_\-./]+$", branch):
        raise HTTPException(status_code=400, detail="Invalid branch name.")

    proc = await asyncio.create_subprocess_exec(
        "git", "checkout", branch,
        cwd=str(project_dir),
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE,
    )
    out, err = await proc.communicate()
    if proc.returncode != 0:
        detail_msg = err.decode("utf-8", errors="replace") or out.decode("utf-8", errors="replace") or "Failed to checkout branch."
        raise HTTPException(status_code=400, detail=detail_msg)

    return {"success": True, "branch": branch, "message": f"Switched to branch '{branch}'."}


@app.post(
    "/api/projects/{name}/git/branch/create",
    tags=["Git"],
)
async def create_project_git_branch(name: str, req: GitCreateBranchRequest):
    project_dir = resolve_project_dir(name)
    if not (project_dir / ".git").exists():
        raise HTTPException(status_code=400, detail="Not a git repository.")

    branch = req.name.strip()
    if not branch or not re.match(r"^[a-zA-Z0-9_\-./]+$", branch):
        raise HTTPException(status_code=400, detail="Invalid branch name.")

    cmd = ["git", "checkout", "-b", branch] if req.checkout else ["git", "branch", branch]
    proc = await asyncio.create_subprocess_exec(
        *cmd,
        cwd=str(project_dir),
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE,
    )
    out, err = await proc.communicate()
    if proc.returncode != 0:
        detail_msg = err.decode("utf-8", errors="replace") or out.decode("utf-8", errors="replace") or "Failed to create branch."
        raise HTTPException(status_code=400, detail=detail_msg)

    return {"success": True, "branch": branch, "message": f"Branch '{branch}' created successfully."}


@app.get(
    "/api/projects/{name}/git/diff",
    tags=["Git"],
)
async def get_project_git_diff(name: str, file: Optional[str] = None, staged: bool = False):
    project_dir = resolve_project_dir(name)
    if not project_dir.exists() or not project_dir.is_dir():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Project '{name}' not found.",
        )

    cmd = ["git", "diff"]
    if staged:
        cmd.append("--cached")
    if file:
        safe_file = resolve_file_path(project_dir, file)
        cmd.append(str(safe_file.relative_to(project_dir)))

    try:
        diff_proc = await asyncio.create_subprocess_exec(
            *cmd,
            cwd=str(project_dir),
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
        )
        diff_out, _ = await diff_proc.communicate()
        return {"diff": diff_out.decode("utf-8", errors="replace")}
    except Exception as e:
        return {"diff": f"Git diff error: {str(e)}"}


class GitCommitNode(BaseModel):
    hash: str
    parents: List[str] = []
    refs: List[str] = []
    isHead: bool = False
    message: str
    author: str
    date: str
    graphPrefix: str = "*"
    lane: int = 0


class GitLogResponse(BaseModel):
    commits: List[GitCommitNode]


@app.get(
    "/api/projects/{name}/git/log",
    response_model=GitLogResponse,
    tags=["Git"],
)
async def get_project_git_log(name: str, limit: int = 50):
    project_dir = resolve_project_dir(name)
    if not (project_dir / ".git").exists():
        return GitLogResponse(commits=[])

    try:
        proc = await asyncio.create_subprocess_exec(
            "git", "log", "--all", "--graph", "--date=short",
            "--format=format:__COMMIT__%h|%p|%d|%s|%an|%cd",
            f"-n{limit}",
            cwd=str(project_dir),
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
        )
        out, _ = await proc.communicate()
        raw_text = out.decode("utf-8", errors="replace")
    except Exception:
        return GitLogResponse(commits=[])

    commits: List[GitCommitNode] = []
    lines = raw_text.splitlines()

    for line in lines:
        if "__COMMIT__" not in line:
            continue

        graph_prefix, commit_data = line.split("__COMMIT__", 1)
        graph_prefix = graph_prefix.rstrip() or "*"
        parts = commit_data.split("|")
        if len(parts) < 6:
            continue

        c_hash = parts[0].strip()
        parents = [p.strip() for p in parts[1].split() if p.strip()]
        ref_raw = parts[2].strip()
        message = parts[3].strip()
        author = parts[4].strip()
        date_str = parts[5].strip()

        # Parse refs like (HEAD -> main, origin/main, tag: v1.0)
        refs: List[str] = []
        is_head = False
        if ref_raw.startswith("(") and ref_raw.endswith(")"):
            cleaned_refs = ref_raw[1:-1].split(",")
            for r in cleaned_refs:
                r_strip = r.strip()
                if "HEAD" in r_strip:
                    is_head = True
                refs.append(r_strip)

        lane = 0
        star_idx = graph_prefix.find("*")
        if star_idx >= 0:
            lane = star_idx // 2

        commits.append(
            GitCommitNode(
                hash=c_hash,
                parents=parents,
                refs=refs,
                isHead=is_head,
                message=message,
                author=author,
                date=date_str,
                graphPrefix=graph_prefix,
                lane=lane,
            )
        )

    return GitLogResponse(commits=commits)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host=HOST, port=PORT, reload=True)
