
import { useStore } from "zustand";
import { currentTurn } from "../stores/pipelineStore";
import { formatDuration } from "../formatting-utils";

interface StageState {
  active: boolean;
  complete: boolean;
  time: string;
}

const Pipeline = () => {
  function stageClasses(
    state: StageState,
    color: "cyan" | "purple" | "orange",
  ): string {
    const colorMap = {
      cyan: {
        border: "border-cyan-400",
        active: "bg-cyan-400/15 shadow-[0_0_16px_theme(colors.cyan.400/30)]",
      },
      purple: {
        border: "border-purple-500",
        active:
          "bg-purple-500/15 shadow-[0_0_16px_theme(colors.purple.500/30)]",
      },
      orange: {
        border: "border-orange-500",
        active:
          "bg-orange-500/15 shadow-[0_0_16px_theme(colors.orange.500/30)]",
      },
    };

    const c = colorMap[color];
    let classes = `w-13 h-13 rounded-xl flex items-center justify-center text-2xl
                       bg-[#252530] border-2 ${c.border} transition-all duration-300`;

    if (state.active) {
      classes += ` ${c.active} scale-105 animate-pulse`;
    } else if (state.complete) {
      classes += " opacity-70";
    }

    return classes;
  }
  const currentTurnState = useStore(currentTurn);

  let stt = {
    active: !!currentTurnState.sttStartTs && !currentTurnState.sttEndTs,
    complete: !!currentTurnState.sttEndTs,
    time:
      currentTurnState.sttEndTs && currentTurnState.sttStartTs
        ? formatDuration(
            currentTurnState.sttEndTs - currentTurnState.sttStartTs,
          )
        : currentTurnState.sttStartTs
          ? "..."
          : "—",
  };

  let agent = {
    active: !!currentTurnState.agentStartTs && !currentTurnState.agentEndTs,
    complete: !!currentTurnState.agentEndTs,
    time:
      currentTurnState.agentEndTs && currentTurnState.agentStartTs
        ? formatDuration(
            currentTurnState.agentEndTs - currentTurnState.agentStartTs,
          )
        : currentTurnState.agentStartTs
          ? "..."
          : "—",
  };

  let tts = {
    active: !!currentTurnState.ttsStartTs && !currentTurnState.ttsEndTs,
    complete: !!currentTurnState.ttsEndTs,
    time:
      currentTurnState.ttsEndTs && currentTurnState.ttsStartTs
        ? formatDuration(
            currentTurnState.ttsEndTs - currentTurnState.ttsStartTs,
          )
        : currentTurnState.ttsStartTs
          ? "..."
          : "—",
  };

  return (
    <>
      <div className="flex items-center justify-center gap-4 py-4">
        <div className="flex flex-col items-center gap-2.5">
          <div className={stageClasses(stt, "cyan")}>🎤</div>
          <div className="text-[11px] font-medium uppercase tracking-wider text-gray-500">
            STT
          </div>
          <div className="font-mono text-xs text-gray-600">{stt.time}</div>
        </div>

        <div className="text-gray-600 text-lg -mt-6">→</div>

        <div className="flex flex-col items-center gap-2.5">
          <div className={stageClasses(agent, "purple")}>🤖</div>
          <div className="text-[11px] font-medium uppercase tracking-wider text-gray-500">
            Agent
          </div>
          <div className="font-mono text-xs text-gray-600">{agent.time}</div>
        </div>

        <div className="text-gray-600 text-lg -mt-6">→</div>

        <div className="flex flex-col items-center gap-2.5">
          <div className={stageClasses(tts, "orange")}>🔊</div>
          <div className="text-[11px] font-medium uppercase tracking-wider text-gray-500">
            TTS
          </div>
          <div className="font-mono text-xs text-gray-600">{tts.time}</div>
        </div>
      </div>
    </>
  );
};

export default Pipeline;
