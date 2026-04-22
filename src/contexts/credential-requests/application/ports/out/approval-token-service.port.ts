import type { CredentialRequestId, DecisionType, Instant } from "../../../domain";

export interface ApprovalTokenPayload {
  requestId: CredentialRequestId;
  decision: DecisionType;
  issuedAt: Instant;
  expiresAt: Instant;
}

export interface ApprovalTokenServicePort {
  verify(token: string): Promise<ApprovalTokenPayload>;
}

