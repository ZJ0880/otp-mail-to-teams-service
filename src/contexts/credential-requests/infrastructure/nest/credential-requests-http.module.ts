import { Module } from "@nestjs/common";
import { AdminAuthModule } from "../../../admin-auth/infrastructure/nest/admin-auth.module";
import { UsersAuthenticationModule } from "../../../users/infrastructure/nest/users-authentication.module";
import { CredentialRequestsPersistenceModule } from "./credential-requests-persistence.module";
import type { ApprovalTokenServicePort } from "../../application/ports/out/approval-token-service.port";
import type { AuditEventRepositoryPort } from "../../application/ports/out/audit-event-repository.port";
import type { ClockPort } from "../../application/ports/out/clock.port";
import type { CredentialRequestRepositoryPort } from "../../application/ports/out/credential-request-repository.port";
import type { IdGeneratorPort } from "../../application/ports/out/id-generator.port";
import type { LockRepositoryPort } from "../../application/ports/out/lock-repository.port";
import type { UserAuthenticationPort } from "../../../users/application/ports/out/user-authentication.port";
import { ApproveCredentialRequestService } from "../../application/services/approve-credential-request.service";
import { CreateCredentialRequestService } from "../../application/services/create-credential-request.service";
import { ExecuteApprovalTokenDecisionService } from "../../application/services/execute-approval-token-decision.service";
import { GetCredentialRequestByIdService } from "../../application/services/get-credential-request-by-id.service";
import { ListCredentialRequestsService } from "../../application/services/list-credential-requests.service";
import { RejectCredentialRequestService } from "../../application/services/reject-credential-request.service";
import { AdminCredentialRequestsController } from "../../adapters/in/http/admin-credential-requests.controller";
import { IntegrationApprovalsController } from "../../adapters/in/http/integration-approvals.controller";
import { PublicCredentialRequestsController } from "../../adapters/in/http/public-credential-requests.controller";
import { JwtApprovalTokenService } from "../adapters/out/approval-token/jwt-approval-token.service";
import { CryptoIdGeneratorAdapter } from "../adapters/out/id-generator/crypto-id-generator.adapter";
import { SystemClockAdapter } from "../adapters/out/clock/system-clock.adapter";
import {
  APPROVAL_TOKEN_SERVICE_PORT,
  CLOCK_PORT,
  ID_GENERATOR_PORT,
} from "./credential-requests-application.tokens";
import {
  AUDIT_EVENT_REPOSITORY_PORT,
  CREDENTIAL_REQUEST_REPOSITORY_PORT,
  LOCK_REPOSITORY_PORT,
} from "./credential-requests-persistence.tokens";
import { USER_AUTHENTICATION_PORT } from "../../../users/infrastructure/nest/users-authentication.tokens";

@Module({
  imports: [AdminAuthModule, UsersAuthenticationModule, CredentialRequestsPersistenceModule],
  controllers: [PublicCredentialRequestsController, AdminCredentialRequestsController, IntegrationApprovalsController],
  providers: [
    SystemClockAdapter,
    CryptoIdGeneratorAdapter,
    JwtApprovalTokenService,
    {
      provide: CreateCredentialRequestService,
      useFactory: (
        clock: ClockPort,
        idGenerator: IdGeneratorPort,
        credentialRequestRepository: CredentialRequestRepositoryPort,
        lockRepository: LockRepositoryPort,
        auditEventRepository: AuditEventRepositoryPort,
        userAuthentication: UserAuthenticationPort,
      ) => new CreateCredentialRequestService(
        clock,
        idGenerator,
        credentialRequestRepository,
        lockRepository,
        auditEventRepository,
        userAuthentication,
      ),
      inject: [
        CLOCK_PORT,
        ID_GENERATOR_PORT,
        CREDENTIAL_REQUEST_REPOSITORY_PORT,
        LOCK_REPOSITORY_PORT,
        AUDIT_EVENT_REPOSITORY_PORT,
          USER_AUTHENTICATION_PORT,
      ],
    },
    {
      provide: GetCredentialRequestByIdService,
      useFactory: (credentialRequestRepository: CredentialRequestRepositoryPort) =>
        new GetCredentialRequestByIdService(credentialRequestRepository),
      inject: [CREDENTIAL_REQUEST_REPOSITORY_PORT],
    },
    {
      provide: ListCredentialRequestsService,
      useFactory: (credentialRequestRepository: CredentialRequestRepositoryPort) =>
        new ListCredentialRequestsService(credentialRequestRepository),
      inject: [CREDENTIAL_REQUEST_REPOSITORY_PORT],
    },
    {
      provide: ApproveCredentialRequestService,
      useFactory: (
        credentialRequestRepository: CredentialRequestRepositoryPort,
        auditEventRepository: AuditEventRepositoryPort,
        clock: ClockPort,
      ) => new ApproveCredentialRequestService(
        credentialRequestRepository,
        auditEventRepository,
        clock,
      ),
      inject: [
        CREDENTIAL_REQUEST_REPOSITORY_PORT,
        AUDIT_EVENT_REPOSITORY_PORT,
        CLOCK_PORT,
      ],
    },
    {
      provide: RejectCredentialRequestService,
      useFactory: (
        credentialRequestRepository: CredentialRequestRepositoryPort,
        auditEventRepository: AuditEventRepositoryPort,
        clock: ClockPort,
      ) => new RejectCredentialRequestService(
        credentialRequestRepository,
        auditEventRepository,
        clock,
      ),
      inject: [
        CREDENTIAL_REQUEST_REPOSITORY_PORT,
        AUDIT_EVENT_REPOSITORY_PORT,
        CLOCK_PORT,
      ],
    },
    {
      provide: ExecuteApprovalTokenDecisionService,
      useFactory: (
        approvalTokenService: ApprovalTokenServicePort,
        credentialRequestRepository: CredentialRequestRepositoryPort,
        auditEventRepository: AuditEventRepositoryPort,
        clock: ClockPort,
      ) => new ExecuteApprovalTokenDecisionService(
        approvalTokenService,
        credentialRequestRepository,
        auditEventRepository,
        clock,
      ),
      inject: [
        APPROVAL_TOKEN_SERVICE_PORT,
        CREDENTIAL_REQUEST_REPOSITORY_PORT,
        AUDIT_EVENT_REPOSITORY_PORT,
        CLOCK_PORT,
      ],
    },
    {
      provide: CLOCK_PORT,
      useExisting: SystemClockAdapter,
    },
    {
      provide: ID_GENERATOR_PORT,
      useExisting: CryptoIdGeneratorAdapter,
    },
    {
      provide: APPROVAL_TOKEN_SERVICE_PORT,
      useExisting: JwtApprovalTokenService,
    },
  ],
  exports: [CLOCK_PORT, ID_GENERATOR_PORT, APPROVAL_TOKEN_SERVICE_PORT],
})
export class CredentialRequestsHttpModule {}