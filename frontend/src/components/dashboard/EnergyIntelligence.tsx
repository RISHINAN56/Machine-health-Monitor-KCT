import React from "react";
import { useTwin } from "../../context/TwinContext";
import {
  Zap,
  TrendingDown,
  DollarSign,
  AlertTriangle,
  Flame,
  Clock,
  Gauge,
  Leaf,
  CheckCircle2,
} from "lucide-react";

export const EnergyIntelligence: React.FC = () => {
  const { energy, displayTelemetry } = useTwin();

  const powerKw = energy?.power_kw ?? 7.8;
  const kva = energy?.apparent_power_kva ?? 8.9;
  const powerFactor = energy?.power_factor ?? 0.88;
  const todayKwh = energy?.energy_today_kwh ?? 142.5;
  const weeklyKwh = energy?.energy_weekly_kwh ?? 890.0;
  const monthlyKwh = energy?.energy_monthly_kwh ?? 3840.0;
  const powerLoss = energy?.power_loss_kw ?? 1.15;
  const efficiency = energy?.energy_efficiency_pct ?? 85.3;
  const costPerHour = energy?.cost_per_hour_usd ?? 1.09;
  const costToday = energy?.cost_today_usd ?? 19.95;
  const costMonthly = energy?.cost_monthly_estimate_usd ?? 537.6;
  const savingsOpp = energy?.cost_savings_opportunity_usd ?? 2.85;
  const wasteActive = energy?.waste_detection_active ?? false;
  const wasteReason = energy?.waste_reason;

  const rpm = displayTelemetry?.sensors?.rpm ?? 650;
  const motorLoad = displayTelemetry?.sensors?.motor_load ?? 16.5;

  return (
    <div className="space-y-6">
      {/* Top Banner Alert if Energy Waste Detected */}
      {wasteActive && (
        <div className="glass-panel p-4 rounded-2xl border border-amber-500/80 bg-amber-950/40 shadow-glow-amber flex items-center justify-between animate-pulse">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/40">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-hud text-sm font-semibold text-amber-200 uppercase tracking-wide">
                Energy Waste Anomaly Detected
              </h4>
              <p className="text-xs text-amber-300/80 font-mono mt-0.5">
                {wasteReason || "Excessive friction causing parasitic power loss."}
              </p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-[10px] uppercase font-hud text-slate-400 block">
              Recoverable Cost
            </span>
            <span className="text-base font-bold font-mono text-amber-300">
              +${savingsOpp.toFixed(2)}/day
            </span>
          </div>
        </div>
      )}

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Active Power kW */}
        <div className="glass-panel p-4 rounded-2xl border border-industrial-700/60 shadow-panel">
          <div className="flex items-center justify-between text-slate-400 text-xs font-hud uppercase">
            <span>Active Power Draw</span>
            <Zap className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-cyan-300">
              {powerKw.toFixed(2)}
            </span>
            <span className="text-xs font-mono text-slate-400">kW</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] font-mono text-slate-400 pt-2 border-t border-industrial-800">
            <span>Apparent: {kva.toFixed(1)} kVA</span>
            <span>cos φ: {powerFactor.toFixed(2)}</span>
          </div>
        </div>

        {/* Card 2: Parasitic Power Loss kW */}
        <div className="glass-panel p-4 rounded-2xl border border-industrial-700/60 shadow-panel">
          <div className="flex items-center justify-between text-slate-400 text-xs font-hud uppercase">
            <span>Parasitic Loss</span>
            <Flame className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className={`text-2xl font-bold font-mono ${powerLoss > 2.0 ? "text-red-400" : "text-amber-300"
              }`}>
              {powerLoss.toFixed(2)}
            </span>
            <span className="text-xs font-mono text-slate-400">kW</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] font-mono text-slate-400 pt-2 border-t border-industrial-800">
            <span>Friction &amp; Heat Dissipation</span>
            <span className="text-amber-400 font-semibold">{((powerLoss / (powerKw || 1)) * 100).toFixed(0)}%</span>
          </div>
        </div>

        {/* Card 3: Energy Efficiency */}
        <div className="glass-panel p-4 rounded-2xl border border-industrial-700/60 shadow-panel">
          <div className="flex items-center justify-between text-slate-400 text-xs font-hud uppercase">
            <span>System Efficiency</span>
            <Gauge className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className={`text-2xl font-bold font-mono ${efficiency >= 85 ? "text-emerald-400" : efficiency >= 75 ? "text-amber-400" : "text-red-400"
              }`}>
              {efficiency.toFixed(1)}%
            </span>
            <span className="text-xs font-mono text-slate-400">IEC 60034-30</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] font-mono text-slate-400 pt-2 border-t border-industrial-800">
            <span>IE3 Premium Class</span>
            <span className="text-emerald-400 flex items-center gap-0.5">
              <CheckCircle2 className="w-3 h-3" /> Optimal
            </span>
          </div>
        </div>

        {/* Card 4: Operating Cost */}
        <div className="glass-panel p-4 rounded-2xl border border-industrial-700/60 shadow-panel">
          <div className="flex items-center justify-between text-slate-400 text-xs font-hud uppercase">
            <span>Hourly / Daily Cost</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-emerald-300">
              ${costPerHour.toFixed(2)}
            </span>
            <span className="text-xs font-mono text-slate-400">/hr</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] font-mono text-slate-400 pt-2 border-t border-industrial-800">
            <span>Today: ${costToday.toFixed(2)}</span>
            <span>Est. Mo: ${costMonthly.toFixed(0)}</span>
          </div>
        </div>
      </div>

      {/* Main Energy Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Aggregated Energy Usage Profiles */}
        <div className="lg:col-span-7 glass-panel p-5 rounded-2xl border border-industrial-700/60 shadow-panel flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-industrial-700/40">
              <div>
                <h3 className="font-hud text-sm font-semibold text-slate-100 uppercase tracking-wider flex items-center gap-2">
                  <Leaf className="w-4 h-4 text-emerald-400" />
                  Industrial Consumption Profiles &amp; Projections
                </h3>
                <p className="text-xs text-slate-400 font-mono mt-0.5">
                  Based on 3-Phase 400V 50Hz Industrial Inverter Ingestion
                </p>
              </div>
              <span className="text-xs font-mono text-slate-300 px-2.5 py-1 rounded bg-industrial-800 border border-industrial-700">
                Tariff: $0.14 / kWh
              </span>
            </div>

            <div className="grid grid-cols-3 gap-4 my-5">
              <div className="p-3.5 rounded-xl bg-industrial-950/70 border border-industrial-800">
                <span className="text-[10px] font-hud text-slate-400 uppercase block">
                  Today&apos;s Usage
                </span>
                <div className="text-xl font-bold font-mono text-cyan-300 mt-1">
                  {todayKwh.toFixed(1)} <span className="text-xs text-slate-400">kWh</span>
                </div>
                <span className="text-[10px] text-slate-500 font-mono mt-1 block">
                  18.0 Operating Hours
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-industrial-950/70 border border-industrial-800">
                <span className="text-[10px] font-hud text-slate-400 uppercase block">
                  Weekly Run
                </span>
                <div className="text-xl font-bold font-mono text-slate-200 mt-1">
                  {weeklyKwh.toFixed(0)} <span className="text-xs text-slate-400">kWh</span>
                </div>
                <span className="text-[10px] text-slate-500 font-mono mt-1 block">
                  Week-to-date total
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-industrial-950/70 border border-industrial-800">
                <span className="text-[10px] font-hud text-slate-400 uppercase block">
                  Monthly Projection
                </span>
                <div className="text-xl font-bold font-mono text-emerald-300 mt-1">
                  {monthlyKwh.toFixed(0)} <span className="text-xs text-slate-400">kWh</span>
                </div>
                <span className="text-[10px] text-slate-500 font-mono mt-1 block">
                  Forecasted 30-day sum
                </span>
              </div>
            </div>

            {/* Visual Power Flow Breakdown */}
            <div className="space-y-3">
              <div className="text-xs font-hud text-slate-400 uppercase tracking-wider">
                Electrical Power Distribution
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-mono text-slate-300">
                  <span>Useful Mechanical Weaving Work</span>
                  <span className="text-cyan-400 font-bold">
                    {(powerKw - powerLoss).toFixed(2)} kW ({(((powerKw - powerLoss) / (powerKw || 1)) * 100).toFixed(1)}%)
                  </span>
                </div>
                <div className="h-2 w-full bg-industrial-950 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-cyan-500 rounded-full shadow-glow-cyan"
                    style={{ width: `${Math.min(100, Math.max(10, (((powerKw - powerLoss) / (powerKw || 1)) * 100)))}%` }}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-mono text-slate-300">
                  <span>Parasitic Thermal &amp; Bearing Losses</span>
                  <span className="text-amber-400 font-bold">
                    {powerLoss.toFixed(2)} kW ({((powerLoss / (powerKw || 1)) * 100).toFixed(1)}%)
                  </span>
                </div>
                <div className="h-2 w-full bg-industrial-950 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-500 rounded-full shadow-glow-amber"
                    style={{ width: `${Math.min(100, Math.max(5, ((powerLoss / (powerKw || 1)) * 100)))}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-5 pt-3 border-t border-industrial-800/80 flex items-center justify-between text-xs font-mono text-slate-400">
            <span>Machine Status: {rpm > 10 ? "Weaving Active" : "Standby"}</span>
            <span>Motor Load: {motorLoad.toFixed(1)} Amps</span>
          </div>
        </div>

        {/* Right Column: Energy Optimization & Cost Savings Opportunities */}
        <div className="lg:col-span-5 glass-panel p-5 rounded-2xl border border-industrial-700/60 shadow-panel flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-industrial-700/40">
              <h3 className="font-hud text-sm font-semibold text-slate-100 uppercase tracking-wider flex items-center gap-2">
                <TrendingDown className="w-4 h-4 text-cyan-400" />
                Cost Savings Intelligence
              </h3>
              <span className="text-[10px] font-hud uppercase px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                AI Optimization
              </span>
            </div>

            <div className="my-4 p-4 rounded-xl bg-industrial-950/80 border border-industrial-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-slate-400">Identified Recovery Potential</span>
                <span className="text-sm font-bold font-mono text-emerald-400">
                  ${(savingsOpp * 30).toFixed(2)} / month
                </span>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                By addressing bearing friction and re-tensioning the timing drive belt, parasitic electrical dissipation can be reduced by up to <strong>{(powerLoss * 0.6).toFixed(2)} kW</strong>.
              </p>
            </div>

            <div className="space-y-2.5">
              <div className="p-3 rounded-lg bg-industrial-900/60 border border-industrial-800 flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                <div className="text-xs font-mono">
                  <div className="text-slate-200 font-bold">VFD Speed Scheduling</div>
                  <div className="text-slate-400 text-[11px] mt-0.5">
                    Modulate loom RPM from 680 to 620 during off-peak warp change intervals to conserve ~4.2 kWh/shift.
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-industrial-900/60 border border-industrial-800 flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div className="text-xs font-mono">
                  <div className="text-slate-200 font-bold">Auto-Standby Sleep Mode</div>
                  <div className="text-slate-400 text-[11px] mt-0.5">
                    Trigger low-power inverter sleep after 90 seconds of continuous weft yarn breakage stops.
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-industrial-800/80 text-[11px] font-mono text-slate-500 flex items-center justify-between">
            <span>Carbon Index: 0.42 kg CO2/kWh</span>
            <span>Est. Saved: 1.8 tons CO2/yr</span>
          </div>
        </div>
      </div>
    </div>
  );
};
