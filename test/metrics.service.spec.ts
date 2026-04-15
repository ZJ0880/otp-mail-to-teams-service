import { MetricsService } from "../src/observability/metrics.service";

describe("MetricsService", () => {
  let service: MetricsService;

  beforeEach(() => {
    service = new MetricsService();
  });

  afterEach(() => {
    service.reset();
  });

  describe("recordCounter", () => {
    it("records a counter metric", () => {
      service.recordCounter("requests");
      service.recordCounter("requests", 5);

      const summary = service.getSummary();
      expect(summary["requests"]).toBeDefined();
      expect(summary["requests"].count).toBe(2);
      expect(summary["requests"].sum).toBe(6);
    });

    it("records counter with tags", () => {
      service.recordCounter("http_requests", 1, { method: "GET", status: "200" });
      service.recordCounter("http_requests", 1, { method: "POST", status: "201" });

      const summary = service.getSummary();
      expect(summary["http_requests"]).toBeDefined();
      expect(summary["http_requests"].count).toBe(2);
    });
  });

  describe("recordGauge", () => {
    it("records gauge metrics with proper aggregation", () => {
      service.recordGauge("memory_mb", 256);
      service.recordGauge("memory_mb", 512);
      service.recordGauge("memory_mb", 384);

      const summary = service.getSummary();
      expect(summary["memory_mb"].avg).toBe(384);
      expect(summary["memory_mb"].min).toBe(256);
      expect(summary["memory_mb"].max).toBe(512);
    });
  });

  describe("recordHistogram", () => {
    it("records histogram metrics for latency", () => {
      service.recordHistogram("response_time_ms", 100);
      service.recordHistogram("response_time_ms", 150);
      service.recordHistogram("response_time_ms", 200);

      const summary = service.getSummary();
      expect(summary["response_time_ms"].avg).toBe(150);
    });
  });

  describe("getSummary", () => {
    it("returns aggregated metrics with statistics", () => {
      service.recordCounter("errors", 2);
      service.recordGauge("cpu_percent", 45);

      const summary = service.getSummary();
      expect(Object.keys(summary)).toContain("errors");
      expect(Object.keys(summary)).toContain("cpu_percent");
      expect(summary["errors"].sum).toBe(2);
      expect(summary["cpu_percent"].lastValue).toBe(45);
    });
  });

  describe("reset", () => {
    it("clears all metrics", () => {
      service.recordCounter("test");
      expect(Object.keys(service.getSummary()).length).toBeGreaterThan(0);

      service.reset();
      expect(Object.keys(service.getSummary()).length).toBe(0);
    });
  });
});
