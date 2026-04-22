import { CredentialRequest, CredentialRequestId, RequestStatus } from "../../domain";
import { Instant } from "../../domain";
import { PaginationInput, PaginatedResult } from "../../contracts/pagination";

export interface CredentialRequestListFilters {
  status?: RequestStatus;
  from?: Instant;
  to?: Instant;
  emailContains?: string;
  platform?: string;
}

export interface CredentialRequestRepositoryPort {
  create(request: CredentialRequest): Promise<void>;
  getById(id: CredentialRequestId): Promise<CredentialRequest | null>;
  list(
    filters: CredentialRequestListFilters,
    pagination: PaginationInput,
  ): Promise<PaginatedResult<CredentialRequest>>;
  saveDecision(
    id: CredentialRequestId,
    next: { status: Exclude<RequestStatus, "PENDING">; decidedAt: Instant; decisionReason?: string },
  ): Promise<void>;
}

