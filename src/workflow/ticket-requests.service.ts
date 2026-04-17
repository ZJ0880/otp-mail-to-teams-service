import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { AttemptResult, Prisma, TicketStatus } from "@prisma/client";
import { SecretEncryptionService } from "../security/secret-encryption.service";
import { PrismaService } from "../database/prisma.service";
import {
  CreateTicketRequestDto,
  ListTicketRequestsQueryDto,
  RequestStatus,
  TicketRequestAttemptItem,
  TicketRequestDetailResponse,
  TicketRequestListResponse,
  TicketRequestResponseItem,
} from "./ticket-requests.dto";
import { ManualOtpProcessingService } from "./manual-otp-processing.service";
import { OtpProcessingResult } from "./otp-processing.service";

interface AuthenticatedRequestUser {
  userId: string;
  username: string;
  role: "ADMIN" | "OPERATOR" | "VIEWER";
}

interface EncodedRequestMeta {
  requesterName: string;
  requesterEmail: string;
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
    private readonly secretEncryptionService: SecretEncryptionService,
    private readonly manualOtpProcessingService: ManualOtpProcessingService,
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
      reason: input.reason?.trim() || undefined,
    });

    const processNow = input.processNow ?? true;

    const created = await this.prismaService.ticketRequest.create({
      data: {
        requestedByUserId: user.userId,
        profileId: profile.id,
        status: processNow ? TicketStatus.PROCESSING : TicketStatus.PENDING,
        startedAt: processNow ? new Date() : null,
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
          processNow,
        },
      },
    });

    if (!processNow) {
      return this.toResponseItem(created, this.decodeRequestMeta(created.requestReason));
    }

    try {
      const processingSummary = await this.manualOtpProcessingService.processUnreadMessages({
        mailHost: profile.mailHost,
        mailPort: profile.mailPort,
        mailSecure: profile.mailSecure,
        mailUser: profile.mailUser,
        mailMailbox: profile.mailMailbox,
        mailPassword: this.secretEncryptionService.decrypt(profile.mailPasswordEncrypted),
        teamsWebhookUrl: this.secretEncryptionService.decrypt(profile.teamsWebhookEncrypted),
        teamsMessageTemplate: profile.teamsMessageTemplate,
        allowedFromCsv: profile.allowedFromCsv ?? undefined,
        subjectKeywordsCsv: profile.subjectKeywordsCsv ?? undefined,
        otpRegexPatterns: profile.otpRegexPatterns,
        otpTtlMinutes: profile.otpTtlMinutes,
      });

      const finalStatus = this.resolveFinalStatus(processingSummary);

      const updated = await this.prismaService.ticketRequest.update({
        where: { id: created.id },
        data: {
          status: finalStatus,
          finishedAt: new Date(),
        },
        include: {
          requestedBy: true,
        },
      });

      await this.prismaService.ticketAttempt.create({
        data: {
          ticketRequestId: created.id,
          attemptNumber: 1,
          result: this.resolveAttemptResult(processingSummary),
          errorMessage:
            processingSummary.errorCount > 0
              ? "Processing finished with errors. Check logs and filters."
              : null,
          durationMs: null,
        },
      });

      await this.prismaService.auditLog.create({
        data: {
          actorUserId: user.userId,
          action: "TICKET_REQUEST_PROCESSED",
          entityType: "TicketRequest",
          entityId: created.id,
          afterJson: processingSummary as unknown as Prisma.InputJsonValue,
        },
      });

      return this.toResponseItem(
        updated,
        this.decodeRequestMeta(updated.requestReason),
        processingSummary,
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);

      const failed = await this.prismaService.ticketRequest.update({
        where: { id: created.id },
        data: {
          status: TicketStatus.FAILED,
          finishedAt: new Date(),
        },
        include: {
          requestedBy: true,
        },
      });

      await this.prismaService.ticketAttempt.create({
        data: {
          ticketRequestId: created.id,
          attemptNumber: 1,
          result: AttemptResult.FAILED,
          errorMessage: message,
          durationMs: null,
        },
      });

      await this.prismaService.auditLog.create({
        data: {
          actorUserId: user.userId,
          action: "TICKET_REQUEST_FAILED",
          entityType: "TicketRequest",
          entityId: created.id,
          afterJson: {
            error: message,
          },
        },
      });

      return this.toResponseItem(failed, this.decodeRequestMeta(failed.requestReason));
    }
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

  private resolveFinalStatus(processingSummary: OtpProcessingResult): TicketStatus {
    if (processingSummary.sentCount > 0) {
      return TicketStatus.SUCCESS;
    }

    if (processingSummary.errorCount > 0) {
      return TicketStatus.FAILED;
    }

    return TicketStatus.FAILED;
  }

  private resolveAttemptResult(processingSummary: OtpProcessingResult): AttemptResult {
    if (processingSummary.sentCount > 0) {
      return AttemptResult.SUCCESS;
    }

    if (processingSummary.expiredCount > 0) {
      return AttemptResult.EXPIRED;
    }

    if (processingSummary.filteredCount > 0) {
      return AttemptResult.FILTERED;
    }

    if (processingSummary.notFoundCount > 0) {
      return AttemptResult.NO_MATCH;
    }

    return AttemptResult.FAILED;
  }

  private encodeRequestMeta(meta: EncodedRequestMeta): string {
    return `${REQUEST_META_PREFIX}${JSON.stringify(meta)}`;
  }

  private decodeRequestMeta(raw: string | null | undefined): EncodedRequestMeta {
    if (!raw?.startsWith(REQUEST_META_PREFIX)) {
      return {
        requesterName: "unknown",
        requesterEmail: "unknown@example.com",
      };
    }

    try {
      const parsed = JSON.parse(raw.slice(REQUEST_META_PREFIX.length)) as EncodedRequestMeta;
      return {
        requesterName: parsed?.requesterName || "unknown",
        requesterEmail: parsed?.requesterEmail || "unknown@example.com",
        reason: parsed?.reason,
      };
    } catch {
      return {
        requesterName: "unknown",
        requesterEmail: "unknown@example.com",
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
    processingSummary?: OtpProcessingResult,
  ): TicketRequestResponseItem {
    return {
      id: row.id,
      requesterName: metadata.requesterName,
      requesterEmail: metadata.requesterEmail,
      requestedAt: row.requestedAt.toISOString(),
      startedAt: row.startedAt?.toISOString() ?? undefined,
      resolvedAt: row.finishedAt?.toISOString() ?? undefined,
      status: this.fromTicketStatus(row.status),
      requestedBy: row.requestedBy.name,
      note: metadata.reason,
      processingSummary: processingSummary
        ? {
            unreadCount: processingSummary.unreadCount,
            processedCount: processingSummary.processedCount,
            sentCount: processingSummary.sentCount,
            filteredCount: processingSummary.filteredCount,
            notFoundCount: processingSummary.notFoundCount,
            expiredCount: processingSummary.expiredCount,
            errorCount: processingSummary.errorCount,
          }
        : undefined,
    };
  }
}