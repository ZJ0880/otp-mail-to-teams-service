import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { MailModule } from "../mail/mail.module";
import { ObservabilityModule } from "../observability/observability.module";
import { OtpModule } from "../otp/otp.module";
import { TeamsModule } from "../teams/teams.module";
import { MailPollingService } from "./mail-polling.service";
import { ManualOtpProcessingService } from "./manual-otp-processing.service";
import { OtpProcessingService } from "./otp-processing.service";
import { AuditController } from "./audit.controller";
import { TicketController } from "./ticket.controller";
import { TicketRequestsService } from "./ticket-requests.service";

@Module({
  imports: [AuthModule, MailModule, OtpModule, TeamsModule, ObservabilityModule],
  controllers: [TicketController, AuditController],
  providers: [
    OtpProcessingService,
    ManualOtpProcessingService,
    MailPollingService,
    TicketRequestsService,
  ],
})
export class WorkflowModule {}
