import { DomainError } from "./domain-error";
import type { RequestStatus } from "../request-status";

export class AlreadyDecidedError extends DomainError {
  readonly code = "ALREADY_DECIDED";

  constructor(readonly currentStatus: Exclude<RequestStatus, "PENDING">) {
    super(`Request is already decided with status ${currentStatus}`);
  }
}

