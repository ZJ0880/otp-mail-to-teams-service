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
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class ManualProcessTicketsDto {
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

  @ApiProperty({ example: "your-bot-account@gmail.com" })
  @IsString()
  @IsNotEmpty()
  mailUser!: string;

  @ApiPropertyOptional({ example: "INBOX" })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  mailMailbox?: string;

  @ApiProperty({ example: "xxxx yyyy zzzz qqqq" })
  @IsString()
  @IsNotEmpty()
  mailPassword!: string;

  @ApiProperty({ example: "https://your-webhook-url" })
  @IsUrl({ protocols: ["https"], require_protocol: true })
  teamsWebhookUrl!: string;

  @ApiPropertyOptional({ example: "Codigo: {otp} | Remitente: {from} | Asunto: {subject}" })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  teamsMessageTemplate?: string;

  @ApiPropertyOptional({ example: "noreply@service.com" })
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

  @ApiPropertyOptional({ example: 20 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}
