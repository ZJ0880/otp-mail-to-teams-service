import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { AppConfigModule } from "./config/config.module";
import { DatabaseModule } from "./database/database.module";
import { validateEnvironment } from "./config/env.schema";
import { MailModule } from "./mail/mail.module";
import { OtpModule } from "./otp/otp.module";
import { SecurityModule } from "./security/security.module";
import { TeamsModule } from "./teams/teams.module";
import { ObservabilityModule } from "./observability/observability.module";
import { AdminAuthModule } from "./contexts/admin-auth/infrastructure/nest/admin-auth.module";
import { UsersModule } from "./contexts/users/infrastructure/nest/users.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnvironment,
    }),
    AdminAuthModule,
    UsersModule,
    AppConfigModule,
    DatabaseModule,
    SecurityModule,
    MailModule,
    OtpModule,
    TeamsModule,
    ObservabilityModule,
  ],
})
export class AppModule {}
