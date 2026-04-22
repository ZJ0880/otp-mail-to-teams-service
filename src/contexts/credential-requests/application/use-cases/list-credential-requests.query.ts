import type { UseCase } from "../contracts/use-case";
import type { RequestStatus } from "../../domain";
import type { PaginatedResult, PaginationInput } from "../contracts/pagination";

export interface ListCredentialRequestsFilters {
  status?: RequestStatus;
  fromIso?: string;
  toIso?: string;
  emailContains?: string;
  platform?: string;
}

export interface ListCredentialRequestsInput {
  filters: ListCredentialRequestsFilters;
  pagination: PaginationInput;
}

export interface CredentialRequestListItemView {
  id: string;
  requesterEmail: string;
  platform: string;
  status: RequestStatus;
  createdAtIso: string;
  decidedAtIso?: string;
}

export type ListCredentialRequestsOutput = PaginatedResult<CredentialRequestListItemView>;

export interface ListCredentialRequestsQuery
  extends UseCase<ListCredentialRequestsInput, ListCredentialRequestsOutput> {}

