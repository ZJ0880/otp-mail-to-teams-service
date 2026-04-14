import { Injectable } from "@nestjs/common";
import { AppConfigService } from "../../config/app-config.service";

@Injectable()
export class OtpValidatorService {
  constructor(private readonly appConfigService: AppConfigService) {}

  isCurrent(receivedAt: Date, referenceDate: Date = new Date()): boolean {
    const ageInMs = referenceDate.getTime() - receivedAt.getTime();
    if (ageInMs < 0) {
      return false;
    }

    const ttlInMs = this.appConfigService.otpTtlMinutes * 60 * 1000;
    return ageInMs <= ttlInMs;
  }
}
