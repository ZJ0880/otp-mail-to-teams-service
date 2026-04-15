import { Injectable, Logger } from "@nestjs/common";

export interface HealthCheckResult {
  status: "healthy" | "degraded" | "unhealthy";
  checks: Record<string, { status: "ok" | "warning" | "error"; message?: string }>;
  timestamp: Date;
  uptime: number;
}

type CheckStatus = "ok" | "warning" | "error";
type CheckInfo = { status: CheckStatus; message?: string };
type LastCheck = { status: "ok" | "error"; timestamp: Date };

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
    const checks: Record<string, CheckInfo> = {
      imap: this.buildImapCheck(),
      teams: this.buildTeamsCheck(),
      cycle: this.buildCycleCheck(),
    };

    const overallStatus = this.getOverallStatus(checks);

    return {
      status: overallStatus,
      checks,
      timestamp: new Date(),
      uptime: Date.now() - this.startTime,
    };
  }

  private buildImapCheck(): CheckInfo {
    return this.buildStandardCheck(
      this.lastImapCheck,
      "No IMAP check performed yet",
      "IMAP connection ok",
      (check) => `IMAP check failed at ${check.timestamp.toISOString()}`,
    );
  }

  private buildTeamsCheck(): CheckInfo {
    return this.buildStandardCheck(
      this.lastTeamsCheck,
      "No Teams check performed yet",
      "Teams webhook ok",
      (check) => `Teams check failed at ${check.timestamp.toISOString()}`,
    );
  }

  private buildCycleCheck(): CheckInfo {
    return this.buildStandardCheck(
      this.lastCycleCheck,
      "No cycle performed yet",
      `Last cycle ok (${this.cycleDuration}ms)`,
      (check) => `Cycle failed at ${check.timestamp.toISOString()}`,
    );
  }

  private buildStandardCheck(
    check: LastCheck | null,
    missingMessage: string,
    successMessage: string,
    errorMessageFactory: (check: LastCheck) => string,
  ): CheckInfo {
    if (!check) {
      return { status: "warning", message: missingMessage };
    }

    if (check.status === "ok") {
      return { status: "ok", message: successMessage };
    }

    return { status: "error", message: errorMessageFactory(check) };
  }

  private getOverallStatus(checks: Record<string, CheckInfo>): HealthCheckResult["status"] {
    const values = Object.values(checks);
    if (values.some((check) => check.status === "error")) {
      return "unhealthy";
    }

    if (values.some((check) => check.status === "warning")) {
      return "degraded";
    }

    return "healthy";
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
