import React, { useState } from "react";
import { useTwin } from "../../context/TwinContext";
import {
  Bot,
  Send,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  X,
  Cpu,
  HelpCircle,
  Wrench,
  Activity,
} from "lucide-react";

export const AiAssistantPanel: React.FC = () => {
  const {
    isAssistantOpen,
    setIsAssistantOpen,
    assistantMessages,
    askAssistant,
    activeMachineId,
  } = useTwin();

  const [inputQuery, setInputQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const quickPrompts = [
    "Analyze current vibration and thermal telemetry",
    "What is the remaining useful life (RUL) of the spindle bearings?",
    "Explain the root cause of the current operating alert",
    "Provide maintenance SOP for belt tension adjustment",
  ];

  const handleSend = async (queryText?: string) => {
    const textToSend = queryText || inputQuery;
    if (!textToSend.trim() || isLoading) return;

    setInputQuery("");
    setIsLoading(true);
    try {
      await askAssistant(textToSend);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isAssistantOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-industrial-950/95 border-l border-cyan-500/40 shadow-2xl backdrop-blur-xl flex flex-col justify-between">
      {/* Drawer Header */}
      <div className="p-4 border-b border-industrial-800 flex items-center justify-between bg-industrial-900/60">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 shadow-glow-cyan">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-hud text-sm font-semibold text-slate-100 uppercase tracking-wider flex items-center gap-1.5">
              <span>MHM Assistant</span>
              <span className="text-[10px] text-emerald-400 font-mono font-normal px-1.5 py-0.2 rounded bg-emerald-950 border border-emerald-500/30">
                LIVE
              </span>
            </h3>
            <p className="text-[11px] text-slate-400 font-mono mt-0.5">
              Grounded on Machine: <strong className="text-cyan-300">{activeMachineId}</strong> Telemetry
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsAssistantOpen(false)}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-industrial-800 transition"
          title="Close MHM Assistant"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Message Chat Flow */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 font-mono text-xs">
        {assistantMessages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col ${msg.sender === "user" ? "items-end" : "items-start"
              }`}
          >
            <div
              className={`max-w-[88%] p-3.5 rounded-2xl ${msg.sender === "user"
                  ? "bg-cyan-600 text-slate-950 font-bold shadow-md rounded-br-none"
                  : "bg-industrial-900 border border-industrial-700/80 text-slate-200 rounded-bl-none shadow-panel space-y-2.5"
                }`}
            >
              {msg.sender === "ai" && (
                <div className="flex items-center justify-between text-[10px] text-cyan-400 font-hud uppercase pb-1.5 border-b border-industrial-800">
                  <span className="flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-cyan-400" />
                    MHM Diagnostic Engine
                  </span>
                  {msg.confidence !== undefined && (
                    <span>Confidence: {(msg.confidence * 100).toFixed(0)}%</span>
                  )}
                </div>
              )}

              <p className="whitespace-pre-line leading-relaxed">{msg.text}</p>

              {/* Grounded Diagnostic Meta Badges */}
              {msg.root_cause && (
                <div className="p-2.5 rounded-xl bg-industrial-950/80 border border-industrial-800 text-[11px] space-y-1 mt-2">
                  <div className="text-amber-400 font-bold uppercase text-[10px] flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    <span>Root Cause:</span>
                  </div>
                  <div className="text-slate-300">{msg.root_cause}</div>
                </div>
              )}

              {msg.recommended_action && (
                <div className="p-2.5 rounded-xl bg-cyan-950/40 border border-cyan-500/30 text-[11px] space-y-1">
                  <div className="text-cyan-300 font-bold uppercase text-[10px] flex items-center gap-1">
                    <Wrench className="w-3 h-3" />
                    <span>Recommended Action / SOP:</span>
                  </div>
                  <div className="text-slate-300">{msg.recommended_action}</div>
                </div>
              )}

              <div className="text-[9px] text-slate-500 text-right">{msg.timestamp}</div>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex items-center gap-2 text-cyan-400 text-xs font-mono p-3 rounded-xl bg-industrial-900/60 border border-industrial-800 animate-pulse">
            <Bot className="w-4 h-4 animate-spin" />
            <span>Analyzing real-time sensor signatures...</span>
          </div>
        )}
      </div>

      {/* Quick Inquiries & Input Bar */}
      <div className="p-4 border-t border-industrial-800 bg-industrial-900/80 space-y-3">
        {/* Quick Question Chips */}
        <div className="flex flex-wrap gap-1.5">
          {quickPrompts.map((prompt, i) => (
            <button
              key={i}
              onClick={() => handleSend(prompt)}
              className="text-[10px] font-mono font-medium px-2.5 py-1 rounded-lg bg-industrial-950 border border-industrial-700 text-slate-300 hover:text-cyan-300 hover:border-cyan-400/50 transition truncate max-w-full"
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* Query Input Field */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            placeholder="Ask MHM Assistant about telemetry, RUL, or diagnostics..."
            className="flex-1 bg-industrial-950 border border-industrial-700 rounded-xl px-3.5 py-2 text-xs font-mono text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-400 transition"
          />
          <button
            type="submit"
            disabled={!inputQuery.trim() || isLoading}
            className="p-2 rounded-xl bg-cyan-500 text-industrial-950 font-medium hover:bg-cyan-400 transition disabled:opacity-40 disabled:cursor-not-allowed shadow-glow-cyan"
            title="Submit question"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
