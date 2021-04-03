-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "discriminator" TEXT NOT NULL,
    "email" TEXT
);
INSERT INTO "new_User" ("id", "name", "discriminator", "email") SELECT "id", "name", "discriminator", "email" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
