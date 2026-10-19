import { backendFetch } from "@/lib/api/server";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const response = await backendFetch("/health");
    const payload = await response.json();
    return Response.json(payload.data, { status: response.status });
  } catch {
    return Response.json({ ok: false, service: "zeladoria-api", database: "unknown" }, { status: 503 });
  }
}
