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


def test_compile_pandoc_engine():
    project_name = "pytest-pandoc-test"
    temp_dir = WORKSPACE_DIR / project_name
    if temp_dir.exists():
        shutil.rmtree(temp_dir)

    try:
        client.post("/api/projects", json={"name": project_name})

        # Save markdown file
        md_content = "# Test Pandoc\n\n| Col 1 | Col 2 |\n| --- | --- |\n| 1 | 2 |\n"
        client.put(
            f"/api/projects/{project_name}/files/notes.md",
            json={"content": md_content},
        )

        compile_res = client.post(
            f"/api/projects/{project_name}/compile",
            json={"mainFile": "notes.md", "engine": "Pandoc"},
        )
        assert compile_res.status_code == 200
        data = compile_res.json()
        assert "success" in data
        assert isinstance(data["errors"], list)
    finally:
        if temp_dir.exists():
            shutil.rmtree(temp_dir)


def test_compile_modular_project_and_raw_asset():
    project_name = "pytest-modular-proj"
    temp_dir = WORKSPACE_DIR / project_name
    if temp_dir.exists():
        shutil.rmtree(temp_dir)

    try:
        # Create base project
        create_res = client.post("/api/projects", json={"name": project_name})
        assert create_res.status_code == 201

        # Create subfolder file: chapters/bab1.tex
        chapter_content = (
            "\\section{Pendahuluan Modular}\nIni adalah isi bab 1 dari subfolder.\n"
        )
        save_chap = client.put(
            f"/api/projects/{project_name}/files/chapters/bab1.tex",
            json={"content": chapter_content},
        )
        assert save_chap.status_code == 200

        # Create assets/sample.txt
        asset_content = "binary-asset-sample-data"
        save_asset = client.put(
            f"/api/projects/{project_name}/files/assets/sample.txt",
            json={"content": asset_content},
        )
        assert save_asset.status_code == 200

        # Update main.tex to include chapters/bab1
        main_content = (
            "\\documentclass{article}\n"
            "\\begin{document}\n"
            "\\input{chapters/bab1}\n"
            "\\end{document}\n"
        )
        save_main = client.put(
            f"/api/projects/{project_name}/files/main.tex",
            json={"content": main_content},
        )
        assert save_main.status_code == 200

        # Compile main.tex
        compile_res = client.post(
            f"/api/projects/{project_name}/compile",
            json={"mainFile": "main.tex", "engine": "pdfLaTeX"},
        )
        assert compile_res.status_code == 200
        comp_data = compile_res.json()
        assert comp_data["success"] is True

        # Test raw asset streaming endpoint
        raw_res = client.get(f"/api/projects/{project_name}/raw/assets/sample.txt")
        assert raw_res.status_code == 200
        assert raw_res.text == asset_content
    finally:
        if temp_dir.exists():
            shutil.rmtree(temp_dir)
