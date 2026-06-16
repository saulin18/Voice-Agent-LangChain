import { create } from "zustand";
import type { ActivityStore, LogStore } from "../types";

export const activities = create<ActivityStore>((set) => ({
  activities: [],

  addActivity(type, label, text, args) {
    set((state) => ({
      activities: [
        {
          id: `activity-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
          type,
          label,
          text,
          args,
          timestamp: new Date(),
        },
        ...state.activities,
      ].slice(0, 50),
    }));
  },

  clear: () => set({ activities: [] }),
}));

export const logs = create<LogStore>((set) => ({
  logs: [],

  log(message: string) {
    set((state) => ({
      logs: [
        ...state.logs,
        {
          id: `log-${state.logs.length + 1}-${Date.now()}`,
          message,
          timestamp: new Date(),
        },
      ],
    }));
  },

  clear: () => set({ logs: [] }),
}));
