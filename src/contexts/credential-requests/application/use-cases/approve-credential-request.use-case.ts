import type { UseCase } from "../contracts/use-case";
import type { CredentialRequestId, Instant, RequestStatus } from "../../domain";

export interface ApproveCredentialRequestInput {
  requestId: CredentialRequestId;
  reason?: string;
}

export interface ApproveCredentialRequestOutput {
  requestId: CredentialRequestId;
  status: Extract<RequestStatus, "APPROVED">;
  decidedAt: Instant;
}

export interface ApproveCredentialRequestUseCase
  extends UseCase<ApproveCredentialRequestInput, ApproveCredentialRequestOutput> {}

