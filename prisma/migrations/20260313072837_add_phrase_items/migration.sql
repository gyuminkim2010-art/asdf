/*
  Warnings:

  - A unique constraint covering the columns `[userId,contentType,contentId]` on the table `WrongAnswerNote` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "WrongAnswerNote" ADD COLUMN "extraData" TEXT;

-- CreateTable
CREATE TABLE "PhraseItem" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "category" TEXT NOT NULL,
    "title" TEXT,
    "hanjaText" TEXT NOT NULL,
    "koreanText" TEXT NOT NULL,
    "hanjaTokens" TEXT NOT NULL,
    "koreanTokens" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "WrongAnswerNote_userId_contentType_contentId_key" ON "WrongAnswerNote"("userId", "contentType", "contentId");
