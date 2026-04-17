import { Logger, ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { AppConfigService } from "./config/app-config.service";
import { AppModule } from "./app.module";

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, {
    logger: ["error", "warn", "log", "debug", "verbose"],
  });
  app.enableShutdownHooks();
  app.setGlobalPrefix("api");
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  const logger = new Logger("Bootstrap");
  const config = app.get(AppConfigService);
  const webhookHost = safeHost(config.teamsWebhookUrl);
  const port = config.appPort;

  app.enableCors({
    origin: config.corsOrigins,
  });

  await app.listen(port);

  logger.log("OTP mail-to-Teams API started.");
  logger.log(
    `Configuration loaded: host=${config.mailHost}:${config.mailPort} mailbox=${config.mailMailbox} pollingEnabled=${config.enablePolling} webhookHost=${webhookHost}`,
  );
  logger.log(`HTTP server running on port ${port} with prefix /api`);
}

function safeHost(value: string): string {
  try {
    return new URL(value).host;
  } catch {
    return "invalid-url";
  }
}

bootstrap();
