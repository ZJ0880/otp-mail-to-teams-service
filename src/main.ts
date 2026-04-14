import { Logger } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { AppConfigService } from "./config/app-config.service";
import { AppModule } from "./app.module";

async function bootstrap(): Promise<void> {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ["error", "warn", "log", "debug", "verbose"],
  });
  app.enableShutdownHooks();

  const logger = new Logger("Bootstrap");
  const config = app.get(AppConfigService);
  const webhookHost = safeHost(config.teamsWebhookUrl);

  logger.log("OTP mail-to-Teams worker started.");
  logger.log(
    `Configuration loaded: host=${config.mailHost}:${config.mailPort} mailbox=${config.mailMailbox} polling=${config.pollingIntervalSeconds}s webhookHost=${webhookHost}`,
  );
}

function safeHost(value: string): string {
  try {
    return new URL(value).host;
  } catch {
    return "invalid-url";
  }
}

bootstrap();
