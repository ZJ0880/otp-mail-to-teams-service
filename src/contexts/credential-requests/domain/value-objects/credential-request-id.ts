export class CredentialRequestId {
  private constructor(readonly value: string) {}

  static from(value: string): CredentialRequestId {
    const normalized = String(value ?? "").trim();
    if (!normalized) {
      throw new Error("CredentialRequestId cannot be empty");
    }
    return new CredentialRequestId(normalized);
  }
}

