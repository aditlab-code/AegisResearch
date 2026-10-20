import json
import logging
import os
import re
import time
from pathlib import Path
from typing import Dict, List, Optional
from pydantic import BaseModel, Field

from backend.config import BASE_DIR, WORKSPACE_DIR

logger = logging.getLogger("workspace_registry")

REGISTRY_FILE = Path(
    os.getenv("AEGIS_REGISTRY_FILE", str(BASE_DIR / "workspaces.json"))
).resolve()

BLOCKED_SYSTEM_DIRS = {
    Path("/"),
    Path("/etc"),
    Path("/bin"),
    Path("/sbin"),
    Path("/usr"),
    Path("/root"),
    Path("/sys"),
    Path("/proc"),
    Path("/dev"),
    Path("/boot"),
    Path("/var"),
    Path("/opt"),
}

SENSITIVE_FOLDER_NAMES = {".ssh", ".gnupg", ".aws", ".config/systemd"}

COMMON_ROOT_FILENAMES = [
    "main.tex",
    "document.tex",
    "paper.tex",
    "thesis.tex",
    "index.tex",
]


class WorkspaceEntry(BaseModel):
    id: str
    name: str
    path: str
    root_file: Optional[str] = None
    last_opened: float = Field(default_factory=time.time)


def detect_root_latex_file(folder: Path) -> Optional[str]:
    """Detect the most likely root LaTeX file in a folder."""
    if not folder.exists() or not folder.is_dir():
        return None

    # 1. Check for common primary root filenames
    for fname in COMMON_ROOT_FILENAMES:
        candidate = folder / fname
        if candidate.is_file():
            return fname

    # 2. Search for any .tex file containing \documentclass and \begin{document}
    tex_files = sorted(folder.glob("*.tex"))
    for tf in tex_files:
        try:
            content = tf.read_text(encoding="utf-8", errors="ignore")
            if "\\documentclass" in content and "\\begin{document}" in content:
                return tf.name
        except Exception:
            continue

    # 3. Fallback to first .tex file in the directory
    if tex_files:
        return tex_files[0].name

    return None


class WorkspaceRegistry:
    def __init__(self, registry_file: Path = REGISTRY_FILE):
        self.registry_file = registry_file
        self._workspaces: Dict[str, WorkspaceEntry] = {}
        self.load()

    def load(self) -> None:
        """Load workspaces from disk."""
        if not self.registry_file.exists():
            self._workspaces = {}
            return

        try:
            data = json.loads(self.registry_file.read_text(encoding="utf-8"))
            self._workspaces = {
                item["id"]: WorkspaceEntry(**item)
                for item in data
                if isinstance(item, dict) and "id" in item
            }
        except Exception as e:
            logger.warning(f"Failed to load workspace registry: {e}")
            self._workspaces = {}

    def save(self) -> None:
        """Persist registered workspaces to disk."""
        try:
            self.registry_file.parent.mkdir(parents=True, exist_ok=True)
            data = [w.model_dump() for w in self._workspaces.values()]
            self.registry_file.write_text(json.dumps(data, indent=2), encoding="utf-8")
        except Exception as e:
            logger.error(f"Failed to save workspace registry: {e}")

    def validate_path(self, target_path: str) -> Path:
        """Ensure path is a valid directory, within user's accessible scope, and not a blocked system dir."""
        resolved = Path(target_path).expanduser().resolve()

        if not resolved.exists():
            raise ValueError(f"Path does not exist: {target_path}")

        if not resolved.is_dir():
            raise ValueError(f"Path is not a directory: {target_path}")

        # Check blocked system directories
        for blocked in BLOCKED_SYSTEM_DIRS:
            if resolved == blocked or blocked in resolved.parents:
                # Allow subdirectories of /home or /tmp/..., but block /etc, /root, /bin, etc.
                if not any(
                    resolved.is_relative_to(p)
                    for p in [Path.home(), Path("/tmp"), WORKSPACE_DIR]
                ):
                    raise ValueError(
                        f"Access to system directory is forbidden: {target_path}"
                    )

        # Block sensitive directories
        path_str = str(resolved)
        for sensitive in SENSITIVE_FOLDER_NAMES:
            if f"/{sensitive}" in path_str or path_str.endswith(f"/{sensitive}"):
                raise ValueError(
                    f"Opening sensitive directory is forbidden: {sensitive}"
                )

        return resolved

    def register(
        self, folder_path: str, custom_root: Optional[str] = None
    ) -> WorkspaceEntry:
        """Register a folder as an active workspace and return its entry."""
        resolved = self.validate_path(folder_path)
        folder_name = resolved.name or "workspace"

        # Find or create entry
        # Check if already registered by path
        for entry in self._workspaces.values():
            if Path(entry.path).resolve() == resolved:
                entry.last_opened = time.time()
                if custom_root:
                    entry.root_file = custom_root
                elif not entry.root_file or not (resolved / entry.root_file).exists():
                    entry.root_file = detect_root_latex_file(resolved)
                self.save()
                return entry

        # Generate unique id based on folder name
        base_id = re.sub(r"[^a-zA-Z0-9_\-]", "", folder_name).lower() or "workspace"
        unique_id = base_id
        counter = 1
        while unique_id in self._workspaces:
            unique_id = f"{base_id}-{counter}"
            counter += 1

        root_file = custom_root or detect_root_latex_file(resolved)

        entry = WorkspaceEntry(
            id=unique_id,
            name=folder_name,
            path=str(resolved),
            root_file=root_file,
            last_opened=time.time(),
        )

        self._workspaces[unique_id] = entry
        self.save()
        return entry

    def get(self, id_or_name: str) -> Optional[WorkspaceEntry]:
        """Lookup by ID or folder name."""
        if id_or_name in self._workspaces:
            return self._workspaces[id_or_name]

        # Match by name or path
        for entry in self._workspaces.values():
            if entry.name == id_or_name or entry.path == id_or_name:
                return entry

        return None

    def list_recent(self) -> List[WorkspaceEntry]:
        """List all workspaces sorted by last opened descending."""
        entries = list(self._workspaces.values())
        entries.sort(key=lambda x: x.last_opened, reverse=True)
        return entries

    def remove(self, workspace_id: str) -> bool:
        """Remove a workspace from the registry."""
        if workspace_id in self._workspaces:
            del self._workspaces[workspace_id]
            self.save()
            return True
        return False

    def touch(self, workspace_id: str) -> None:
        """Update last opened timestamp."""
        if workspace_id in self._workspaces:
            self._workspaces[workspace_id].last_opened = time.time()
            self.save()


workspace_registry = WorkspaceRegistry()
