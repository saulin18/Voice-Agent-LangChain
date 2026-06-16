import { create } from "zustand";
import type { TurnStore, TurnStateData, LatencyStatsStore } from "../types";

const initialTurn: TurnStateData = {
  active: false,
  turnStartTs: null,
  sttStartTs: null,
  sttEndTs: null,
  agentStartTs: null,
  agentEndTs: null,
  ttsStartTs: null,
  ttsEndTs: null,
  text: "",
  response: "",
};

function createTurnStore() {
  return create<TurnStore>((set) => ({
    ...initialTurn,

    startTurn(ts: number) {
      set((state) => ({
        ...state,
        active: true,
        turnStartTs: ts,
        sttStartTs: null,
        sttEndTs: null,
        agentStartTs: null,
        agentEndTs: null,
        ttsStartTs: null,
        ttsEndTs: null,
        text: "",
        response: "",
      }));
    },

    sttStart(ts: number) {
      set((state) => ({ ...state, sttStartTs: state.sttStartTs ?? ts }));
    },

    sttEnd(ts: number, text: string) {
      set((state) => ({ ...state, sttEndTs: ts, text }));
    },

    sttChunk(text: string) {
      set((state) => ({ ...state, text }));
    },

    agentStart(ts: number) {
      set((state) => ({ ...state, agentStartTs: state.agentStartTs ?? ts }));
    },

    agentChunk(ts: number, text: string) {
      set((state) => ({
        ...state,
        agentStartTs: state.agentStartTs ?? ts,
        agentEndTs: ts,
        response: state.response + text,
      }));
    },

    ttsStart(ts: number) {
      set((state) => ({ ...state, ttsStartTs: state.ttsStartTs ?? ts }));
    },

    ttsChunk(ts: number) {
      set((state) => ({
        ...state,
        ttsStartTs: state.ttsStartTs ?? ts,
        ttsEndTs: ts,
      }));
    },

    finishTurn() {
      set((state) => ({ ...state, active: false }));
    },

    reset() {
      set({ ...initialTurn });
    },

    preserveFromTurn(turn: TurnStateData) {
      set({
        active: false,
        turnStartTs: turn.turnStartTs,
        sttStartTs: turn.sttStartTs,
        sttEndTs: turn.sttEndTs,
        agentStartTs: turn.agentStartTs,
        agentEndTs: turn.agentEndTs,
        ttsStartTs: turn.ttsStartTs,
        ttsEndTs: turn.ttsEndTs,
        text: turn.text,
        response: turn.response,
      });
    },
  }));
}

export const currentTurn = createTurnStore();

export const latencyStats = create<LatencyStatsStore>((set, get) => ({
  turns: 0,
  stt: [],
  agent: [],
  tts: [],
  total: [],

  recordTurn(turn: TurnStateData) {
    const sttLatency =
      turn.sttEndTs && turn.sttStartTs
        ? turn.sttEndTs - turn.sttStartTs
        : null;
    const agentLatency =
      turn.agentEndTs && turn.agentStartTs
        ? turn.agentEndTs - turn.agentStartTs
        : null;
    const ttsLatency =
      turn.ttsEndTs && turn.ttsStartTs
        ? turn.ttsEndTs - turn.ttsStartTs
        : null;

    if (
      sttLatency !== null &&
      agentLatency !== null &&
      ttsLatency !== null
    ) {
      set((state) => ({
        turns: state.turns + 1,
        stt: [...state.stt, sttLatency],
        agent: [...state.agent, agentLatency],
        tts: [...state.tts, ttsLatency],
        total: [...state.total, sttLatency + agentLatency + ttsLatency],
      }));
    }
  },

  reset() {
    set({ turns: 0, stt: [], agent: [], tts: [], total: [] });
  },

  computedStats() {
    const { total } = get();
    if (total.length === 0) {
      return { avg: null, min: null, max: null };
    }
    const avg = total.reduce((a, b) => a + b, 0) / total.length;
    return { avg, min: Math.min(...total), max: Math.max(...total) };
  },
}));

// Preserved waterfall snapshot (kept until next turn starts)
export const waterfallData = createTurnStore();
