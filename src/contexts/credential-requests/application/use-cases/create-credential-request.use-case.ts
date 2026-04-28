import type { UseCase } from "../contracts/use-case";
import type { CredentialRequestId, Instant, RequestStatus } from "../../domain";

export interface CreateCredentialRequestInput {
  email: string;
  password: string;
}

export interface CreateCredentialRequestOutput {
  requestId: CredentialRequestId;
  status: Extract<RequestStatus, "PENDING">;
  createdAt: Instant;
}

export interface CreateCredentialRequestUseCase
  extends UseCase<CreateCredentialRequestInput, CreateCredentialRequestOutput> {}

