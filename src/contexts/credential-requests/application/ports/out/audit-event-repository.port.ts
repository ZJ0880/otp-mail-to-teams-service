import type { CredentialRequestId, Instant } from "../../../domain";

export type AuditEventType =
  | "CREDENTIAL_REQUEST_CREATED"
  | "CREDENTIAL_REQUEST_APPROVED"
  | "CREDENTIAL_REQUEST_REJECTED"
  | "APPROVAL_TOKEN_EXECUTED";

export interface AuditEventRecord {
  type: AuditEventType;
  requestId: CredentialRequestId;
  occurredAt: Instant;
  details?: Record<string, unknown>;
  actorId?: string;
}

export interface AuditEventRepositoryPort {
  append(event: AuditEventRecord): Promise<void>;
}

