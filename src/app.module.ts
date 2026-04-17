import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { AuthModule } from "./auth/auth.module";
import { AppConfigModule } from "./config/config.module";
import { DatabaseModule } from "./database/database.module";
import { validateEnvironment } from "./config/env.schema";
import { MailModule } from "./mail/mail.module";
import { OtpModule } from "./otp/otp.module";
import { SecurityModule } from "./security/security.module";
import { TeamsModule } from "./teams/teams.module";
import { WorkflowModule } from "./workflow/workflow.module";
import { ObservabilityModule } from "./observability/observability.module";
import { SettingsModule } from "./settings/settings.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnvironment,
    }),
    AuthModule,
    AppConfigModule,
    DatabaseModule,
    SecurityModule,
    MailModule,
    OtpModule,
    TeamsModule,
    SettingsModule,
    WorkflowModule,
    ObservabilityModule,
  ],
})
export class AppModule {}
