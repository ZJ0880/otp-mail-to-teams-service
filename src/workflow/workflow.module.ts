import { Module } from "@nestjs/common";
import { AdminAuthModule } from "../contexts/admin-auth/infrastructure/nest/admin-auth.module";
import { MailModule } from "../mail/mail.module";
import { ObservabilityModule } from "../observability/observability.module";
import { OtpModule } from "../otp/otp.module";
import { TeamsModule } from "../teams/teams.module";
import { MailPollingService } from "./mail-polling.service";
import { ManualOtpProcessingService } from "./manual-otp-processing.service";
import { OtpProcessingService } from "./otp-processing.service";
import { ApprovalActionService } from "./approval-action.service";
import { ApprovalsController } from "./approvals.controller";
import { ApprovalLinkService } from "./approval-link.service";
import { RequestApprovalNotifierService } from "./request-approval-notifier.service";
import { AuditController } from "./audit.controller";
import { TicketController } from "./ticket.controller";
import { TicketRequestsService } from "./ticket-requests.service";

@Module({
  imports: [AdminAuthModule, MailModule, OtpModule, TeamsModule, ObservabilityModule],
  controllers: [TicketController, AuditController, ApprovalsController],
  providers: [
    OtpProcessingService,
    ManualOtpProcessingService,
    MailPollingService,
    TicketRequestsService,
    ApprovalLinkService,
    RequestApprovalNotifierService,
    ApprovalActionService,
  ],
})
export class WorkflowModule {}
