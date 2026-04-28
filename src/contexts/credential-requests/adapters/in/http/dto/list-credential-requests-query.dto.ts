import { ApiPropertyOptional } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { IsIn, IsInt, IsOptional, IsString, Max, Min } from "class-validator";

export const CREDENTIAL_REQUEST_STATUSES = ["PENDING", "APPROVED", "REJECTED"] as const;

export class ListCredentialRequestsQueryDto {
  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @Transform(({ value }) => Number.parseInt(String(value), 10))
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ example: 20 })
  @IsOptional()
  @Transform(({ value }) => Number.parseInt(String(value), 10))
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize?: number;

  @ApiPropertyOptional({ example: "2026-04-01T00:00:00.000Z" })
  @IsOptional()
  @IsString()
  fromIso?: string;

  @ApiPropertyOptional({ example: "2026-04-30T23:59:59.999Z" })
  @IsOptional()
  @IsString()
  toIso?: string;

  @ApiPropertyOptional({ example: "student@school.edu" })
  @IsOptional()
  @IsString()
  emailContains?: string;

  @ApiPropertyOptional({ example: "udemy" })
  @IsOptional()
  @IsString()
  platform?: string;

  @ApiPropertyOptional({ enum: CREDENTIAL_REQUEST_STATUSES })
  @IsOptional()
  @IsIn(CREDENTIAL_REQUEST_STATUSES)
  status?: (typeof CREDENTIAL_REQUEST_STATUSES)[number];
}