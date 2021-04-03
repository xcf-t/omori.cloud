/*
  Warnings:

  - You are about to alter the column `size` on the `CloudSave` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Int`.

*/
-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_CloudSave" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "creatorId" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    FOREIGN KEY ("creatorId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_CloudSave" ("id", "createdAt", "creatorId", "size") SELECT "id", "createdAt", "creatorId", "size" FROM "CloudSave";
DROP TABLE "CloudSave";
ALTER TABLE "new_CloudSave" RENAME TO "CloudSave";
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "avatar" TEXT,
    "discriminator" TEXT NOT NULL,
    "storageUsage" INTEGER NOT NULL DEFAULT 0,
    "email" TEXT
);
INSERT INTO "new_User" ("id", "name", "discriminator", "email", "avatar") SELECT "id", "name", "discriminator", "email", "avatar" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
