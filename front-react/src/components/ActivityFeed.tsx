import { activities } from "../stores/activityStore";
import { formatTime } from "../formatting-utils";
import { useStore } from "zustand";
const ActivityFeed = () => {
  const activitiesStore = useStore(activities);
  const iconMap: Record<string, string> = {
    stt: "🎤",
    agent: "🤖",
    tts: "🔊",
    tool: "🔧",
  };

  const colorMap: Record<string, { bg: string; label: string }> = {
    stt: { bg: "bg-cyan-400/10", label: "text-cyan-400" },
    agent: { bg: "bg-purple-500/10", label: "text-purple-500" },
    tts: { bg: "bg-orange-500/10", label: "text-orange-500" },
    tool: { bg: "bg-blue-500/10", label: "text-blue-500" },
  };

  return (
    <>
      <div className="bg-white rounded-2xl p-6 border border-gray-200 h-full">
        <div className="flex items-center justify-between mb-4">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">
            Activity
          </span>
          <button
            onClick={() => activitiesStore.clear()}
            className="text-[11px] text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
          >
            Clear
          </button>
        </div>

        <div className="max-h-80 overflow-y-auto flex flex-col gap-2.5">
          {activitiesStore.activities.length === 0 && (
            <div className="text-gray-400 text-sm py-5 text-center">
              No activity yet...
            </div>
          )}
          {activitiesStore.activities.length > 0 &&
            activitiesStore.activities.map((item) => (
              <div
                key={item.id}
                className="flex items-start gap-3 p-3 bg-gray-100 rounded-xl animate-slideIn"
              >
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm flex-shrink-0 ${colorMap[item.type]?.bg ?? ""}`}
                >
                  {iconMap[item.type] || "📋"}
                </div>
                <div className="flex-1 min-w-0">
                  <div
                    className={`text-[10px] font-semibold uppercase tracking-wider mb-0.5 ${colorMap[item.type]?.label ?? ""}`}
                  >
                    {item.label}
                  </div>
                  <div className="text-sm text-gray-900 leading-relaxed break-words">
                    {item.text}
                  </div>
                  {item.args && (
                    <pre className="mt-2 p-2 bg-black/5 rounded-md font-mono text-[11px] text-gray-600 overflow-x-auto whitespace-pre-wrap">
                      {JSON.stringify(item.args, null, 2)}
                    </pre>
                  )}
                  <div className="mt-1">
                    <span className="font-mono text-[10px] text-gray-400">
                      {formatTime(item.timestamp)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
        </div>
      </div>
      {/* <style>
              @keyframes slideIn {from} {opacity}: 0;
              transform: translateY(-8px);
              }
              to {opacity}: 1;
              transform: translateY(0);
              }
              }

              .animate-slideIn {animation}: slideIn 0.3s ease-out;
              }
          </style> */}
    </>
  );
};

export default ActivityFeed;
