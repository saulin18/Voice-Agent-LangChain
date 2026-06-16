
import { session } from "../stores/sessionStore";
import { useStore } from "zustand";
const Header = () => {
  const store = useStore(session);
  const formattedTime = store.formattedTime;
  return (
    <header className="flex items-center justify-between mb-7">
      <div className="flex items-center gap-3">
        <span className="text-3xl">🥪</span>
        <h1 className="text-2xl font-semibold tracking-tight text-gray-900 dark:text-gray-100 m-0">
          Voice Sandwich
        </h1>
      </div>
      <div className="flex items-center gap-2 font-mono text-sm text-gray-400">
        <span>{formattedTime()}</span>
        <span
          className={`w-2 h-2 rounded-full transition-all duration-300 ${
            store.connected
              ? "bg-green-500 shadow-[0_0_6px_theme(colors.green.500)]"
              : "bg-gray-400"
          }`}
        ></span>
      </div>
    </header>
  );
};

export default Header;
