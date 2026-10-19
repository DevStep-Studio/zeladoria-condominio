import { cookies } from "next/headers";
import { backendFetch } from "@/lib/api/server";
import { requireCondo } from "@/lib/auth";
export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: Promise<{ entity: string }> }) {
  const { entity } = await params;
  const { condoId, session } = await requireCondo();
  const query = new URLSearchParams({ condoId: String(condoId), role: session.role });
  const response = await backendFetch(`/export/${encodeURIComponent(entity)}?${query}`, { token: (await cookies()).get("gc_session")?.value });
  if (!response.ok) return new Response("Exportação indisponível para este perfil.", { status: response.status });
  return new Response(response.body, { headers: { "content-type": response.headers.get("content-type") ?? "text/csv; charset=utf-8", "content-disposition": response.headers.get("content-disposition") ?? "attachment" } });
}
