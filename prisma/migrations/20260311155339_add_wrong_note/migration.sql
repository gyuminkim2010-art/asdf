-- CreateTable
CREATE TABLE "WrongAnswerNote" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "contentType" TEXT NOT NULL,
    "contentId" INTEGER NOT NULL,
    "questionText" TEXT NOT NULL,
    "questionPrompt" TEXT NOT NULL,
    "correctAnswer" TEXT NOT NULL,
    "selectedAnswer" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" INTEGER NOT NULL,
    CONSTRAINT "WrongAnswerNote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
