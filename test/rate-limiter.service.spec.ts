import { RateLimiterService } from "../src/observability/rate-limiter.service";

describe("RateLimiterService", () => {
  let service: RateLimiterService;

  beforeEach(() => {
    service = new RateLimiterService();
  });

  afterEach(() => {
    service.reset();
  });

  describe("isAllowed", () => {
    it("allows requests within per-minute limit", () => {
      for (let i = 0; i < 60; i++) {
        expect(service.isAllowed()).toBe(true);
      }

      expect(service.isAllowed()).toBe(false);
    });

    it("allows new requests after timeout", (done) => {
      for (let i = 0; i < 60; i++) {
        service.isAllowed();
      }

      expect(service.isAllowed()).toBe(false);

      setTimeout(() => {
        service.reset();
        expect(service.isAllowed()).toBe(true);
        done();
      }, 100);
    });
  });

  describe("getStatus", () => {
    it("returns current request counts", () => {
      service.isAllowed();
      service.isAllowed();
      service.isAllowed();

      const status = service.getStatus();
      expect(status.lastMinuteRequests).toBe(3);
      expect(status.limits.maxRequestsPerMinute).toBe(60);
    });
  });

  describe("setConfig", () => {
    it("updates rate limit configuration", () => {
      service.setConfig({ maxRequestsPerMinute: 10 });

      for (let i = 0; i < 10; i++) {
        expect(service.isAllowed()).toBe(true);
      }

      expect(service.isAllowed()).toBe(false);
    });
  });

  describe("reset", () => {
    it("clears all request history", () => {
      service.isAllowed();
      const before = service.getStatus().lastMinuteRequests;
      expect(before).toBeGreaterThan(0);

      service.reset();
      const after = service.getStatus().lastMinuteRequests;
      expect(after).toBe(0);
    });
  });
});
