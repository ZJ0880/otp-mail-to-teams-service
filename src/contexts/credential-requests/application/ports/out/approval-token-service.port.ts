import type { DecisionType } from "../../domain";
import type { CredentialRequestId } from "../../domain";
import type { Instant } from "../../domain";

export interface ApprovalTokenPayload {
  requestId: CredentialRequestId;
  decision: DecisionType;
  issuedAt: Instant;
  expiresAt: Instant;
}

export interface ApprovalTokenServicePort {
  verify(token: string): Promise<ApprovalTokenPayload>;
}

