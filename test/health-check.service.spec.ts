import { HealthCheckService } from "../src/observability/health-check.service";

describe("HealthCheckService", () => {
  let service: HealthCheckService;

  beforeEach(() => {
    service = new HealthCheckService();
  });

  afterEach(() => {
    service.reset();
  });

  describe("recordImapCheck", () => {
    it("records IMAP connection status", () => {
      service.recordImapCheck("ok");

      const health = service.getHealth();
      expect(health.checks.imap.status).toBe("ok");
    });

    it("records IMAP error status", () => {
      service.recordImapCheck("error");

      const health = service.getHealth();
      expect(health.checks.imap.status).toBe("error");
      expect(health.status).toBe("unhealthy");
    });
  });

  describe("recordTeamsCheck", () => {
    it("records Teams webhook status", () => {
      service.recordTeamsCheck("ok");

      const health = service.getHealth();
      expect(health.checks.teams.status).toBe("ok");
    });

    it("marks system as unhealthy when Teams fails", () => {
      service.recordImapCheck("ok");
      service.recordTeamsCheck("error");
      service.recordCycleCheck("ok", 100);

      const health = service.getHealth();
      expect(health.status).toBe("unhealthy");
    });
  });

  describe("recordCycleCheck", () => {
    it("records cycle status and duration", () => {
      service.recordCycleCheck("ok", 250);

      const health = service.getHealth();
      expect(health.checks.cycle.status).toBe("ok");
      expect(health.checks.cycle.message).toContain("250ms");
    });
  });

  describe("getHealth", () => {
    it("returns degraded status when no checks performed", () => {
      const health = service.getHealth();
      expect(health.status).toBe("degraded");
    });

    it("returns healthy status when all checks pass", () => {
      service.recordImapCheck("ok");
      service.recordTeamsCheck("ok");
      service.recordCycleCheck("ok", 100);

      const health = service.getHealth();
      expect(health.status).toBe("healthy");
      expect(health.uptime).toBeGreaterThanOrEqual(0);
      expect(health.timestamp).toBeDefined();
    });

    it("returns unhealthy status when any check fails", () => {
      service.recordImapCheck("ok");
      service.recordTeamsCheck("ok");
      service.recordCycleCheck("error", 500);

      const health = service.getHealth();
      expect(health.status).toBe("unhealthy");
    });
  });

  describe("reset", () => {
    it("clears all health checks", () => {
      service.recordImapCheck("ok");
      service.recordTeamsCheck("error");

      service.reset();

      const health = service.getHealth();
      expect(health.checks.imap.status).toBe("warning");
      expect(health.checks.teams.status).toBe("warning");
    });
  });
});
