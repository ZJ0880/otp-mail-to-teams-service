import { Injectable, Logger } from "@nestjs/common";

export interface HealthCheckResult {
  status: "healthy" | "degraded" | "unhealthy";
  checks: Record<string, { status: "ok" | "warning" | "error"; message?: string }>;
  timestamp: Date;
  uptime: number;
}

@Injectable()
export class HealthCheckService {
  private readonly logger = new Logger(HealthCheckService.name);
  private readonly startTime = Date.now();
  private lastImapCheck: { status: "ok" | "error"; timestamp: Date } | null = null;
  private lastTeamsCheck: { status: "ok" | "error"; timestamp: Date } | null = null;
  private lastCycleCheck: { status: "ok" | "error"; timestamp: Date } | null = null;
  private cycleDuration: number = 0;

  /**
   * Record IMAP connectivity status
   */
  recordImapCheck(status: "ok" | "error"): void {
    this.lastImapCheck = { status, timestamp: new Date() };
    this.logger.debug(`IMAP health check: ${status}`);
  }

  /**
   * Record Teams webhook status
   */
  recordTeamsCheck(status: "ok" | "error"): void {
    this.lastTeamsCheck = { status, timestamp: new Date() };
    this.logger.debug(`Teams health check: ${status}`);
  }

  /**
   * Record polling cycle status
   */
  recordCycleCheck(status: "ok" | "error", durationMs: number): void {
    this.lastCycleCheck = { status, timestamp: new Date() };
    this.cycleDuration = durationMs;
    this.logger.debug(`Cycle health check: ${status} (${durationMs}ms)`);
  }

  /**
   * Get full health status
   */
  getHealth(): HealthCheckResult {
    const checks: Record<string, { status: "ok" | "warning" | "error"; message?: string }> = {};

    // IMAP check
    if (this.lastImapCheck) {
      checks.imap = {
        status: this.lastImapCheck.status === "ok" ? "ok" : "error",
        message:
          this.lastImapCheck.status === "ok"
            ? "IMAP connection ok"
            : `IMAP check failed at ${this.lastImapCheck.timestamp.toISOString()}`,
      };
    } else {
      checks.imap = { status: "warning", message: "No IMAP check performed yet" };
    }

    // Teams check
    if (this.lastTeamsCheck) {
      checks.teams = {
        status: this.lastTeamsCheck.status === "ok" ? "ok" : "error",
        message:
          this.lastTeamsCheck.status === "ok"
            ? "Teams webhook ok"
            : `Teams check failed at ${this.lastTeamsCheck.timestamp.toISOString()}`,
      };
    } else {
      checks.teams = { status: "warning", message: "No Teams check performed yet" };
    }

    // Cycle check
    if (this.lastCycleCheck) {
      checks.cycle = {
        status: this.lastCycleCheck.status === "ok" ? "ok" : "error",
        message:
          this.lastCycleCheck.status === "ok"
            ? `Last cycle ok (${this.cycleDuration}ms)`
            : `Cycle failed at ${this.lastCycleCheck.timestamp.toISOString()}`,
      };
    } else {
      checks.cycle = { status: "warning", message: "No cycle performed yet" };
    }

    // Determine overall status
    const errorCount = Object.values(checks).filter((c) => c.status === "error").length;
    const overallStatus =
      errorCount > 0 ? "unhealthy" : Object.values(checks).some((c) => c.status === "warning") ? "degraded" : "healthy";

    return {
      status: overallStatus,
      checks,
      timestamp: new Date(),
      uptime: Date.now() - this.startTime,
    };
  }

  /**
   * Reset health checks
   */
  reset(): void {
    this.lastImapCheck = null;
    this.lastTeamsCheck = null;
    this.lastCycleCheck = null;
    this.cycleDuration = 0;
    this.logger.log("Health checks reset");
  }
}
