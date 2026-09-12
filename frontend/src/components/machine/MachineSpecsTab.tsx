import React from "react";
import { RealWorldMachine } from "../../types";
import {
  Calendar,
  Clock,
  Gauge,
  Layers,
  Zap,
  ShieldCheck,
  Wrench,
  Sparkles,
  Cpu,
} from "lucide-react";

export interface MachineSpecsTabProps {
  machine: RealWorldMachine;
}

export const MachineSpecsTab: React.FC<MachineSpecsTabProps> = ({ machine }) => {
  return (
    <div className="glass-panel rounded-2xl p-4 border border-industrial-700/60 shadow-panel space-y-2.5 text-xs font-mono">
      <div className="flex items-center gap-1.5 pb-2 border-b border-industrial-700/40">
        <Cpu className="w-4 h-4 text-[#00E5FF]" />
        <h3 className="font-hud text-xs font-bold text-slate-200 uppercase tracking-wider">
          Machine Specifications
        </h3>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between items-center py-1 border-b border-slate-800/50">
          <span className="text-slate-400 flex items-center gap-1.5">
            <Sparkles className="w-3 h-3 text-[#00E5FF]" />
            <span>Manufacturer</span>
          </span>
          <span className="text-white font-semibold">{machine.manufacturer}</span>
        </div>

        <div className="flex justify-between items-center py-1 border-b border-slate-800/50">
          <span className="text-slate-400 flex items-center gap-1.5">
            <Calendar className="w-3 h-3 text-slate-400" />
            <span>Installation Date</span>
          </span>
          <span className="text-slate-200">{machine.installationDate}</span>
        </div>

        <div className="flex justify-between items-center py-1 border-b border-slate-800/50">
          <span className="text-slate-400 flex items-center gap-1.5">
            <Clock className="w-3 h-3 text-slate-400" />
            <span>Operating Hours</span>
          </span>
          <span className="text-[#00E5FF] font-semibold">
            {machine.operatingHours.toLocaleString()} hrs
          </span>
        </div>

        <div className="flex justify-between items-center py-1 border-b border-slate-800/50">
          <span className="text-slate-400 flex items-center gap-1.5">
            <Gauge className="w-3 h-3 text-slate-400" />
            <span>Current Production</span>
          </span>
          <span className="text-[#00FFC8] font-semibold">{machine.currentProduction}</span>
        </div>

        <div className="flex justify-between items-center py-1 border-b border-slate-800/50">
          <span className="text-slate-400 flex items-center gap-1.5">
            <Layers className="w-3 h-3 text-slate-400" />
            <span>Fabric Type</span>
          </span>
          <span className="text-slate-200 text-right">{machine.fabricType}</span>
        </div>

        <div className="flex justify-between items-center py-1 border-b border-slate-800/50">
          <span className="text-slate-400 flex items-center gap-1.5">
            <Zap className="w-3 h-3 text-slate-400" />
            <span>Power Consumption</span>
          </span>
          <span className="text-amber-300 font-semibold">{machine.powerConsumptionKw} kW</span>
        </div>

        <div className="flex justify-between items-center py-1 border-b border-slate-800/50">
          <span className="text-slate-400 flex items-center gap-1.5">
            <ShieldCheck className="w-3 h-3 text-slate-400" />
            <span>Efficiency Rating</span>
          </span>
          <span className="text-[#00E5FF] font-semibold">{machine.efficiency}% OEE</span>
        </div>

        <div className="flex flex-col gap-1 py-1">
          <span className="text-slate-400 flex items-center gap-1.5">
            <Wrench className="w-3 h-3 text-[#FFB000]" />
            <span>Maintenance Schedule</span>
          </span>
          <span
            className={`text-[11px] p-2 rounded-lg border ${
              machine.status === "Warning"
                ? "bg-amber-950/40 text-[#FFB000] border-amber-500/40 font-semibold"
                : "bg-slate-900/60 text-slate-200 border-slate-800"
            }`}
          >
            {machine.maintenanceSchedule}
          </span>
        </div>
      </div>
    </div>
  );
};
