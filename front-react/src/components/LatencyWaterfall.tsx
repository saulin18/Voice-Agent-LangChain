import { useEffect, useMemo, useState } from "react";
import { useStore } from "zustand";
import { formatDuration } from "../formatting-utils";
import {
  currentTurn,
  latencyStats,
  waterfallData,
} from "../stores/pipelineStore";
import type { TurnStateData } from "../types";

interface BarStyle {
  left: string;
  width: string;
  opacity: number;
}

interface BarRow {
  style: BarStyle;
  duration: string;
}

interface Bars {
  stt: BarRow;
  agent: BarRow;
  tts: BarRow;
}

function getBarStyle(
  baseTime: number,
  totalDuration: number,
  startTs: number | null,
  endTs: number | null,
  isActiveNow: boolean,
  now: number,
): BarStyle {
  if (!startTs) return { left: "0%", width: "0%", opacity: 0 };

  const left = ((startTs - baseTime) / totalDuration) * 100;

  let end: number;
  if (endTs) {
    end = endTs;
  } else if (isActiveNow) {
    end = now;
  } else {
    end = startTs;
  }

  const width = Math.max(((end - startTs) / totalDuration) * 100, 0.5);
  return { left: `${left}%`, width: `${width}%`, opacity: 1 };
}

function getDuration(
  startTs: number | null,
  endTs: number | null,
  isActiveNow: boolean,
  now: number,
): string {
  if (!startTs) return "—";
  if (!endTs && isActiveNow) return formatDuration(now - startTs);
  if (!endTs) return "—";
  return formatDuration(endTs - startTs);
}

function computeBars(
  data: TurnStateData,
  isActive: boolean,
  now: number,
): Bars | null {
  if (!data.turnStartTs) return null;

  const baseTime = data.turnStartTs;

  let endTime = baseTime;
  if (data.ttsEndTs) endTime = Math.max(endTime, data.ttsEndTs);
  else if (data.agentEndTs) endTime = Math.max(endTime, data.agentEndTs);
  else if (data.sttEndTs) endTime = Math.max(endTime, data.sttEndTs);
  if (isActive) endTime = Math.max(endTime, now);

  const totalDuration = Math.max(endTime - baseTime, 500);

  return {
    stt: {
      style: getBarStyle(
        baseTime,
        totalDuration,
        data.sttStartTs,
        data.sttEndTs,
        isActive && !!data.sttStartTs && !data.sttEndTs,
        now,
      ),
      duration: getDuration(
        data.sttStartTs,
        data.sttEndTs,
        isActive && !!data.sttStartTs && !data.sttEndTs,
        now,
      ),
    },
    agent: {
      style: getBarStyle(
        baseTime,
        totalDuration,
        data.agentStartTs,
        data.agentEndTs,
        isActive && !!data.agentStartTs && !data.agentEndTs,
        now,
      ),
      duration: getDuration(
        data.agentStartTs,
        data.agentEndTs,
        isActive && !!data.agentStartTs && !data.agentEndTs,
        now,
      ),
    },
    tts: {
      style: getBarStyle(
        baseTime,
        totalDuration,
        data.ttsStartTs,
        data.ttsEndTs,
        isActive && !!data.ttsStartTs && !data.ttsEndTs,
        now,
      ),
      duration: getDuration(
        data.ttsStartTs,
        data.ttsEndTs,
        isActive && !!data.ttsStartTs && !data.ttsEndTs,
        now,
      ),
    },
  };
}

function computeTotalLatency(
  data: TurnStateData,
  isActive: boolean,
  now: number,
): string {
  if (!data.turnStartTs) return "—";
  if (data.sttStartTs && data.ttsEndTs) {
    return formatDuration(data.ttsEndTs - data.sttStartTs);
  }
  if (isActive && data.sttStartTs) {
    return formatDuration(now - data.sttStartTs);
  }
  return "—";
}

const LatencyWaterfall = () => {
  const currentTurnState = useStore(currentTurn);
  const waterfall = useStore(waterfallData);
  const turns = useStore(latencyStats, (s) => s.turns);
  const total = useStore(latencyStats, (s) => s.total);
  const computedStats = useMemo(
    () => latencyStats.getState().computedStats(),
    [turns, total],
  );
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!currentTurnState.active) return;
    const id = setInterval(() => setNow(Date.now()), 100);
    return () => clearInterval(id);
  }, [currentTurnState.active]);

  const data = currentTurnState.active ? currentTurnState : waterfall;
  const isActive = currentTurnState.active;

  const bars = useMemo(
    () => computeBars(data, isActive, now),
    [data, isActive, now],
  );

  const totalLatencyDisplay = useMemo(
    () => computeTotalLatency(data, isActive, now),
    [data, isActive, now],
  );

  const rows = bars
    ? [
        {
          label: "STT",
          bar: bars.stt,
          gradient: "from-cyan-400 to-emerald-500",
        },
        {
          label: "Agent",
          bar: bars.agent,
          gradient: "from-purple-500 to-violet-600",
        },
        {
          label: "TTS",
          bar: bars.tts,
          gradient: "from-orange-500 to-orange-600",
        },
      ]
    : [];

  return (
    <div className="mt-5 pt-5 border-t border-gray-700">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-xs">⏱</span>
        <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">
          Latency Waterfall
        </span>
        <span className="ml-auto font-mono text-sm font-semibold text-cyan-400">
          {totalLatencyDisplay}
        </span>
      </div>

      <div className="mb-4">
        {bars ? (
          rows.map((row) => (
            <div key={row.label} className="flex items-center mb-2">
              <div className="w-12 flex-shrink-0 text-[10px] font-semibold uppercase tracking-wider text-gray-500">
                {row.label}
              </div>
              <div className="flex-1 h-5 bg-[#252530] rounded relative overflow-hidden">
                <div
                  className={`absolute h-full rounded bg-gradient-to-r ${row.gradient} min-w-0.5`}
                  style={{
                    left: row.bar.style.left,
                    width: row.bar.style.width,
                    opacity: row.bar.style.opacity,
                  }}
                />
              </div>
              <div className="w-14 flex-shrink-0 text-right font-mono text-[10px] text-gray-600 pl-2.5">
                {row.bar.duration}
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-4 text-gray-600 text-xs">
            Latency data will appear here
          </div>
        )}
      </div>

      <div className="flex justify-between gap-2 pt-3 border-t border-gray-700">
        <div className="flex flex-col items-center gap-1">
          <span className="text-[9px] font-semibold uppercase tracking-wider text-gray-600">
            Turns
          </span>
          <span className="font-mono text-sm text-gray-500">{turns}</span>
        </div>
        <div className="flex flex-col items-center gap-1">
          <span className="text-[9px] font-semibold uppercase tracking-wider text-gray-600">
            Avg Total
          </span>
          <span className="font-mono text-sm text-gray-500">
            {computedStats.avg !== null
              ? formatDuration(computedStats.avg)
              : "—"}
          </span>
        </div>
        <div className="flex flex-col items-center gap-1">
          <span className="text-[9px] font-semibold uppercase tracking-wider text-gray-600">
            Min
          </span>
          <span className="font-mono text-sm text-gray-500">
            {computedStats.min !== null
              ? formatDuration(computedStats.min)
              : "—"}
          </span>
        </div>
        <div className="flex flex-col items-center gap-1">
          <span className="text-[9px] font-semibold uppercase tracking-wider text-gray-600">
            Max
          </span>
          <span className="font-mono text-sm text-gray-500">
            {computedStats.max !== null
              ? formatDuration(computedStats.max)
              : "—"}
          </span>
        </div>
      </div>
    </div>
  );
};

export default LatencyWaterfall;
