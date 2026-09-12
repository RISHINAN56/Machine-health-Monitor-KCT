export const APP_CONFIG = {
  APP_NAME: "MHM Digital Twin",
  FULL_NAME: "Machine Health Monitoring & Industrial Digital Twin Platform",
  VERSION: "2.0.0",
  FACILITY_NAME: "Coimbatore Smart Weaving Facility 4.0",
  TELEMETRY_INTERVAL_MS: 2000,
  AUXILIARY_POLL_INTERVAL_MS: 3000,
  WS_RECONNECT_DELAY_MS: 2000,
  DEFAULT_MACHINE_ID: "picanol",
  MAX_HISTORY_LENGTH: 240,
};

export const API_ROUTES = {
  TELEMETRY_WS: "/ws/telemetry",
  ALERTS: "/api/alerts",
  ENERGY: "/api/energy",
  FLEET: "/api/fleet",
  WORK_ORDERS: "/api/maintenance/work-orders",
  SCENARIO: "/api/simulation/scenario",
};
