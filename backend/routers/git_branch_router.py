import asyncio
import re

from fastapi import APIRouter, HTTPException, status

from backend.routers.common import resolve_file_path, resolve_project_dir
from backend.schemas.git_schemas import (
    GitCheckoutRequest,
    GitCommitNode,
    GitCreateBranchRequest,
    GitLogResponse,
)

router = APIRouter()


@router.get(
    "/api/projects/{name}/git/branches",
    tags=["Git"],
)
async def list_project_git_branches(name: str):
    project_dir = resolve_project_dir(name)
    if not (project_dir / ".git").exists():
        raise HTTPException(status_code=400, detail="Not a git repository.")

    proc = await asyncio.create_subprocess_exec(
        "git",
        "branch",
        "--list",
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


@router.post(
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
        "git",
        "checkout",
        branch,
        cwd=str(project_dir),
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE,
    )
    out, err = await proc.communicate()
    if proc.returncode != 0:
        detail_msg = (
            err.decode("utf-8", errors="replace")
            or out.decode("utf-8", errors="replace")
            or "Failed to checkout branch."
        )
        raise HTTPException(status_code=400, detail=detail_msg)

    return {
        "success": True,
        "branch": branch,
        "message": f"Switched to branch '{branch}'.",
    }


@router.post(
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

    cmd = (
        ["git", "checkout", "-b", branch] if req.checkout else ["git", "branch", branch]
    )
    proc = await asyncio.create_subprocess_exec(
        *cmd,
        cwd=str(project_dir),
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE,
    )
    out, err = await proc.communicate()
    if proc.returncode != 0:
        detail_msg = (
            err.decode("utf-8", errors="replace")
            or out.decode("utf-8", errors="replace")
            or "Failed to create branch."
        )
        raise HTTPException(status_code=400, detail=detail_msg)

    return {
        "success": True,
        "branch": branch,
        "message": f"Branch '{branch}' created successfully.",
    }


@router.get(
    "/api/projects/{name}/git/diff",
    tags=["Git"],
)
async def get_project_git_diff(
    name: str, file: str | None = None, staged: bool = False
):
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
    except Exception as e:  # noqa: BLE001
        return {"diff": f"Git diff error: {e!s}"}


@router.get(
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
            "git",
            "log",
            "--all",
            "--graph",
            "--date=short",
            "--format=format:__COMMIT__%h|%p|%d|%s|%an|%cd",
            f"-n{limit}",
            cwd=str(project_dir),
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
        )
        out, _ = await proc.communicate()
        raw_text = out.decode("utf-8", errors="replace")
    except Exception:  # noqa: BLE001
        return GitLogResponse(commits=[])

    commits: list[GitCommitNode] = []
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
        refs: list[str] = []
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
