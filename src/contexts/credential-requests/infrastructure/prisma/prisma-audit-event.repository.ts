import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { AuditEventRecord, AuditEventRepositoryPort } from "../../application/ports/out/audit-event-repository.port";
import { PrismaService } from "../../../../database/prisma.service";

const AUDIT_ENTITY_TYPE = "CredentialRequest";

@Injectable()
export class PrismaAuditEventRepository implements AuditEventRepositoryPort {
  constructor(private readonly prismaService: PrismaService) {}

  async append(event: AuditEventRecord): Promise<void> {
    const afterJson: Record<string, unknown> = {
      requestId: event.requestId.value,
      occurredAtIso: event.occurredAt.toIsoString(),
    };
    if (event.details) {
      Object.assign(afterJson, event.details);
    }

    await this.prismaService.auditLog.create({
      data: {
        actorUserId: event.actorId ?? "system",
        action: event.type,
        entityType: AUDIT_ENTITY_TYPE,
        entityId: event.requestId.value,
        beforeJson: Prisma.JsonNull,
        afterJson: afterJson as Prisma.InputJsonValue,
        ip: null,
        userAgent: null,
        createdAt: event.occurredAt.value,
      },
    });
  }
}