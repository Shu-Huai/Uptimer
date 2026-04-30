import Link from "next/link";
import { redirect } from "next/navigation";

import { loginAction } from "@/actions/auth.actions";
import { IconifyIcon } from "@/components/ui/iconify-icon";
import { getCurrentUserId } from "@/lib/auth";

type LoginPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const userId = await getCurrentUserId();
  if (userId) {
    redirect("/dashboard");
  }

  const params = (await searchParams) ?? {};
  const error = typeof params.error === "string" ? decodeURIComponent(params.error) : undefined;

  return (
    <div className="m-6 h-full content-center max-w-sm space-y-4">
      <section className="up-card p-6 text-center">
        <div className="mx-auto grid size-20 place-items-center rounded-full bg-[linear-gradient(145deg,#ffe78a_0%,#ffc95a_100%)] text-[#2d3543] shadow-[0_14px_24px_rgba(255,195,77,0.3)]">
          <IconifyIcon icon="ph:timer" className="up-icon size-11" />
        </div>
        <h1 className="mt-3 text-3xl font-semibold">UpTimer</h1>
        <p className="up-subtitle">记录、分析、提升</p>
      </section>

      {error ? <div className="up-card border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}

      <form action={loginAction} className="up-card space-y-3 p-5">
        <label className="up-form-label">
          邮箱
          <input name="email" type="email" required className="up-field" placeholder="请输入邮箱" />
        </label>
        <label className="up-form-label">
          密码
          <input name="password" type="password" required className="up-field" placeholder="请输入密码" />
        </label>
        <button type="submit" className="up-primary-btn w-full">
          登录
        </button>
        <p className="text-center text-sm text-[#9aa5b8]">
          还没有账号？
          <Link href="/auth/register" className="ml-1 up-text-primary">
            去注册
          </Link>
        </p>
      </form>
    </div>
  );
}
