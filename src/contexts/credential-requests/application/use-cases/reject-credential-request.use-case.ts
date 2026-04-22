import type { UseCase } from "../contracts/use-case";
import type { CredentialRequestId, Instant, RequestStatus } from "../../domain";

export interface RejectCredentialRequestInput {
  requestId: CredentialRequestId;
  reason?: string;
}

export interface RejectCredentialRequestOutput {
  requestId: CredentialRequestId;
  status: Extract<RequestStatus, "REJECTED">;
  decidedAt: Instant;
}

export interface RejectCredentialRequestUseCase
  extends UseCase<RejectCredentialRequestInput, RejectCredentialRequestOutput> {}

