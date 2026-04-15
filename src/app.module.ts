import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { AppConfigModule } from "./config/config.module";
import { validateEnvironment } from "./config/env.schema";
import { MailModule } from "./mail/mail.module";
import { OtpModule } from "./otp/otp.module";
import { TeamsModule } from "./teams/teams.module";
import { WorkflowModule } from "./workflow/workflow.module";
import { ObservabilityModule } from "./observability/observability.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnvironment,
    }),
    AppConfigModule,
    MailModule,
    OtpModule,
    TeamsModule,
    WorkflowModule,
    ObservabilityModule,
  ],
})
export class AppModule {}
