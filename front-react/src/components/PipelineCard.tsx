
import { currentTurn } from "../stores/pipelineStore";
import Pipeline from "./Pipeline";
import LatencyWaterfall from "./LatencyWaterfall";
import { useStore } from "zustand";
const PipelineCard = () => {
  const currentTurnState = useStore(currentTurn);
  return (
    <div
      className={`bg-[#1a1a20] text-gray-100 rounded-2xl p-6 h-full transition-opacity duration-300 ${currentTurnState.active ? "" : "opacity-50"}`}
    >
      <div className="flex items-center justify-between mb-4">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">
          Pipeline
        </span>
        <span
          className={`font-mono text-[11px] py-1 px-2 rounded ${currentTurnState.active ? "text-cyan-400 bg-cyan-400/15" : "text-gray-600 bg-[#252530]"}`}
        >
          {currentTurnState.active ? "Turn Active" : "Waiting..."}
        </span>
      </div>

      <Pipeline />
      <LatencyWaterfall />
    </div>
  );
};

export default PipelineCard;
