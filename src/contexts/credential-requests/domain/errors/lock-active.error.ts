import { DomainError } from "./domain-error";

export class LockActiveError extends DomainError {
  readonly code = "LOCK_ACTIVE";

  constructor(readonly lockedUntilIso: string) {
    super(`Lock is active until ${lockedUntilIso}`);
  }
}

