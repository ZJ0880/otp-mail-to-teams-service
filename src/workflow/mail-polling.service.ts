import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { AppConfigService } from "../config/app-config.service";
import { OtpProcessingService } from "./otp-processing.service";
import { MetricsService } from "../observability/metrics.service";
import { HealthCheckService } from "../observability/health-check.service";
import { RateLimiterService } from "../observability/rate-limiter.service";

@Injectable()
export class MailPollingService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(MailPollingService.name);
  private timer?: NodeJS.Timeout;
  private running = false;

  constructor(
    private readonly otpProcessingService: OtpProcessingService,
    private readonly appConfigService: AppConfigService,
    private readonly metricsService: MetricsService,
    private readonly healthCheckService: HealthCheckService,
    private readonly rateLimiterService: RateLimiterService,
  ) {}

  async onModuleInit(): Promise<void> {
    this.logger.log(
      `Initializing polling worker with interval ${this.appConfigService.pollingIntervalSeconds} seconds.`,
    );
    await this.executeCycle();

    this.timer = setInterval(async () => {
      await this.executeCycle();
    }, this.appConfigService.pollingIntervalSeconds * 1000);

    this.logger.log(
      `Polling started every ${this.appConfigService.pollingIntervalSeconds} seconds.`,
    );
  }

  async onModuleDestroy(): Promise<void> {
    if (this.timer) {
      clearInterval(this.timer);
    }
  }

  private async executeCycle(): Promise<void> {
    if (this.running) {
      this.logger.warn("Skipping cycle because previous cycle is still running.");
      this.metricsService.recordCounter("polling.skipped");
      return;
    }

    if (!this.rateLimiterService.isAllowed()) {
      this.logger.warn("Rate limit exceeded, skipping cycle.");
      this.metricsService.recordCounter("polling.rate_limited");
      return;
    }

    this.running = true;
    const startedAt = Date.now();
    this.logger.log("Polling cycle started.");

    try {
      await this.otpProcessingService.processUnreadMessages();
      const durationMs = Date.now() - startedAt;
      this.logger.log(`Polling cycle finished in ${durationMs} ms.`);
      
      this.metricsService.recordHistogram("polling.duration_ms", durationMs);
      this.metricsService.recordCounter("polling.completed");
      this.healthCheckService.recordCycleCheck("ok", durationMs);
    } catch (error) {
      const durationMs = Date.now() - startedAt;
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`Polling cycle failed after ${durationMs}ms: ${errorMessage}`);
      
      this.metricsService.recordCounter("polling.failed");
      this.metricsService.recordHistogram("polling.duration_ms", durationMs);
      this.healthCheckService.recordCycleCheck("error", durationMs);
    } finally {
      this.running = false;
    }
  }
}
