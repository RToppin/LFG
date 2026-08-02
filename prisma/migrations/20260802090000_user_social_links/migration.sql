CREATE TYPE "SocialLinkKind" AS ENUM ('WEBSITE', 'TWITCH', 'YOUTUBE', 'STEAM', 'X', 'INSTAGRAM', 'TIKTOK', 'XBOX', 'PLAYSTATION', 'NINTENDO', 'OTHER');

CREATE TABLE "SocialLink" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "kind" "SocialLinkKind" NOT NULL,
    "url" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SocialLink_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "SocialLink_userId_kind_key" ON "SocialLink"("userId", "kind");

CREATE INDEX "SocialLink_userId_sortOrder_idx" ON "SocialLink"("userId", "sortOrder");

ALTER TABLE "SocialLink" ADD CONSTRAINT "SocialLink_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;