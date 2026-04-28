/*
  Warnings:

  - The values [PROCESSING,SUCCESS,FAILED,RETRYING,CANCELLED] on the enum `TicketStatus` will be removed. If these variants are still used in the database, this will fail.
  - The values [OPERATOR,VIEWER] on the enum `UserRole` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `finishedAt` on the `TicketRequest` table. All the data in the column will be lost.
  - You are about to drop the column `profileId` on the `TicketRequest` table. All the data in the column will be lost.
  - You are about to drop the column `requestedByUserId` on the `TicketRequest` table. All the data in the column will be lost.
  - You are about to drop the column `startedAt` on the `TicketRequest` table. All the data in the column will be lost.
  - You are about to drop the `CredentialProfile` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `NotificationEvent` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `OtpResult` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `RateLimitEvent` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `TicketAttempt` table. If the table is not empty, all the data it contains will be lost.
  - Made the column `passwordHash` on table `User` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "public"."TicketStatus_new" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
ALTER TABLE "public"."TicketRequest" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "public"."TicketRequest" ALTER COLUMN "status" TYPE "public"."TicketStatus_new" USING ("status"::text::"public"."TicketStatus_new");
ALTER TYPE "public"."TicketStatus" RENAME TO "TicketStatus_old";
ALTER TYPE "public"."TicketStatus_new" RENAME TO "TicketStatus";
DROP TYPE "public"."TicketStatus_old";
ALTER TABLE "public"."TicketRequest" ALTER COLUMN "status" SET DEFAULT 'PENDING';
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "public"."UserRole_new" AS ENUM ('USER', 'ADMIN');
ALTER TABLE "public"."User" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "public"."User" ALTER COLUMN "role" TYPE "public"."UserRole_new" USING ("role"::text::"public"."UserRole_new");
ALTER TYPE "public"."UserRole" RENAME TO "UserRole_old";
ALTER TYPE "public"."UserRole_new" RENAME TO "UserRole";
DROP TYPE "public"."UserRole_old";
ALTER TABLE "public"."User" ALTER COLUMN "role" SET DEFAULT 'USER';
COMMIT;

-- DropForeignKey
ALTER TABLE "public"."AuditLog" DROP CONSTRAINT "AuditLog_actorUserId_fkey";

-- DropForeignKey
ALTER TABLE "public"."CredentialProfile" DROP CONSTRAINT "CredentialProfile_ownerUserId_fkey";

-- DropForeignKey
ALTER TABLE "public"."NotificationEvent" DROP CONSTRAINT "NotificationEvent_userId_fkey";

-- DropForeignKey
ALTER TABLE "public"."OtpResult" DROP CONSTRAINT "OtpResult_ticketRequestId_fkey";

-- DropForeignKey
ALTER TABLE "public"."RateLimitEvent" DROP CONSTRAINT "RateLimitEvent_userId_fkey";

-- DropForeignKey
ALTER TABLE "public"."TicketAttempt" DROP CONSTRAINT "TicketAttempt_ticketRequestId_fkey";

-- DropForeignKey
ALTER TABLE "public"."TicketRequest" DROP CONSTRAINT "TicketRequest_profileId_fkey";

-- DropForeignKey
ALTER TABLE "public"."TicketRequest" DROP CONSTRAINT "TicketRequest_requestedByUserId_fkey";

-- DropIndex
DROP INDEX "public"."TicketRequest_profileId_idx";

-- DropIndex
DROP INDEX "public"."TicketRequest_requestedByUserId_idx";

-- AlterTable
ALTER TABLE "public"."TicketRequest" DROP COLUMN "finishedAt",
DROP COLUMN "profileId",
DROP COLUMN "requestedByUserId",
DROP COLUMN "startedAt",
ADD COLUMN     "resolvedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "public"."User" ADD COLUMN     "document" TEXT,
ADD COLUMN     "firstName" TEXT,
ADD COLUMN     "lastName" TEXT,
ALTER COLUMN "role" SET DEFAULT 'USER',
ALTER COLUMN "passwordHash" SET NOT NULL;

-- DropTable
DROP TABLE "public"."CredentialProfile";

-- DropTable
DROP TABLE "public"."NotificationEvent";

-- DropTable
DROP TABLE "public"."OtpResult";

-- DropTable
DROP TABLE "public"."RateLimitEvent";

-- DropTable
DROP TABLE "public"."TicketAttempt";

-- DropEnum
DROP TYPE "public"."AttemptResult";

-- DropEnum
DROP TYPE "public"."NotificationType";

-- CreateIndex
CREATE INDEX "User_role_isActive_idx" ON "public"."User"("role", "isActive");

-- CreateIndex
CREATE INDEX "User_email_isActive_idx" ON "public"."User"("email", "isActive");
