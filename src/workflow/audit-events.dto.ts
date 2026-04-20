import { Transform } from "class-transformer";
import { IsIn, IsInt, IsOptional, IsString, Max, Min } from "class-validator";
import { ApiPropertyOptional } from "@nestjs/swagger";

const AUDIT_RESULTS = ["success", "failure"] as const;

export class AuditEventsQueryDto {
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

  @ApiPropertyOptional({ example: "2026-04-19T00:00:00.000Z" })
  @IsOptional()
  @IsString()
  from?: string;

  @ApiPropertyOptional({ example: "2026-04-19T23:59:59.999Z" })
  @IsOptional()
  @IsString()
  to?: string;

  @ApiPropertyOptional({ example: "admin otp" })
  @IsOptional()
  @IsString()
  actor?: string;

  @ApiPropertyOptional({ example: "TICKET_REQUEST_CREATED" })
  @IsOptional()
  @IsString()
  action?: string;

  @ApiPropertyOptional({ example: "success", enum: AUDIT_RESULTS })
  @IsOptional()
  @IsIn(AUDIT_RESULTS)
  result?: (typeof AUDIT_RESULTS)[number];

  @ApiPropertyOptional({ example: "clx123abc" })
  @IsOptional()
  @IsString()
  ticketId?: string;
}

export interface AuditEventResponse {
  id: string;
  timestamp: string;
  actor: string;
  action: string;
  result: "success" | "failure";
  ticketId?: string;
  details: string;
}

export interface AuditEventsListResponse {
  items: AuditEventResponse[];
  total: number;
}
