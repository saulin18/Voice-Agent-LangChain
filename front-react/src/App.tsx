import { useMemo } from "react";
import "./App.css";
import ActivityFeed from "./components/ActivityFeed";
import Console from "./components/Console";
import PipelineCard from "./components/PipelineCard";
import { createVoiceSession } from "./websocket";
import Header from "./components/Header";
import Controls from "./components/Controls";

function App() {
  const voiceSession = useMemo(() => createVoiceSession(), []);

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-6 box-border">
      <Header />

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-5 mb-5">
        <Controls
          onStart={() => void voiceSession.start()}
          onStop={() => voiceSession.stop()}
        />
        <PipelineCard />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <ActivityFeed />
        <Console />
      </div>
    </div>
  );
}

export default App;
