import { Module } from "@nestjs/common";
import { MailModule } from "../mail/mail.module";
import { ObservabilityModule } from "../observability/observability.module";
import { OtpModule } from "../otp/otp.module";
import { TeamsModule } from "../teams/teams.module";
import { MailPollingService } from "./mail-polling.service";
import { OtpProcessingService } from "./otp-processing.service";

@Module({
  imports: [MailModule, OtpModule, TeamsModule, ObservabilityModule],
  providers: [OtpProcessingService, MailPollingService],
})
export class WorkflowModule {}
