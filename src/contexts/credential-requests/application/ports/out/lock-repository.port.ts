import { Instant, LockKey } from "../../../domain";

export interface LockInfo {
  key: LockKey;
  lockedUntil: Instant;
}

export interface LockRepositoryPort {
  getActive(key: LockKey, now: Instant): Promise<LockInfo | null>;
  acquire(key: LockKey, lockedUntil: Instant): Promise<boolean>;
}

