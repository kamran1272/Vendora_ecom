CREATE TABLE "warehouse_imports" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "providerId" TEXT NOT NULL,
    "query" TEXT,
    "status" TEXT NOT NULL DEFAULT 'RUNNING',
    "createdCount" INTEGER NOT NULL DEFAULT 0,
    "updatedCount" INTEGER NOT NULL DEFAULT 0,
    "failedCount" INTEGER NOT NULL DEFAULT 0,
    "errors" TEXT NOT NULL DEFAULT '[]',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" DATETIME
);
CREATE INDEX "warehouse_imports_providerId_createdAt_idx" ON "warehouse_imports"("providerId", "createdAt");
CREATE INDEX "warehouse_imports_status_createdAt_idx" ON "warehouse_imports"("status", "createdAt");