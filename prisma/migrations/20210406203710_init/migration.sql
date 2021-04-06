/*
  Warnings:

  - Added the required column `dataHash` to the `CloudSave` table without a default value. This is not possible if the table is not empty.
  - Added the required column `metaHash` to the `CloudSave` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_CloudSave" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "description" TEXT NOT NULL DEFAULT '',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dataHash" TEXT NOT NULL,
    "metaHash" TEXT NOT NULL,
    "creatorId" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    FOREIGN KEY ("creatorId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_CloudSave" ("id", "description", "createdAt", "creatorId", "size") SELECT "id", "description", "createdAt", "creatorId", "size" FROM "CloudSave";
DROP TABLE "CloudSave";
ALTER TABLE "new_CloudSave" RENAME TO "CloudSave";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
