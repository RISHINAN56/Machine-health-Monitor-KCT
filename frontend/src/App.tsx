import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TwinProvider, useTwin } from "./context/TwinContext";
import { Header } from "./components/layout/Header";
import { Sidebar } from "./components/layout/Sidebar";
import { LandingHero } from "./components/landing/LandingHero";
import { CanvasContainer } from "./components/3d/CanvasContainer";
import { LiveSensorPanel } from "./components/dashboard/LiveSensorPanel";
import { MachineOverview } from "./components/dashboard/MachineOverview";
import { WaveformOscilloscope } from "./components/dashboard/WaveformOscilloscope";
import { PredictionPanel } from "./components/dashboard/PredictionPanel";
import { MaintenancePanel } from "./components/dashboard/MaintenancePanel";
import { AlertTimeline } from "./components/dashboard/AlertTimeline";
import { HistoricalAnalytics } from "./components/dashboard/HistoricalAnalytics";
import { ComponentHealthGrid } from "./components/dashboard/ComponentHealthGrid";
import { EnergyIntelligence } from "./components/dashboard/EnergyIntelligence";
import { FactoryFloorView } from "./components/dashboard/FactoryFloorView";
import { ExecutiveDashboard } from "./components/dashboard/ExecutiveDashboard";
import { HistoricalPlayback } from "./components/dashboard/HistoricalPlayback";
import { AiAssistantPanel } from "./components/dashboard/AiAssistantPanel";
import { ToastContainer } from "./components/common/ToastContainer";
import { ErrorBoundary } from "./components/common/ErrorBoundary";

const AppContent: React.FC = () => {
  const [currentView, setCurrentView] = useState<"landing" | "dashboard">("dashboard");
  const { activeTab } = useTwin();

  return (
    <div className="min-h-screen flex flex-col bg-industrial-950 text-slate-100 font-sans selection:bg-cyan-400 selection:text-industrial-950 crt-grid">
      {/* Top Header Bar */}
      <Header currentView={currentView} onViewChange={setCurrentView} />

      {/* Main Viewport Container */}
      <main className="flex-1 w-full max-w-[1720px] mx-auto p-4 sm:p-6 space-y-6">
        <AnimatePresence mode="wait">
          {currentView === "landing" ? (
            <motion.div
              key="landing"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
            >
              <LandingHero onEnterConsole={() => setCurrentView("dashboard")} />
            </motion.div>
          ) : (
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25 }}
              className="space-y-6"
            >
              {/* TAB 1: 3D DIGITAL TWIN CONSOLE */}
              {activeTab === "console" && (
                <>
                  {/* Historical Time-Travel Playback Scrubber (Phase 9) */}
                  <HistoricalPlayback />

                  {/* 1. Live Sensor Telemetry Strip */}
                  <LiveSensorPanel />

                  {/* 2. Primary 3D Digital Twin & Scenario Control Split */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Left: Quick Scenario & Component Sidebar (Phase 2: 5 Industrial Failure Modes) */}
                    <div className="lg:col-span-3">
                      <Sidebar />
                    </div>

                    {/* Center / Right: Interactive 3D Digital Twin Canvas (Phase 1 & Phase 8: Thermal Heatmap) */}
                    <div className="lg:col-span-9 h-[540px]">
                      <ErrorBoundary fallbackTitle="3D Digital Twin Canvas">
                        <CanvasContainer />
                      </ErrorBoundary>
                    </div>
                  </div>

                  {/* 3. Component-Level Digital Twin & RUL Matrix (Phase 1 & Phase 3) */}
                  <ComponentHealthGrid />

                  {/* 4. Oscilloscope & Machine Health Row */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    <div className="lg:col-span-7">
                      <MachineOverview />
                    </div>
                    <div className="lg:col-span-5">
                      <WaveformOscilloscope />
                    </div>
                  </div>

                  {/* 5. AI Diagnostics & Prescriptive Maintenance Row (Phase 4: Prescriptions & SOPs) */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    <div className="lg:col-span-6">
                      <PredictionPanel />
                    </div>
                    <div className="lg:col-span-6">
                      <MaintenancePanel />
                    </div>
                  </div>

                  {/* 6. Historical Trends & Alarm Timeline Row */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    <div className="lg:col-span-7">
                      <HistoricalAnalytics />
                    </div>
                    <div className="lg:col-span-5">
                      <AlertTimeline />
                    </div>
                  </div>
                </>
              )}

              {/* TAB 2: FACTORY FLOOR MULTI-MACHINE VIEW (Phase 6) */}
              {activeTab === "fleet" && <FactoryFloorView />}

              {/* TAB 3: ENERGY INTELLIGENCE & SUSTAINABILITY (Phase 5) */}
              {activeTab === "energy" && <EnergyIntelligence />}

              {/* TAB 4: EXECUTIVE CXO ANALYTICS DASHBOARD (Phase 10) */}
              {activeTab === "executive" && <ExecutiveDashboard />}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Grounded AI Maintenance Assistant Drawer (Phase 7) */}
      <AiAssistantPanel />

      {/* Floating Live Alert Toasts */}
      <ToastContainer />

      {/* Industrial Footer */}
      <footer className="w-full border-t border-industrial-800/80 bg-industrial-950/90 py-4 px-6 text-center text-xs font-mono text-slate-500">
        <div className="max-w-[1720px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>
            MHM | 3D Visualization of Machine Health Monitoring
          </span>
          <span className="text-slate-400">
            ISO 10816 Mechanical Standard &bull; IEC 60034 Energy Protocol &bull; 10 Hz Real-Time WebSockets
          </span>
        </div>
      </footer>
    </div>
  );
};

export default function App() {
  return (
    <ErrorBoundary fallbackTitle="MHM Platform">
      <TwinProvider>
        <AppContent />
      </TwinProvider>
    </ErrorBoundary>
  );
}

