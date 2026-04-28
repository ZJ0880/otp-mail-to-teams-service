export class Instant {
  private constructor(readonly value: Date) {}

  static fromDate(value: Date): Instant {
    if (!(value instanceof Date) || Number.isNaN(value.valueOf())) {
      throw new TypeError("Instant must be a valid Date");
    }

    return new Instant(new Date(value));
  }

  static fromIso(iso: string): Instant {
    const parsed = new Date(String(iso ?? ""));
    if (Number.isNaN(parsed.valueOf())) {
      throw new TypeError("Instant must be a valid ISO date");
    }

    return new Instant(parsed);
  }

  toIsoString(): string {
    return this.value.toISOString();
  }

  isBefore(other: Instant): boolean {
    return this.value.valueOf() < other.value.valueOf();
  }
}

