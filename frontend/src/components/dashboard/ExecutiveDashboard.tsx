import React from "react";
import { useTwin } from "../../context/TwinContext";
import {
  TrendingUp,
  ShieldCheck,
  DollarSign,
  Clock,
  Zap,
  Award,
  Factory,
  CheckCircle2,
  FileSpreadsheet,
  Download,
} from "lucide-react";

export const ExecutiveDashboard: React.FC = () => {
  const { fleet, energy } = useTwin();

  const factoryHealth = fleet?.factory_health_score ?? 86.2;
  const oeeAvg = fleet?.fleet_oee_average ?? 94.6;
  const powerKw = fleet?.total_power_kw ?? 74.4;

  return (
    <div className="space-y-6">
      {/* Executive Header Banner */}
      <div className="glass-panel p-6 rounded-2xl border border-industrial-700/60 shadow-panel flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-cyan-400" />
            <h2 className="font-hud text-lg font-bold text-slate-100 uppercase tracking-wider">
              Performance Monitoring
            </h2>
          </div>
          <p className="text-xs text-slate-400 font-mono mt-1">
            Multi-Machine Telemetry &bull; Plant Reliability &bull; Operational Efficiency
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => window.print()}
            className="px-3.5 py-1.5 rounded-xl text-xs font-hud uppercase tracking-wider bg-industrial-800 text-slate-200 border border-industrial-700 hover:bg-industrial-700 transition flex items-center gap-1.5 font-medium"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            <span>Export ESG Report</span>
          </button>
        </div>
      </div>

      {/* Primary CXO Key Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Overall Factory Health */}
        <div className="glass-panel p-5 rounded-2xl border border-industrial-700/60 shadow-panel">
          <div className="flex items-center justify-between text-slate-400 text-xs font-hud uppercase">
            <span>Factory Health Score</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold font-mono text-emerald-400">
              {factoryHealth.toFixed(1)}%
            </span>
            <span className="text-xs font-mono text-emerald-400">+2.4% MoM</span>
          </div>
          <p className="text-[11px] font-mono text-slate-400 mt-2">
            5 Weaving machines reporting nominal condition.
          </p>
        </div>

        {/* Metric 2: Fleet OEE */}
        <div className="glass-panel p-5 rounded-2xl border border-industrial-700/60 shadow-panel">
          <div className="flex items-center justify-between text-slate-400 text-xs font-hud uppercase">
            <span>Fleet OEE Average</span>
            <TrendingUp className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold font-mono text-cyan-300">
              {oeeAvg.toFixed(1)}%
            </span>
            <span className="text-xs font-mono text-cyan-400">World Class (&gt;85%)</span>
          </div>
          <p className="text-[11px] font-mono text-slate-400 mt-2">
            Availability: 96.8% &bull; Performance: 98.2%
          </p>
        </div>

        {/* Metric 3: Cost Savings YTD */}
        <div className="glass-panel p-5 rounded-2xl border border-industrial-700/60 shadow-panel">
          <div className="flex items-center justify-between text-slate-400 text-xs font-hud uppercase">
            <span>Downtime Avoided ($)</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold font-mono text-emerald-300">
              $14,280
            </span>
            <span className="text-xs font-mono text-slate-400">YTD</span>
          </div>
          <p className="text-[11px] font-mono text-slate-400 mt-2">
            3 catastrophic bearing seizures prevented prior to failure.
          </p>
        </div>

        {/* Metric 4: Downtime Reduction */}
        <div className="glass-panel p-5 rounded-2xl border border-industrial-700/60 shadow-panel">
          <div className="flex items-center justify-between text-slate-400 text-xs font-hud uppercase">
            <span>Downtime Reduction (%)</span>
            <Clock className="w-4 h-4 text-purple-400" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold font-mono text-purple-300">
              -34.5%
            </span>
            <span className="text-xs font-mono text-purple-400">vs Prev Year</span>
          </div>
          <p className="text-[11px] font-mono text-slate-400 mt-2">
            MTBF: 782 hrs &bull; MTTR: 42 mins
          </p>
        </div>
      </div>

      {/* Deep Dive Analytics Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Plant Equipment Availability & Reliability */}
        <div className="lg:col-span-8 glass-panel p-5 rounded-2xl border border-industrial-700/60 shadow-panel space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-industrial-700/40">
            <div>
              <h3 className="font-hud text-sm font-semibold text-slate-100 uppercase tracking-wider flex items-center gap-2">
                <Factory className="w-4 h-4 text-cyan-400" />
                Reliability Metrics &amp; Operational Efficiency
              </h3>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                ISO 13374 Condition Monitoring Performance Validation
              </p>
            </div>
            <span className="text-xs font-mono px-2.5 py-1 rounded bg-industrial-800 border border-industrial-700 text-slate-300">
              Monthly Review Cycle
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 py-2">
            <div className="p-4 rounded-xl bg-industrial-950/70 border border-industrial-800">
              <span className="text-[10px] font-hud text-slate-400 uppercase">
                Mean Time Between Failures
              </span>
              <div className="text-2xl font-bold font-mono text-slate-100 mt-1">
                782 <span className="text-xs text-slate-400">Hours</span>
              </div>
              <span className="text-[10px] text-emerald-400 font-mono mt-1 block">
                +18.4% improvement
              </span>
            </div>

            <div className="p-4 rounded-xl bg-industrial-950/70 border border-industrial-800">
              <span className="text-[10px] font-hud text-slate-400 uppercase">
                Mean Time to Repair (MTTR)
              </span>
              <div className="text-2xl font-bold font-mono text-cyan-300 mt-1">
                42 <span className="text-xs text-slate-400">Minutes</span>
              </div>
              <span className="text-[10px] text-emerald-400 font-mono mt-1 block">
                -28.0% shorter turnaround
              </span>
            </div>

            <div className="p-4 rounded-xl bg-industrial-950/70 border border-industrial-800">
              <span className="text-[10px] font-hud text-slate-400 uppercase">
                Work Orders Executed
              </span>
              <div className="text-2xl font-bold font-mono text-emerald-400 mt-1">
                48 / 50
              </div>
              <span className="text-[10px] text-slate-400 font-mono mt-1 block">
                96% on-time completion
              </span>
            </div>
          </div>

          {/* Plant Energy & Carbon Sustainability Summary */}
          <div className="p-4 rounded-xl bg-industrial-950/80 border border-industrial-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-hud font-semibold text-slate-200 uppercase">
                  Carbon &amp; Energy Footprint Impact
                </h4>
                <p className="text-xs text-slate-400 font-mono mt-0.5">
                  Peak demand: {powerKw.toFixed(1)} kW &bull; Projected avoidance: 2.1 metric tons CO2 / month
                </p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[10px] uppercase font-hud text-emerald-400 block font-semibold">
                ESG Rating
              </span>
              <span className="text-sm font-bold font-mono text-slate-100">
                Tier 1 Industry 4.0
              </span>
            </div>
          </div>
        </div>

        {/* Right Column: Strategic Maintenance Directives */}
        <div className="lg:col-span-4 glass-panel p-5 rounded-2xl border border-industrial-700/60 shadow-panel flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-industrial-700/40">
              <h3 className="font-hud text-sm font-semibold text-slate-100 uppercase tracking-wider flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                Strategic Directives
              </h3>
            </div>

            <div className="space-y-3 mt-4">
              <div className="p-3 rounded-xl bg-industrial-900/70 border border-industrial-800">
                <span className="text-[10px] font-hud uppercase px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  Priority 1: Tsudakoma Bearing Overhaul
                </span>
                <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                  Schedule off-shift bearing replacement on TSUDAKOMA ZAX001 during Saturday warp changeover to avoid 8 hours of peak downtime.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-industrial-900/70 border border-industrial-800">
                <span className="text-[10px] font-hud uppercase px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                  Priority 2: E-Shed Servo Optimization
                </span>
                <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                  Calibrate Toyota JAT910 E-Shed independent servo tensioning to maximize energy savings and trim daily kWh dissipation.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-5 pt-3 border-t border-industrial-800/80 text-[11px] font-mono text-slate-400 flex items-center justify-between">
            <span>Next Executive Audit: Oct 1, 2026</span>
            <span className="text-emerald-400 font-bold">100% Compliant</span>
          </div>
        </div>
      </div>
    </div>
  );
};
