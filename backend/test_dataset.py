import pytest
from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)


def test_dataset_schema_success():
    res = client.get(
        "/api/projects/template-thesis/dataset/schema?path=benchmark_audit_200.csv"
    )
    assert res.status_code == 200
    data = res.json()
    assert data["filename"] == "benchmark_audit_200.csv"
    assert data["total_rows"] == 200
    assert data["total_columns"] == 7
    assert len(data["columns"]) == 7
    first_col = data["columns"][0]
    assert first_col["name"] == "group"


def test_dataset_slice_pagination():
    res = client.get(
        "/api/projects/template-thesis/dataset/slice?path=benchmark_audit_200.csv&row_offset=0&row_limit=25&col_offset=0&col_limit=4"
    )
    assert res.status_code == 200
    data = res.json()
    assert data["row_offset"] == 0
    assert data["row_limit"] == 25
    assert data["col_offset"] == 0
    assert data["col_limit"] == 4
    assert len(data["columns"]) == 4
    assert len(data["data"]) == 25
    # First row has 4 columns matching selected columns
    assert len(data["data"][0]) == 4
    assert data["data"][0][0] == "Control"


def test_dataset_slice_offset():
    res = client.get(
        "/api/projects/template-thesis/dataset/slice?path=benchmark_audit_200.csv&row_offset=100&row_limit=10&col_offset=2&col_limit=3"
    )
    assert res.status_code == 200
    data = res.json()
    assert data["row_offset"] == 100
    assert len(data["data"]) == 10
    assert len(data["columns"]) == 3


def test_dataset_file_not_found():
    res = client.get(
        "/api/projects/template-thesis/dataset/schema?path=assets/non_existent.csv"
    )
    assert res.status_code == 404


def test_dataset_invalid_format():
    res = client.get("/api/projects/template-thesis/dataset/schema?path=main.tex")
    assert res.status_code == 400


def test_dataset_path_traversal():
    res = client.get(
        "/api/projects/template-thesis/dataset/schema?path=../../etc/passwd"
    )
    assert res.status_code == 400
