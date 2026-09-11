export type MachineStatus = "Healthy" | "Warning" | "Critical";

export type SimulationScenario =
  | "normal"
  | "bearing_wear"
  | "motor_overload"
  | "shaft_misalignment"
  | "belt_slippage"
  | "overheating"
  | "loom_jam"
  | "rapid_estop"
  | "speed_fluctuation";

export interface RawSensorData {
  timestamp: string;
  temperature: number;
  vibration: number;
  motor_load: number;
  rpm: number;
}

export interface HealthBreakdown {
  temperature_score: number;
  temperature_impact: number;
  vibration_score: number;
  vibration_impact: number;
  motor_load_score: number;
  motor_load_impact: number;
  rpm_stability_score: number;
  rpm_stability_impact: number;
}

export interface ComponentHealth {
  name: string;
  status: MachineStatus;
  health_score: number;
  temperature: number;
  vibration: number;
  stress_level: number;
  glow_color: string;
  risk_score: number;
  failure_probability: number;
  maintenance_status: string;
  remaining_useful_life_days: number;
  remaining_useful_life_hours: number;
  is_failing: boolean;
}

export interface AIPrediction {
  status: MachineStatus;
  confidence: number;
  probabilities: Record<string, number>;
  failure_probability: number;
  risk_percentage: number;
  health_percentage: number;
  remaining_useful_life_hours: number;
  diagnosis: string;
  explanation: string;
}

export interface TelemetryPacket {
  machine_id: string;
  timestamp: string;
  sensors: RawSensorData;
  overall_health_score: number;
  overall_status: MachineStatus;
  health_breakdown: HealthBreakdown;
  components: Record<string, ComponentHealth>;
  ai_prediction: AIPrediction;
  scenario: SimulationScenario;
  uptime_seconds: number;
  picks_per_minute: number;
  total_picks: number;
  meters_woven: number;
  oee_percentage: number;
  active_alerts_count: number;
}

export type AlertSeverity = "INFO" | "WARNING" | "CRITICAL";

export interface AlertEvent {
  id: string;
  timestamp: string;
  severity: AlertSeverity;
  component: string;
  title: string;
  message: string;
  metric_name: string;
  metric_value: number;
  threshold_value: number;
  acknowledged: boolean;
  resolved: boolean;
}

export type MaintenancePriority = "LOW" | "MEDIUM" | "HIGH" | "EMERGENCY";

export interface MaintenanceRecommendation {
  id: string;
  component: string;
  action: string;
  priority: MaintenancePriority;
  confidence_score: number;
  root_cause_explanation: string;
  recommended_window_hours: number;
  created_at: string;
}

export type WorkOrderStatus = "PENDING" | "DISPATCHED" | "IN_PROGRESS" | "COMPLETED";

export interface WorkOrder {
  id: string;
  recommendation_id?: string;
  component: string;
  task_description: string;
  priority: MaintenancePriority;
  status: WorkOrderStatus;
  assigned_technician?: string;
  created_at: string;
  notes?: string;
}

export type CameraPreset = "isometric" | "motor" | "bearings" | "loom" | "belt" | "top";

export type ViewportMode = "standard" | "thermal" | "wireframe";

export type NavigationTab = "console" | "fleet" | "energy" | "executive";

export interface EnergyMetrics {
  timestamp?: string;
  machine_id: string;
  power_kw: number;
  apparent_power_kva: number;
  power_factor: number;
  energy_today_kwh: number;
  energy_weekly_kwh: number;
  energy_monthly_kwh: number;
  power_loss_kw: number;
  energy_efficiency_pct: number;
  cost_per_hour_usd: number;
  cost_today_usd: number;
  cost_monthly_estimate_usd: number;
  cost_savings_opportunity_usd: number;
  waste_detection_active: boolean;
  waste_reason: string | null;
}

export interface MachineSummary {
  machine_id: string;
  name: string;
  model: string;
  status: MachineStatus;
  health_score: number;
  rpm: number;
  temperature: number;
  vibration: number;
  scenario: SimulationScenario;
  oee_percentage: number;
  location: string;
  meters_woven_today: number;
  active_alerts_count: number;
}

export interface FleetOverview {
  timestamp: string;
  factory_name: string;
  total_machines: number;
  active_machines: number;
  factory_health_score: number;
  fleet_oee_average: number;
  total_power_kw: number;
  machines: MachineSummary[];
}

export interface AssistantMessage {
  id: string;
  sender: "user" | "ai";
  text: string;
  root_cause?: string;
  risk_assessment?: string;
  recommended_action?: string;
  confidence?: number;
  timestamp: string;
}
