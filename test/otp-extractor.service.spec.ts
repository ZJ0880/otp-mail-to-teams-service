import { OtpExtractorService } from "../src/otp/application/otp-extractor.service";

describe("OtpExtractorService", () => {
  const appConfigService = {
    otpRegexPatterns: [/OTP[:\s]+(\d{6})/gi, /\b(\d{6})\b/g],
  };

  const service = new OtpExtractorService(appConfigService as never);

  it("extracts OTP from subject first", () => {
    const result = service.extract("Tu OTP: 123456", "Body OTP: 999999");

    expect(result).not.toBeNull();
    expect(result?.code).toBe("123456");
    expect(result?.extractedFrom).toBe("subject");
  });

  it("extracts OTP from body when subject has no OTP", () => {
    const result = service.extract("Aviso", "Codigo OTP: 654321");

    expect(result).not.toBeNull();
    expect(result?.code).toBe("654321");
    expect(result?.extractedFrom).toBe("body");
  });

  it("returns null when no OTP is found", () => {
    const result = service.extract("Hola", "Sin codigo aqui");

    expect(result).toBeNull();
  });
});
