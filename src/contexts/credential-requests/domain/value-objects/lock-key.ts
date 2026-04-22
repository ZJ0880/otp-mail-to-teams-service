import { Platform } from "./platform";
import { RequesterEmail } from "./requester-email";

export class LockKey {
  private constructor(
    readonly email: RequesterEmail,
    readonly platform: Platform,
  ) {}

  static of(email: RequesterEmail, platform: Platform): LockKey {
    return new LockKey(email, platform);
  }

  toString(): string {
    return `${this.email.value}::${this.platform.value}`;
  }
}

