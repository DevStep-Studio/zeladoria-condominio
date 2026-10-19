import { backendFetch } from "@/lib/api/server";
export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: Promise<{ tipo: string }> }) {
  const { tipo } = await params;
  const response = await backendFetch(`/modelos/${encodeURIComponent(tipo)}`);
  if (!response.ok) return new Response("Modelo não encontrado", { status: response.status });
  return new Response(response.body, { headers: { "content-type": response.headers.get("content-type") ?? "text/csv; charset=utf-8", "content-disposition": response.headers.get("content-disposition") ?? "attachment" } });
}
