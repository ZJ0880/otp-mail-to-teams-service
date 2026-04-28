import { Injectable } from "@nestjs/common";
import { AuditLog as AuditLogRow, Prisma } from "@prisma/client";
import { Instant, LockKey } from "../../domain";
import { LockInfo, LockRepositoryPort } from "../../application/ports/out/lock-repository.port";
import { PrismaService } from "../../../../database/prisma.service";

const LOCK_ENTITY_TYPE = "CredentialRequestLock";
const LOCK_ACQUIRED_ACTION = "LOCK_ACQUIRED";

@Injectable()
export class PrismaLockRepository implements LockRepositoryPort {
  constructor(private readonly prismaService: PrismaService) {}

  async getActive(key: LockKey, now: Instant): Promise<LockInfo | null> {
    const row = await this.prismaService.auditLog.findFirst({
      where: {
        action: LOCK_ACQUIRED_ACTION,
        entityType: LOCK_ENTITY_TYPE,
        entityId: key.toString(),
      },
      orderBy: { createdAt: "desc" },
    });

    return this.toActiveLock(row, key, now);
  }

  async acquire(key: LockKey, lockedUntil: Instant): Promise<boolean> {
    const now = Instant.fromDate(new Date());

    return this.prismaService.$transaction(async (transaction) => {
      const row = await transaction.auditLog.findFirst({
        where: {
          action: LOCK_ACQUIRED_ACTION,
          entityType: LOCK_ENTITY_TYPE,
          entityId: key.toString(),
        },
        orderBy: { createdAt: "desc" },
      });

      if (this.toActiveLock(row, key, now)) {
        return false;
      }

      await transaction.auditLog.create({
        data: {
          actorUserId: "system",
          action: LOCK_ACQUIRED_ACTION,
          entityType: LOCK_ENTITY_TYPE,
          entityId: key.toString(),
          beforeJson: Prisma.JsonNull,
          afterJson: {
            lockedUntilIso: lockedUntil.toIsoString(),
          },
          ip: null,
          userAgent: null,
          createdAt: now.value,
        },
      });

      return true;
    });
  }

  private toActiveLock(row: AuditLogRow | null, key: LockKey, now: Instant): LockInfo | null {
    if (!row?.afterJson || typeof row.afterJson !== "object" || Array.isArray(row.afterJson)) {
      return null;
    }

    const lockedUntilIso = (row.afterJson as Record<string, unknown>).lockedUntilIso;
    if (typeof lockedUntilIso !== "string") {
      return null;
    }

    const lockedUntil = Instant.fromIso(lockedUntilIso);
    if (lockedUntil.isBefore(now)) {
      return null;
    }

    return { key, lockedUntil };
  }
}