import { IsBoolean, IsInt, IsNotEmpty, IsOptional, IsString, IsUrl, Max, Min } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class CreateCredentialProfileDto {
  @ApiProperty({ example: "principal" })
  @IsString()
  @IsNotEmpty()
  profileName!: string;

  @ApiProperty({ example: "imap.gmail.com" })
  @IsString()
  @IsNotEmpty()
  mailHost!: string;

  @ApiProperty({ example: 993 })
  @IsInt()
  @Min(1)
  @Max(65535)
  mailPort!: number;

  @ApiProperty({ example: true })
  @IsBoolean()
  mailSecure!: boolean;

  @ApiProperty({ example: "your-bot-account@gmail.com" })
  @IsString()
  @IsNotEmpty()
  mailUser!: string;

  @ApiProperty({ example: "INBOX" })
  @IsString()
  @IsNotEmpty()
  mailMailbox!: string;

  @ApiProperty({ example: "xxxx yyyy zzzz qqqq" })
  @IsString()
  @IsNotEmpty()
  mailPassword!: string;

  @ApiProperty({ example: "https://your-webhook-url" })
  @IsUrl({ protocols: ["https"], require_protocol: true })
  teamsWebhookUrl!: string;

  @ApiProperty({ example: String.raw`Codigo: {otp}\nFecha: {receivedAt}\nRemitente: {from}\nAsunto: {subject}` })
  @IsString()
  @IsNotEmpty()
  teamsMessageTemplate!: string;

  @ApiPropertyOptional({ example: "noreply@service.com,alerts@service.com" })
  @IsOptional()
  @IsString()
  allowedFromCsv?: string;

  @ApiPropertyOptional({ example: "otp,codigo,codigo de verificacion" })
  @IsOptional()
  @IsString()
  subjectKeywordsCsv?: string;

  @ApiProperty({ example: String.raw`\b(\d{6})\b` })
  @IsString()
  @IsNotEmpty()
  otpRegexPatterns!: string;

  @ApiProperty({ example: 5 })
  @IsInt()
  @Min(1)
  @Max(60)
  otpTtlMinutes!: number;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}

export class UpdateCredentialProfileDto {
  @ApiPropertyOptional({ example: "principal" })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  profileName?: string;

  @ApiPropertyOptional({ example: "imap.gmail.com" })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  mailHost?: string;

  @ApiPropertyOptional({ example: 993 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(65535)
  mailPort?: number;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  mailSecure?: boolean;

  @ApiPropertyOptional({ example: "your-bot-account@gmail.com" })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  mailUser?: string;

  @ApiPropertyOptional({ example: "INBOX" })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  mailMailbox?: string;

  @ApiPropertyOptional({ example: "xxxx yyyy zzzz qqqq" })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  mailPassword?: string;

  @ApiPropertyOptional({ example: "https://your-webhook-url" })
  @IsOptional()
  @IsUrl({ protocols: ["https"], require_protocol: true })
  teamsWebhookUrl?: string;

  @ApiPropertyOptional({ example: String.raw`Codigo: {otp}\nFecha: {receivedAt}\nRemitente: {from}\nAsunto: {subject}` })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  teamsMessageTemplate?: string;

  @ApiPropertyOptional({ example: "noreply@service.com,alerts@service.com" })
  @IsOptional()
  @IsString()
  allowedFromCsv?: string;

  @ApiPropertyOptional({ example: "otp,codigo,codigo de verificacion" })
  @IsOptional()
  @IsString()
  subjectKeywordsCsv?: string;

  @ApiPropertyOptional({ example: String.raw`\b(\d{6})\b` })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  otpRegexPatterns?: string;

  @ApiPropertyOptional({ example: 5 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(60)
  otpTtlMinutes?: number;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}

export class ValidateCredentialProfileDto extends CreateCredentialProfileDto {}
