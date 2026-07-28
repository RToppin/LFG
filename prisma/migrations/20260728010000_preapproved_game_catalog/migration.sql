-- CreateEnum
CREATE TYPE "GameApprovalStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "GameSource" AS ENUM ('CURATED', 'STEAM', 'USER_REQUEST', 'ADMIN');

-- CreateEnum
CREATE TYPE "GameRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'DUPLICATE');

-- AlterTable
ALTER TABLE "Game" ADD COLUMN     "approvalStatus" "GameApprovalStatus" NOT NULL DEFAULT 'APPROVED',
ADD COLUMN     "approvedAt" TIMESTAMP(3),
ADD COLUMN     "approvedById" TEXT,
ADD COLUMN     "coverImageUrl" TEXT,
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "listingEnabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "maximumPlayers" INTEGER,
ADD COLUMN     "minimumPlayers" INTEGER,
ADD COLUMN     "shortName" TEXT,
ADD COLUMN     "source" "GameSource" NOT NULL DEFAULT 'CURATED',
ADD COLUMN     "sourceRank" INTEGER,
ADD COLUMN     "steamAppId" INTEGER,
ADD COLUMN     "supportsCrossplay" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "supportsDedicatedServers" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "supportsLocalCoop" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "supportsOnlineCoop" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE "GameCategory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GameCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GameCategoryOnGame" (
    "gameId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,

    CONSTRAINT "GameCategoryOnGame_pkey" PRIMARY KEY ("gameId","categoryId")
);

-- CreateTable
CREATE TABLE "GameRequest" (
    "id" TEXT NOT NULL,
    "requestedName" TEXT NOT NULL,
    "normalizedName" TEXT NOT NULL,
    "steamStoreUrl" TEXT,
    "notes" TEXT,
    "status" "GameRequestStatus" NOT NULL DEFAULT 'PENDING',
    "probableGameId" TEXT,
    "requestedById" TEXT NOT NULL,
    "reviewedById" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GameRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "GameCategory_slug_key" ON "GameCategory"("slug");

-- CreateIndex
CREATE INDEX "GameCategoryOnGame_categoryId_idx" ON "GameCategoryOnGame"("categoryId");

-- CreateIndex
CREATE INDEX "GameRequest_status_createdAt_idx" ON "GameRequest"("status", "createdAt");

-- CreateIndex
CREATE INDEX "GameRequest_normalizedName_idx" ON "GameRequest"("normalizedName");

-- CreateIndex
CREATE INDEX "GameRequest_requestedById_status_idx" ON "GameRequest"("requestedById", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Game_steamAppId_key" ON "Game"("steamAppId");

-- CreateIndex
CREATE INDEX "Game_name_idx" ON "Game"("name");

-- CreateIndex
CREATE INDEX "Game_approvalStatus_idx" ON "Game"("approvalStatus");

-- CreateIndex
CREATE INDEX "Game_isActive_idx" ON "Game"("isActive");

-- CreateIndex
CREATE INDEX "Game_listingEnabled_idx" ON "Game"("listingEnabled");

-- CreateIndex
CREATE INDEX "Game_sourceRank_idx" ON "Game"("sourceRank");

-- CreateIndex
CREATE INDEX "Game_steamAppId_idx" ON "Game"("steamAppId");

-- AddForeignKey
ALTER TABLE "Game" ADD CONSTRAINT "Game_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GameCategoryOnGame" ADD CONSTRAINT "GameCategoryOnGame_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GameCategoryOnGame" ADD CONSTRAINT "GameCategoryOnGame_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "GameCategory"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GameRequest" ADD CONSTRAINT "GameRequest_probableGameId_fkey" FOREIGN KEY ("probableGameId") REFERENCES "Game"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GameRequest" ADD CONSTRAINT "GameRequest_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GameRequest" ADD CONSTRAINT "GameRequest_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
