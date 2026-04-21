import { Injectable, NotFoundException } from "@nestjs/common";
import { TicketStatus } from "@prisma/client";
import { PrismaService } from "../database/prisma.service";
import { ApprovalLinkPayload, ApprovalLinkService } from "./approval-link.service";

@Injectable()
export class ApprovalActionService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly approvalLinkService: ApprovalLinkService,
  ) {}

  async renderLandingPage(token: string): Promise<string> {
    const payload = this.approvalLinkService.verifyLinkToken(token);

    if (payload.decision === "details") {
      return this.renderDetailsPage(payload);
    }

    const result = await this.executeDecision(token);
    return this.renderResultPage(payload, result);
  }

  async executeDecision(token: string): Promise<{ requestId: string; decision: string; status: TicketStatus }> {
    const payload = this.approvalLinkService.verifyLinkToken(token);
    const ticketRequest = await this.prismaService.ticketRequest.findUnique({
      where: { id: payload.requestId },
    });

    if (!ticketRequest) {
      throw new NotFoundException("Ticket request not found");
    }

    if (ticketRequest.status === TicketStatus.SUCCESS || ticketRequest.status === TicketStatus.FAILED) {
      const effectiveDecision =
        ticketRequest.status === TicketStatus.SUCCESS ? "approve" : "reject";

      return {
        requestId: payload.requestId,
        decision: effectiveDecision,
        status: ticketRequest.status,
      };
    }

    if (payload.decision === "approve") {
      await this.prismaService.ticketRequest.update({
        where: { id: payload.requestId },
        data: {
          status: TicketStatus.SUCCESS,
          finishedAt: new Date(),
        },
      });

      return {
        requestId: payload.requestId,
        decision: payload.decision,
        status: TicketStatus.SUCCESS,
      };
    }

    if (payload.decision === "reject") {
      await this.prismaService.ticketRequest.update({
        where: { id: payload.requestId },
        data: {
          status: TicketStatus.FAILED,
          finishedAt: new Date(),
        },
      });

      return {
        requestId: payload.requestId,
        decision: payload.decision,
        status: TicketStatus.FAILED,
      };
    }

    return {
      requestId: payload.requestId,
      decision: payload.decision,
      status: ticketRequest.status,
    };
  }

  private renderResultPage(
    payload: ApprovalLinkPayload,
    result: { requestId: string; decision: string; status: TicketStatus },
  ): string {
    const actionText = result.status === TicketStatus.SUCCESS ? "Aceptada" : "Rechazada";
    const requestedDecision = payload.decision === "approve" ? "approve" : "reject";
    const finalDecision = result.status === TicketStatus.SUCCESS ? "approve" : "reject";
    const notice =
      requestedDecision === finalDecision
        ? "La solicitud se procesó correctamente con esta acción."
        : "La solicitud ya estaba resuelta con una acción anterior.";

    return this.htmlPage(
      `Solicitud ${actionText}`,
      `
        <p>La solicitud de <strong>${this.escapeHtml(payload.requesterName)}</strong> ya fue procesada.</p>
        <p>${this.escapeHtml(notice)}</p>
        <div style="display:grid;gap:8px;margin-top:16px;">
          <div><strong>Plataforma:</strong> ${this.escapeHtml(payload.platform)}</div>
          <div><strong>Curso:</strong> ${this.escapeHtml(payload.course)}</div>
          <div><strong>Decisión:</strong> ${this.escapeHtml(result.decision)}</div>
          <div><strong>Estado:</strong> ${this.escapeHtml(result.status)}</div>
          <div><strong>Solicitud:</strong> ${this.escapeHtml(result.requestId)}</div>
        </div>
      `,
    );
  }

  private renderDetailsPage(payload: ApprovalLinkPayload): string {
    return this.htmlPage(
      "Detalle de solicitud",
      `
        <div style="display:grid;gap:12px;">
          <div><strong>Solicitante:</strong> ${this.escapeHtml(payload.requesterName)}</div>
          <div><strong>Correo:</strong> ${this.escapeHtml(payload.requesterEmail)}</div>
          <div><strong>Plataforma:</strong> ${this.escapeHtml(payload.platform)}</div>
          <div><strong>Curso:</strong> ${this.escapeHtml(payload.course)}</div>
          <div><strong>Motivo:</strong> ${this.escapeHtml(payload.reason ?? 'Sin motivo')}</div>
          <div><strong>Fecha:</strong> ${this.escapeHtml(payload.requestedAt)}</div>
          <div><strong>Solicitud:</strong> ${this.escapeHtml(payload.requestId)}</div>
        </div>
      `,
    );
  }

  private htmlPage(title: string, content: string): string {
    return `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${this.escapeHtml(title)}</title>
  <style>
    body { font-family: Arial, sans-serif; background:#f3f4f6; margin:0; padding:32px; }
    .card { max-width:720px; margin:0 auto; background:#fff; border-radius:16px; box-shadow:0 12px 28px rgba(0,0,0,.08); padding:24px; }
    h1 { margin-top:0; font-size:24px; }
  </style>
</head>
<body>
  <div class="card">
    <h1>${this.escapeHtml(title)}</h1>
    ${content}
  </div>
</body>
</html>`;
  }

  private escapeHtml(value: string): string {
    return value
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  }
}
