import contextlib
import logging
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager
from typing import Any

from langchain_core.runnables import RunnableGenerator
from agent_workflow import stt_stream, agent_stream, tts_stream
from events import event_to_dict
from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware
from starlette.websockets import WebSocketDisconnect, WebSocketState

logger = logging.getLogger(__name__)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

pipeline = (
    RunnableGenerator(stt_stream)  # Audio → STT events
    | RunnableGenerator(agent_stream)  # STT events → Agent events
    | RunnableGenerator(tts_stream)  # Agent events → TTS audio
)


def _websocket_closed(exc: BaseException) -> bool:
    if isinstance(exc, WebSocketDisconnect):
        return True
    return isinstance(exc, RuntimeError) and "websocket.send" in str(exc)


@asynccontextmanager
async def voice_pipeline(
    audio_stream: AsyncIterator[bytes],
) -> AsyncIterator[Any]:
    """Run the STT → agent → TTS pipeline; aclose() on exit like `async with connect()`."""
    output_stream = pipeline.atransform(audio_stream)
    try:
        yield output_stream
    finally:
        if hasattr(output_stream, "aclose"):
            with contextlib.suppress(Exception):
                await output_stream.aclose()


async def _safe_send_json(websocket: WebSocket, payload: dict) -> bool:
    """Send JSON; return False when the client has already disconnected."""
    if websocket.client_state != WebSocketState.CONNECTED:
        return False
    try:
        await websocket.send_json(payload)
        return True
    except (WebSocketDisconnect, RuntimeError) as exc:
        if _websocket_closed(exc):
            return False
        raise


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()

    async def websocket_audio_stream():
        async for data in websocket.iter_bytes():
            yield data

    try:
        async with voice_pipeline(websocket_audio_stream()) as output_stream:
            async for event in output_stream:
                if not await _safe_send_json(websocket, event_to_dict(event)):
                    break
    except WebSocketDisconnect:
        pass
    except Exception:
        logger.exception("Voice pipeline error")
        with contextlib.suppress(Exception):
            await _safe_send_json(
                websocket,
                {"type": "error", "text": "Pipeline error — check server logs"},
            )
