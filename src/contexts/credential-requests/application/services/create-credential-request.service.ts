import {
  CredentialRequest,
  Instant,
  Platform,
  RequestContext,
  RequesterEmail,
  LockActiveError,
} from "../../domain";
import { CreateCredentialRequestInput, CreateCredentialRequestOutput, CreateCredentialRequestUseCase } from "../use-cases/create-credential-request.use-case";
import { ClockPort } from "../ports/out/clock.port";
import { IdGeneratorPort } from "../ports/out/id-generator.port";
import { CredentialRequestRepositoryPort } from "../ports/out/credential-request-repository.port";
import { LockRepositoryPort } from "../ports/out/lock-repository.port";
import { AuditEventRepositoryPort } from "../ports/out/audit-event-repository.port";
import { CredentialRequestConflictError } from "../errors/credential-request.errors";
import { UserAuthenticationPort } from "../../../users/application/ports/out/user-authentication.port";

const LOCK_TTL_MINUTES = 10;
const PUBLIC_REQUEST_PLATFORM = "udemy";

export class CreateCredentialRequestService implements CreateCredentialRequestUseCase {
  constructor(
    private readonly clock: ClockPort,
    private readonly idGenerator: IdGeneratorPort,
    private readonly credentialRequestRepository: CredentialRequestRepositoryPort,
    private readonly lockRepository: LockRepositoryPort,
    private readonly auditEventRepository: AuditEventRepositoryPort,
    private readonly userAuthentication: UserAuthenticationPort,
  ) {}

  async execute(input: CreateCredentialRequestInput): Promise<CreateCredentialRequestOutput> {
    const now = this.clock.now();
    const id = this.idGenerator.newCredentialRequestId();
    const authenticatedUser = await this.userAuthentication.authenticate({
      email: input.email,
      password: input.password,
    });

    const requesterEmail = RequesterEmail.from(authenticatedUser.email);
    const platform = Platform.from(PUBLIC_REQUEST_PLATFORM);
    const context = RequestContext.create({});
    const request = CredentialRequest.create({
      id,
      requesterEmail,
      platform,
      context,
      createdAt: now,
    });

    const lockKey = request.lockKey();
    const activeLock = await this.lockRepository.getActive(lockKey, now);
    if (activeLock) {
      throw new CredentialRequestConflictError(new LockActiveError(activeLock.lockedUntil.toIsoString()).message);
    }

    const lockedUntil = Instant.fromDate(new Date(now.value.getTime() + LOCK_TTL_MINUTES * 60 * 1000));
    const acquired = await this.lockRepository.acquire(lockKey, lockedUntil);
    if (!acquired) {
      const retryLock = await this.lockRepository.getActive(lockKey, now);
      throw new CredentialRequestConflictError(
        retryLock ? new LockActiveError(retryLock.lockedUntil.toIsoString()).message : "A request lock is already active",
      );
    }

    await this.credentialRequestRepository.create(request);
    await this.auditEventRepository.append({
      type: "CREDENTIAL_REQUEST_CREATED",
      requestId: id,
      occurredAt: now,
      details: {
        requesterEmail: requesterEmail.value,
        platform: platform.value,
        userId: authenticatedUser.id,
      },
    });

    return {
      requestId: id,
      status: "PENDING",
      createdAt: now,
    };
  }
}