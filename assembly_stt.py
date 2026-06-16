import asyncio
import contextlib
import json
from urllib.parse import urlencode
from typing import AsyncIterator, Optional
import os
from logging import getLogger
from dotenv import load_dotenv
import websockets
from websockets import ClientConnection

from events import STTChunkEvent, STT_EVENT, STTOutputEvent

load_dotenv()
logger = getLogger(__name__)


class AssemblyAI:
    def __init__(
        self,
        api_key: Optional[str] = None,
        sample_rate: int = 16000,
        format_turns: bool = True,
    ) -> None:
        self.api_key = api_key or os.getenv("ASSEMBLY_AI_API_KEY")
        if not self.api_key:
            raise ValueError("AssemblyAI API key is required")

        self.sample_rate = sample_rate
        self.format_turns = format_turns

        self._connection_signal = asyncio.Event()

        self._close_signal = asyncio.Event()
        self._ws: Optional[ClientConnection] = None

    async def receive_events(self) -> AsyncIterator[STT_EVENT]:
        while not self._close_signal.is_set():
            try:
                _, pending = await asyncio.wait(
                    [
                        asyncio.create_task(self._close_signal.wait()),
                        asyncio.create_task(self._connection_signal.wait()),
                    ],
                    return_when=asyncio.FIRST_COMPLETED,
                )
            except Exception as e:
                logger.error(f"Error receiving events: {e}")
                raise

            with contextlib.suppress(asyncio.CancelledError):
                for task in pending:
                    task.cancel()

            if self._close_signal.is_set():
                logger.info("Connection closed")
                break

            if self._ws and self._ws.close_code is None:
                self._connection_signal.clear()
                try:
                    async for raw_message in self._ws:
                        try:
                            message = json.loads(raw_message)
                            message_type = message.get("type")
                            if message_type == "Begin":
                                pass
                            
                            elif message_type == "Turn":
                                transcript = message.get("transcript", "")
                                turn_is_formatted = message.get(
                                    "turn_is_formatted", False
                                )
                                if turn_is_formatted:
                                    if transcript:
                                        yield STTOutputEvent.create(transcript)
                                else:
                                    yield STTChunkEvent.create(transcript)

                            elif message_type == "Termination":
                                # no-op
                                pass
                            else:
                                if "error" in message:
                                    logger.error(
                                        f"AssemblyAISTT error: {message['error']}"
                                    )
                                    break
                        except json.JSONDecodeError as e:
                            logger.error(
                                f"[DEBUG] AssemblyAISTT JSON decode error: {e}"
                            )
                            continue
                except websockets.exceptions.ConnectionClosed:
                    logger.error("AssemblyAISTT: WebSocket connection closed")

    async def send_audio(self, audio_data: bytes):
        ws = await self._ensure_connection()
        await ws.send(audio_data)

    async def _ensure_connection(self) -> ClientConnection:
        if self._close_signal.is_set():
            raise RuntimeError(
                "AssemblyAISTT tried establishing a connection after it was closed"
            )
        if self._ws and self._ws.close_code is None:
            return self._ws

        params = urlencode(
            {
                "sample_rate": self.sample_rate,
                "format_turns": str(self.format_turns).lower(),
            }
        )
        url = f"wss://streaming.assemblyai.com/v3/ws?{params}"
        self._ws: ClientConnection = await websockets.connect(
            url, additional_headers={"Authorization": self.api_key}
        )

        self._connection_signal.set()
        return self._ws

    async def close(self) -> None:
        if self._ws and self._ws.close_code is None:
            await self._ws.close()
        self._ws = None
        self._close_signal.set()
