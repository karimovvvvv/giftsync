import json
from collections import defaultdict

from fastapi import WebSocket


class ConnectionManager:
    """
    Hub для WebSocket соединений.
    Клиенты подписываются по wishlist slug.
    """

    def __init__(self):
        self._connections: dict[str, list[WebSocket]] = defaultdict(list)

    async def connect(self, websocket: WebSocket, slug: str) -> None:
        await websocket.accept()
        self._connections[slug].append(websocket)

    def disconnect(self, websocket: WebSocket, slug: str) -> None:
        conns = self._connections.get(slug, [])
        if websocket in conns:
            conns.remove(websocket)
        if not conns and slug in self._connections:
            del self._connections[slug]

    async def broadcast(self, slug: str, event: dict) -> None:
        """Отправить JSON-событие всем подключённым клиентам вишлиста."""
        payload = json.dumps(event, default=str, ensure_ascii=False)
        dead: list[WebSocket] = []
        for ws in list(self._connections.get(slug, [])):
            try:
                await ws.send_text(payload)
            except Exception:
                dead.append(ws)
        for ws in dead:
            self.disconnect(ws, slug)

    def active_connections(self, slug: str) -> int:
        return len(self._connections.get(slug, []))


# Глобальный singleton
manager = ConnectionManager()