-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "public"."UserRole" AS ENUM ('ADMIN', 'OPERATOR', 'VIEWER');

-- CreateEnum
CREATE TYPE "public"."TicketStatus" AS ENUM ('PENDING', 'PROCESSING', 'SUCCESS', 'FAILED', 'RETRYING', 'CANCELLED');

-- CreateEnum
CREATE TYPE "public"."AttemptResult" AS ENUM ('SUCCESS', 'FAILED', 'NO_MATCH', 'EXPIRED', 'FILTERED');

-- CreateEnum
CREATE TYPE "public"."NotificationType" AS ENUM ('TICKET_CREATED', 'TICKET_STATUS_CHANGED', 'TICKET_RETRY_SCHEDULED', 'CONFIG_UPDATED', 'RATE_LIMIT_BLOCKED', 'SYSTEM_ALERT');

-- CreateTable
CREATE TABLE "public"."User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "public"."UserRole" NOT NULL DEFAULT 'OPERATOR',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "passwordHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."CredentialProfile" (
    "id" TEXT NOT NULL,
    "ownerUserId" TEXT NOT NULL,
    "profileName" TEXT NOT NULL,
    "mailHost" TEXT NOT NULL,
    "mailPort" INTEGER NOT NULL,
    "mailSecure" BOOLEAN NOT NULL,
    "mailUser" TEXT NOT NULL,
    "mailMailbox" TEXT NOT NULL,
    "mailPasswordEncrypted" TEXT NOT NULL,
    "teamsWebhookEncrypted" TEXT NOT NULL,
    "teamsMessageTemplate" TEXT NOT NULL,
    "allowedFromCsv" TEXT,
    "subjectKeywordsCsv" TEXT,
    "otpRegexPatterns" TEXT NOT NULL,
    "otpTtlMinutes" INTEGER NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CredentialProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."TicketRequest" (
    "id" TEXT NOT NULL,
    "requestedByUserId" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "requesterName" TEXT NOT NULL DEFAULT '',
    "requesterEmail" TEXT NOT NULL DEFAULT '',
    "status" "public"."TicketStatus" NOT NULL DEFAULT 'PENDING',
    "requestReason" TEXT,
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "startedAt" TIMESTAMP(3),
    "finishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TicketRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."TicketAttempt" (
    "id" TEXT NOT NULL,
    "ticketRequestId" TEXT NOT NULL,
    "attemptNumber" INTEGER NOT NULL,
    "result" "public"."AttemptResult" NOT NULL,
    "errorCode" TEXT,
    "errorMessage" TEXT,
    "durationMs" INTEGER,
    "executedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TicketAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."OtpResult" (
    "id" TEXT NOT NULL,
    "ticketRequestId" TEXT NOT NULL,
    "otpMasked" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "receivedAt" TIMESTAMP(3) NOT NULL,
    "deliveredToTeams" BOOLEAN NOT NULL DEFAULT false,
    "deliveredAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OtpResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."AuditLog" (
    "id" TEXT NOT NULL,
    "actorUserId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "beforeJson" JSONB,
    "afterJson" JSONB,
    "ip" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."RateLimitEvent" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "blocked" BOOLEAN NOT NULL,
    "windowKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RateLimitEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."NotificationEvent" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "eventType" "public"."NotificationType" NOT NULL,
    "payloadJson" JSONB NOT NULL,
    "delivered" BOOLEAN NOT NULL DEFAULT false,
    "deliveredAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NotificationEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "public"."User"("email");

-- CreateIndex
CREATE INDEX "CredentialProfile_ownerUserId_idx" ON "public"."CredentialProfile"("ownerUserId");

-- CreateIndex
CREATE UNIQUE INDEX "CredentialProfile_ownerUserId_profileName_key" ON "public"."CredentialProfile"("ownerUserId", "profileName");

-- CreateIndex
CREATE UNIQUE INDEX "CredentialProfile_id_ownerUserId_key" ON "public"."CredentialProfile"("id", "ownerUserId");

-- CreateIndex
CREATE INDEX "TicketRequest_requestedByUserId_idx" ON "public"."TicketRequest"("requestedByUserId");

-- CreateIndex
CREATE INDEX "TicketRequest_profileId_idx" ON "public"."TicketRequest"("profileId");

-- CreateIndex
CREATE INDEX "TicketRequest_status_requestedAt_idx" ON "public"."TicketRequest"("status", "requestedAt");

-- CreateIndex
CREATE INDEX "TicketRequest_requesterEmail_requestedAt_idx" ON "public"."TicketRequest"("requesterEmail", "requestedAt");

-- CreateIndex
CREATE INDEX "TicketRequest_requesterName_requestedAt_idx" ON "public"."TicketRequest"("requesterName", "requestedAt");

-- CreateIndex
CREATE INDEX "TicketAttempt_ticketRequestId_executedAt_idx" ON "public"."TicketAttempt"("ticketRequestId", "executedAt");

-- CreateIndex
CREATE UNIQUE INDEX "TicketAttempt_ticketRequestId_attemptNumber_key" ON "public"."TicketAttempt"("ticketRequestId", "attemptNumber");

-- CreateIndex
CREATE INDEX "OtpResult_ticketRequestId_idx" ON "public"."OtpResult"("ticketRequestId");

-- CreateIndex
CREATE INDEX "AuditLog_actorUserId_createdAt_idx" ON "public"."AuditLog"("actorUserId", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_entityType_entityId_idx" ON "public"."AuditLog"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "RateLimitEvent_userId_endpoint_createdAt_idx" ON "public"."RateLimitEvent"("userId", "endpoint", "createdAt");

-- CreateIndex
CREATE INDEX "NotificationEvent_userId_createdAt_idx" ON "public"."NotificationEvent"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "NotificationEvent_eventType_createdAt_idx" ON "public"."NotificationEvent"("eventType", "createdAt");

-- AddForeignKey
ALTER TABLE "public"."CredentialProfile" ADD CONSTRAINT "CredentialProfile_ownerUserId_fkey" FOREIGN KEY ("ownerUserId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TicketRequest" ADD CONSTRAINT "TicketRequest_requestedByUserId_fkey" FOREIGN KEY ("requestedByUserId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TicketRequest" ADD CONSTRAINT "TicketRequest_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "public"."CredentialProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TicketAttempt" ADD CONSTRAINT "TicketAttempt_ticketRequestId_fkey" FOREIGN KEY ("ticketRequestId") REFERENCES "public"."TicketRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."OtpResult" ADD CONSTRAINT "OtpResult_ticketRequestId_fkey" FOREIGN KEY ("ticketRequestId") REFERENCES "public"."TicketRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AuditLog" ADD CONSTRAINT "AuditLog_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."RateLimitEvent" ADD CONSTRAINT "RateLimitEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."NotificationEvent" ADD CONSTRAINT "NotificationEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;


