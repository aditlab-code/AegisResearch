import pytest
import shutil
import tempfile
from pathlib import Path
from fastapi.testclient import TestClient

from backend.main import app
from backend.services.workspace_registry import (
    WorkspaceRegistry,
    detect_root_latex_file,
    workspace_registry,
)

client = TestClient(app)


@pytest.fixture
def temp_latex_dir(tmp_path):
    proj_dir = tmp_path / "my_external_thesis"
    proj_dir.mkdir(parents=True, exist_ok=True)
    main_tex = proj_dir / "thesis.tex"
    main_tex.write_text(
        "\\documentclass{article}\n\\begin{document}\nExternal thesis content\n\\end{document}\n",
        encoding="utf-8",
    )
    ch1 = proj_dir / "chapter1.tex"
    ch1.write_text("Chapter 1 text", encoding="utf-8")
    return proj_dir


def test_detect_root_latex_file(temp_latex_dir):
    # With thesis.tex containing documentclass & begin document
    root = detect_root_latex_file(temp_latex_dir)
    assert root == "thesis.tex"

    # If main.tex is added, it should take precedence
    (temp_latex_dir / "main.tex").write_text(
        "\\documentclass{report}\n\\begin{document}\nHi\n\\end{document}"
    )
    assert detect_root_latex_file(temp_latex_dir) == "main.tex"


def test_open_workspace_endpoint(temp_latex_dir):
    res = client.post("/api/workspaces/open", json={"path": str(temp_latex_dir)})
    assert res.status_code == 200
    data = res.json()
    assert data["name"] == "my_external_thesis"
    assert data["path"] == str(temp_latex_dir)
    assert data["root_file"] == "thesis.tex"
    ws_id = data["id"]

    # Verify listed in /api/workspaces/recent
    recents = client.get("/api/workspaces/recent").json()
    assert any(w["id"] == ws_id for w in recents)

    # Verify listed in /api/projects
    projects = client.get("/api/projects").json()
    assert ws_id in projects

    # Verify file reading via projects API in-place
    files_res = client.get(f"/api/projects/{ws_id}/files")
    assert files_res.status_code == 200
    file_names = [f["name"] for f in files_res.json()]
    assert "thesis.tex" in file_names
    assert "chapter1.tex" in file_names

    # Read content
    read_res = client.get(f"/api/projects/{ws_id}/files/thesis.tex")
    assert read_res.status_code == 200
    assert "External thesis content" in read_res.json()["content"]

    # Cleanup / remove workspace
    del_res = client.delete(f"/api/workspaces/{ws_id}")
    assert del_res.status_code == 200


def test_security_blocked_paths():
    # Attempting to open /etc or non-existent path
    res = client.post("/api/workspaces/open", json={"path": "/etc"})
    assert res.status_code == 400
    assert "forbidden" in res.json()["detail"].lower()

    res_none = client.post(
        "/api/workspaces/open", json={"path": "/non/existent/path/xyz123"}
    )
    assert res_none.status_code == 400


def test_open_dialog_endpoint(monkeypatch):
    import backend.main

    async def mock_pick():
        return None

    monkeypatch.setattr(backend.main, "pick_directory_native", mock_pick)
    res = client.post("/api/workspaces/open-dialog")
    assert res.status_code == 200
    data = res.json()
    assert "cancelled" in data
    assert "requires_manual_input" in data
