import { redirect } from "next/navigation";

type NewRecordPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function NewRecordPage({ searchParams }: NewRecordPageProps) {
  const params = (await searchParams) ?? {};
  const dateParam = typeof params.date === "string" ? params.date : "";
  const query = new URLSearchParams();
  query.set("backfill", "1");
  if (dateParam) query.set("date", dateParam);
  redirect(`/records?${query.toString()}`);
}
