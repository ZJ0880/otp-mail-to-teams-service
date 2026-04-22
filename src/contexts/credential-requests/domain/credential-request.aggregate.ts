import type { RequestStatus } from "./request-status";
import { AlreadyDecidedError } from "./errors/already-decided.error";
import { CredentialRequestId } from "./value-objects/credential-request-id";
import { Decision } from "./value-objects/decision";
import { Instant } from "./value-objects/instant";
import { LockKey } from "./value-objects/lock-key";
import { Platform } from "./value-objects/platform";
import { RequestContext } from "./value-objects/request-context";
import { RequesterEmail } from "./value-objects/requester-email";

export class CredentialRequest {
  private constructor(
    readonly id: CredentialRequestId,
    readonly requesterEmail: RequesterEmail,
    readonly platform: Platform,
    readonly context: RequestContext,
    readonly status: RequestStatus,
    readonly createdAt: Instant,
    readonly decidedAt?: Instant,
    readonly decision?: Decision,
  ) {}

  static create(input: {
    id: CredentialRequestId;
    requesterEmail: RequesterEmail;
    platform: Platform;
    context?: RequestContext;
    createdAt: Instant;
  }): CredentialRequest {
    return new CredentialRequest(
      input.id,
      input.requesterEmail,
      input.platform,
      input.context ?? RequestContext.create({}),
      "PENDING",
      input.createdAt,
    );
  }

  approve(decidedAt: Instant, reason?: string): CredentialRequest {
    if (this.status !== "PENDING") {
      throw new AlreadyDecidedError(this.status);
    }
    if (decidedAt.isBefore(this.createdAt)) {
      throw new Error("decidedAt cannot be before createdAt");
    }
    return new CredentialRequest(
      this.id,
      this.requesterEmail,
      this.platform,
      this.context,
      "APPROVED",
      this.createdAt,
      decidedAt,
      Decision.approve(reason),
    );
  }

  reject(decidedAt: Instant, reason?: string): CredentialRequest {
    if (this.status !== "PENDING") {
      throw new AlreadyDecidedError(this.status);
    }
    if (decidedAt.isBefore(this.createdAt)) {
      throw new Error("decidedAt cannot be before createdAt");
    }
    return new CredentialRequest(
      this.id,
      this.requesterEmail,
      this.platform,
      this.context,
      "REJECTED",
      this.createdAt,
      decidedAt,
      Decision.reject(reason),
    );
  }

  lockKey(): LockKey {
    return LockKey.of(this.requesterEmail, this.platform);
  }
}

