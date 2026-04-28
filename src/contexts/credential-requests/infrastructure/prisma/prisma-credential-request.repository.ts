import { Injectable } from "@nestjs/common";
import { Prisma, TicketRequest as TicketRequestRow } from "@prisma/client";
import {
  CredentialRequest,
  CredentialRequestId,
  Instant,
  Platform,
  RequestContext,
  RequestStatus,
  RequesterEmail,
} from "../../domain";
import { PaginatedResult, PaginationInput } from "../../application/contracts/pagination";
import {
  CredentialRequestListFilters,
  CredentialRequestRepositoryPort,
} from "../../application/ports/out/credential-request-repository.port";
import { PrismaService } from "../../../../database/prisma.service";

interface StoredRequestMetadata {
  platform?: string;
  course?: string;
  reason?: string;
  decisionReason?: string;
}

@Injectable()
export class PrismaCredentialRequestRepository implements CredentialRequestRepositoryPort {
  constructor(private readonly prismaService: PrismaService) {}

  async create(request: CredentialRequest): Promise<void> {
    const metadata = this.serializeMetadata({
      platform: request.platform.value,
      course: request.context.course?.value,
      reason: request.context.reason?.value,
    });

    await this.prismaService.ticketRequest.create({
      data: {
        id: request.id.value,
        requesterName: request.platform.value,
        requesterEmail: request.requesterEmail.value,
        status: request.status,
        requestReason: metadata,
        requestedAt: request.createdAt.value,
        resolvedAt: request.decidedAt?.value ?? null,
        createdAt: request.createdAt.value,
        updatedAt: request.createdAt.value,
      },
    });
  }

  async getById(id: CredentialRequestId): Promise<CredentialRequest | null> {
    const row = await this.prismaService.ticketRequest.findUnique({
      where: { id: id.value },
    });

    return row ? this.toDomain(row) : null;
  }

  async list(
    filters: CredentialRequestListFilters,
    pagination: PaginationInput,
  ): Promise<PaginatedResult<CredentialRequest>> {
    const where = this.buildWhere(filters);

    const [total, rows] = await this.prismaService.$transaction([
      this.prismaService.ticketRequest.count({ where }),
      this.prismaService.ticketRequest.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (pagination.page - 1) * pagination.pageSize,
        take: pagination.pageSize,
      }),
    ]);

    return {
      total,
      items: rows.map((row) => this.toDomain(row)),
    };
  }

  async saveDecision(
    id: CredentialRequestId,
    next: { status: Exclude<RequestStatus, "PENDING">; decidedAt: Instant; decisionReason?: string },
  ): Promise<void> {
    const existing = await this.prismaService.ticketRequest.findUniqueOrThrow({
      where: { id: id.value },
    });

    const metadata = this.parseMetadata(existing.requestReason);
    const storedMetadata = this.serializeMetadata({
      platform: metadata.platform ?? existing.requesterName,
      course: metadata.course,
      reason: metadata.reason,
      decisionReason: next.decisionReason ?? metadata.decisionReason,
    });

    await this.prismaService.ticketRequest.update({
      where: { id: id.value },
      data: {
        status: next.status,
        resolvedAt: next.decidedAt.value,
        requestReason: storedMetadata,
        updatedAt: next.decidedAt.value,
      },
    });
  }

  private buildWhere(filters: CredentialRequestListFilters): Prisma.TicketRequestWhereInput {
    const where: Prisma.TicketRequestWhereInput = {};
    const createdAt: Prisma.DateTimeFilter = {};

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.from) {
      createdAt.gte = filters.from.value;
    }

    if (filters.to) {
      createdAt.lte = filters.to.value;
    }

    if (Object.keys(createdAt).length > 0) {
      where.createdAt = createdAt;
    }

    if (filters.emailContains?.trim()) {
      where.requesterEmail = {
        contains: filters.emailContains.trim().toLowerCase(),
        mode: "insensitive",
      };
    }

    if (filters.platform?.trim()) {
      where.requesterName = Platform.from(filters.platform).value;
    }

    return where;
  }

  private toDomain(row: TicketRequestRow): CredentialRequest {
    const metadata = this.parseMetadata(row.requestReason);
    const platform = Platform.from(metadata.platform ?? row.requesterName ?? "unknown");
    const request = CredentialRequest.create({
      id: CredentialRequestId.from(row.id),
      requesterEmail: RequesterEmail.from(row.requesterEmail),
      platform,
      context: RequestContext.create({
        course: metadata.course,
        reason: metadata.reason,
      }),
      createdAt: Instant.fromDate(row.createdAt),
    });

    const rowStatus = String(row.status);
    const resolvedAt = (row as { resolvedAt?: Date | null }).resolvedAt;

    if (rowStatus === "APPROVED") {
      return request.approve(Instant.fromDate(resolvedAt ?? row.updatedAt ?? row.createdAt), metadata.decisionReason);
    }

    if (rowStatus === "REJECTED") {
      return request.reject(Instant.fromDate(resolvedAt ?? row.updatedAt ?? row.createdAt), metadata.decisionReason);
    }

    return request;
  }

  private parseMetadata(raw: string | null): StoredRequestMetadata {
    if (!raw) {
      return {};
    }

    try {
      const parsed = JSON.parse(raw) as unknown;
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
        return { reason: raw };
      }

      const payload = parsed as Record<string, unknown>;
      return {
        platform: typeof payload.platform === "string" ? payload.platform : undefined,
        course: typeof payload.course === "string" ? payload.course : undefined,
        reason: typeof payload.reason === "string" ? payload.reason : undefined,
        decisionReason:
          typeof payload.decisionReason === "string" ? payload.decisionReason : undefined,
      };
    } catch {
      return { reason: raw };
    }
  }

  private serializeMetadata(metadata: StoredRequestMetadata): string | null {
    const payload: StoredRequestMetadata = {};

    if (metadata.platform) {
      payload.platform = metadata.platform;
    }

    if (metadata.course) {
      payload.course = metadata.course;
    }

    if (metadata.reason) {
      payload.reason = metadata.reason;
    }

    if (metadata.decisionReason) {
      payload.decisionReason = metadata.decisionReason;
    }

    return Object.keys(payload).length > 0 ? JSON.stringify(payload) : null;
  }
}