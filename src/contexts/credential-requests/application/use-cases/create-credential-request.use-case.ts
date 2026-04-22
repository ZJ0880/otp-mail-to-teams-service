import type { UseCase } from "../contracts/use-case";
import type { CredentialRequestId, Instant, RequestStatus } from "../../domain";

export interface CreateCredentialRequestInput {
  requesterEmail: string;
  platform: string;
  course?: string;
  reason?: string;
}

export interface CreateCredentialRequestOutput {
  requestId: CredentialRequestId;
  status: Extract<RequestStatus, "PENDING">;
  createdAt: Instant;
}

export interface CreateCredentialRequestUseCase
  extends UseCase<CreateCredentialRequestInput, CreateCredentialRequestOutput> {}

