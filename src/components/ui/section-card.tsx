import type { ReactNode } from "react";

type SectionCardProps = {
  title: string;
  description?: string;
  children: ReactNode;
};

export function SectionCard({ title, description, children }: SectionCardProps) {
  return (
    <section className="up-card p-4">
      <div className="mb-4 border-b border-[#e7eef9] pb-3">
        <h2 className="text-base font-semibold tracking-[0.01em] text-[#2f3f57]">{title}</h2>
        {description ? <p className="mt-1 text-sm up-text-weak">{description}</p> : null}
      </div>
      {children}
    </section>
  );
}
