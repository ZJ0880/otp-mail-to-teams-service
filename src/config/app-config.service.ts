import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class AppConfigService {
  constructor(private readonly configService: ConfigService) {}

  get mailHost(): string {
    return this.mustGet("MAIL_HOST");
  }

  get mailPort(): number {
    return Number(this.mustGet("MAIL_PORT"));
  }

  get mailSecure(): boolean {
    return this.mustGet("MAIL_SECURE") === "true";
  }

  get mailUser(): string {
    return this.mustGet("MAIL_USER");
  }

  get mailPassword(): string {
    return this.mustGet("MAIL_PASSWORD");
  }

  get mailMailbox(): string {
    return this.mustGet("MAIL_MAILBOX");
  }

  get mailAllowedFrom(): string[] {
    return this.csv("MAIL_ALLOWED_FROM");
  }

  get mailSubjectKeywords(): string[] {
    return this.csv("MAIL_SUBJECT_KEYWORDS");
  }

  get otpRegexPatterns(): RegExp[] {
    const raw = this.mustGet("OTP_REGEX_PATTERNS");
    return raw
      .split("||")
      .map((value) => value.trim())
      .filter((value) => value.length > 0)
      .map((value) => new RegExp(value, "gi"));
  }

  get otpTtlMinutes(): number {
    return Number(this.mustGet("OTP_TTL_MINUTES"));
  }

  get pollingIntervalSeconds(): number {
    return Number(this.mustGet("APP_POLLING_INTERVAL_SECONDS"));
  }

  get teamsWebhookUrl(): string {
    return this.mustGet("TEAMS_WEBHOOK_URL");
  }

  get teamsMessageTemplate(): string {
    return (
      this.configService.get<string>("TEAMS_MESSAGE_TEMPLATE") ??
      "ALERTA OTP\\n\\nCodigo: **{otp}**\\nFecha: {receivedAt}\\nRemitente: {from}\\nAsunto: {subject}\\n\\nAccion: usa este codigo de inmediato y no lo compartas."
    );
  }

  private csv(key: string): string[] {
    const value = this.configService.get<string>(key);
    if (!value) {
      return [];
    }

    return value
      .split(",")
      .map((item) => item.trim().toLowerCase())
      .filter((item) => item.length > 0);
  }

  private mustGet(key: string): string {
    const value = this.configService.get<string>(key);
    if (!value) {
      throw new Error(`Missing required config value: ${key}`);
    }

    return value;
  }
}
