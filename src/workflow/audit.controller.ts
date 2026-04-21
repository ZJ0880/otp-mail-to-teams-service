import { BadRequestException, Controller, Get, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth } from "@nestjs/swagger";
import { Prisma } from "@prisma/client";
import { Roles } from "../auth/roles.decorator";
import { RolesGuard } from "../auth/roles.guard";
import { TokenAuthGuard } from "../auth/token-auth.guard";
import { PrismaService } from "../database/prisma.service";
import { AuditEventsListResponse, AuditEventsQueryDto, AuditEventResponse } from "./audit-events.dto";

@Controller("audit")
@UseGuards(TokenAuthGuard, RolesGuard)
@ApiBearerAuth("bearer")
export class AuditController {
  constructor(private readonly prismaService: PrismaService) {}

  @Get("events")
  @Roles("ADMIN", "OPERATOR", "VIEWER")
  async listEvents(@Query() query: AuditEventsQueryDto): Promise<AuditEventsListResponse> {
    const page = this.normalizePositiveNumber(query.page, 1);
    const pageSize = this.normalizePositiveNumber(query.pageSize, 20, 100);
    const skip = (page - 1) * pageSize;

    const fromDate = this.parseIsoDate(query.from, "from");
    const toDate = this.parseIsoDate(query.to, "to");

    if (fromDate && toDate && fromDate.getTime() > toDate.getTime()) {
      throw new BadRequestException("from must be before or equal to to");
    }

    const whereByDate =
      fromDate || toDate
        ? {
            createdAt: {
              ...(fromDate ? { gte: fromDate } : {}),
              ...(toDate ? { lte: toDate } : {}),
            },
          }
        : {};

    const whereByAction = query.action
      ? {
          action: {
            contains: query.action.trim(),
            mode: "insensitive" as const,
          },
        }
      : {};

    const whereByTicket = query.ticketId
      ? {
          entityId: query.ticketId,
        }
      : {};

    const whereByActor = query.actor
      ? {
          actor: {
            name: {
              contains: query.actor.trim(),
              mode: "insensitive" as const,
            },
          },
        }
      : {};

    let whereByResult: Prisma.AuditLogWhereInput = {};
    if (query.result === "failure") {
      whereByResult = {
        action: {
          contains: "FAILED",
          mode: "insensitive" as const,
        },
      };
    } else if (query.result === "success") {
      whereByResult = {
        OR: [
          {
            action: {
              contains: "CREATED",
              mode: "insensitive" as const,
            },
          },
          {
            action: {
              contains: "PROCESSED",
              mode: "insensitive" as const,
            },
          },
        ],
      };
    }

    const dbWhere: Prisma.AuditLogWhereInput = {
      ...whereByDate,
      ...whereByAction,
      ...whereByTicket,
      ...whereByActor,
      ...whereByResult,
    };

    const total = await this.prismaService.auditLog.count({
      where: dbWhere,
    });

    const rows = await this.prismaService.auditLog.findMany({
      where: dbWhere,
      include: {
        actor: true,
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize,
    });

    const items = rows.map((row): AuditEventResponse => {
      const result = row.action.toUpperCase().includes("FAILED") ? "failure" : "success";
      const details = this.safeDetails(row.afterJson, row.beforeJson);

      return {
        id: row.id,
        timestamp: row.createdAt.toISOString(),
        actor: row.actor.name,
        action: row.action,
        result,
        ticketId: row.entityType === "TicketRequest" ? row.entityId : undefined,
        details,
      };
    });

    return {
      items,
      total,
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

  private safeDetails(afterJson: unknown, beforeJson: unknown): string {
    const value = afterJson ?? beforeJson;
    if (!value) {
      return "No details";
    }

    try {
      return JSON.stringify(value);
    } catch {
      return "No details";
    }
  }
}