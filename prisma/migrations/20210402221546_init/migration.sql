-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_UserToken" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "token" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_UserToken" ("id", "token", "userId") SELECT "id", "token", "userId" FROM "UserToken";
DROP TABLE "UserToken";
ALTER TABLE "new_UserToken" RENAME TO "UserToken";
CREATE UNIQUE INDEX "UserToken.token_unique" ON "UserToken"("token");
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
