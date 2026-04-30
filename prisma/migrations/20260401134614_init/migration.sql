-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "ActivityNature" AS ENUM ('POSITIVE', 'NEUTRAL', 'NEGATIVE');

-- CreateEnum
CREATE TYPE "RecordSource" AS ENUM ('MANUAL', 'TIMER');

-- CreateEnum
CREATE TYPE "TimerStatus" AS ENUM ('RUNNING', 'FINISHED', 'CANCELED');

-- CreateEnum
CREATE TYPE "PointTransactionType" AS ENUM ('RECORD_EARN', 'GOAL_REWARD', 'GOAL_PENALTY', 'REWARD_REDEEM');

-- CreateEnum
CREATE TYPE "PointRelatedType" AS ENUM ('RECORD', 'GOAL_SETTLEMENT', 'REDEMPTION');

-- CreateEnum
CREATE TYPE "GoalPeriodType" AS ENUM ('DAILY', 'WEEKLY', 'MONTHLY');

-- CreateEnum
CREATE TYPE "StockMode" AS ENUM ('LIMITED', 'UNLIMITED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "pointBalance" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActivityCategory" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "icon" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ActivityCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tag" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Tag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Activity" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "note" TEXT,
    "icon" TEXT,
    "color" TEXT NOT NULL,
    "nature" "ActivityNature" NOT NULL,
    "rewardRatePerHour" DECIMAL(10,2) NOT NULL,
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Activity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActivityTag" (
    "activityId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,

    CONSTRAINT "ActivityTag_pkey" PRIMARY KEY ("activityId","tagId")
);

-- CreateTable
CREATE TABLE "Record" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "activityId" TEXT NOT NULL,
    "startAt" TIMESTAMP(3) NOT NULL,
    "endAt" TIMESTAMP(3) NOT NULL,
    "durationMinutes" INTEGER NOT NULL,
    "source" "RecordSource" NOT NULL,
    "note" TEXT,
    "activityNameSnapshot" TEXT NOT NULL,
    "activityNatureSnapshot" "ActivityNature" NOT NULL,
    "rewardRateSnapshot" DECIMAL(10,2) NOT NULL,
    "pointDelta" DECIMAL(12,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Record_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TimerSession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "activityId" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL,
    "endedAt" TIMESTAMP(3),
    "status" "TimerStatus" NOT NULL DEFAULT 'RUNNING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TimerSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PointTransaction" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "PointTransactionType" NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "balanceAfter" DECIMAL(12,2) NOT NULL,
    "relatedType" "PointRelatedType" NOT NULL,
    "relatedId" TEXT NOT NULL,
    "note" TEXT,
    "happenedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PointTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GoalGroup" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "icon" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GoalGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Goal" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "groupId" TEXT,
    "name" TEXT NOT NULL,
    "note" TEXT,
    "icon" TEXT,
    "color" TEXT NOT NULL,
    "periodType" "GoalPeriodType" NOT NULL,
    "targetMinutes" INTEGER NOT NULL,
    "rewardPoints" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "penaltyPoints" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Goal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GoalActivity" (
    "goalId" TEXT NOT NULL,
    "activityId" TEXT NOT NULL,

    CONSTRAINT "GoalActivity_pkey" PRIMARY KEY ("goalId","activityId")
);

-- CreateTable
CREATE TABLE "GoalSettlement" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "goalId" TEXT NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "totalMinutes" INTEGER NOT NULL,
    "isCompleted" BOOLEAN NOT NULL,
    "pointDelta" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "settledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GoalSettlement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RewardItem" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "note" TEXT,
    "icon" TEXT,
    "color" TEXT NOT NULL,
    "pricePoints" DECIMAL(12,2) NOT NULL,
    "stockMode" "StockMode" NOT NULL,
    "stock" INTEGER,
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RewardItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Redemption" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "rewardItemId" TEXT NOT NULL,
    "priceSnapshot" DECIMAL(12,2) NOT NULL,
    "pointDelta" DECIMAL(12,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Redemption_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ActivityCategory_userId_sortOrder_idx" ON "ActivityCategory"("userId", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "ActivityCategory_userId_name_key" ON "ActivityCategory"("userId", "name");

-- CreateIndex
CREATE INDEX "Tag_userId_createdAt_idx" ON "Tag"("userId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Tag_userId_name_key" ON "Tag"("userId", "name");

-- CreateIndex
CREATE INDEX "Activity_userId_isEnabled_idx" ON "Activity"("userId", "isEnabled");

-- CreateIndex
CREATE INDEX "Activity_categoryId_idx" ON "Activity"("categoryId");

-- CreateIndex
CREATE UNIQUE INDEX "Activity_userId_name_key" ON "Activity"("userId", "name");

-- CreateIndex
CREATE INDEX "Record_userId_startAt_idx" ON "Record"("userId", "startAt");

-- CreateIndex
CREATE INDEX "Record_userId_endAt_idx" ON "Record"("userId", "endAt");

-- CreateIndex
CREATE INDEX "Record_activityId_startAt_idx" ON "Record"("activityId", "startAt");

-- CreateIndex
CREATE INDEX "TimerSession_userId_status_idx" ON "TimerSession"("userId", "status");

-- CreateIndex
CREATE INDEX "TimerSession_userId_startedAt_idx" ON "TimerSession"("userId", "startedAt");

-- CreateIndex
CREATE INDEX "PointTransaction_userId_happenedAt_idx" ON "PointTransaction"("userId", "happenedAt");

-- CreateIndex
CREATE INDEX "PointTransaction_userId_type_idx" ON "PointTransaction"("userId", "type");

-- CreateIndex
CREATE INDEX "GoalGroup_userId_sortOrder_idx" ON "GoalGroup"("userId", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "GoalGroup_userId_name_key" ON "GoalGroup"("userId", "name");

-- CreateIndex
CREATE INDEX "Goal_userId_periodType_isEnabled_idx" ON "Goal"("userId", "periodType", "isEnabled");

-- CreateIndex
CREATE INDEX "Goal_groupId_idx" ON "Goal"("groupId");

-- CreateIndex
CREATE INDEX "GoalSettlement_userId_settledAt_idx" ON "GoalSettlement"("userId", "settledAt");

-- CreateIndex
CREATE UNIQUE INDEX "GoalSettlement_goalId_periodStart_periodEnd_key" ON "GoalSettlement"("goalId", "periodStart", "periodEnd");

-- CreateIndex
CREATE INDEX "RewardItem_userId_isEnabled_idx" ON "RewardItem"("userId", "isEnabled");

-- CreateIndex
CREATE INDEX "Redemption_userId_createdAt_idx" ON "Redemption"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "Redemption_rewardItemId_createdAt_idx" ON "Redemption"("rewardItemId", "createdAt");

-- AddForeignKey
ALTER TABLE "ActivityCategory" ADD CONSTRAINT "ActivityCategory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tag" ADD CONSTRAINT "Tag_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "ActivityCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityTag" ADD CONSTRAINT "ActivityTag_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "Activity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityTag" ADD CONSTRAINT "ActivityTag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Record" ADD CONSTRAINT "Record_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Record" ADD CONSTRAINT "Record_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "Activity"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimerSession" ADD CONSTRAINT "TimerSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimerSession" ADD CONSTRAINT "TimerSession_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "Activity"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PointTransaction" ADD CONSTRAINT "PointTransaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GoalGroup" ADD CONSTRAINT "GoalGroup_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Goal" ADD CONSTRAINT "Goal_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Goal" ADD CONSTRAINT "Goal_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "GoalGroup"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GoalActivity" ADD CONSTRAINT "GoalActivity_goalId_fkey" FOREIGN KEY ("goalId") REFERENCES "Goal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GoalActivity" ADD CONSTRAINT "GoalActivity_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "Activity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GoalSettlement" ADD CONSTRAINT "GoalSettlement_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GoalSettlement" ADD CONSTRAINT "GoalSettlement_goalId_fkey" FOREIGN KEY ("goalId") REFERENCES "Goal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RewardItem" ADD CONSTRAINT "RewardItem_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Redemption" ADD CONSTRAINT "Redemption_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Redemption" ADD CONSTRAINT "Redemption_rewardItemId_fkey" FOREIGN KEY ("rewardItemId") REFERENCES "RewardItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
