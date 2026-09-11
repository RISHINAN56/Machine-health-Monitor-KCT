import React from "react";
import { useTwin } from "../../context/TwinContext";
import {
  Play,
  Pause,
  RotateCcw,
  FastForward,
  Clock,
  History,
  AlertTriangle,
  XCircle,
} from "lucide-react";

export const HistoricalPlayback: React.FC = () => {
  const {
    isPlaybackMode,
    startPlayback,
    stopPlayback,
    playbackIndex,
    playbackHistory,
    isPlaying,
    togglePlayPause,
    seekPlayback,
    playbackSpeed,
    setPlaybackSpeed,
    history,
  } = useTwin();

  if (!isPlaybackMode) {
    return (
      <div className="glass-panel px-4 py-2.5 rounded-xl border border-industrial-700/60 shadow-panel flex items-center justify-between">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-cyan-400" />
          <span className="text-xs font-hud text-slate-200 uppercase tracking-wider font-bold">
            Historical Playback &amp; Incident Analysis
          </span>
          <span className="text-[11px] text-slate-400 font-mono hidden sm:inline">
            ({history.length} frames buffered in ring memory)
          </span>
        </div>
        <button
          onClick={() => startPlayback()}
          disabled={history.length < 5}
          className="px-3 py-1 rounded-lg text-xs font-hud uppercase tracking-wider bg-cyan-500/20 text-cyan-300 border border-cyan-400/50 hover:bg-cyan-500 hover:text-industrial-950 transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 font-medium"
        >
          <History className="w-3.5 h-3.5" />
          <span>Launch Playback</span>
        </button>
      </div>
    );
  }

  const currentPacket = playbackHistory[playbackIndex];
  const maxFrames = Math.max(1, playbackHistory.length - 1);
  const progressPct = ((playbackIndex / maxFrames) * 100).toFixed(1);

  // Identify frames where an alert or warning scenario took place
  const eventIndices = playbackHistory
    .map((pkt, idx) => (pkt.scenario !== "normal" || pkt.overall_health_score < 75 ? idx : -1))
    .filter((idx) => idx !== -1);

  return (
    <div className="glass-panel p-4 rounded-2xl border border-cyan-500/70 bg-cyan-950/25 shadow-glow-cyan flex flex-col gap-3">
      {/* Playback Header */}
      <div className="flex items-center justify-between border-b border-cyan-500/30 pb-2.5">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
          <span className="text-xs font-hud uppercase font-bold text-amber-300 tracking-wider">
            Historical Playback Mode
          </span>
          <span className="text-xs font-mono text-slate-300 font-normal">
            | Frame {playbackIndex + 1} of {playbackHistory.length}
          </span>
          <span className="text-xs font-mono text-cyan-400 hidden md:inline font-normal">
            [{currentPacket?.timestamp ? new Date(currentPacket.timestamp).toLocaleTimeString() : "--:--:--"}]
          </span>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-industrial-900/90 rounded-lg p-0.5 border border-industrial-700">
            {[1, 2, 5].map((spd) => (
              <button
                key={spd}
                onClick={() => setPlaybackSpeed(spd)}
                className={`px-2 py-0.5 text-[10px] font-mono rounded font-medium ${playbackSpeed === spd
                    ? "bg-cyan-500 text-industrial-950"
                    : "text-slate-400 hover:text-white"
                  }`}
              >
                {spd}x
              </button>
            ))}
          </div>

          <button
            onClick={stopPlayback}
            className="px-2.5 py-1 text-xs font-hud uppercase rounded-lg bg-red-900/50 text-red-300 border border-red-500/40 hover:bg-red-800 transition flex items-center gap-1 font-medium"
          >
            <XCircle className="w-3.5 h-3.5" />
            <span>Return to Live</span>
          </button>
        </div>
      </div>

      {/* Scrubber Slider Bar with Event Markers */}
      <div className="relative w-full pt-1 pb-2">
        {/* Event Markers Overlay */}
        <div className="absolute top-2.5 left-0 right-0 h-2 pointer-events-none z-10">
          {eventIndices.map((idx) => {
            const leftPct = (idx / maxFrames) * 100;
            return (
              <div
                key={idx}
                className="absolute top-0 w-1.5 h-2.5 bg-red-500 rounded-sm shadow-glow-red -translate-x-1/2"
                style={{ left: `${leftPct}%` }}
                title={`Alarm Event at frame ${idx}`}
              />
            );
          })}
        </div>

        <input
          type="range"
          min={0}
          max={maxFrames}
          value={playbackIndex}
          onChange={(e) => seekPlayback(parseInt(e.target.value, 10))}
          className="w-full accent-cyan-400 h-2 bg-industrial-950 rounded-lg cursor-pointer appearance-none"
        />

        <div className="flex justify-between text-[10px] font-mono text-slate-400 mt-1">
          <span>00:00 (Start)</span>
          <span className="text-cyan-300 font-bold">{progressPct}% Replayed</span>
          <span>Buffer Tail (Live Edge)</span>
        </div>
      </div>

      {/* Control Action Buttons */}
      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-2">
          <button
            onClick={() => seekPlayback(0)}
            className="p-1.5 rounded-lg bg-industrial-900 hover:bg-industrial-800 text-slate-300 border border-industrial-700 transition"
            title="Rewind to beginning"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={togglePlayPause}
            className="px-3.5 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-industrial-950 font-hud font-medium text-xs uppercase flex items-center gap-1.5 transition shadow-glow-cyan"
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span>{isPlaying ? "Pause" : "Play"}</span>
          </button>

          <button
            onClick={() => seekPlayback(Math.min(maxFrames, playbackIndex + 10))}
            className="p-1.5 rounded-lg bg-industrial-900 hover:bg-industrial-800 text-slate-300 border border-industrial-700 transition"
            title="Skip forward 10 frames"
          >
            <FastForward className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Snapshot Summary Info */}
        <div className="text-xs font-mono text-slate-300 flex items-center gap-3">
          <span>RPM: <strong className="text-cyan-400 font-bold">{currentPacket?.sensors?.rpm?.toFixed(0) ?? 0}</strong></span>
          <span>Temp: <strong className="text-slate-100 font-bold">{currentPacket?.sensors?.temperature?.toFixed(1) ?? 0}°C</strong></span>
          <span>Health: <strong className={`font-extrabold ${currentPacket?.overall_health_score && currentPacket.overall_health_score < 75 ? "text-amber-400" : "text-emerald-400"}`}>
            {currentPacket?.overall_health_score?.toFixed(0) ?? 100}%
          </strong></span>
        </div>
      </div>
    </div>
  );
};
