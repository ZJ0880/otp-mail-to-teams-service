import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { AppConfigService } from "../config/app-config.service";
import { OtpProcessingService } from "./otp-processing.service";

@Injectable()
export class MailPollingService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(MailPollingService.name);
  private timer?: NodeJS.Timeout;
  private running = false;

  constructor(
    private readonly otpProcessingService: OtpProcessingService,
    private readonly appConfigService: AppConfigService,
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
      return;
    }

    this.running = true;
    const startedAt = Date.now();
    this.logger.log("Polling cycle started.");

    try {
      await this.otpProcessingService.processUnreadMessages();
      const durationMs = Date.now() - startedAt;
      this.logger.log(`Polling cycle finished in ${durationMs} ms.`);
    } finally {
      this.running = false;
    }
  }
}
