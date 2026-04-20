-- AlterTable
ALTER TABLE "public"."TicketRequest"
ADD COLUMN "requesterName" TEXT NOT NULL DEFAULT '',
ADD COLUMN "requesterEmail" TEXT NOT NULL DEFAULT '';

-- CreateIndex
CREATE INDEX "TicketRequest_requesterEmail_requestedAt_idx" ON "public"."TicketRequest"("requesterEmail", "requestedAt");

-- CreateIndex
CREATE INDEX "TicketRequest_requesterName_requestedAt_idx" ON "public"."TicketRequest"("requesterName", "requestedAt");
