import { Injectable, Logger } from "@nestjs/common";

interface RateLimitConfig {
  maxRequestsPerMinute: number;
  maxRequestsPerHour: number;
}

@Injectable()
export class RateLimiterService {
  private readonly logger = new Logger(RateLimiterService.name);
  private requestTimestamps: number[] = [];
  private config: RateLimitConfig;

  constructor() {
    this.config = {
      maxRequestsPerMinute: 60,
      maxRequestsPerHour: 900,
    };
  }

  isAllowed(): boolean {
    const now = Date.now();
    const oneMinuteAgo = now - 60 * 1000;
    const oneHourAgo = now - 60 * 60 * 1000;

    this.requestTimestamps = this.requestTimestamps.filter((ts) => ts > oneHourAgo);

    const lastMinuteRequests = this.requestTimestamps.filter((ts) => ts > oneMinuteAgo).length;
    if (lastMinuteRequests >= this.config.maxRequestsPerMinute) {
      this.logger.warn(
        `Rate limit exceeded (per minute): ${lastMinuteRequests}/${this.config.maxRequestsPerMinute}`,
      );
      return false;
    }

    if (this.requestTimestamps.length >= this.config.maxRequestsPerHour) {
      this.logger.warn(
        `Rate limit exceeded (per hour): ${this.requestTimestamps.length}/${this.config.maxRequestsPerHour}`,
      );
      return false;
    }

    this.requestTimestamps.push(now);
    return true;
  }

  getStatus(): {
    lastMinuteRequests: number;
    lastHourRequests: number;
    limits: RateLimitConfig;
  } {
    const now = Date.now();
    const oneMinuteAgo = now - 60 * 1000;

    const lastMinuteRequests = this.requestTimestamps.filter((ts) => ts > oneMinuteAgo).length;
    const lastHourRequests = this.requestTimestamps.length;

    return {
      lastMinuteRequests,
      lastHourRequests,
      limits: this.config,
    };
  }

  setConfig(config: Partial<RateLimitConfig>): void {
    this.config = { ...this.config, ...config };
    this.logger.log(`Rate limiter config updated`, { config: this.config });
  }

  reset(): void {
    this.requestTimestamps = [];
    this.logger.log("Rate limiter reset");
  }
}
