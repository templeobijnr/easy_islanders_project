/**
 * WebSocket Client Metrics
 *
 * Tracks reconnection attempts, close codes, and connection duration.
 * Can be integrated with RUM tools (e.g., Datadog, New Relic) or console beacons.
 */

type CloseCodeMetric = {
  code: number;
  reason: string;
  timestamp: number;
};

type ReconnectMetric = {
  attempt: number;
  backoffMs: number;
  timestamp: number;
};

type ConnectionMetric = {
  threadId: string;
  connectedAt: number;
  disconnectedAt?: number;
  durationMs?: number;
};

class WSMetrics {
  private closeCodes: CloseCodeMetric[] = [];
  private reconnects: ReconnectMetric[] = [];
  private connections: ConnectionMetric[] = [];
  private currentConnection: ConnectionMetric | null = null;

  // Track WebSocket close code
  trackCloseCode(code: number, reason: string) {
    this.closeCodes.push({
      code,
      reason,
      timestamp: Date.now(),
    });

    // Keep last 100 close codes
    if (this.closeCodes.length > 100) {
      this.closeCodes.shift();
    }

    // Log to console in dev
    if (process.env.NODE_ENV === 'development') {
      console.log('[WSMetrics] Close code:', code, reason);
    }
  }

  // Track reconnection attempt
  trackReconnect(attempt: number, backoffMs: number) {
    this.reconnects.push({
      attempt,
      backoffMs,
      timestamp: Date.now(),
    });

    // Keep last 100 reconnects
    if (this.reconnects.length > 100) {
      this.reconnects.shift();
    }

    // Log to console in dev
    if (process.env.NODE_ENV === 'development') {
      console.log('[WSMetrics] Reconnect attempt:', attempt, 'backoff:', backoffMs);
    }
  }

  // Track connection start
  trackConnectionStart(threadId: string) {
    this.currentConnection = {
      threadId,
      connectedAt: Date.now(),
    };
  }

  // Track connection end
  trackConnectionEnd() {
    if (this.currentConnection) {
      const disconnectedAt = Date.now();
      const durationMs = disconnectedAt - this.currentConnection.connectedAt;

      const metric: ConnectionMetric = {
        ...this.currentConnection,
        disconnectedAt,
        durationMs,
      };

      this.connections.push(metric);

      // Keep last 50 connections
      if (this.connections.length > 50) {
        this.connections.shift();
      }

      // Log to console in dev
      if (process.env.NODE_ENV === 'development') {
        console.log('[WSMetrics] Connection duration:', durationMs, 'ms');
      }

      this.currentConnection = null;
    }
  }

  // Get metrics summary
  getSummary() {
    const closeCodeCounts = this.closeCodes.reduce((acc, { code }) => {
      acc[code] = (acc[code] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);

    const avgReconnectBackoff = this.reconnects.length > 0
      ? this.reconnects.reduce((sum, { backoffMs }) => sum + backoffMs, 0) / this.reconnects.length
      : 0;

    const connectionDurations = this.connections
      .filter(c => c.durationMs !== undefined)
      .map(c => c.durationMs!);

    const avgConnectionDuration = connectionDurations.length > 0
      ? connectionDurations.reduce((sum, d) => sum + d, 0) / connectionDurations.length
      : 0;

    const p95ConnectionDuration = connectionDurations.length > 0
      ? this.percentile(connectionDurations, 0.95)
      : 0;

    return {
      closeCodes: closeCodeCounts,
      totalReconnects: this.reconnects.length,
      avgReconnectBackoff: Math.round(avgReconnectBackoff),
      totalConnections: this.connections.length,
      avgConnectionDuration: Math.round(avgConnectionDuration),
      p95ConnectionDuration: Math.round(p95ConnectionDuration),
      currentConnectionDuration: this.currentConnection
        ? Date.now() - this.currentConnection.connectedAt
        : 0,
    };
  }

  // Calculate percentile
  private percentile(arr: number[], p: number): number {
    if (arr.length === 0) return 0;
    const sorted = [...arr].sort((a, b) => a - b);
    const index = Math.ceil(sorted.length * p) - 1;
    return sorted[Math.max(0, index)];
  }

  // Export metrics for RUM integration
  exportForRUM() {
    const summary = this.getSummary();

    // Can be sent to Datadog, New Relic, or custom analytics
    if (process.env.NODE_ENV === 'production' && window.DD_RUM) {
      window.DD_RUM.addAction('ws_metrics', summary);
    }

    return summary;
  }
}

// Singleton instance
export const wsMetrics = new WSMetrics();

// TypeScript declaration for Datadog RUM
declare global {
  interface Window {
    DD_RUM?: {
      addAction: (name: string, context: any) => void;
    };
  }
}
