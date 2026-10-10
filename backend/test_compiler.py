import shutil
import pytest
from fastapi.testclient import TestClient
from backend.main import app
from backend.config import WORKSPACE_DIR

client = TestClient(app)

def test_compile_latex_success_and_streaming():
    project_name = "pytest-compile-proj"
    temp_dir = WORKSPACE_DIR / project_name
    if temp_dir.exists():
        shutil.rmtree(temp_dir)

    try:
        # Create project with default main.tex
        create_res = client.post("/api/projects", json={"name": project_name})
        assert create_res.status_code == 201

        # Compile project
        compile_res = client.post(
            f"/api/projects/{project_name}/compile",
            json={"mainFile": "main.tex", "engine": "pdfLaTeX"},
        )
        assert compile_res.status_code == 200
        data = compile_res.json()
        assert data["success"] is True
        assert data["pdfUrl"] == f"/api/projects/{project_name}/pdf/main.pdf"

        # Stream PDF
        pdf_res = client.get(data["pdfUrl"])
        assert pdf_res.status_code == 200
        assert pdf_res.headers["content-type"] == "application/pdf"
        assert len(pdf_res.content) > 0

        # Assert .synctex.gz was generated
        synctex_file = temp_dir / "main.synctex.gz"
        assert synctex_file.exists()
        assert synctex_file.stat().st_size > 0


        # Test HEAD request for existing PDF
        head_res = client.head(data["pdfUrl"])
        assert head_res.status_code == 200
        assert head_res.headers["content-type"] == "application/pdf"

        # Test HEAD request for non-existent PDF
        head_404 = client.head(f"/api/projects/{project_name}/pdf/notfound.pdf")
        assert head_404.status_code == 404
    finally:
        if temp_dir.exists():
            shutil.rmtree(temp_dir)

def test_compile_latex_syntax_error():
    project_name = "pytest-syntax-err"
    temp_dir = WORKSPACE_DIR / project_name
    if temp_dir.exists():
        shutil.rmtree(temp_dir)

    try:
        client.post("/api/projects", json={"name": project_name})

        # Save invalid tex file with syntax error
        bad_tex = "\\documentclass{article}\n\\begin{document}\n\\undefinedcommand\n\\end{document}"
        client.put(
            f"/api/projects/{project_name}/files/main.tex",
            json={"content": bad_tex},
        )

        compile_res = client.post(
            f"/api/projects/{project_name}/compile",
            json={"mainFile": "main.tex", "engine": "pdfLaTeX"},
        )
        assert compile_res.status_code == 200
        data = compile_res.json()
        assert data["success"] is False
        assert len(data["errors"]) > 0

    finally:
        if temp_dir.exists():
            shutil.rmtree(temp_dir)
