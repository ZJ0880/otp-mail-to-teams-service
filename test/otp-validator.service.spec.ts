import { OtpValidatorService } from "../src/otp/application/otp-validator.service";

describe("OtpValidatorService", () => {
  const appConfigService = {
    otpTtlMinutes: 5,
  };

  const service = new OtpValidatorService(appConfigService as never);

  it("accepts OTP inside TTL window", () => {
    const now = new Date("2026-04-14T10:10:00.000Z");
    const received = new Date("2026-04-14T10:06:00.000Z");

    expect(service.isCurrent(received, now)).toBe(true);
  });

  it("rejects OTP outside TTL window", () => {
    const now = new Date("2026-04-14T10:10:00.000Z");
    const received = new Date("2026-04-14T10:01:00.000Z");

    expect(service.isCurrent(received, now)).toBe(false);
  });

  it("rejects future timestamps", () => {
    const now = new Date("2026-04-14T10:10:00.000Z");
    const received = new Date("2026-04-14T10:11:00.000Z");

    expect(service.isCurrent(received, now)).toBe(false);
  });
});
