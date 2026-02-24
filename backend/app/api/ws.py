import asyncio
import json
import logging

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from app.k8s.watcher import watcher

logger = logging.getLogger(__name__)
router = APIRouter(tags=["websocket"])


@router.websocket("/ws/watch")
async def websocket_watch(ws: WebSocket):
    await ws.accept()
    subscriptions: dict[str, asyncio.Queue] = {}
    tasks: list[asyncio.Task] = []

    async def forward_events(channel: str, queue: asyncio.Queue):
        try:
            while True:
                message = await queue.get()
                await ws.send_text(message)
        except (asyncio.CancelledError, WebSocketDisconnect):
            pass

    try:
        while True:
            data = await ws.receive_text()
            try:
                msg = json.loads(data)
            except json.JSONDecodeError:
                continue

            action = msg.get("action")
            channel = msg.get("channel")

            if action == "subscribe" and channel:
                if channel not in subscriptions:
                    queue = watcher.subscribe(channel)
                    subscriptions[channel] = queue
                    task = asyncio.create_task(forward_events(channel, queue))
                    tasks.append(task)
                    await ws.send_text(json.dumps({"type": "subscribed", "channel": channel}))

            elif action == "unsubscribe" and channel:
                queue = subscriptions.pop(channel, None)
                if queue:
                    watcher.unsubscribe(channel, queue)
                    await ws.send_text(json.dumps({"type": "unsubscribed", "channel": channel}))

            elif action == "ping":
                await ws.send_text(json.dumps({"type": "pong"}))

    except WebSocketDisconnect:
        pass
    finally:
        for channel, queue in subscriptions.items():
            watcher.unsubscribe(channel, queue)
        for task in tasks:
            task.cancel()
