import { hash, compare } from "bcryptjs";

import { db } from "@/lib/db";
import { ConflictError, ValidationError } from "@/lib/errors";

import { loginSchema, registerSchema, type LoginInput, type RegisterInput } from "./auth.schemas";

async function createStarterData(userId: string) {
  await db.activity.create({
    data: {
      userId,
      name: "学习",
      icon: "📘",
      nature: "POSITIVE",
      rewardRatePerHour: 8.34,
    },
  });
}

export const authService = {
  async register(input: RegisterInput) {
    const parsed = registerSchema.parse(input);
    const email = parsed.email.toLowerCase();

    const exists = await db.user.findFirst({
      where: {
        email: { equals: email, mode: "insensitive" },
      },
      select: { id: true },
    });
    if (exists) {
      throw new ConflictError("该邮箱已注册");
    }

    const passwordHash = await hash(parsed.password, 12);
    const user = await db.user.create({
      data: {
        name: parsed.name,
        email,
        passwordHash,
      },
      select: {
        id: true,
        email: true,
        name: true,
      },
    });

    await createStarterData(user.id);
    return user;
  },

  async login(input: LoginInput) {
    const parsed = loginSchema.parse(input);
    const email = parsed.email.toLowerCase();

    const user = await db.user.findFirst({
      where: {
        email: { equals: email, mode: "insensitive" },
      },
      select: {
        id: true,
        email: true,
        name: true,
        passwordHash: true,
      },
    });

    if (!user || !user.passwordHash) {
      throw new ValidationError("邮箱或密码错误");
    }

    const ok = await compare(parsed.password, user.passwordHash);
    if (!ok) {
      throw new ValidationError("邮箱或密码错误");
    }

    return user;
  },
};
