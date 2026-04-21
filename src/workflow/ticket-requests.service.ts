import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma, TicketStatus } from "@prisma/client";
import { PrismaService } from "../database/prisma.service";
import { RequestApprovalNotifierService } from "./request-approval-notifier.service";
import {
  CreateTicketRequestDto,
  ListTicketRequestsQueryDto,
  RequestStatus,
  TicketRequestAttemptItem,
  TicketRequestDetailResponse,
  TicketRequestListResponse,
  TicketRequestResponseItem,
} from "./ticket-requests.dto";

interface AuthenticatedRequestUser {
  userId: string;
  username: string;
  role: "ADMIN" | "OPERATOR" | "VIEWER";
}

interface EncodedRequestMeta {
  requesterName: string;
  requesterEmail: string;
  platform: string;
  course: string;
  reason?: string;
}

interface ResolvedCredentialProfile {
  id: string;
  mailHost: string;
  mailPort: number;
  mailSecure: boolean;
  mailUser: string;
  mailMailbox: string;
  mailPasswordEncrypted: string;
  teamsWebhookEncrypted: string;
  teamsMessageTemplate: string;
  allowedFromCsv: string | null;
  subjectKeywordsCsv: string | null;
  otpRegexPatterns: string;
  otpTtlMinutes: number;
}

const REQUEST_META_PREFIX = "REQ_META::";

@Injectable()
export class TicketRequestsService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly requestApprovalNotifierService: RequestApprovalNotifierService,
  ) {}

  async createRequest(
    user: AuthenticatedRequestUser,
    input: CreateTicketRequestDto,
  ): Promise<TicketRequestResponseItem> {
    const profile = await this.resolveProfileForUser(user.userId);

    if (!profile) {
      throw new BadRequestException(
        "No credential profile is configured for this account. configure settings first.",
      );
    }

    const cleanName = input.requesterName.trim().replaceAll(/\s+/g, " ");
    if (cleanName.length < 2) {
      throw new BadRequestException("requesterName must have at least 2 characters");
    }

    const metadata = this.encodeRequestMeta({
      requesterName: cleanName,
      requesterEmail: input.requesterEmail,
      platform: input.platform?.trim() || "unknown",
      course: input.course?.trim() || "unknown",
      reason: input.reason?.trim() || undefined,
    });

    const processNow = input.processNow ?? false;

    const created = await this.prismaService.ticketRequest.create({
      data: {
        requestedByUserId: user.userId,
        profileId: profile.id,
        status: TicketStatus.PENDING,
        startedAt: null,
        requestReason: metadata,
      },
      include: {
        requestedBy: true,
      },
    });

    await this.prismaService.auditLog.create({
      data: {
        actorUserId: user.userId,
        action: "TICKET_REQUEST_CREATED",
        entityType: "TicketRequest",
        entityId: created.id,
        afterJson: {
          requesterName: cleanName,
          requesterEmail: input.requesterEmail,
          platform: input.platform?.trim() || "unknown",
          course: input.course?.trim() || "unknown",
          processNowRequested: processNow,
          executionMode: "approval_only",
        },
      },
    });

    const responseItem = this.toResponseItem(created, this.decodeRequestMeta(created.requestReason));
    await this.requestApprovalNotifierService.notifyRequestCreated(responseItem);

    return responseItem;
  }

  async listRequests(
    user: AuthenticatedRequestUser,
    query: ListTicketRequestsQueryDto,
  ): Promise<TicketRequestListResponse> {
    const page = this.normalizePositiveNumber(query.page, 1);
    const pageSize = this.normalizePositiveNumber(query.pageSize, 10, 100);
    const skip = (page - 1) * pageSize;

    const fromDate = this.parseIsoDate(query.from, "from");
    const toDate = this.parseIsoDate(query.to, "to");

    if (fromDate && toDate && fromDate.getTime() > toDate.getTime()) {
      throw new BadRequestException("from must be before or equal to to");
    }

    const whereByRole =
      user.role === "ADMIN"
        ? {}
        : {
            requestedByUserId: user.userId,
          };

    const whereByStatus = query.status
      ? {
          status: this.toTicketStatus(query.status),
        }
      : {};

    const whereByDate =
      fromDate || toDate
        ? {
            requestedAt: {
              ...(fromDate ? { gte: fromDate } : {}),
              ...(toDate ? { lte: toDate } : {}),
            },
          }
        : {};

    const normalizedNameFilter = query.name?.trim() ?? "";
    const normalizedEmailFilter = query.email?.trim().toLowerCase() ?? "";

    const whereByName = normalizedNameFilter
      ? {
          requestReason: {
            contains: `"requesterName":"${normalizedNameFilter}`,
            mode: "insensitive" as const,
          },
        }
      : {};

    const whereByEmail = normalizedEmailFilter
      ? {
          requestReason: {
            contains: `"requesterEmail":"${normalizedEmailFilter}`,
            mode: "insensitive" as const,
          },
        }
      : {};

    const dbWhere: Prisma.TicketRequestWhereInput = {
      ...whereByRole,
      ...whereByStatus,
      ...whereByDate,
      ...whereByName,
      ...whereByEmail,
    };

    const total = await this.prismaService.ticketRequest.count({
      where: dbWhere,
    });

    const rows = await this.prismaService.ticketRequest.findMany({
      where: dbWhere,
      orderBy: { requestedAt: "desc" },
      skip,
      take: pageSize,
      include: {
        requestedBy: true,
      },
    });

    const items = rows.map((row) => {
      const metadata = this.decodeRequestMeta(row.requestReason);
      return this.toResponseItem(row, metadata);
    });

    return {
      items,
      total,
    };
  }

  async getRequestById(
    user: AuthenticatedRequestUser,
    requestId: string,
  ): Promise<TicketRequestDetailResponse> {
    const row = await this.prismaService.ticketRequest.findUnique({
      where: { id: requestId },
      include: {
        requestedBy: true,
        attempts: {
          orderBy: { attemptNumber: "asc" },
        },
      },
    });

    if (!row) {
      throw new NotFoundException("Ticket request not found");
    }

    if (user.role !== "ADMIN" && row.requestedByUserId !== user.userId) {
      throw new NotFoundException("Ticket request not found");
    }

    const metadata = this.decodeRequestMeta(row.requestReason);
    const base = this.toResponseItem(row, metadata);

    const attempts: TicketRequestAttemptItem[] = row.attempts.map((attempt) => ({
      id: attempt.id,
      attemptNumber: attempt.attemptNumber,
      result: attempt.result,
      errorMessage: attempt.errorMessage ?? undefined,
      executedAt: attempt.executedAt.toISOString(),
    }));

    return {
      ...base,
      attempts,
    };
  }

  private normalizePositiveNumber(
    value: number | undefined,
    fallback: number,
    max?: number,
  ): number {
    const normalized = Number(value);
    if (!Number.isFinite(normalized) || normalized < 1) {
      return fallback;
    }

    if (max && normalized > max) {
      return max;
    }

    return Math.trunc(normalized);
  }

  private async resolveProfileForUser(userId: string): Promise<ResolvedCredentialProfile | null> {
    const preferred = await this.prismaService.credentialProfile.findFirst({
      where: {
        ownerUserId: userId,
        isDefault: true,
      },
      select: {
        id: true,
        mailHost: true,
        mailPort: true,
        mailSecure: true,
        mailUser: true,
        mailMailbox: true,
        mailPasswordEncrypted: true,
        teamsWebhookEncrypted: true,
        teamsMessageTemplate: true,
        allowedFromCsv: true,
        subjectKeywordsCsv: true,
        otpRegexPatterns: true,
        otpTtlMinutes: true,
      },
      orderBy: { updatedAt: "desc" },
    });

    if (preferred) {
      return preferred;
    }

    const fallback = await this.prismaService.credentialProfile.findFirst({
      where: {
        ownerUserId: userId,
      },
      select: {
        id: true,
        mailHost: true,
        mailPort: true,
        mailSecure: true,
        mailUser: true,
        mailMailbox: true,
        mailPasswordEncrypted: true,
        teamsWebhookEncrypted: true,
        teamsMessageTemplate: true,
        allowedFromCsv: true,
        subjectKeywordsCsv: true,
        otpRegexPatterns: true,
        otpTtlMinutes: true,
      },
      orderBy: { updatedAt: "desc" },
    });

    return fallback ?? null;
  }

  private parseIsoDate(raw: string | undefined, field: string): Date | undefined {
    if (!raw) {
      return undefined;
    }

    const parsed = new Date(raw);
    if (Number.isNaN(parsed.getTime())) {
      throw new BadRequestException(`${field} must be a valid ISO date`);
    }

    return parsed;
  }

  private toTicketStatus(status: RequestStatus): TicketStatus {
    switch (status) {
      case "pending":
        return TicketStatus.PENDING;
      case "processed":
        return TicketStatus.SUCCESS;
      case "failed":
        return TicketStatus.FAILED;
      case "retrying":
        return TicketStatus.RETRYING;
      default:
        return TicketStatus.PENDING;
    }
  }

  private fromTicketStatus(status: TicketStatus): RequestStatus {
    switch (status) {
      case TicketStatus.SUCCESS:
        return "processed";
      case TicketStatus.FAILED:
        return "failed";
      case TicketStatus.RETRYING:
        return "retrying";
      default:
        return "pending";
    }
  }

  private encodeRequestMeta(meta: EncodedRequestMeta): string {
    return `${REQUEST_META_PREFIX}${JSON.stringify(meta)}`;
  }

  private decodeRequestMeta(raw: string | null | undefined): EncodedRequestMeta {
    if (!raw?.startsWith(REQUEST_META_PREFIX)) {
      return {
        requesterName: "unknown",
        requesterEmail: "unknown@example.com",
        platform: "unknown",
        course: "unknown",
      };
    }

    try {
      const parsed = JSON.parse(raw.slice(REQUEST_META_PREFIX.length)) as EncodedRequestMeta;
      return {
        requesterName: parsed?.requesterName || "unknown",
        requesterEmail: parsed?.requesterEmail || "unknown@example.com",
        platform: parsed?.platform || "unknown",
        course: parsed?.course || "unknown",
        reason: parsed?.reason,
      };
    } catch {
      return {
        requesterName: "unknown",
        requesterEmail: "unknown@example.com",
        platform: "unknown",
        course: "unknown",
      };
    }
  }

  private toResponseItem(
    row: {
      id: string;
      status: TicketStatus;
      requestedAt: Date;
      startedAt: Date | null;
      finishedAt: Date | null;
      requestedBy: { name: string };
      requestReason: string | null;
    },
    metadata: EncodedRequestMeta,
  ): TicketRequestResponseItem {
    return {
      id: row.id,
      requesterName: metadata.requesterName,
      requesterEmail: metadata.requesterEmail,
      platform: metadata.platform,
      course: metadata.course,
      requestedAt: row.requestedAt.toISOString(),
      startedAt: row.startedAt?.toISOString() ?? undefined,
      resolvedAt: row.finishedAt?.toISOString() ?? undefined,
      status: this.fromTicketStatus(row.status),
      requestedBy: row.requestedBy.name,
      note: metadata.reason,
      processingSummary: undefined,
    };
  }
}