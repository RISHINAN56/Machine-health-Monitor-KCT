import React from "react";
import { useTwin } from "../../context/TwinContext";
import {
  AlertTriangle,
  AlertOctagon,
  Info,
  Check,
  Bell,
  CheckCheck,
} from "lucide-react";

export const AlertTimeline: React.FC = () => {
  const { alerts, acknowledgeAlert } = useTwin();

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case "CRITICAL":
        return {
          color: "bg-red-500/20 text-cyber-crimson border-cyber-crimson/50",
          icon: AlertOctagon,
        };
      case "WARNING":
        return {
          color: "bg-amber-500/20 text-cyber-amber border-cyber-amber/50",
          icon: AlertTriangle,
        };
      default:
        return {
          color: "bg-cyan-500/20 text-cyan-300 border-cyan-500/40",
          icon: Info,
        };
    }
  };

  return (
    <div className="glass-panel rounded-2xl p-5 border border-industrial-700/60 shadow-panel flex flex-col justify-between">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-industrial-700/40">
        <div className="flex items-center gap-2">
          <Bell className="w-5 h-5 text-cyan-400" />
          <h2 className="font-hud text-sm tracking-wider text-cyan-300 uppercase font-bold">
            Real-Time Alert Stream & Timeline
          </h2>
        </div>
        <span className="text-xs font-mono text-slate-400">
          Total Logged: <b className="text-white">{alerts.length}</b>
        </span>
      </div>

      {/* Alert Feed */}
      <div className="my-3 space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
        {alerts.length === 0 ? (
          <div className="text-xs text-slate-500 font-mono text-center py-8">
            No active or historical alarm events. All sensor parameters within ISO bounds.
          </div>
        ) : (
          alerts.map((alert) => {
            const badge = getSeverityBadge(alert.severity);
            const Icon = badge.icon;
            const timeStr = new Date(alert.timestamp).toLocaleTimeString();

            return (
              <div
                key={alert.id}
                className={`p-3 rounded-xl border transition flex items-start justify-between gap-3 text-xs ${
                  alert.severity === "CRITICAL"
                    ? "bg-red-950/30 border-red-900/60"
                    : alert.severity === "WARNING"
                    ? "bg-amber-950/25 border-amber-900/50"
                    : "bg-industrial-950/60 border-industrial-800"
                }`}
              >
                <div className="flex items-start gap-2.5">
                  <div className={`p-1.5 rounded-lg border shrink-0 mt-0.5 ${badge.color}`}>
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-100 font-sans">
                        {alert.title}
                      </span>
                      <span
                        className={`text-[9px] font-hud uppercase px-1.5 py-0.2 rounded border font-bold ${badge.color}`}
                      >
                        {alert.severity}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {timeStr}
                      </span>
                    </div>
                    <p className="text-slate-300 font-mono text-[11px] mt-0.5">
                      {alert.message}
                    </p>
                    <span className="text-[10px] text-slate-500 font-mono block mt-0.5">
                      Metric: {alert.metric_name} = {alert.metric_value.toFixed(1)} (Limit: {alert.threshold_value})
                    </span>
                  </div>
                </div>

                <div className="shrink-0 flex items-center gap-1.5">
                  {alert.acknowledged ? (
                    <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1">
                      <CheckCheck className="w-3.5 h-3.5" /> ACK
                    </span>
                  ) : (
                    <button
                      onClick={() => acknowledgeAlert(alert.id)}
                      className="px-2.5 py-1 rounded-lg bg-industrial-800 hover:bg-industrial-700 text-cyan-300 border border-industrial-700 text-[10px] font-hud font-bold tracking-wider transition"
                    >
                      ACKNOWLEDGE
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
