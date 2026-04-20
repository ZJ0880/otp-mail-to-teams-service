import { INestApplication, Logger, ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
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

  if (process.env.NODE_ENV !== "production") {
    setupSwagger(app);
    logger.log("Swagger docs enabled at /api/docs");
  }

  await app.listen(port);

  logger.log("OTP mail-to-Teams API started.");
  logger.log(
    `Configuration loaded: host=${config.mailHost}:${config.mailPort} mailbox=${config.mailMailbox} pollingEnabled=${config.enablePolling} webhookHost=${webhookHost}`,
  );
  logger.log(`HTTP server running on port ${port} with prefix /api`);
}

function setupSwagger(app: INestApplication): void {
  const swaggerConfig = new DocumentBuilder()
    .setTitle("OTP Mail to Teams API")
    .setDescription("API documentation for OTP extraction and Teams delivery workflow")
    .setVersion("1.0")
    .addBearerAuth(
      {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
      },
      "bearer",
    )
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup("api/docs", app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });
}

function safeHost(value: string): string {
  try {
    return new URL(value).host;
  } catch {
    return "invalid-url";
  }
}

bootstrap();
