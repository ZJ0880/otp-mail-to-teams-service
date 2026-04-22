import type { UseCase } from "../contracts/use-case";
import type { CredentialRequestId, Instant, RequestStatus } from "../../domain";

export interface ExecuteApprovalTokenDecisionInput {
  token: string;
}

export interface ExecuteApprovalTokenDecisionOutput {
  requestId: CredentialRequestId;
  status: Exclude<RequestStatus, "PENDING">;
  decidedAt: Instant;
}

export interface ExecuteApprovalTokenDecisionUseCase
  extends UseCase<ExecuteApprovalTokenDecisionInput, ExecuteApprovalTokenDecisionOutput> {}

