import { Logger } from "@nestjs/common";

export interface RetryConfig {
  maxRetries: number;
  initialDelayMs: number;
  maxDelayMs: number;
  backoffMultiplier: number;
}

export class RetryableError extends Error {
  constructor(
    message: string,
    public readonly lastError: Error,
    public readonly attempts: number,
  ) {
    super(message);
    this.name = "RetryableError";
  }
}

export function Retryable(config: Partial<RetryConfig> = {}) {
  const defaultConfig: RetryConfig = {
    maxRetries: 3,
    initialDelayMs: 100,
    maxDelayMs: 10000,
    backoffMultiplier: 2,
    ...config,
  };

  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    const logger = new Logger(`${target.constructor.name}.${propertyKey}`);

    descriptor.value = async function (...args: any[]) {
      let lastError: Error | null = null;
      let delay = defaultConfig.initialDelayMs;

      for (let attempt = 1; attempt <= defaultConfig.maxRetries + 1; attempt++) {
        try {
          logger.debug(`Attempt ${attempt}/${defaultConfig.maxRetries + 1}`);
          return await originalMethod.apply(this, args);
        } catch (error) {
          lastError = error instanceof Error ? error : new Error(String(error));
          logger.warn(`Attempt ${attempt} failed: ${lastError.message}`);

          if (attempt <= defaultConfig.maxRetries) {
            logger.log(`Retrying in ${delay}ms...`);
            await new Promise((resolve) => setTimeout(resolve, delay));
            delay = Math.min(delay * defaultConfig.backoffMultiplier, defaultConfig.maxDelayMs);
          }
        }
      }

      throw new RetryableError(
        `Failed after ${defaultConfig.maxRetries + 1} attempts`,
        lastError!,
        defaultConfig.maxRetries + 1,
      );
    };

    return descriptor;
  };
}

export class CircuitBreaker {
  private state: "closed" | "open" | "half-open" = "closed";
  private failureCount = 0;
  private successCount = 0;
  private lastFailureTime: number | null = null;
  private readonly logger: Logger;

  constructor(
    private readonly name: string,
    private readonly threshold: number = 5,
    private readonly timeout: number = 60000,
  ) {
    this.logger = new Logger(`CircuitBreaker[${name}]`);
  }

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === "open") {
      if (Date.now() - this.lastFailureTime! > this.timeout) {
        this.logger.log(`Transitioning to half-open state`);
        this.state = "half-open";
        this.successCount = 0;
      } else {
        throw new Error(`Circuit breaker ${this.name} is OPEN`);
      }
    }

    try {
      const result = await fn();

      if (this.state === "half-open") {
        this.successCount++;
        if (this.successCount >= 3) {
          this.logger.log(`Transitioning to closed state`);
          this.state = "closed";
          this.failureCount = 0;
          this.successCount = 0;
        }
      }

      return result;
    } catch (error) {
      this.failureCount++;
      this.lastFailureTime = Date.now();
      this.logger.warn(`Failure count: ${this.failureCount}/${this.threshold}`);

      if (this.failureCount >= this.threshold) {
        this.logger.error(`Circuit breaker ${this.name} triggered - transitioning to open state`);
        this.state = "open";
      }

      throw error;
    }
  }

  getState(): "closed" | "open" | "half-open" {
    return this.state;
  }

  reset(): void {
    this.state = "closed";
    this.failureCount = 0;
    this.successCount = 0;
    this.lastFailureTime = null;
    this.logger.log(`Circuit breaker reset`);
  }
}
