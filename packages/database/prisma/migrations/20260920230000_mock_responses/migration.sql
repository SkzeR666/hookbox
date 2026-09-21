-- V0.3 mock responses: one canned-response preset per inbox
-- CreateTable
CREATE TABLE "mock_responses" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "inboxId" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "status" INTEGER NOT NULL DEFAULT 200,
    "headers" TEXT NOT NULL DEFAULT '{}',
    "body" TEXT NOT NULL DEFAULT '',
    "contentType" TEXT NOT NULL DEFAULT 'application/json',
    "delayMs" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "mock_responses_inboxId_fkey" FOREIGN KEY ("inboxId") REFERENCES "inboxes" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "mock_responses_inboxId_key" ON "mock_responses"("inboxId");
