export class Platform {
  private constructor(readonly value: string) {}

  static from(value: string): Platform {
    const normalized = String(value ?? "").trim().toLowerCase();
    if (!normalized) {
      throw new Error("Platform cannot be empty");
    }
    if (normalized.length > 64) {
      throw new Error("Platform is too long");
    }
    return new Platform(normalized);
  }
}

