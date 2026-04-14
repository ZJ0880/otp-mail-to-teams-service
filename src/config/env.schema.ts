import { plainToInstance } from "class-transformer";
import {
  IsBooleanString,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  Max,
  Min,
  validateSync,
} from "class-validator";

class EnvironmentVariables {
  @IsString()
  @IsNotEmpty()
  MAIL_HOST!: string;

  @IsInt()
  @Min(1)
  @Max(65535)
  MAIL_PORT!: number;

  @IsBooleanString()
  MAIL_SECURE!: string;

  @IsString()
  @IsNotEmpty()
  MAIL_USER!: string;

  @IsString()
  @IsNotEmpty()
  MAIL_PASSWORD!: string;

  @IsString()
  @IsNotEmpty()
  MAIL_MAILBOX!: string;

  @IsOptional()
  @IsString()
  MAIL_ALLOWED_FROM?: string;

  @IsOptional()
  @IsString()
  MAIL_SUBJECT_KEYWORDS?: string;

  @IsString()
  @IsNotEmpty()
  OTP_REGEX_PATTERNS!: string;

  @IsInt()
  @Min(1)
  @Max(60)
  OTP_TTL_MINUTES!: number;

  @IsInt()
  @Min(5)
  @Max(3600)
  APP_POLLING_INTERVAL_SECONDS!: number;

  @IsUrl({
    protocols: ["https"],
    require_protocol: true,
  })
  TEAMS_WEBHOOK_URL!: string;

  @IsOptional()
  @IsString()
  TEAMS_MESSAGE_TEMPLATE?: string;
}

export function validateEnvironment(config: Record<string, unknown>): EnvironmentVariables {
  const transformed = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });

  const errors = validateSync(transformed, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    const details = errors
      .map((error) => Object.values(error.constraints ?? {}).join(", "))
      .join("; ");
    throw new Error(`Invalid environment variables: ${details}`);
  }

  return transformed;
}
