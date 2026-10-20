import os
import asyncio
from pathlib import Path
from typing import Dict, Set, List
from fastapi import WebSocket, WebSocketDisconnect

# Directory names to ignore
IGNORED_DIRS = {
    ".git",
    ".venv",
    "node_modules",
    "__pycache__",
    ".pytest_cache",
    ".idea",
    ".vscode",
}

# File extensions produced by LaTeX builds that should NOT trigger watcher events
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
}

IGNORED_FILES = {".DS_Store"}


class WorkspaceWatcherManager:
    def __init__(self):
        # Map project_name -> set of active WebSockets
        self._active_connections: Dict[str, Set[WebSocket]] = {}
        # Map project_name -> asyncio task monitoring filesystem
        self._tasks: Dict[str, asyncio.Task] = {}
        # Map project_name -> snapshot of paths to mtime
        self._snapshots: Dict[str, Dict[str, float]] = {}

    def _should_ignore_file(self, filename: str) -> bool:
        if filename in IGNORED_FILES or filename.startswith("."):
            return True
        for ext in TEX_BUILD_ARTIFACT_EXTS:
            if filename.lower().endswith(ext):
                return True
        return False

    def _scan_mtimes(self, project_dir: Path) -> Dict[str, float]:
        snapshot: Dict[str, float] = {}
        if not project_dir.exists() or not project_dir.is_dir():
            return snapshot

        for root, dirs, files in os.walk(project_dir):
            # Mutate dirs in-place to skip ignored directories
            dirs[:] = [
                d for d in dirs if d not in IGNORED_DIRS and not d.startswith(".")
            ]

            root_path = Path(root)
            try:
                rel_root = root_path.relative_to(project_dir).as_posix()
                if rel_root != ".":
                    snapshot[rel_root] = root_path.stat().st_mtime
            except Exception:
                pass

            for f in files:
                if self._should_ignore_file(f):
                    continue
                file_path = root_path / f
                try:
                    rel_file = file_path.relative_to(project_dir).as_posix()
                    snapshot[rel_file] = file_path.stat().st_mtime
                except Exception:
                    continue

        return snapshot

    async def connect(self, project_name: str, websocket: WebSocket):
        await websocket.accept()
        if project_name not in self._active_connections:
            self._active_connections[project_name] = set()
        self._active_connections[project_name].add(websocket)

    def disconnect(self, project_name: str, websocket: WebSocket):
        if project_name in self._active_connections:
            self._active_connections[project_name].discard(websocket)
            if not self._active_connections[project_name]:
                del self._active_connections[project_name]
                if project_name in self._tasks:
                    self._tasks[project_name].cancel()
                    del self._tasks[project_name]
                if project_name in self._snapshots:
                    del self._snapshots[project_name]

    async def broadcast(self, project_name: str, message: dict):
        connections = self._active_connections.get(project_name, set()).copy()
        dead_connections = set()
        for ws in connections:
            try:
                await ws.send_json(message)
            except Exception:
                dead_connections.add(ws)

        for ws in dead_connections:
            self.disconnect(project_name, ws)

    async def start_watcher_if_needed(self, project_name: str, project_dir: Path):
        if project_name in self._tasks and not self._tasks[project_name].done():
            return

        self._snapshots[project_name] = self._scan_mtimes(project_dir)
        self._tasks[project_name] = asyncio.create_task(
            self._watch_loop(project_name, project_dir)
        )

    async def _watch_loop(self, project_name: str, project_dir: Path):
        try:
            while True:
                await asyncio.sleep(0.5)  # 500ms smooth debounce
                if (
                    project_name not in self._active_connections
                    or not self._active_connections[project_name]
                ):
                    break

                current_snapshot = self._scan_mtimes(project_dir)
                prev_snapshot = self._snapshots.get(project_name, {})

                if current_snapshot != prev_snapshot:
                    self._snapshots[project_name] = current_snapshot
                    await self.broadcast(
                        project_name,
                        {
                            "type": "FS_CHANGED",
                            "project": project_name,
                            "timestamp": asyncio.get_event_loop().time(),
                        },
                    )
        except asyncio.CancelledError:
            pass
        except Exception:
            pass


workspace_watcher = WorkspaceWatcherManager()
