import asyncio
import json
import redis.asyncio as aioredis
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query
from app.core.config import settings
from app.core.security import decode_token
from app.websockets.connection_manager import manager

router = APIRouter()

@router.websocket('/ws/v1/alerts/business-owner')
async def websocket_business_owner_alerts(websocket: WebSocket, token: str = Query(...)):
    try:
        payload = decode_token(token)
        if payload.get('role') not in ['Business_Owner']:
            await websocket.close(code=4003)
            return
        await manager.connect(websocket, payload['sub'], 'Business_Owner')
        r = aioredis.from_url(settings.REDIS_URL)
        pubsub = r.pubsub()
        await pubsub.subscribe('fraud_alerts')
        try:
            async for message in pubsub.listen():
                if message['type'] == 'message':
                    data = json.loads(message['data'])
                    await websocket.send_json(data)
        except WebSocketDisconnect:
            pass
        finally:
            await pubsub.unsubscribe('fraud_alerts')
            manager.disconnect(websocket, 'Business_Owner')
    except Exception:
        await websocket.close(code=4001)
