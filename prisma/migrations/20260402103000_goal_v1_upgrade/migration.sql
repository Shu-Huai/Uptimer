-- Goal V1 settlement snapshot fields and relation hardening
ALTER TABLE "GoalSettlement"
  ADD COLUMN "targetMinutesSnapshot" INTEGER,
  ADD COLUMN "rewardPointsSnapshot" DECIMAL(12,2) NOT NULL DEFAULT 0,
  ADD COLUMN "penaltyPointsSnapshot" DECIMAL(12,2) NOT NULL DEFAULT 0,
  ADD COLUMN "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

UPDATE "GoalSettlement" gs
SET "targetMinutesSnapshot" = g."targetMinutes"
FROM "Goal" g
WHERE gs."goalId" = g."id";

UPDATE "GoalSettlement"
SET "targetMinutesSnapshot" = 0
WHERE "targetMinutesSnapshot" IS NULL;

ALTER TABLE "GoalSettlement"
  ALTER COLUMN "targetMinutesSnapshot" SET NOT NULL;

CREATE INDEX "GoalSettlement_goalId_settledAt_idx"
ON "GoalSettlement"("goalId", "settledAt");

ALTER TABLE "GoalActivity" DROP CONSTRAINT "GoalActivity_activityId_fkey";
ALTER TABLE "GoalActivity"
  ADD CONSTRAINT "GoalActivity_activityId_fkey"
  FOREIGN KEY ("activityId") REFERENCES "Activity"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;
