import { AuditEventRepositoryPort } from "../ports/out/audit-event-repository.port";
import { ClockPort } from "../ports/out/clock.port";
import { CredentialRequestRepositoryPort } from "../ports/out/credential-request-repository.port";
import { ApproveCredentialRequestInput, ApproveCredentialRequestOutput, ApproveCredentialRequestUseCase } from "../use-cases/approve-credential-request.use-case";
import {
  CredentialRequestConflictError,
  CredentialRequestNotFoundError,
} from "../errors/credential-request.errors";

export class ApproveCredentialRequestService implements ApproveCredentialRequestUseCase {
  constructor(
    private readonly credentialRequestRepository: CredentialRequestRepositoryPort,
    private readonly auditEventRepository: AuditEventRepositoryPort,
    private readonly clock: ClockPort,
  ) {}

  async execute(input: ApproveCredentialRequestInput): Promise<ApproveCredentialRequestOutput> {
    const request = await this.credentialRequestRepository.getById(input.requestId);
    if (!request) {
      throw new CredentialRequestNotFoundError();
    }

    if (request.status !== "PENDING") {
      if (request.status !== "APPROVED") {
        throw new CredentialRequestConflictError("Credential request is already rejected");
      }

      return {
        requestId: request.id,
        status: "APPROVED",
        decidedAt: request.decidedAt!,
      };
    }

    const decidedAt = this.clock.now();
    const decided = request.approve(decidedAt, input.reason);

    await this.credentialRequestRepository.saveDecision(input.requestId, {
      status: decided.status as "APPROVED",
      decidedAt,
      decisionReason: input.reason,
    });

    await this.auditEventRepository.append({
      type: "CREDENTIAL_REQUEST_APPROVED",
      requestId: input.requestId,
      occurredAt: decidedAt,
      details: { reason: input.reason },
    });

    return {
      requestId: decided.id,
      status: decided.status as "APPROVED",
      decidedAt,
    };
  }
}