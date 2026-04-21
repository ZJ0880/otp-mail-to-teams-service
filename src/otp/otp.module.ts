import { Module } from "@nestjs/common";
import { OtpExtractorService } from "./application/otp-extractor.service";
import { OtpValidatorService } from "./application/otp-validator.service";

@Module({
  providers: [OtpExtractorService, OtpValidatorService],
  exports: [OtpExtractorService, OtpValidatorService],
})
export class OtpModule {}
