import { Transform } from "class-transformer";
import { IsIn, IsInt, IsOptional, IsString, Max, Min } from "class-validator";

const AUDIT_RESULTS = ["success", "failure"] as const;

export class AuditEventsQueryDto {
  @IsOptional()
  @Transform(({ value }) => Number.parseInt(String(value), 10))
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Transform(({ value }) => Number.parseInt(String(value), 10))
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize?: number;

  @IsOptional()
  @IsString()
  from?: string;

  @IsOptional()
  @IsString()
  to?: string;

  @IsOptional()
  @IsString()
  actor?: string;

  @IsOptional()
  @IsString()
  action?: string;

  @IsOptional()
  @IsIn(AUDIT_RESULTS)
  result?: (typeof AUDIT_RESULTS)[number];

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
