-- CreateTable
CREATE TABLE "td_users" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "username" TEXT NOT NULL,
    "faction" TEXT NOT NULL,
    "identity_role" TEXT NOT NULL DEFAULT 'citizen',
    "is_high_affinity_candidate" BOOLEAN NOT NULL DEFAULT false,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "td_users_username_key" ON "td_users"("username");
