import { INestApplication, Logger } from "@nestjs/common";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";

export function setupSwagger(app: INestApplication, logger: Logger): void {
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

  logger.log("Swagger docs enabled at /api/docs");
}