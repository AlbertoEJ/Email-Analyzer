-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "picture" TEXT,
    "encryptedAccessToken" TEXT,
    "encryptedRefreshToken" TEXT,
    "tokenExpiresAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "EmailAnalysis" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "gmailId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "sender" TEXT NOT NULL,
    "senderEmail" TEXT NOT NULL,
    "recipients" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "snippet" TEXT,
    "bodyText" TEXT,
    "bodyHtml" TEXT,
    "headerScore" REAL NOT NULL DEFAULT 0,
    "headerDetails" TEXT,
    "urlScore" REAL NOT NULL DEFAULT 0,
    "urlDetails" TEXT,
    "contentScore" REAL NOT NULL DEFAULT 0,
    "contentDetails" TEXT,
    "attachmentScore" REAL NOT NULL DEFAULT 0,
    "attachmentDetails" TEXT,
    "threatScore" REAL NOT NULL DEFAULT 0,
    "threatLevel" TEXT NOT NULL DEFAULT 'safe',
    "threatSummary" TEXT,
    "analyzedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "EmailAnalysis_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ScanLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "emailsScanned" INTEGER NOT NULL DEFAULT 0,
    "threatsFound" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'running',
    "error" TEXT,
    "startedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" DATETIME,
    CONSTRAINT "ScanLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "EmailAnalysis_userId_idx" ON "EmailAnalysis"("userId");

-- CreateIndex
CREATE INDEX "EmailAnalysis_threatLevel_idx" ON "EmailAnalysis"("threatLevel");

-- CreateIndex
CREATE INDEX "EmailAnalysis_date_idx" ON "EmailAnalysis"("date");

-- CreateIndex
CREATE UNIQUE INDEX "EmailAnalysis_gmailId_userId_key" ON "EmailAnalysis"("gmailId", "userId");

-- CreateIndex
CREATE INDEX "ScanLog_userId_idx" ON "ScanLog"("userId");
