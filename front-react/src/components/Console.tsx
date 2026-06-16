import { formatTime } from "../formatting-utils";
import { logs } from "../stores/activityStore";
import { useStore } from "zustand";

const Console = () => {
  const logsStore = useStore(logs);
  return (
    <>
      <div className="bg-white rounded-2xl p-6 border border-gray-200 h-full">
        <div className="flex items-center justify-between mb-4">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">
            Console
          </span>
        </div>

        <div className="max-h-44 overflow-y-auto font-mono text-[11px] text-gray-600 leading-relaxed">
          {logsStore.logs.length === 0 && (
            <div className="text-gray-400">Logs will appear here...</div>
          )}
          {logsStore.logs.length > 0 &&
            logsStore.logs.map((entry) => (
              <div
                key={entry.id}
                className="py-0.5 border-b border-gray-100 last:border-b-0"
              >
                <span className="text-gray-400 mr-2">
                  {formatTime(entry.timestamp)}
                </span>
                {entry.message}
              </div>
            ))}
        </div>
      </div>
    </>
  );
};

export default Console;
