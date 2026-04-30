import { z } from "zod";

export const registerSchema = z.object({
  email: z.string().trim().email("邮箱格式不正确"),
  password: z
    .string()
    .min(6, "密码至少 6 位")
    .max(64, "密码长度不能超过 64 位"),
  name: z.string().trim().min(1, "昵称不能为空").max(30, "昵称最多 30 个字符"),
});

export const loginSchema = z.object({
  email: z.string().trim().email("邮箱格式不正确"),
  password: z.string().min(1, "密码不能为空"),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
