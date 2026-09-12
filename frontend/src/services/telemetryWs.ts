import { TelemetryPacket } from "../types";
import { API_ROUTES, APP_CONFIG } from "../config/constants";

export type TelemetryMessageCallback = (packet: TelemetryPacket) => void;
export type ConnectionChangeCallback = (connected: boolean) => void;

export class TelemetryWebSocketManager {
  private ws: WebSocket | null = null;
  private reconnectTimer: number | null = null;
  private isDestroyed = false;
  private useDirectBackend = false;
  private onMessageCallback: TelemetryMessageCallback | null = null;
  private onConnectionChangeCallback: ConnectionChangeCallback | null = null;

  constructor(
    onMessage: TelemetryMessageCallback,
    onConnectionChange: ConnectionChangeCallback
  ) {
    this.onMessageCallback = onMessage;
    this.onConnectionChangeCallback = onConnectionChange;
    this.connect();
  }

  private connect() {
    if (this.isDestroyed) return;

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const host = window.location.hostname || "localhost";
    const wsUrl = this.useDirectBackend
      ? `${protocol}//${host}:8000${API_ROUTES.TELEMETRY_WS}`
      : `${protocol}//${window.location.host}${API_ROUTES.TELEMETRY_WS}`;

    try {
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        if (this.isDestroyed) return;
        this.onConnectionChangeCallback?.(true);
      };

      this.ws.onmessage = (event) => {
        if (this.isDestroyed) return;
        try {
          const data = JSON.parse(event.data);
          if (data && data.overall_health_score !== undefined) {
            this.onMessageCallback?.(data as TelemetryPacket);
          }
        } catch {
          // ignore non-packet frames
        }
      };

      this.ws.onclose = () => {
        if (this.isDestroyed) return;
        this.onConnectionChangeCallback?.(false);
        this.useDirectBackend = !this.useDirectBackend;
        this.reconnectTimer = window.setTimeout(
          () => this.connect(),
          APP_CONFIG.WS_RECONNECT_DELAY_MS
        );
      };

      this.ws.onerror = () => {
        this.ws?.close();
      };
    } catch {
      this.reconnectTimer = window.setTimeout(
        () => this.connect(),
        APP_CONFIG.WS_RECONNECT_DELAY_MS
      );
    }
  }

  public send(payload: object): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(payload));
    }
  }

  public destroy(): void {
    this.isDestroyed = true;
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    if (this.ws) {
      this.ws.onclose = null;
      this.ws.close();
      this.ws = null;
    }
  }
}
