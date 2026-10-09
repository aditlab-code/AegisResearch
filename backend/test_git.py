import shutil
import pytest
from fastapi.testclient import TestClient
from backend.main import app
from backend.config import WORKSPACE_DIR

client = TestClient(app)

def test_git_status_and_init_lifecycle():
    project_name = "pytest-git-init-lifecycle"
    temp_dir = WORKSPACE_DIR / project_name
    if temp_dir.exists():
        shutil.rmtree(temp_dir)

    try:
        # Create normal project
        create_res = client.post("/api/projects", json={"name": project_name})
        assert create_res.status_code == 201

        # Check git status before init -> isGitRepo should be False
        status_res1 = client.get(f"/api/projects/{project_name}/git/status")
        assert status_res1.status_code == 200
        data1 = status_res1.json()
        assert data1["isGitRepo"] is False

        # Call git init endpoint
        init_res = client.post(f"/api/projects/{project_name}/git/init")
        assert init_res.status_code == 201
        assert init_res.json()["success"] is True

        # Check git status after init -> isGitRepo should be True
        status_res2 = client.get(f"/api/projects/{project_name}/git/status")
        assert status_res2.status_code == 200
        data2 = status_res2.json()
        assert data2["isGitRepo"] is True

        # Verify .gitignore exists
        gitignore_path = temp_dir / ".gitignore"
        assert gitignore_path.exists()
        assert "*.aux" in gitignore_path.read_text()

    finally:
        if temp_dir.exists():
            shutil.rmtree(temp_dir)


def test_git_diff_endpoint():
    res = client.get("/api/projects/quantum-thesis/git/diff")
    assert res.status_code == 200
    assert "diff" in res.json()


def test_git_stage_unstage_discard_lifecycle():
    project_name = "pytest-git-stage-lifecycle"
    temp_dir = WORKSPACE_DIR / project_name
    if temp_dir.exists():
        shutil.rmtree(temp_dir)

    try:
        # Create and init project
        client.post("/api/projects", json={"name": project_name})
        client.post(f"/api/projects/{project_name}/git/init")

        # 1. Add changes: modify main.tex and create new-note.md
        main_tex = temp_dir / "main.tex"
        main_tex.write_text("\\documentclass{article}\n\\begin{document}\nInitial\n\\end{document}\n")
        new_note = temp_dir / "new-note.md"
        new_note.write_text("# New Notes\n")

        # Initial commit so main.tex is tracked
        client.post(f"/api/projects/{project_name}/git/commit", json={"message": "First setup", "smartCommit": True})

        # Now modify main.tex and create extra.tex
        main_tex.write_text("\\documentclass{article}\n\\begin{document}\nUpdated\n\\end{document}\n")
        extra_tex = temp_dir / "extra.tex"
        extra_tex.write_text("% Extra\n")

        # Check status -> both in unstaged, staged is empty
        st1 = client.get(f"/api/projects/{project_name}/git/status").json()
        assert st1["isGitRepo"] is True
        assert len(st1["staged"]) == 0
        assert len(st1["unstaged"]) >= 2

        # 2. Stage single file
        stage_res = client.post(f"/api/projects/{project_name}/git/stage", json={"file": "main.tex"})
        assert stage_res.status_code == 200
        st2 = client.get(f"/api/projects/{project_name}/git/status").json()
        staged_paths = [f["path"] for f in st2["staged"]]
        assert "main.tex" in staged_paths

        # Check diff with staged=True
        diff_res = client.get(f"/api/projects/{project_name}/git/diff?staged=true")
        assert diff_res.status_code == 200
        assert "Updated" in diff_res.json()["diff"]

        # 3. Unstage single file
        unstage_res = client.post(f"/api/projects/{project_name}/git/unstage", json={"file": "main.tex"})
        assert unstage_res.status_code == 200
        st3 = client.get(f"/api/projects/{project_name}/git/status").json()
        assert len(st3["staged"]) == 0

        # 4. Stage all
        stage_all_res = client.post(f"/api/projects/{project_name}/git/stage", json={"all": True})
        assert stage_all_res.status_code == 200
        st4 = client.get(f"/api/projects/{project_name}/git/status").json()
        assert len(st4["staged"]) >= 2

        # 5. Unstage all
        unstage_all_res = client.post(f"/api/projects/{project_name}/git/unstage", json={"all": True})
        assert unstage_all_res.status_code == 200
        st5 = client.get(f"/api/projects/{project_name}/git/status").json()
        assert len(st5["staged"]) == 0

        # 6. Discard tracked file
        discard_res = client.post(f"/api/projects/{project_name}/git/discard", json={"file": "main.tex"})
        assert discard_res.status_code == 200
        assert "Updated" not in main_tex.read_text()

        # 7. Discard untracked file
        discard_untracked = client.post(f"/api/projects/{project_name}/git/discard", json={"file": "extra.tex"})
        assert discard_untracked.status_code == 200
        assert not extra_tex.exists()

    finally:
        if temp_dir.exists():
            shutil.rmtree(temp_dir)


def test_git_commit_and_branches_lifecycle():
    project_name = "pytest-git-commit-branch"
    temp_dir = WORKSPACE_DIR / project_name
    if temp_dir.exists():
        shutil.rmtree(temp_dir)

    try:
        # Create and init project
        client.post("/api/projects", json={"name": project_name})
        client.post(f"/api/projects/{project_name}/git/init")

        # 1. Smart Commit test
        note_file = temp_dir / "chapter1.tex"
        note_file.write_text("\\section{Chapter 1}\nIntro content\n")

        commit_res = client.post(
            f"/api/projects/{project_name}/git/commit",
            json={"message": "feat: add chapter 1", "smartCommit": True},
        )
        assert commit_res.status_code == 200
        assert commit_res.json()["success"] is True

        # Status should now be clean
        st_clean = client.get(f"/api/projects/{project_name}/git/status").json()
        assert st_clean["modifiedCount"] == 0

        # 2. Branch listing
        branches_res = client.get(f"/api/projects/{project_name}/git/branches")
        assert branches_res.status_code == 200
        b_data = branches_res.json()
        assert b_data["current"] in b_data["branches"]

        # 3. Create new branch
        create_b_res = client.post(
            f"/api/projects/{project_name}/git/branch/create",
            json={"name": "experiments/draft-a", "checkout": True},
        )
        assert create_b_res.status_code == 200
        assert create_b_res.json()["branch"] == "experiments/draft-a"

        # Verify current branch is now experiments/draft-a
        b_after_create = client.get(f"/api/projects/{project_name}/git/branches").json()
        assert b_after_create["current"] == "experiments/draft-a"
        assert "experiments/draft-a" in b_after_create["branches"]

        # 4. Checkout back to original branch
        original_branch = b_data["current"]
        checkout_res = client.post(
            f"/api/projects/{project_name}/git/checkout",
            json={"branch": original_branch},
        )
        assert checkout_res.status_code == 200
        assert checkout_res.json()["branch"] == original_branch

        b_final = client.get(f"/api/projects/{project_name}/git/branches").json()
        assert b_final["current"] == original_branch

    finally:
        if temp_dir.exists():
            shutil.rmtree(temp_dir)

