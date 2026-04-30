import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";
import { hash } from "bcryptjs";
import { ActivityNature, GoalPeriodType, PrismaClient, StockMode } from "@prisma/client";

import { DEMO_EMAIL, DEMO_PASSWORD, DEMO_USER_ID } from "../src/lib/constants";
import { toDecimal } from "../src/lib/utils";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error("DATABASE_URL 未配置");
}

const prisma = new PrismaClient({
  adapter: new PrismaPg(databaseUrl),
});

async function main() {
  const demoPasswordHash = await hash(DEMO_PASSWORD, 12);

  await prisma.user.upsert({
    where: { id: DEMO_USER_ID },
    update: {
      name: "UpTimer Demo User",
      email: DEMO_EMAIL,
      passwordHash: demoPasswordHash,
    },
    create: {
      id: DEMO_USER_ID,
      name: "UpTimer Demo User",
      email: DEMO_EMAIL,
      passwordHash: demoPasswordHash,
      pointBalance: toDecimal(0),
    },
  });

  const activities = [
    {
      id: "act-study",
      name: "学习",
      nature: ActivityNature.POSITIVE,
      rewardRatePerHour: 10,
      icon: "📘",
    },
    {
      id: "act-reading",
      name: "阅读",
      nature: ActivityNature.POSITIVE,
      rewardRatePerHour: 6,
      icon: "📖",
    },
    {
      id: "act-exercise",
      name: "运动",
      nature: ActivityNature.POSITIVE,
      rewardRatePerHour: 8,
      icon: "🏃",
    },
    {
      id: "act-sleep",
      name: "睡觉",
      nature: ActivityNature.NEUTRAL,
      rewardRatePerHour: 0,
      icon: "😴",
    },
    {
      id: "act-eat",
      name: "吃饭",
      nature: ActivityNature.NEUTRAL,
      rewardRatePerHour: 1,
      icon: "🍚",
    },
    {
      id: "act-scroll",
      name: "刷短视频",
      nature: ActivityNature.NEGATIVE,
      rewardRatePerHour: -8,
      icon: "📱",
    },
    {
      id: "act-gaming",
      name: "打游戏",
      nature: ActivityNature.NEGATIVE,
      rewardRatePerHour: -6,
      icon: "🎮",
    },
  ];

  for (const activity of activities) {
    await prisma.activity.upsert({
      where: { id: activity.id },
      update: {
        userId: DEMO_USER_ID,
        name: activity.name,
        note: "",
        icon: activity.icon,
        nature: activity.nature,
        rewardRatePerHour: toDecimal(activity.rewardRatePerHour),
        isEnabled: true,
      },
      create: {
        id: activity.id,
        userId: DEMO_USER_ID,
        name: activity.name,
        note: "",
        icon: activity.icon,
        nature: activity.nature,
        rewardRatePerHour: toDecimal(activity.rewardRatePerHour),
        isEnabled: true,
      },
    });
  }

  await prisma.goal.upsert({
    where: { id: "goal-daily-study" },
    update: {
      name: "每日学习 60 分钟",
      periodType: GoalPeriodType.DAILY,
      targetMinutes: 60,
      rewardPoints: toDecimal(8),
      penaltyPoints: toDecimal(4),
      color: "#2563eb",
      isEnabled: true,
    },
    create: {
      id: "goal-daily-study",
      userId: DEMO_USER_ID,
      name: "每日学习 60 分钟",
      periodType: GoalPeriodType.DAILY,
      targetMinutes: 60,
      rewardPoints: toDecimal(8),
      penaltyPoints: toDecimal(4),
      color: "#2563eb",
      isEnabled: true,
    },
  });

  await prisma.goal.upsert({
    where: { id: "goal-weekly-study-reading" },
    update: {
      name: "每周学习+阅读 600 分钟",
      periodType: GoalPeriodType.WEEKLY,
      targetMinutes: 600,
      rewardPoints: toDecimal(30),
      penaltyPoints: toDecimal(12),
      color: "#1d4ed8",
      isEnabled: true,
    },
    create: {
      id: "goal-weekly-study-reading",
      userId: DEMO_USER_ID,
      name: "每周学习+阅读 600 分钟",
      periodType: GoalPeriodType.WEEKLY,
      targetMinutes: 600,
      rewardPoints: toDecimal(30),
      penaltyPoints: toDecimal(12),
      color: "#1d4ed8",
      isEnabled: true,
    },
  });

  await prisma.goalActivity.deleteMany({
    where: {
      goalId: { in: ["goal-daily-study", "goal-weekly-study-reading"] },
    },
  });

  await prisma.goalActivity.createMany({
    data: [
      { goalId: "goal-daily-study", activityId: "act-study" },
      { goalId: "goal-weekly-study-reading", activityId: "act-study" },
      { goalId: "goal-weekly-study-reading", activityId: "act-reading" },
    ],
    skipDuplicates: true,
  });

  await Promise.all(
    [
      { id: "reward-episode", name: "看一集剧", pricePoints: 15, stockMode: StockMode.UNLIMITED, stock: null },
      { id: "reward-milk-tea", name: "买一杯奶茶", pricePoints: 25, stockMode: StockMode.LIMITED, stock: 5 },
      { id: "reward-game-30", name: "玩 30 分钟游戏", pricePoints: 10, stockMode: StockMode.UNLIMITED, stock: null },
    ].map((item) =>
      prisma.rewardItem.upsert({
        where: { id: item.id },
        update: {
          name: item.name,
          pricePoints: toDecimal(item.pricePoints),
          stockMode: item.stockMode,
          stock: item.stock,
          color: "#334155",
          icon: "🎁",
          note: "Seed 奖励项",
          isEnabled: true,
        },
        create: {
          id: item.id,
          userId: DEMO_USER_ID,
          name: item.name,
          pricePoints: toDecimal(item.pricePoints),
          stockMode: item.stockMode,
          stock: item.stock,
          color: "#334155",
          icon: "🎁",
          note: "Seed 奖励项",
          isEnabled: true,
        },
      }),
    ),
  );
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
