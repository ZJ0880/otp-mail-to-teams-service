export type DecisionType = "APPROVE" | "REJECT";

export class DecisionReason {
  private constructor(readonly value: string) {}

  static from(value: string): DecisionReason {
    const normalized = String(value ?? "").trim();
    if (!normalized) {
      throw new Error("DecisionReason cannot be empty");
    }
    if (normalized.length > 500) {
      throw new Error("DecisionReason is too long");
    }
    return new DecisionReason(normalized);
  }
}

export class Decision {
  private constructor(
    readonly type: DecisionType,
    readonly reason?: DecisionReason,
  ) {}

  static approve(reason?: string): Decision {
    return new Decision("APPROVE", reason ? DecisionReason.from(reason) : undefined);
  }

  static reject(reason?: string): Decision {
    return new Decision("REJECT", reason ? DecisionReason.from(reason) : undefined);
  }
}

