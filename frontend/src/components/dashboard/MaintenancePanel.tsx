import React, { useState } from "react";
import { useTwin } from "../../context/TwinContext";
import {
  Wrench,
  CheckCircle2,
  Clock,
  AlertOctagon,
  PlusCircle,
  FileText,
  UserCheck,
} from "lucide-react";
import { WorkOrderStatus } from "../../types";

export const MaintenancePanel: React.FC = () => {
  const { telemetry, workOrders, createWorkOrder, updateWorkOrderStatus } = useTwin();
  const [isCreating, setIsCreating] = useState(false);

  const pred = telemetry?.ai_prediction;
  const isCritical = telemetry?.overall_status === "Critical";
  const isWarning = telemetry?.overall_status === "Warning";

  // Derive suggested action safely
  const vib = telemetry?.sensors?.vibration ?? 0;
  const temp = telemetry?.sensors?.temperature ?? 0;
  const load = telemetry?.sensors?.motor_load ?? 0;

  const suggestedAction =
    vib >= 750
      ? "Replace Spindle Bearings & Re-align Drive Shaft"
      : temp >= 55
        ? "Motor Stator Service & Clean Cooling Ducts"
        : load >= 850
          ? "Inspect Shedding Mechanism & Lubricate Sley Sword"
          : isWarning
            ? "Lubricate Bearings & Tension Drive Belt"
            : "Routine 500-Hour Preventive Maintenance";

  const targetComponent =
    vib >= 450
      ? "bearings"
      : temp >= 45
        ? "main_motor"
        : load >= 650
          ? "loom_section"
          : "drive_shaft";

  const priority = isCritical ? "EMERGENCY" : isWarning ? "HIGH" : "MEDIUM";

  const handleDispatchAction = async () => {
    setIsCreating(true);
    await createWorkOrder(targetComponent, suggestedAction, priority);
    setIsCreating(false);
  };

  return (
    <div className="glass-panel rounded-2xl p-5 border border-industrial-700/60 shadow-panel flex flex-col justify-between">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-industrial-700/40">
        <div className="flex items-center gap-2">
          <Wrench className="w-5 h-5 text-amber-400" />
          <h2 className="font-hud text-sm tracking-wider text-amber-300 uppercase font-bold">
            Maintenance Recommendations
          </h2>
        </div>
        <span className="text-xs font-mono text-slate-400">
          Open Orders: <b className="text-cyan-300">{workOrders.length}</b>
        </span>
      </div>

      {/* Active AI Recommendation Banner */}
      <div
        className={`p-4 rounded-xl border my-3.5 ${isCritical
            ? "bg-red-950/40 border-cyber-crimson/50 shadow-glow-crimson"
            : isWarning
              ? "bg-amber-950/40 border-cyber-amber/50 shadow-glow-amber"
              : "bg-emerald-950/30 border-cyber-emerald/40"
          }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span
                className={`text-[10px] font-hud uppercase px-2 py-0.5 rounded font-bold ${isCritical
                    ? "bg-red-500 text-white animate-pulse"
                    : isWarning
                      ? "bg-amber-500 text-industrial-950"
                      : "bg-emerald-600 text-white"
                  }`}
              >
                {priority} RECOMMENDATION
              </span>
              <span className="text-xs font-mono text-slate-300">
                Target: <b>{targetComponent.toUpperCase()}</b>
              </span>
            </div>
            <h3 className="text-base font-semibold text-slate-100 font-sans">
              {suggestedAction}
            </h3>
            <p className="text-xs text-slate-300 mt-1 font-mono font-normal">
              Action Window:{" "}
              <b className="text-cyan-300 font-semibold">
                {isCritical ? "Within 4 Hours" : isWarning ? "Within 24 Hours" : "Next Scheduled Shift"}
              </b>
            </p>
          </div>

          <button
            onClick={handleDispatchAction}
            disabled={isCreating}
            className={`px-4 py-2.5 rounded-xl font-hud text-xs tracking-wider font-medium transition flex items-center gap-2 whitespace-nowrap ${isCritical
                ? "bg-cyber-crimson hover:bg-red-600 text-white shadow-glow-crimson"
                : "bg-cyan-500 hover:bg-cyan-400 text-industrial-950 shadow-glow-cyan"
              }`}
          >
            <PlusCircle className="w-4 h-4" />
            {isCreating ? "DISPATCHING..." : "DISPATCH WORK ORDER"}
          </button>
        </div>
      </div>

      {/* Work Orders List */}
      <div>
        <div className="text-xs font-hud text-slate-400 uppercase tracking-wider mb-2 flex items-center justify-between">
          <span>Active Work Orders</span>
          <span className="font-mono text-[11px] text-slate-500">Auto-logged</span>
        </div>

        <div className="space-y-2 max-h-[140px] overflow-y-auto pr-1">
          {workOrders.length === 0 ? (
            <div className="text-xs text-slate-500 font-mono text-center py-3">
              No pending maintenance work orders. All systems nominal.
            </div>
          ) : (
            workOrders.map((order) => (
              <div
                key={order.id}
                className="p-2.5 rounded-xl bg-industrial-950/60 border border-industrial-800 flex items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-cyan-400 shrink-0" />
                  <div>
                    <span className="font-mono font-bold text-slate-200">
                      {order.id}: {order.task_description}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono block">
                      Component: {order.component} | Crew: {order.assigned_technician}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span
                    className={`text-[10px] font-hud uppercase px-2 py-0.5 rounded font-bold ${order.status === "COMPLETED"
                        ? "bg-emerald-950 text-emerald-300 border border-emerald-800"
                        : "bg-amber-950 text-amber-300 border border-amber-800"
                      }`}
                  >
                    {order.status}
                  </span>

                  {order.status !== "COMPLETED" && (
                    <button
                      onClick={() => updateWorkOrderStatus(order.id, "COMPLETED")}
                      className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500 hover:text-industrial-950 transition"
                      title="Mark as Completed"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
