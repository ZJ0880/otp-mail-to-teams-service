import { Injectable, Logger } from "@nestjs/common";
import { AppConfigService } from "../config/app-config.service";
import { TeamsWebhookNotifierService } from "../teams/infrastructure/teams-webhook-notifier.service";
import { buildStyledAdaptiveCard, TeamsCardAction, TeamsCardField } from "../teams/infrastructure/teams-card.builder";
import { ApprovalDecision, ApprovalLinkService } from "./approval-link.service";
import { TicketRequestResponseItem } from "./ticket-requests.dto";

@Injectable()
export class RequestApprovalNotifierService {
  private readonly logger = new Logger(RequestApprovalNotifierService.name);

  constructor(
    private readonly appConfigService: AppConfigService,
    private readonly approvalLinkService: ApprovalLinkService,
    private readonly teamsWebhookNotifierService: TeamsWebhookNotifierService,
  ) {}

  async notifyRequestCreated(request: TicketRequestResponseItem): Promise<void> {
    const approvalBaseUrl = this.appConfigService.adminPanelBaseUrl;
    if (!approvalBaseUrl) {
      throw new Error("APP_ADMIN_PANEL_BASE_URL is required to build approval links");
    }

    const fields: TeamsCardField[] = [
      { label: "Solicitante", value: request.requesterName },
      { label: "Plataforma", value: request.platform },
      { label: "Curso", value: request.course },
      { label: "Fecha", value: request.requestedAt },
    ];

    const actions: TeamsCardAction[] = [
      this.buildAction(request, approvalBaseUrl, "approve", "Aceptar", "positive"),
      this.buildAction(request, approvalBaseUrl, "reject", "Denegar", "destructive"),
      this.buildAction(request, approvalBaseUrl, "details", "Ver detalles", "default"),
    ];

    const adaptiveCard = buildStyledAdaptiveCard(
      "Nueva Solicitud de Credenciales",
      fields,
      actions,
      {
        subtitle: "Revisa la solicitud y toma una decisión desde el enlace seguro.",
      },
    );

    const fallbackText = [
      "Nueva Solicitud de Credenciales",
      `Solicitante: ${request.requesterName}`,
      `Plataforma: ${request.platform}`,
      `Curso: ${request.course}`,
      `RequestId: ${request.id}`,
    ].join(" | ");

    const webhookUrl = this.appConfigService.teamsWebhookUrl;
    this.logger.log(`Sending approval card for request ${request.id}`);

    await this.teamsWebhookNotifierService.sendAdaptiveCard(webhookUrl, adaptiveCard, fallbackText);
  }

  private buildAction(
    request: TicketRequestResponseItem,
    baseUrl: string,
    decision: ApprovalDecision,
    title: string,
    style: "default" | "positive" | "destructive",
  ): TeamsCardAction {
    const token = this.approvalLinkService.createLinkToken({
      requestId: request.id,
      decision,
      requesterName: request.requesterName,
      requesterEmail: request.requesterEmail,
      platform: request.platform,
      course: request.course,
      reason: request.note,
      requestedAt: request.requestedAt,
    });
    const approvalBaseUrl = this.resolveApprovalBaseUrl(baseUrl);

    return {
      title,
      url: `${approvalBaseUrl}/${token}`,
      style,
    };
  }

  private resolveApprovalBaseUrl(baseUrl: string): string {
    const normalized = baseUrl.trim().replace(/\/$/, "");
    if (!normalized) {
      throw new Error("APP_ADMIN_PANEL_BASE_URL cannot be empty");
    }

    if (normalized.endsWith("/api/approvals")) {
      return normalized;
    }

    return `${normalized}/api/approvals`;
  }
}
