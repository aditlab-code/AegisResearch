import asyncio
import shutil

from fastapi import APIRouter, HTTPException, status

from backend.routers.common import (
    is_tex_artifact,
    resolve_file_path,
    resolve_project_dir,
)
from backend.schemas.git_schemas import (
    GitCommitRequest,
    GitDiscardRequest,
    GitFileChange,
    GitStageRequest,
    GitStatusResponse,
    GitUnstageRequest,
)

router = APIRouter()


@router.get(
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
            "git",
            "branch",
            "--show-current",
            cwd=str(project_dir),
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
        )
        branch_out, _ = await branch_proc.communicate()
        branch_name = branch_out.decode("utf-8").strip() or "main"

        status_proc = await asyncio.create_subprocess_exec(
            "git",
            "status",
            "-s",
            cwd=str(project_dir),
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
        )
        status_out, _ = await status_proc.communicate()
        status_lines = status_out.decode("utf-8").splitlines()

        staged_files: list[GitFileChange] = []
        unstaged_files: list[GitFileChange] = []
        all_changed_files: list[GitFileChange] = []
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
            if index_char in {"M", "A", "D", "R", "C"}:
                staged_files.append(
                    GitFileChange(status=index_char, path=raw_path, staged=True)
                )

            # Unstaged / Untracked changes (working tree)
            if worktree_char in {"M", "D"} or line.startswith("??"):
                u_status = worktree_char if worktree_char in {"M", "D"} else "?"
                unstaged_files.append(
                    GitFileChange(status=u_status, path=raw_path, staged=False)
                )

            if raw_path not in seen_paths:
                seen_paths.add(raw_path)
                combined_status = line[:2].strip()
                all_changed_files.append(
                    GitFileChange(
                        status=combined_status,
                        path=raw_path,
                        staged=index_char in {"M", "A", "D"},
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
    except Exception:  # noqa: BLE001
        return GitStatusResponse(
            isGitRepo=False,
            branch=None,
            modifiedCount=0,
            files=[],
            staged=[],
            unstaged=[],
        )


@router.post(
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
        "git",
        "init",
        cwd=str(project_dir),
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE,
    )
    await init_proc.communicate()

    # Run git add .
    add_proc = await asyncio.create_subprocess_exec(
        "git",
        "add",
        ".",
        cwd=str(project_dir),
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE,
    )
    await add_proc.communicate()

    # Initial commit (fallback if already committed or empty)
    commit_proc = await asyncio.create_subprocess_exec(
        "git",
        "commit",
        "-m",
        "Initial commit",
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


@router.post(
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
        raise HTTPException(
            status_code=400,
            detail=stderr.decode("utf-8", errors="replace") or "Git add failed.",
        )
    return {"success": True, "message": "File(s) staged successfully."}


@router.post(
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
    _, _stderr = await proc.communicate()
    if proc.returncode != 0:
        # Fallback to git reset HEAD
        fallback_target = (
            "."
            if (req.all or not req.file)
            else str(resolve_file_path(project_dir, req.file).relative_to(project_dir))
        )
        f_proc = await asyncio.create_subprocess_exec(
            "git",
            "reset",
            "HEAD",
            fallback_target,
            cwd=str(project_dir),
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
        )
        _, f_err = await f_proc.communicate()
        if f_proc.returncode != 0:
            raise HTTPException(
                status_code=400,
                detail=f_err.decode("utf-8", errors="replace") or "Git unstage failed.",
            )

    return {"success": True, "message": "File(s) unstaged successfully."}


@router.post(
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
        "git",
        "status",
        "-s",
        rel_path,
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
            "git",
            "restore",
            rel_path,
            cwd=str(project_dir),
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
        )
        _, _ = await restore_proc.communicate()
        if restore_proc.returncode != 0:
            # Fallback to git checkout --
            co_proc = await asyncio.create_subprocess_exec(
                "git",
                "checkout",
                "--",
                rel_path,
                cwd=str(project_dir),
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
            )
            await co_proc.communicate()

    return {"success": True, "message": f"Changes in '{req.file}' discarded."}


@router.post(
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
        "git",
        "diff",
        "--cached",
        "--name-only",
        cwd=str(project_dir),
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE,
    )
    diff_out, _ = await diff_proc.communicate()
    has_staged = bool(diff_out.decode("utf-8").strip())

    if not has_staged:
        if req.smartCommit:
            add_proc = await asyncio.create_subprocess_exec(
                "git",
                "add",
                ".",
                cwd=str(project_dir),
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
            )
            await add_proc.communicate()
        else:
            raise HTTPException(status_code=400, detail="No staged changes to commit.")

    commit_proc = await asyncio.create_subprocess_exec(
        "git",
        "commit",
        "-m",
        msg,
        cwd=str(project_dir),
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE,
    )
    c_out, c_err = await commit_proc.communicate()
    if commit_proc.returncode != 0:
        err_msg = (
            c_err.decode("utf-8", errors="replace")
            or c_out.decode("utf-8", errors="replace")
            or "Commit failed."
        )
        raise HTTPException(status_code=400, detail=err_msg)

    return {"success": True, "message": f"Committed: {msg}"}
