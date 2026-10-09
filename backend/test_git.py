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
