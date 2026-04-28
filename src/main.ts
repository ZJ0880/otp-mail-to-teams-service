import { Logger, ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { AppConfigService } from "./config/app-config.service";
import { setupSwagger } from "./config/swagger.config";
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
  const adminPanelHost = config.adminPanelBaseUrl ? safeHost(config.adminPanelBaseUrl) : "not-configured";
  const mailHost = config.mailHost;
  const port = config.appPort;

  app.enableCors({
    origin: config.corsOrigins,
  });

  if (process.env.NODE_ENV !== "production") {
    setupSwagger(app, logger);
  }

  await app.listen(port);

  logger.log("Credential Requests API started.");
  logger.log(
    `Configuration loaded: mailHost=${mailHost} pollingEnabled=${config.enablePolling} webhookHost=${webhookHost} approvalPanelHost=${adminPanelHost} corsOrigins=${config.corsOrigins.join(",")}`,
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
