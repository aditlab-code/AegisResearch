import pytest
from pathlib import Path
from fastapi.testclient import TestClient

from backend.main import app
from backend.services.synctex import (
    parse_synctex_edit_output,
    parse_synctex_view_output,
)

client = TestClient(app)


def test_parse_synctex_edit_output_success():
    sample_output = """This is SyncTeX command line utility, version 1.5
SyncTeX result begin
Output:thesis.pdf
Input:/workspace/proj/./chapters/intro.tex
Line:42
Column:10
Offset:0
Context:
SyncTeX result end
"""
    proj_dir = Path("/workspace/proj")
    res = parse_synctex_edit_output(sample_output, proj_dir)
    assert res["success"] is True
    assert res["file"] == "chapters/intro.tex"
    assert res["line"] == 42
    assert res["column"] == 10


def test_parse_synctex_edit_output_fallback_col():
    sample_output = """This is SyncTeX command line utility, version 1.5
SyncTeX result begin
Output:thesis.pdf
Input:/workspace/proj/main.tex
Line:15
Column:-1
SyncTeX result end
"""
    proj_dir = Path("/workspace/proj")
    res = parse_synctex_edit_output(sample_output, proj_dir)
    assert res["success"] is True
    assert res["file"] == "main.tex"
    assert res["line"] == 15
    assert res["column"] == 1


def test_parse_synctex_edit_output_no_data():
    sample_output = "No synctex file found"
    res = parse_synctex_edit_output(sample_output)
    assert res["success"] is False
    assert "No SyncTeX data found" in res["message"]


def test_parse_synctex_view_output_success():
    sample_output = """This is SyncTeX command line utility, version 1.5
SyncTeX result begin
Output:thesis.pdf
Page:2
x:142.50
y:320.10
h:100.00
v:322.00
W:380.00
H:12.50
SyncTeX result end
"""
    res = parse_synctex_view_output(sample_output)
    assert res["success"] is True
    assert res["page"] == 2
    assert res["x"] == 142.5
    assert res["y"] == 320.1
    assert res["width"] == 380.0
    assert res["height"] == 12.5


def test_parse_synctex_view_output_no_data():
    sample_output = "Error: synctex file does not exist"
    res = parse_synctex_view_output(sample_output)
    assert res["success"] is False


def test_api_synctex_not_found_project():
    res = client.post(
        "/api/projects/non-existent-proj-xyz/synctex/inverse",
        json={"pdfName": "main.pdf", "page": 1, "x": 100.0, "y": 200.0},
    )
    assert res.status_code == 404


def test_api_synctex_real_template_thesis():
    # template-thesis exists and has main.pdf + main.synctex.gz
    # Test inverse search
    inv_res = client.post(
        "/api/projects/template-thesis/synctex/inverse",
        json={"pdfName": "main.pdf", "page": 1, "x": 200.0, "y": 250.0},
    )
    assert inv_res.status_code == 200
    inv_data = inv_res.json()
    assert inv_data["success"] is True
    assert "main.tex" in inv_data["file"]
    assert inv_data["line"] > 0

    # Test forward search
    fwd_res = client.post(
        "/api/projects/template-thesis/synctex/forward",
        json={
            "pdfName": "main.pdf",
            "file": "main.tex",
            "line": inv_data["line"],
            "column": 1,
        },
    )
    assert fwd_res.status_code == 200
    fwd_data = fwd_res.json()
    assert fwd_data["success"] is True
    assert fwd_data["page"] >= 1
    assert fwd_data["x"] is not None
    assert fwd_data["y"] is not None
