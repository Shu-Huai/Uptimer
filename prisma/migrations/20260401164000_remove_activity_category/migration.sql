ALTER TABLE "Activity" DROP CONSTRAINT IF EXISTS "Activity_categoryId_fkey";
DROP INDEX IF EXISTS "Activity_categoryId_idx";
ALTER TABLE "Activity" DROP COLUMN IF EXISTS "categoryId";
DROP TABLE IF EXISTS "ActivityCategory";