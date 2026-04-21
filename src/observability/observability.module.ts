import { Module } from "@nestjs/common";
import { MetricsService } from "./metrics.service";
import { RateLimiterService } from "./rate-limiter.service";
import { HealthCheckService } from "./health-check.service";

@Module({
  providers: [MetricsService, RateLimiterService, HealthCheckService],
  exports: [MetricsService, RateLimiterService, HealthCheckService],
})
export class ObservabilityModule {}
