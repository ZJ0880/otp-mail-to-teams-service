import { AuditEventRepositoryPort } from "../ports/out/audit-event-repository.port";
import { ApprovalTokenServicePort } from "../ports/out/approval-token-service.port";
import { ClockPort } from "../ports/out/clock.port";
import { CredentialRequestRepositoryPort } from "../ports/out/credential-request-repository.port";
import { ExecuteApprovalTokenDecisionInput, ExecuteApprovalTokenDecisionOutput, ExecuteApprovalTokenDecisionUseCase } from "../use-cases/execute-approval-token-decision.use-case";
import { CredentialRequestNotFoundError } from "../errors/credential-request.errors";

export class ExecuteApprovalTokenDecisionService implements ExecuteApprovalTokenDecisionUseCase {
  constructor(
    private readonly approvalTokenService: ApprovalTokenServicePort,
    private readonly credentialRequestRepository: CredentialRequestRepositoryPort,
    private readonly auditEventRepository: AuditEventRepositoryPort,
    private readonly clock: ClockPort,
  ) {}

  async execute(input: ExecuteApprovalTokenDecisionInput): Promise<ExecuteApprovalTokenDecisionOutput> {
    const payload = await this.approvalTokenService.verify(input.token);
    const request = await this.credentialRequestRepository.getById(payload.requestId);

    if (!request) {
      throw new CredentialRequestNotFoundError();
    }

    if (request.status !== "PENDING") {
      return {
        requestId: request.id,
        status: request.status,
        decidedAt: request.decidedAt ?? request.createdAt,
      };
    }

    const decidedAt = this.clock.now();
    const nextStatus = payload.decision === "APPROVE" ? "APPROVED" : "REJECTED";
    const decided = payload.decision === "APPROVE"
      ? request.approve(decidedAt)
      : request.reject(decidedAt);

    await this.credentialRequestRepository.saveDecision(payload.requestId, {
      status: nextStatus,
      decidedAt,
    });

    await this.auditEventRepository.append({
      type: "APPROVAL_TOKEN_EXECUTED",
      requestId: payload.requestId,
      occurredAt: decidedAt,
      details: {
        decision: payload.decision,
        issuedAtIso: payload.issuedAt.toIsoString(),
        expiresAtIso: payload.expiresAt.toIsoString(),
      },
    });

    return {
      requestId: decided.id,
      status: decided.status as "APPROVED" | "REJECTED",
      decidedAt,
    };
  }
}