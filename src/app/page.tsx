import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { ensureSeed } from "@/db/seed";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  await ensureSeed();
  const session = await getSession();

  if (session) {
    redirect("/painel");
  }

  redirect("/login");
}
