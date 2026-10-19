import { cookies } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";
import { backendFetch } from "@/lib/api/server";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const assemblyId = parseInt(id, 10);
  if (!assemblyId || isNaN(assemblyId)) {
    return new NextResponse("ID de assembleia inválido.", { status: 400 });
  }

  const jar = await cookies();
  const query = new URLSearchParams();
  if (jar.get("gc_condo")?.value) query.set("condoId", jar.get("gc_condo")!.value);
  if (jar.get("gc_role")?.value) query.set("role", jar.get("gc_role")!.value);

  const response = await backendFetch(`/assembleias/${assemblyId}/ata/download?${query.toString()}`, {
    token: jar.get("gc_session")?.value,
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => null) as { message?: string } | null;
    return new NextResponse(payload?.message || "Não foi possível baixar a ata.", { status: response.status });
  }

  return new NextResponse(await response.text(), {
    status: 200,
    headers: {
      "Content-Type": response.headers.get("content-type") ?? "application/pdf",
      "Content-Disposition": response.headers.get("content-disposition") ?? "attachment",
      "Cache-Control": "private, no-cache, no-store, must-revalidate",
    },
  });
}
