import pytest
from fastapi.testclient import TestClient
from backend.main import app
from backend.config import WORKSPACE_DIR

client = TestClient(app)

def test_root_endpoint():
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert "Scholarly LaTeX IDE Backend" in data["message"]

def test_health_endpoint():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["cors"] is True
    assert data["workspace_dir"] == str(WORKSPACE_DIR)

def test_cors_headers():
    response = client.options(
        "/api/health",
        headers={
            "Origin": "http://localhost:5173",
            "Access-Control-Request-Method": "GET",
        },
    )
    assert response.status_code == 200
    assert response.headers.get("access-control-allow-origin") == "http://localhost:5173"

def test_list_projects():
    response = client.get("/api/projects")
    assert response.status_code == 200
    projects = response.json()
    assert isinstance(projects, list)
    assert "quantum-thesis" in projects

def test_create_project_lifecycle():
    project_name = "pytest-temp-project"
    temp_dir = WORKSPACE_DIR / project_name
    if temp_dir.exists():
        import shutil
        shutil.rmtree(temp_dir)

    try:
        # Create
        response = client.post("/api/projects", json={"name": project_name})
        assert response.status_code == 201
        data = response.json()
        assert data["name"] == project_name
        assert temp_dir.exists()
        assert (temp_dir / "main.tex").exists()

        # Duplicate should fail
        dup_response = client.post("/api/projects", json={"name": project_name})
        assert dup_response.status_code == 409
    finally:
        if temp_dir.exists():
            import shutil
            shutil.rmtree(temp_dir)

def test_get_project_files_success():
    response = client.get("/api/projects/quantum-thesis/files")
    assert response.status_code == 200
    files = response.json()
    assert isinstance(files, list)
    file_names = {f["name"]: f for f in files}
    assert "thesis.tex" in file_names
    assert file_names["thesis.tex"]["kind"] == "tex"
    assert "notes.md" in file_names
    assert file_names["notes.md"]["kind"] == "md"
    assert "references.bib" in file_names
    assert file_names["references.bib"]["kind"] == "other"
    for f in files:
        assert "path" in f
        assert "size" in f and isinstance(f["size"], int)
        assert "updatedAt" in f

def test_get_project_files_not_found():
    response = client.get("/api/projects/non-existent-project-404/files")
    assert response.status_code == 404
    assert "not found" in response.json()["detail"].lower()

def test_project_invalid_name_protection():
    response = client.get("/api/projects/..%2F..%2Fetc/files")
    assert response.status_code in [400, 404]

def test_create_and_scan_project_lifecycle():
    project_name = "pytest-scan-proj"
    temp_dir = WORKSPACE_DIR / project_name
    if temp_dir.exists():
        import shutil
        shutil.rmtree(temp_dir)

    try:
        create_res = client.post("/api/projects", json={"name": project_name})
        assert create_res.status_code == 201
        data = create_res.json()
        assert len(data["files"]) == 1
        assert data["files"][0]["name"] == "main.tex"
        assert data["files"][0]["kind"] == "tex"

        # Scan project files
        scan_res = client.get(f"/api/projects/{project_name}/files")
        assert scan_res.status_code == 200
        scanned = scan_res.json()
        assert len(scanned) == 1
        assert scanned[0]["name"] == "main.tex"
        assert scanned[0]["kind"] == "tex"
    finally:
        if temp_dir.exists():
            import shutil
            shutil.rmtree(temp_dir)

def test_read_file_success():
    response = client.get("/api/projects/quantum-thesis/files/thesis.tex")
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "thesis.tex"
    assert data["path"] == "thesis.tex"
    assert "\\documentclass" in data["content"]
    assert data["size"] > 0
    assert "updatedAt" in data

def test_read_file_not_found():
    response = client.get("/api/projects/quantum-thesis/files/does_not_exist.tex")
    assert response.status_code == 404

def test_read_file_path_traversal():
    response = client.get("/api/projects/quantum-thesis/files/..%2F..%2Fconfig.py")
    assert response.status_code in [400, 404]

def test_save_file_lifecycle():
    project_name = "pytest-save-lifecycle"
    temp_dir = WORKSPACE_DIR / project_name
    if temp_dir.exists():
        import shutil
        shutil.rmtree(temp_dir)

    try:
        # Create project
        create_res = client.post("/api/projects", json={"name": project_name})
        assert create_res.status_code == 201

        # Save/overwrite main.tex
        new_content = "\\documentclass{article}\n\\begin{document}\nHello Saved World!\n\\end{document}"
        save_res = client.put(
            f"/api/projects/{project_name}/files/main.tex",
            json={"content": new_content},
        )
        assert save_res.status_code == 200
        save_data = save_res.json()
        assert save_data["success"] is True
        assert save_data["path"] == "main.tex"

        # Read back to verify
        read_res = client.get(f"/api/projects/{project_name}/files/main.tex")
        assert read_res.status_code == 200
        assert read_res.json()["content"] == new_content

        # Physical file on disk matches
        disk_file = temp_dir / "main.tex"
        assert disk_file.exists()
        assert disk_file.read_text(encoding="utf-8") == new_content
    finally:
        if temp_dir.exists():
            import shutil
            shutil.rmtree(temp_dir)
