import pytest
from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)


def test_dataset_schema_success():
    res = client.get(
        "/api/projects/template-thesis/dataset/schema?path=assets/research_transactions.csv"
    )
    assert res.status_code == 200
    data = res.json()
    assert data["filename"] == "research_transactions.csv"
    assert data["total_rows"] == 500000
    assert data["total_columns"] == 200
    assert len(data["columns"]) == 200
    first_col = data["columns"][0]
    assert first_col["name"] == "TransactionID"


def test_dataset_slice_pagination():
    res = client.get(
        "/api/projects/template-thesis/dataset/slice?path=assets/research_transactions.csv&row_offset=0&row_limit=25&col_offset=0&col_limit=10"
    )
    assert res.status_code == 200
    data = res.json()
    assert data["row_offset"] == 0
    assert data["row_limit"] == 25
    assert data["col_offset"] == 0
    assert data["col_limit"] == 10
    assert len(data["columns"]) == 10
    assert len(data["data"]) == 25
    # First row has 10 columns matching selected columns
    assert len(data["data"][0]) == 10
    assert data["data"][0][0] == 1000000  # First TransactionID


def test_dataset_slice_offset():
    res = client.get(
        "/api/projects/template-thesis/dataset/slice?path=assets/research_transactions.csv&row_offset=100&row_limit=10&col_offset=5&col_limit=5"
    )
    assert res.status_code == 200
    data = res.json()
    assert data["row_offset"] == 100
    assert len(data["data"]) == 10
    assert len(data["columns"]) == 5


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
