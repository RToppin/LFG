ALTER TABLE "LfgPost" ADD COLUMN "platforms" "Platform"[] NOT NULL DEFAULT ARRAY[]::"Platform"[];

UPDATE "LfgPost"
SET "platforms" = ARRAY["platform"]::"Platform"[]
WHERE cardinality("platforms") = 0;

CREATE INDEX "LfgPost_platforms_idx" ON "LfgPost" USING GIN ("platforms");