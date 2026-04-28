import { Module } from "@nestjs/common";
import { DatabaseModule } from "../../../../database/database.module";
import { PrismaAuditEventRepository } from "../prisma/prisma-audit-event.repository";
import { PrismaCredentialRequestRepository } from "../prisma/prisma-credential-request.repository";
import { PrismaLockRepository } from "../prisma/prisma-lock.repository";
import {
  AUDIT_EVENT_REPOSITORY_PORT,
  CREDENTIAL_REQUEST_REPOSITORY_PORT,
  LOCK_REPOSITORY_PORT,
} from "./credential-requests-persistence.tokens";

@Module({
  imports: [DatabaseModule],
  providers: [
    PrismaCredentialRequestRepository,
    PrismaLockRepository,
    PrismaAuditEventRepository,
    {
      provide: CREDENTIAL_REQUEST_REPOSITORY_PORT,
      useExisting: PrismaCredentialRequestRepository,
    },
    {
      provide: LOCK_REPOSITORY_PORT,
      useExisting: PrismaLockRepository,
    },
    {
      provide: AUDIT_EVENT_REPOSITORY_PORT,
      useExisting: PrismaAuditEventRepository,
    },
  ],
  exports: [
    CREDENTIAL_REQUEST_REPOSITORY_PORT,
    LOCK_REPOSITORY_PORT,
    AUDIT_EVENT_REPOSITORY_PORT,
  ],
})
export class CredentialRequestsPersistenceModule {}