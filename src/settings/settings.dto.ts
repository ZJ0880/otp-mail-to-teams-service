import { IsBoolean, IsInt, IsNotEmpty, IsOptional, IsString, IsUrl, Max, Min } from "class-validator";

export class CreateCredentialProfileDto {
  @IsString()
  @IsNotEmpty()
  profileName!: string;

  @IsString()
  @IsNotEmpty()
  mailHost!: string;

  @IsInt()
  @Min(1)
  @Max(65535)
  mailPort!: number;

  @IsBoolean()
  mailSecure!: boolean;

  @IsString()
  @IsNotEmpty()
  mailUser!: string;

  @IsString()
  @IsNotEmpty()
  mailMailbox!: string;

  @IsString()
  @IsNotEmpty()
  mailPassword!: string;

  @IsUrl({ protocols: ["https"], require_protocol: true })
  teamsWebhookUrl!: string;

  @IsString()
  @IsNotEmpty()
  teamsMessageTemplate!: string;

  @IsOptional()
  @IsString()
  allowedFromCsv?: string;

  @IsOptional()
  @IsString()
  subjectKeywordsCsv?: string;

  @IsString()
  @IsNotEmpty()
  otpRegexPatterns!: string;

  @IsInt()
  @Min(1)
  @Max(60)
  otpTtlMinutes!: number;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}

export class UpdateCredentialProfileDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  profileName?: string;

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

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  mailUser?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  mailMailbox?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  mailPassword?: string;

  @IsOptional()
  @IsUrl({ protocols: ["https"], require_protocol: true })
  teamsWebhookUrl?: string;

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
  @IsBoolean()
  isDefault?: boolean;
}

export class ValidateCredentialProfileDto extends CreateCredentialProfileDto {}
