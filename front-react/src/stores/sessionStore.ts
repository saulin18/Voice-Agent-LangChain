import { create } from "zustand";
import type { SessionStore } from "../types";

export const session = create<SessionStore>((set, get) => ({
  connected: false,
  recording: false,
  status: "ready",
  startTime: null,
  elapsed: 0,
  timer: null,

  connect() {
    get().clearTimer();
    set({
      connected: true,
      recording: true,
      status: "listening",
      startTime: Date.now(),
      elapsed: 0,
      timer: setInterval(() => {
        const { startTime } = get();
        set({
          elapsed: startTime
            ? Math.floor((Date.now() - startTime) / 1000)
            : 0,
        });
      }, 1000),
    });
  },

  disconnect() {
    get().clearTimer();
    set({
      connected: false,
      recording: false,
      status: "disconnected",
      timer: null,
    });
  },

  setStatus(status) {
    set({ status });
  },

  reset() {
    get().clearTimer();
    set({
      connected: false,
      recording: false,
      status: "ready",
      startTime: null,
      elapsed: 0,
      timer: null,
    });
  },

  clearTimer() {
    const { timer } = get();
    if (timer) {
      clearInterval(timer);
    }
  },

  formattedTime() {
    const { elapsed } = get();
    const mins = Math.floor(elapsed / 60);
    const secs = elapsed % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  },
}));
