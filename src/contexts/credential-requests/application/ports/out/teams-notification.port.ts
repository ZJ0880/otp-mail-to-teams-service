import type { CredentialRequestId, Platform, RequestStatus, RequesterEmail } from "../../../domain";

export interface CredentialRequestSummary {
  id: CredentialRequestId;
  requesterEmail: RequesterEmail;
  platform: Platform;
  status: RequestStatus;
  createdAt: string;
}

export interface TeamsNotificationPort {
  notifyRequestCreated(summary: CredentialRequestSummary, approvalExecuteUrl: string): Promise<void>;
  notifyRequestDecided(summary: CredentialRequestSummary): Promise<void>;
}

