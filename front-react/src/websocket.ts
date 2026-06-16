import type { ServerEvent } from "./types";
import {
  currentTurn,
  latencyStats,
  waterfallData,
} from "./stores/pipelineStore";
import { activities, logs } from "./stores/activityStore";
import { session } from "./stores/sessionStore";
import { createAudioCapture } from "./audio/audioCapture";
import { createAudioPlayback } from "./audio/playback";

export interface VoiceSession {
  start: () => Promise<void>;
  stop: () => void;
}

export function createVoiceSession(): VoiceSession {
  let ws: WebSocket | null = null;
  let ttsFinishTimeout: ReturnType<typeof setTimeout> | null = null;

  const audioCapture = createAudioCapture();
  const audioPlayback = createAudioPlayback();

  function handleEvent(event: ServerEvent) {
    const turn = currentTurn.getState();

    switch (event.type) {
      case "stt_chunk": {
        if (!turn.active) {
          const prevTurn = currentTurn.getState();
          if (prevTurn.turnStartTs) {
            waterfallData.getState().preserveFromTurn(prevTurn);
          }
          currentTurn.getState().startTurn(event.timestamp);
        }
        currentTurn.getState().sttStart(event.timestamp);
        currentTurn.getState().sttChunk(event.text);
        break;
      }

      case "stt_output":
        currentTurn.getState().sttEnd(event.timestamp, event.text);
        activities.getState().addActivity("stt", "Transcription", event.text);
        break;

      case "agent_chunk":
        currentTurn.getState().agentChunk(event.timestamp, event.text);
        break;

      case "agent_end":
        // Turn boundary marker from backend; TTS follows via buffered text
        break;

      case "tool_call":
        activities.getState().addActivity(
          "tool",
          `Tool: ${event.name}`,
          "Called with arguments:",
          event.args,
        );
        logs.getState().log(`Tool call: ${event.name}`);
        break;

      case "tool_result":
        activities.getState().addActivity(
          "tool",
          `Tool Result: ${event.name}`,
          event.result,
        );
        logs.getState().log(`Tool result: ${event.result}`);
        break;

      case "tts_chunk": {
        const turnState = currentTurn.getState();
        if (!turnState.ttsStartTs && turnState.response) {
          activities
            .getState()
            .addActivity("agent", "Agent Response", turnState.response);
        }
        currentTurn.getState().ttsChunk(event.timestamp);
        audioPlayback.push(event.audio);

        if (ttsFinishTimeout) clearTimeout(ttsFinishTimeout);
        ttsFinishTimeout = setTimeout(() => {
          const t = currentTurn.getState();
          if (t.active && t.sttEndTs && t.ttsEndTs) {
            finishTurn();
          }
        }, 300);
        break;
      }
    }
  }

  function finishTurn() {
    const turn = currentTurn.getState();
    waterfallData.getState().preserveFromTurn(turn);
    latencyStats.getState().recordTurn(turn);
    currentTurn.getState().finishTurn();
  }

  async function start(): Promise<void> {
    session.getState().reset();
    currentTurn.getState().reset();
    latencyStats.getState().reset();
    waterfallData.getState().reset();
    activities.getState().clear();
    logs.getState().clear();
    audioPlayback.stop();

    session.getState().setStatus("connecting");

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    ws = new WebSocket(`${protocol}//${window.location.host}/ws`);
    ws.binaryType = "arraybuffer";

    ws.onopen = async () => {
      session.getState().connect();
      logs.getState().log("Session started");

      try {
        await audioCapture.start((chunk) => {
          if (ws && ws.readyState === WebSocket.OPEN) {
            ws.send(chunk);
          }
        });
        logs.getState().log("Microphone access granted");
        logs.getState().log("Streaming PCM audio (16kHz, 16-bit, mono)");
      } catch (err) {
        console.error(err);
        logs.getState().log(
          `Error: ${err instanceof Error ? err.message : "Unknown error"}`,
        );
        session.getState().setStatus("error");
        stop();
      }
    };

    ws.onmessage = (event) => {
      const eventData = JSON.parse(event.data as string) as ServerEvent;
      handleEvent(eventData);
    };

    ws.onclose = () => {
      session.getState().disconnect();
      logs.getState().log("WebSocket disconnected");
    };

    ws.onerror = (e) => {
      console.error(e);
      logs.getState().log("WebSocket error");
      session.getState().setStatus("error");
    };
  }

  function stop(): void {
    logs.getState().log("Session ended");

    if (ttsFinishTimeout) {
      clearTimeout(ttsFinishTimeout);
      ttsFinishTimeout = null;
    }

    audioPlayback.stop();
    audioCapture.stop();

    if (ws) {
      ws.close();
      ws = null;
    }

    session.getState().reset();
  }

  return { start, stop };
}
