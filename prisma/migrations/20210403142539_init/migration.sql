-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "avatar" TEXT,
    "discriminator" TEXT NOT NULL,
    "storageQuota" INTEGER NOT NULL DEFAULT 1000000,
    "storageUsage" INTEGER NOT NULL DEFAULT 0,
    "email" TEXT
);
INSERT INTO "new_User" ("id", "name", "avatar", "discriminator", "storageUsage", "email") SELECT "id", "name", "avatar", "discriminator", "storageUsage", "email" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
