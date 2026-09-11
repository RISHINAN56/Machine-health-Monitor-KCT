import React, { useEffect, useState } from "react";
import { useTwin } from "../../context/TwinContext";
import { AlertTriangle, AlertOctagon, Info, X } from "lucide-react";
import { AlertEvent } from "../../types";

export const ToastContainer: React.FC = () => {
  const { alerts, acknowledgeAlert } = useTwin();
  const [activeToasts, setActiveToasts] = useState<AlertEvent[]>([]);

  // When a new unacknowledged critical or warning alert arrives, display toast
  useEffect(() => {
    if (alerts.length > 0) {
      const latest = alerts[0];
      if (!latest.acknowledged && !latest.resolved) {
        setActiveToasts((prev) => {
          if (prev.some((t) => t.id === latest.id)) return prev;
          return [latest, ...prev.slice(0, 2)];
        });
      }
    }
  }, [alerts]);

  const dismissToast = (id: string) => {
    setActiveToasts((prev) => prev.filter((t) => t.id !== id));
  };

  if (activeToasts.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none">
      {activeToasts.map((toast) => {
        const isCrit = toast.severity === "CRITICAL";
        const Icon = isCrit ? AlertOctagon : AlertTriangle;

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto p-3.5 rounded-2xl border backdrop-blur-lg shadow-2xl flex items-start justify-between gap-3 transition-all duration-300 animate-slide-in ${isCrit
                ? "bg-industrial-950/95 border-cyber-crimson text-white shadow-glow-crimson"
                : "bg-industrial-950/95 border-cyber-amber text-slate-100 shadow-glow-amber"
              }`}
          >
            <div className="flex items-start gap-2.5">
              <div
                className={`p-1.5 rounded-xl mt-0.5 ${isCrit ? "bg-red-500/20 text-red-400" : "bg-amber-500/20 text-amber-400"
                  }`}
              >
                <Icon className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-hud font-bold text-xs uppercase tracking-wide">
                    {toast.severity} ALERT
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">
                    {new Date(toast.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                <h4 className="font-sans font-semibold text-xs mt-0.5">{toast.title}</h4>
                <p className="text-[11px] text-slate-300 font-mono mt-0.5 line-clamp-2 font-normal">
                  {toast.message}
                </p>
                <button
                  onClick={() => {
                    acknowledgeAlert(toast.id);
                    dismissToast(toast.id);
                  }}
                  className="mt-2 text-[10px] font-hud font-medium px-2.5 py-1 rounded bg-industrial-800 hover:bg-industrial-700 text-cyan-300 border border-industrial-700 transition"
                >
                  ACKNOWLEDGE
                </button>
              </div>
            </div>

            <button
              onClick={() => dismissToast(toast.id)}
              className="text-slate-400 hover:text-white transition p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
