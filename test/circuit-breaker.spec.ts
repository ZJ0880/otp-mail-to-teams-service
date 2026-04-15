import { CircuitBreaker } from "../src/observability/retry.utils";

describe("CircuitBreaker", () => {
  let breaker: CircuitBreaker;
  let callCount: number;

  beforeEach(() => {
    breaker = new CircuitBreaker("test-service", 3, 100);
    callCount = 0;
  });

  describe("execute", () => {
    it("allows requests when circuit is closed", async () => {
      const mockFn = async () => {
        callCount++;
        return "success";
      };

      const result = await breaker.execute(mockFn);
      expect(result).toBe("success");
      expect(callCount).toBe(1);
    });

    it("fails and opens circuit after threshold failures", async () => {
      const mockFn = async () => {
        callCount++;
        throw new Error("Service error");
      };

      for (let i = 0; i < 3; i++) {
        try {
          await breaker.execute(mockFn);
        } catch {
        }
      }

      expect(breaker.getState()).toBe("open");

      try {
        await breaker.execute(mockFn);
        fail("Should have thrown circuit open error");
      } catch (error) {
        expect((error as Error).message).toContain("Circuit breaker");
        expect(callCount).toBe(3);
      }
    });

    it("transitions to half-open after timeout", async () => {
      const mockFn = async () => {
        throw new Error("Service error");
      };

      for (let i = 0; i < 3; i++) {
        try {
          await breaker.execute(mockFn);
        } catch {
        }
      }

      expect(breaker.getState()).toBe("open");

      await new Promise((resolve) => setTimeout(resolve, 150));

      const mockFnSuccess = async () => {
        return "success";
      };

      breaker = new CircuitBreaker("test-service", 3, 100);
      for (let i = 0; i < 3; i++) {
        try {
          await breaker.execute(mockFn);
        } catch {
        }
      }

      await new Promise((resolve) => setTimeout(resolve, 150));

      const result = await breaker.execute(mockFnSuccess);
      expect(result).toBe("success");
      expect(breaker.getState()).toBe("half-open");
    });

    it("closes circuit after successful half-open requests", async () => {
      const mockFnFail = async () => {
        throw new Error("Service error");
      };

      for (let i = 0; i < 3; i++) {
        try {
          await breaker.execute(mockFnFail);
        } catch {
        }
      }

      expect(breaker.getState()).toBe("open");
      breaker.reset();

      expect(breaker.getState()).toBe("closed");
    });
  });

  describe("getState", () => {
    it("returns current circuit state", () => {
      expect(breaker.getState()).toBe("closed");
    });
  });

  describe("reset", () => {
    it("resets circuit to closed state", async () => {
      const mockFn = async () => {
        throw new Error("Service error");
      };

      for (let i = 0; i < 3; i++) {
        try {
          await breaker.execute(mockFn);
        } catch {
        }
      }

      expect(breaker.getState()).toBe("open");

      breaker.reset();
      expect(breaker.getState()).toBe("closed");
    });
  });
});
