import { AlertEvent, EnergyMetrics, FleetOverview, SimulationScenario, WorkOrder, WorkOrderStatus } from "../types";
import { API_ROUTES } from "../config/constants";

export const apiService = {
  async fetchAuxiliaryData(): Promise<{
    alerts: AlertEvent[] | null;
    workOrders: WorkOrder[] | null;
    energy: EnergyMetrics | null;
    fleet: FleetOverview | null;
  }> {
    try {
      const [alertsRes, ordersRes, energyRes, fleetRes] = await Promise.all([
        fetch(API_ROUTES.ALERTS),
        fetch(API_ROUTES.WORK_ORDERS),
        fetch(API_ROUTES.ENERGY),
        fetch(API_ROUTES.FLEET),
      ]);

      return {
        alerts: alertsRes.ok ? await alertsRes.json() : null,
        workOrders: ordersRes.ok ? await ordersRes.json() : null,
        energy: energyRes.ok ? await energyRes.json() : null,
        fleet: fleetRes.ok ? await fleetRes.json() : null,
      };
    } catch {
      return { alerts: null, workOrders: null, energy: null, fleet: null };
    }
  },

  async setScenario(scenario: SimulationScenario): Promise<boolean> {
    try {
      const res = await fetch(API_ROUTES.SCENARIO, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scenario }),
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  async acknowledgeAlert(alertId: string): Promise<boolean> {
    try {
      const res = await fetch(`${API_ROUTES.ALERTS}/${alertId}/acknowledge`, { method: "POST" });
      return res.ok;
    } catch {
      return false;
    }
  },

  async createWorkOrder(
    component: string,
    task: string,
    priority: string = "MEDIUM",
    recommendationId?: string
  ): Promise<WorkOrder | null> {
    try {
      const res = await fetch(API_ROUTES.WORK_ORDERS, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          component,
          task_description: task,
          priority,
          recommendation_id: recommendationId,
        }),
      });
      if (res.ok) {
        return await res.json();
      }
      return null;
    } catch {
      return null;
    }
  },

  async updateWorkOrderStatus(orderId: string, status: WorkOrderStatus): Promise<WorkOrder | null> {
    try {
      const res = await fetch(`${API_ROUTES.WORK_ORDERS}/${orderId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        return await res.json();
      }
      return null;
    } catch {
      return null;
    }
  },
};
