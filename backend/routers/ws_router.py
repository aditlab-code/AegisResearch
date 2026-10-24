from fastapi import APIRouter, HTTPException, WebSocket, WebSocketDisconnect, status

from backend.routers.common import resolve_project_dir
from backend.watcher import workspace_watcher

router = APIRouter()


@router.websocket("/api/ws/workspace/{name}")
async def workspace_ws(websocket: WebSocket, name: str):
    try:
        project_dir = resolve_project_dir(name)
    except HTTPException:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    if not project_dir.exists() or not project_dir.is_dir():
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    await workspace_watcher.connect(name, websocket)
    await workspace_watcher.start_watcher_if_needed(name, project_dir)

    try:
        while True:
            data = await websocket.receive_text()
            # Heartbeat ping/pong support
            if data == "ping":
                await websocket.send_text("pong")
    except WebSocketDisconnect:
        workspace_watcher.disconnect(name, websocket)
    except Exception:  # noqa: BLE001
        workspace_watcher.disconnect(name, websocket)
