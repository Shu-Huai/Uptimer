import Link from "next/link";
import { redirect } from "next/navigation";

import { registerAction } from "@/actions/auth.actions";
import { getCurrentUserId } from "@/lib/auth";

type RegisterPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function RegisterPage({ searchParams }: RegisterPageProps) {
  const userId = await getCurrentUserId();
  if (userId) {
    redirect("/dashboard");
  }

  const params = (await searchParams) ?? {};
  const error = typeof params.error === "string" ? decodeURIComponent(params.error) : undefined;

  return (
    <div className="m-6 h-full content-center max-w-sm space-y-4">
      <section className="up-card p-6 text-center">
        <h1 className="text-3xl font-semibold">创建账号</h1>
        <p className="up-subtitle">注册后将自动创建你的个人默认数据</p>
      </section>

      {error ? <div className="up-card border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}

      <form action={registerAction} className="up-card space-y-3 p-5">
        <label className="up-form-label">
          昵称
          <input name="name" required className="up-field" placeholder="请输入昵称" />
        </label>
        <label className="up-form-label">
          邮箱
          <input name="email" type="email" required className="up-field" placeholder="请输入邮箱" />
        </label>
        <label className="up-form-label">
          密码
          <input
            name="password"
            type="password"
            required
            minLength={6}
            className="up-field"
            placeholder="至少 6 位密码"
          />
        </label>
        <button type="submit" className="up-primary-btn w-full">
          注册并开始使用
        </button>
        <p className="text-center text-sm text-[#9aa5b8]">
          已有账号？
          <Link href="/auth/login" className="ml-1 up-text-primary">
            去登录
          </Link>
        </p>
      </form>
    </div>
  );
}
