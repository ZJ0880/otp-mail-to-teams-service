export class RequesterEmail {
  private constructor(readonly value: string) {}

  static from(value: string): RequesterEmail {
    const normalized = String(value ?? "").trim().toLowerCase();
    if (!normalized) {
      throw new Error("RequesterEmail cannot be empty");
    }

    // Intentionally simple. Transport-layer can be stricter; domain only needs a safe baseline.
    const looksLikeEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized);
    if (!looksLikeEmail) {
      throw new Error("RequesterEmail must be a valid email");
    }

    return new RequesterEmail(normalized);
  }
}

