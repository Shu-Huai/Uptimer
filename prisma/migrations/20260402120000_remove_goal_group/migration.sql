-- Drop goal grouping concept: remove Goal.groupId and GoalGroup table
ALTER TABLE "Goal" DROP CONSTRAINT IF EXISTS "Goal_groupId_fkey";

DROP INDEX IF EXISTS "Goal_groupId_idx";

ALTER TABLE "Goal" DROP COLUMN IF EXISTS "groupId";

DROP TABLE IF EXISTS "GoalGroup";
