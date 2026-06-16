// Server event types
export type ServerEvent =
  | { type: "stt_chunk"; timestamp: number; text: string }
  | { type: "stt_output"; timestamp: number; text: string }
  | { type: "agent_chunk"; timestamp: number; text: string }
  | { type: "agent_end"; timestamp: number }
  | {
      type: "tool_call";
      timestamp: number;
      id: string;
      name: string;
      args: Record<string, unknown>;
    }
  | {
      type: "tool_result";
      timestamp: number;
      toolCallId: string;
      name: string;
      result: string;
    }
  | { type: "tts_chunk"; timestamp: number; audio: string }
  | { type: "error"; text: string };

export type SessionStatus =
  | "ready"
  | "connecting"
  | "listening"
  | "error"
  | "disconnected";

// Session state
export interface SessionStore {
  connected: boolean;
  recording: boolean;
  status: SessionStatus;
  startTime: number | null;
  elapsed: number;
  timer: ReturnType<typeof setInterval> | null;
  connect: () => void;
  disconnect: () => void;
  setStatus: (status: SessionStatus) => void;
  reset: () => void;
  clearTimer: () => void;
  formattedTime: () => string;
}

// Pipeline turn data
export interface TurnStateData {
  active: boolean;
  turnStartTs: number | null;
  sttStartTs: number | null;
  sttEndTs: number | null;
  agentStartTs: number | null;
  agentEndTs: number | null;
  ttsStartTs: number | null;
  ttsEndTs: number | null;
  text: string;
  response: string;
}

export interface TurnStore extends TurnStateData {
  startTurn: (ts: number) => void;
  sttStart: (ts: number) => void;
  sttEnd: (ts: number, text: string) => void;
  sttChunk: (text: string) => void;
  agentStart: (ts: number) => void;
  agentChunk: (ts: number, text: string) => void;
  ttsStart: (ts: number) => void;
  ttsChunk: (ts: number) => void;
  finishTurn: () => void;
  reset: () => void;
  preserveFromTurn: (turn: TurnStateData) => void;
}

// Latency statistics
export interface LatencyStats {
  turns: number;
  stt: number[];
  agent: number[];
  tts: number[];
  total: number[];
}

export interface ComputedLatencyStats {
  avg: number | null;
  min: number | null;
  max: number | null;
}

export interface LatencyStatsStore extends LatencyStats {
  recordTurn: (turn: TurnStateData) => void;
  reset: () => void;
  computedStats: () => ComputedLatencyStats;
}

// Activity feed item
export interface ActivityItem {
  id: string;
  type: "stt" | "agent" | "tts" | "tool";
  label: string;
  text: string;
  args?: Record<string, unknown>;
  timestamp: Date;
}

// Console log entry
export interface LogEntry {
  id: string;
  message: string;
  timestamp: Date;
}

export interface ActivityStore {
  activities: ActivityItem[];
  addActivity: (
    type: ActivityItem["type"],
    label: string,
    text: string,
    args?: Record<string, unknown>,
  ) => void;
  clear: () => void;
}

export interface LogStore {
  logs: LogEntry[];
  log: (message: string) => void;
  clear: () => void;
}
