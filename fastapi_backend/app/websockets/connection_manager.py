from typing import Dict, List
from fastapi import WebSocket

class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, user_id: str, role: str):
        await websocket.accept()
        if role not in self.active_connections:
            self.active_connections[role] = []
        self.active_connections[role].append(websocket)

    def disconnect(self, websocket: WebSocket, role: str):
        if role in self.active_connections:
            self.active_connections[role] = [x for x in self.active_connections[role] if x != websocket]

    async def broadcast_to_role(self, role: str, message: dict):
        if role in self.active_connections:
            disconnected = []
            for ws in self.active_connections[role]:
                try:
                    await ws.send_json(message)
                except:
                    disconnected.append(ws)
            for ws in disconnected:
                self.active_connections[role].remove(ws)

manager = ConnectionManager()
