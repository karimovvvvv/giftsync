from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from app.websocket.manager import manager

router = APIRouter(tags=["websocket"])


@router.websocket("/ws/{slug}")
async def websocket_endpoint(websocket: WebSocket, slug: str):
    """
    WebSocket канал для вишлиста.
    Клиент подключается и получает real-time события:
    - contribution.added / removed
    - hero_buyer.activated
    - cascade.transferred
    - item.locked / added / updated / archived
    - capsule.revealed
    """
    await manager.connect(websocket, slug)
    try:
        # Держим соединение открытым, ждём ping или отключения
        while True:
            # Ожидаем любые данные от клиента (ping/pong keepalive)
            data = await websocket.receive_text()
            # Можно добавить обработку клиентских сообщений при необходимости
    except WebSocketDisconnect:
        manager.disconnect(websocket, slug)