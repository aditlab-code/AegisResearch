import shutil
import pytest
import time
from fastapi.testclient import TestClient
from backend.main import app
from backend.config import WORKSPACE_DIR

client = TestClient(app)


def test_tree_hierarchy_endpoint():
    project_name = "pytest-tree-proj"
    temp_dir = WORKSPACE_DIR / project_name
    if temp_dir.exists():
        shutil.rmtree(temp_dir)

    try:
        # Create project
        create_res = client.post("/api/projects", json={"name": project_name})
        assert create_res.status_code == 201

        # Create subfolder 'chapters'
        folder_res = client.post(
            f"/api/projects/{project_name}/folders", json={"path": "chapters"}
        )
        assert folder_res.status_code == 201

        # Create file in subfolder 'chapters/intro.tex'
        file_res = client.post(
            f"/api/projects/{project_name}/files",
            json={"path": "chapters/intro.tex", "content": "% intro"},
        )
        assert file_res.status_code == 201

        # Fetch tree
        tree_res = client.get(f"/api/projects/{project_name}/tree")
        assert tree_res.status_code == 200
        tree = tree_res.json()

        # Should contain 'chapters' as a folder and 'main.tex' as a file
        folder_node = next((n for n in tree if n["name"] == "chapters"), None)
        assert folder_node is not None
        assert folder_node["type"] == "folder"
        assert len(folder_node["children"]) == 1
        assert folder_node["children"][0]["name"] == "intro.tex"
        assert folder_node["children"][0]["type"] == "file"

    finally:
        if temp_dir.exists():
            shutil.rmtree(temp_dir)


def test_create_folder_conflict_and_traversal():
    project_name = "pytest-folder-guard"
    temp_dir = WORKSPACE_DIR / project_name
    if temp_dir.exists():
        shutil.rmtree(temp_dir)

    try:
        client.post("/api/projects", json={"name": project_name})

        # Valid create
        res1 = client.post(
            f"/api/projects/{project_name}/folders", json={"path": "data"}
        )
        assert res1.status_code == 201

        # Conflict create
        res2 = client.post(
            f"/api/projects/{project_name}/folders", json={"path": "data"}
        )
        assert res2.status_code == 409

        # Path traversal prevention
        res3 = client.post(
            f"/api/projects/{project_name}/folders", json={"path": "../forbidden"}
        )
        assert res3.status_code == 400
    finally:
        if temp_dir.exists():
            shutil.rmtree(temp_dir)


def test_workspace_websocket_sync():
    project_name = "pytest-ws-sync"
    temp_dir = WORKSPACE_DIR / project_name
    if temp_dir.exists():
        shutil.rmtree(temp_dir)

    try:
        client.post("/api/projects", json={"name": project_name})

        with client.websocket_connect(f"/api/ws/workspace/{project_name}") as ws:
            # Test ping pong
            ws.send_text("ping")
            pong = ws.receive_text()
            assert pong == "pong"

            # Create a file in disk
            new_file = temp_dir / "external_note.md"
            new_file.write_text("Hello from outside", encoding="utf-8")

            # Watcher should detect and send FS_CHANGED
            msg = ws.receive_json()
            assert msg["type"] == "FS_CHANGED"
            assert msg["project"] == project_name

    finally:
        if temp_dir.exists():
            shutil.rmtree(temp_dir)
