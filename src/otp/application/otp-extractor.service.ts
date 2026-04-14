import { Injectable } from "@nestjs/common";
import { AppConfigService } from "../../config/app-config.service";
import { OtpRecord } from "../domain/otp-record.interface";

@Injectable()
export class OtpExtractorService {
  constructor(private readonly appConfigService: AppConfigService) {}

  extract(subject: string, bodyText: string): OtpRecord | null {
    const fromSubject = this.findMatch(subject);
    if (fromSubject) {
      return {
        code: fromSubject.code,
        matchedPattern: fromSubject.matchedPattern,
        extractedFrom: "subject",
      };
    }

    const fromBody = this.findMatch(bodyText);
    if (!fromBody) {
      return null;
    }

    return {
      code: fromBody.code,
      matchedPattern: fromBody.matchedPattern,
      extractedFrom: "body",
    };
  }

  private findMatch(input: string): { code: string; matchedPattern: string } | null {
    for (const pattern of this.appConfigService.otpRegexPatterns) {
      pattern.lastIndex = 0;
      const match = pattern.exec(input);
      if (match?.[1]) {
        return {
          code: match[1],
          matchedPattern: pattern.source,
        };
      }

      if (match?.[0]) {
        return {
          code: match[0],
          matchedPattern: pattern.source,
        };
      }
    }

    return null;
  }
}
