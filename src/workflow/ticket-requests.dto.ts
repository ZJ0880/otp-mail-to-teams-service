import { Transform } from "class-transformer";
import {
  IsBoolean,
  IsEmail,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  Min,
} from "class-validator";

export const REQUEST_STATUSES = ["pending", "processed", "failed", "retrying"] as const;
export type RequestStatus = (typeof REQUEST_STATUSES)[number];

export class CreateTicketRequestDto {
  @IsString()
  @IsNotEmpty()
  requesterName!: string;

  @Transform(({ value }) => String(value ?? "").trim().toLowerCase())
  @IsEmail()
  requesterEmail!: string;

  @IsOptional()
  @IsString()
  reason?: string;

  @IsOptional()
  @IsBoolean()
  processNow?: boolean;
}

export class ListTicketRequestsQueryDto {
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
  name?: string;

  @IsOptional()
  @Transform(({ value }) => String(value ?? "").trim().toLowerCase())
  @IsString()
  email?: string;

  @IsOptional()
  @IsIn(REQUEST_STATUSES)
  status?: RequestStatus;
}

export interface TicketRequestResponseItem {
  id: string;
  requesterName: string;
  requesterEmail: string;
  requestedAt: string;
  startedAt?: string;
  resolvedAt?: string;
  status: RequestStatus;
  requestedBy?: string;
  note?: string;
  processingSummary?: {
    unreadCount: number;
    processedCount: number;
    sentCount: number;
    filteredCount: number;
    notFoundCount: number;
    expiredCount: number;
    errorCount: number;
  };
}

export interface TicketRequestListResponse {
  items: TicketRequestResponseItem[];
  total: number;
}

export interface TicketRequestAttemptItem {
  id: string;
  attemptNumber: number;
  result: string;
  errorMessage?: string;
  executedAt: string;
}

export interface TicketRequestDetailResponse extends TicketRequestResponseItem {
  attempts: TicketRequestAttemptItem[];
}