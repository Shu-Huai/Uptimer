import Link from "next/link";

export default function NewActivityPage() {
  return (
    <div className="up-card p-5">
      <h1 className="up-page-title text-lg">新建活动</h1>
      <p className="mt-2 text-sm up-text-weak">
        当前版本统一在活动管理页创建。请前往 <Link href="/activities" className="up-text-primary">/activities</Link>。
      </p>
    </div>
  );
}
