import { AuditEventRepositoryPort } from "../ports/out/audit-event-repository.port";
import { ClockPort } from "../ports/out/clock.port";
import { CredentialRequestRepositoryPort } from "../ports/out/credential-request-repository.port";
import { RejectCredentialRequestInput, RejectCredentialRequestOutput, RejectCredentialRequestUseCase } from "../use-cases/reject-credential-request.use-case";
import {
  CredentialRequestConflictError,
  CredentialRequestNotFoundError,
} from "../errors/credential-request.errors";

export class RejectCredentialRequestService implements RejectCredentialRequestUseCase {
  constructor(
    private readonly credentialRequestRepository: CredentialRequestRepositoryPort,
    private readonly auditEventRepository: AuditEventRepositoryPort,
    private readonly clock: ClockPort,
  ) {}

  async execute(input: RejectCredentialRequestInput): Promise<RejectCredentialRequestOutput> {
    const request = await this.credentialRequestRepository.getById(input.requestId);
    if (!request) {
      throw new CredentialRequestNotFoundError();
    }

    if (request.status !== "PENDING") {
      if (request.status !== "REJECTED") {
        throw new CredentialRequestConflictError("Credential request is already approved");
      }

      return {
        requestId: request.id,
        status: "REJECTED",
        decidedAt: request.decidedAt!,
      };
    }

    const decidedAt = this.clock.now();
    const decided = request.reject(decidedAt, input.reason);

    await this.credentialRequestRepository.saveDecision(input.requestId, {
      status: decided.status as "REJECTED",
      decidedAt,
      decisionReason: input.reason,
    });

    await this.auditEventRepository.append({
      type: "CREDENTIAL_REQUEST_REJECTED",
      requestId: input.requestId,
      occurredAt: decidedAt,
      details: { reason: input.reason },
    });

    return {
      requestId: decided.id,
      status: decided.status as "REJECTED",
      decidedAt,
    };
  }
}