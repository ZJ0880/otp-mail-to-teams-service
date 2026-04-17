import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  Max,
  Min,
} from "class-validator";

export class ManualProcessTicketsDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  mailHost?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(65535)
  mailPort?: number;

  @IsOptional()
  @IsBoolean()
  mailSecure?: boolean;

  @IsString()
  @IsNotEmpty()
  mailUser!: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  mailMailbox?: string;

  @IsString()
  @IsNotEmpty()
  mailPassword!: string;

  @IsUrl({ protocols: ["https"], require_protocol: true })
  teamsWebhookUrl!: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  teamsMessageTemplate?: string;

  @IsOptional()
  @IsString()
  allowedFromCsv?: string;

  @IsOptional()
  @IsString()
  subjectKeywordsCsv?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  otpRegexPatterns?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(60)
  otpTtlMinutes?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}
