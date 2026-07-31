-- CreateEnum
CREATE TYPE "SocialPostStatus" AS ENUM ('ACTIVE', 'REMOVED_BY_MODERATION');

-- CreateEnum
CREATE TYPE "MediaApprovalStatus" AS ENUM ('NONE', 'PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "LeaderboardVerificationStatus" AS ENUM ('UNVERIFIED', 'PENDING', 'VERIFIED', 'REJECTED');

-- CreateTable
CREATE TABLE "SocialPost" (
    "id" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "imageUrl" TEXT,
    "imageStatus" "MediaApprovalStatus" NOT NULL DEFAULT 'NONE',
    "status" "SocialPostStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SocialPost_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SocialComment" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "SocialComment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectZomboidRun" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "characterName" TEXT NOT NULL,
    "zombieKills" INTEGER NOT NULL,
    "daysSurvived" INTEGER NOT NULL,
    "gameSettings" TEXT NOT NULL,
    "verificationStatus" "LeaderboardVerificationStatus" NOT NULL DEFAULT 'UNVERIFIED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProjectZomboidRun_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SocialPost_gameId_status_createdAt_idx" ON "SocialPost"("gameId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "SocialPost_authorId_createdAt_idx" ON "SocialPost"("authorId", "createdAt");

-- CreateIndex
CREATE INDEX "SocialPost_imageStatus_createdAt_idx" ON "SocialPost"("imageStatus", "createdAt");

-- CreateIndex
CREATE INDEX "SocialComment_postId_createdAt_idx" ON "SocialComment"("postId", "createdAt");

-- CreateIndex
CREATE INDEX "SocialComment_authorId_createdAt_idx" ON "SocialComment"("authorId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "ProjectZomboidRun_postId_key" ON "ProjectZomboidRun"("postId");

-- CreateIndex
CREATE INDEX "ProjectZomboidRun_verificationStatus_zombieKills_idx" ON "ProjectZomboidRun"("verificationStatus", "zombieKills");

-- CreateIndex
CREATE INDEX "ProjectZomboidRun_verificationStatus_daysSurvived_idx" ON "ProjectZomboidRun"("verificationStatus", "daysSurvived");

-- AddForeignKey
ALTER TABLE "SocialPost" ADD CONSTRAINT "SocialPost_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SocialPost" ADD CONSTRAINT "SocialPost_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SocialComment" ADD CONSTRAINT "SocialComment_postId_fkey" FOREIGN KEY ("postId") REFERENCES "SocialPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SocialComment" ADD CONSTRAINT "SocialComment_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectZomboidRun" ADD CONSTRAINT "ProjectZomboidRun_postId_fkey" FOREIGN KEY ("postId") REFERENCES "SocialPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;
