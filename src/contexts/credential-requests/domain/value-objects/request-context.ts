export class Course {
  private constructor(readonly value: string) {}

  static from(value: string): Course {
    const normalized = String(value ?? "").trim();
    if (!normalized) {
      throw new Error("Course cannot be empty");
    }
    if (normalized.length > 200) {
      throw new Error("Course is too long");
    }
    return new Course(normalized);
  }
}

export class RequestReason {
  private constructor(readonly value: string) {}

  static from(value: string): RequestReason {
    const normalized = String(value ?? "").trim();
    if (!normalized) {
      throw new Error("RequestReason cannot be empty");
    }
    if (normalized.length > 500) {
      throw new Error("RequestReason is too long");
    }
    return new RequestReason(normalized);
  }
}

export class RequestContext {
  private constructor(
    readonly course?: Course,
    readonly reason?: RequestReason,
  ) {}

  static create(input: { course?: string; reason?: string }): RequestContext {
    const course = input.course ? Course.from(input.course) : undefined;
    const reason = input.reason ? RequestReason.from(input.reason) : undefined;
    return new RequestContext(course, reason);
  }
}

