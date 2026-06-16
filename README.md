# Fullstack text-to-speech speech-to-text application
---

Simple speech-to-text / text-to-speech application using LangChain and React for the frontend.

## Stack

- [LangChain](https://docs.langchain.com/oss/python/langchain/overview) - AI agent and workflow
- [uv](https://docs.astral.sh/uv/) - dependency management and virtual environments
- [React](https://react.dev/) - Frontend
- [AssemblyAI](https://www.assemblyai.com/) - Speech to text
- [Cartesia](https://www.cartesia.ai/) - Text to speech
- [Google Gemini](https://ai.google.dev/) - LLM for the voice agent
- [FastAPI](http://fastapi.tiangolo.com/) - Presentational layer, real-time communication

The architecture is quite simple: an event-driven pipeline with streaming and real-time communication in the server layer using [FastAPI WebSockets](https://fastapi.tiangolo.com/advanced/websockets) and [LangChain Runnables](https://reference.langchain.com/python/langchain-core/runnables).

```
Mic → WebSocket → AssemblyAI (STT) → LangChain Agent (Gemini) → Cartesia (TTS) → Speaker
```

Please check `.env.example` for efficiently setting local environment.

## Run

**Backend** (port 8000):

```bash
uv sync
uv run python main.py
```

**Frontend** (port 5173, proxies `/ws` to the backend):

```bash
cd front-react
pnpm install
pnpm dev
```

Open http://localhost:5173, allow microphone access, and start a session.
