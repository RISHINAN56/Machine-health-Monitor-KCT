import { RealWorldMachine, SimulationScenario, TelemetryPacket } from "../types";

export const REAL_WORLD_MACHINES: Record<string, RealWorldMachine> = {
  picanol: {
    id: "picanol",
    name: "PICANOL OMNIPLUS SUMMUM",
    manufacturer: "Picanol",
    type: "Air-Jet Loom",
    status: "Healthy",
    healthScore: 98.4,
    rpm: 650,
    temperature: 31.8,
    vibration: 84.0,
    efficiency: 96.8,
    installationDate: "March 14, 2023",
    operatingHours: 8420,
    currentProduction: "485 picks/min (~185 m/day)",
    picksPerMinute: 485,
    fabricType: "Fine Cotton Poplin (120s/2)",
    powerConsumptionKw: 5.4,
    airPressureBar: 5.2,
    maintenanceSchedule: "Bi-weekly Lube (Due in 11 days)",
    modelGlb: "picanol.glb",
    accentColor: "#00E5FF",
    badgeText: "SUMO DRIVE ACTIVE",
    location: "Bay 1 - High-Speed Weaving Shed",
    metersWovenToday: 185.4,
    activeAlertsCount: 0,
    details: {
      reedWidth: "190 cm",
      sheddingType: "Positive Cam Shedding (1340)",
      nozzleSystem: "Pneumatic Double Main Nozzle with Fixed Relay",
      motorType: "Sumo Direct-Drive Switched Reluctance Motor",
      controlSystem: "BlueBox Microprocessor Controller",
    },
  },
  toyota: {
    id: "toyota",
    name: "TOYOTA JAT910",
    manufacturer: "Toyota Industries",
    type: "Air-Jet Loom",
    status: "Healthy",
    healthScore: 96.2,
    rpm: 680,
    temperature: 32.5,
    vibration: 92.0,
    efficiency: 97.5,
    installationDate: "November 20, 2022",
    operatingHours: 11240,
    currentProduction: "520 picks/min (~210 m/day)",
    picksPerMinute: 520,
    fabricType: "Premium Spun Denim (14 oz)",
    powerConsumptionKw: 4.8,
    airPressureBar: 4.6,
    maintenanceSchedule: "Spindle Greasing (Due in 18 days)",
    modelGlb: "toyota_jat910.glb",
    accentColor: "#00FFC8",
    badgeText: "E-SHED ECO RUN",
    location: "Bay 2 - Cleanroom Denim Hall",
    metersWovenToday: 210.8,
    activeAlertsCount: 0,
    details: {
      reedWidth: "210 cm",
      sheddingType: "E-Shed Independent Electronic Servo Shedding",
      nozzleSystem: "Twin Sub-Nozzle Air-Saving Wave Insertion",
      motorType: "Toyota High-Efficiency Permanent Magnet Servo",
      controlSystem: "12-inch Function Panel Touch Terminal (JAT-OS)",
    },
  },
  tsudakoma: {
    id: "tsudakoma",
    name: "TSUDAKOMA ZAX001 NEO PLUS",
    manufacturer: "Tsudakoma",
    type: "Air-Jet Loom",
    status: "Warning",
    healthScore: 68.5,
    rpm: 620,
    temperature: 48.6,
    vibration: 495.0,
    efficiency: 88.2,
    installationDate: "July 08, 2021",
    operatingHours: 16890,
    currentProduction: "440 picks/min (~145 m/day - Throttled)",
    picksPerMinute: 440,
    fabricType: "Technical Polyester Filament",
    powerConsumptionKw: 6.8,
    airPressureBar: 5.8,
    maintenanceSchedule: "URGENT: Bearing & Belt Service (Due in 1 day)",
    modelGlb: "tsudakoma_zax001.glb",
    accentColor: "#FFB000",
    badgeText: "BEARING WEAR DETECTED",
    location: "Bay 3 - Heavy Technical Filament Bay",
    metersWovenToday: 144.6,
    activeAlertsCount: 1,
    details: {
      reedWidth: "230 cm",
      sheddingType: "Rigid Box-Frame Crank Shedding",
      nozzleSystem: "High-Thrust Twin Relay Boosters",
      motorType: "Dual-Belt High-Torque Induction Motor",
      controlSystem: "WeaveNavigation Intelligent Terminal",
    },
  },
};

export const REAL_MACHINES_LIST: RealWorldMachine[] = [
  REAL_WORLD_MACHINES.picanol,
  REAL_WORLD_MACHINES.toyota,
  REAL_WORLD_MACHINES.tsudakoma,
];

export function getMachineById(id: string): RealWorldMachine {
  return REAL_WORLD_MACHINES[id] || REAL_WORLD_MACHINES.picanol;
}

export function generateMachineTelemetryPacket(
  machineId: string,
  scenario: SimulationScenario = "normal"
): TelemetryPacket {
  const machine = getMachineById(machineId);
  const isTsudakoma = machine.id === "tsudakoma";

  const rpmJitter = (Math.random() - 0.5) * 6;
  const tempJitter = (Math.random() - 0.5) * 0.4;
  const vibJitter = (Math.random() - 0.5) * (isTsudakoma ? 15 : 4);
  const healthJitter = (Math.random() - 0.5) * 0.3;

  const currentRpm = Math.max(100, Math.round(machine.rpm + rpmJitter));
  const currentTemp = Number((machine.temperature + tempJitter).toFixed(1));
  const currentVib = Number((machine.vibration + vibJitter).toFixed(1));
  const currentHealth = Number(
    Math.min(100, Math.max(20, machine.healthScore + healthJitter)).toFixed(1)
  );
  const currentPicks = Math.round(machine.picksPerMinute + (Math.random() - 0.5) * 4);

  const status = machine.status;

  return {
    machine_id: machine.id,
    timestamp: new Date().toISOString(),
    sensors: {
      timestamp: new Date().toISOString(),
      temperature: currentTemp,
      vibration: currentVib,
      motor_load: isTsudakoma ? 86.4 : 64.2,
      rpm: currentRpm,
    },
    overall_health_score: currentHealth,
    overall_status: status,
    health_breakdown: {
      temperature_score: isTsudakoma ? 62.0 : 98.0,
      temperature_impact: isTsudakoma ? -14.0 : 0.0,
      vibration_score: isTsudakoma ? 54.0 : 97.0,
      vibration_impact: isTsudakoma ? -24.0 : 0.0,
      motor_load_score: isTsudakoma ? 76.0 : 99.0,
      motor_load_impact: isTsudakoma ? -6.0 : 0.0,
      rpm_stability_score: 98.0,
      rpm_stability_impact: 0.0,
    },
    components: {
      main_motor: {
        name: isTsudakoma ? "Dual-Belt Drive Motor" : machine.id === "toyota" ? "Toyota Servo Drive" : "Sumo Direct-Drive",
        status: isTsudakoma ? "Warning" : "Healthy",
        health_score: isTsudakoma ? 72 : 98,
        temperature: currentTemp - 2,
        vibration: isTsudakoma ? 220 : 85,
        stress_level: isTsudakoma ? 68 : 22,
        glow_color: isTsudakoma ? "#ffb000" : "#00ff88",
        risk_score: isTsudakoma ? 28 : 2,
        failure_probability: isTsudakoma ? 0.28 : 0.01,
        maintenance_status: isTsudakoma ? "Service Soon" : "Good",
        remaining_useful_life_days: isTsudakoma ? 48 : 420,
        remaining_useful_life_hours: isTsudakoma ? 1152 : 10080,
        is_failing: false,
      },
      drive_shaft: {
        name: "Main Drive Shaft",
        status: "Healthy",
        health_score: 97,
        temperature: currentTemp - 4,
        vibration: isTsudakoma ? 180 : 70,
        stress_level: 25,
        glow_color: "#00ff88",
        risk_score: 3,
        failure_probability: 0.02,
        maintenance_status: "Good",
        remaining_useful_life_days: 640,
        remaining_useful_life_hours: 15360,
        is_failing: false,
      },
      bearings: {
        name: "Spindle Roller Bearings",
        status: isTsudakoma ? "Warning" : "Healthy",
        health_score: isTsudakoma ? 58 : 96,
        temperature: currentTemp + 4,
        vibration: currentVib,
        stress_level: isTsudakoma ? 78 : 24,
        glow_color: isTsudakoma ? "#ffb000" : "#00ff88",
        risk_score: isTsudakoma ? 42 : 4,
        failure_probability: isTsudakoma ? 0.42 : 0.02,
        maintenance_status: isTsudakoma ? "Action Required" : "Good",
        remaining_useful_life_days: isTsudakoma ? 14 : 380,
        remaining_useful_life_hours: isTsudakoma ? 336 : 9120,
        is_failing: isTsudakoma,
      },
      belt_system: {
        name: isTsudakoma ? "Dual V-Belt Transmission" : "Direct Gear Coupling",
        status: isTsudakoma ? "Warning" : "Healthy",
        health_score: isTsudakoma ? 74 : 98,
        temperature: currentTemp,
        vibration: isTsudakoma ? 240 : 80,
        stress_level: isTsudakoma ? 62 : 18,
        glow_color: isTsudakoma ? "#ffb000" : "#00ff88",
        risk_score: isTsudakoma ? 26 : 2,
        failure_probability: isTsudakoma ? 0.26 : 0.01,
        maintenance_status: isTsudakoma ? "Inspect Tension" : "Good",
        remaining_useful_life_days: isTsudakoma ? 55 : 510,
        remaining_useful_life_hours: isTsudakoma ? 1320 : 12240,
        is_failing: false,
      },
      loom_section: {
        name: "Sley & Air-Jet Insertion Nozzles",
        status: "Healthy",
        health_score: 95,
        temperature: currentTemp - 3,
        vibration: 95,
        stress_level: 28,
        glow_color: "#00ff88",
        risk_score: 5,
        failure_probability: 0.04,
        maintenance_status: "Good",
        remaining_useful_life_days: 720,
        remaining_useful_life_hours: 17280,
        is_failing: false,
      },
      power_unit: {
        name: "Pneumatic Pressure Regulator",
        status: "Healthy",
        health_score: 98,
        temperature: 30,
        vibration: 40,
        stress_level: 15,
        glow_color: "#00ff88",
        risk_score: 1,
        failure_probability: 0.01,
        maintenance_status: "Good",
        remaining_useful_life_days: 850,
        remaining_useful_life_hours: 20400,
        is_failing: false,
      },
    },
    ai_prediction: {
      status,
      confidence: 0.96,
      probabilities: {
        Normal: isTsudakoma ? 0.08 : 0.96,
        Bearing_Wear: isTsudakoma ? 0.88 : 0.02,
        Motor_Overload: 0.01,
        Shaft_Misalignment: 0.01,
      },
      failure_probability: isTsudakoma ? 0.42 : 0.02,
      risk_percentage: isTsudakoma ? 42 : 3,
      health_percentage: currentHealth,
      remaining_useful_life_hours: isTsudakoma ? 336 : 9120,
      diagnosis: isTsudakoma
        ? "Harmonic outer race defect on right spindle bearing. Vibration exceeds ISO 10816 Class II threshold (4.5 mm/s RMS)."
        : `${machine.name} operating within optimal Industry 4.0 parameters. ISO 10816 Zone A nominal.`,
      explanation: isTsudakoma
        ? "Early stage fatigue spalling detected on outer ring ball track. Vibration spectral peak at 3.2x shaft frequency. Recommend lubrication and replacement."
        : "All sensor signals nominal. Sumo direct-drive and air pneumatic insertion synchronization at 99.4% precision.",
    },
    scenario,
    uptime_seconds: machine.operatingHours * 3600,
    picks_per_minute: currentPicks,
    total_picks: 18450200,
    meters_woven: machine.metersWovenToday,
    oee_percentage: machine.efficiency,
    active_alerts_count: machine.activeAlertsCount,
  };
}
