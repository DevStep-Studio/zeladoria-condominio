import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { generateIncidentsCsv } from "@/lib/services/system-incidents-storage";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return new NextResponse("Não autorizado", { status: 401 });
    }

    const isSuperAdmin = session.role === "superadmin" || session.user.isSuperAdmin;
    const condoId = session.condo?.id ?? null;

    const csvData = generateIncidentsCsv(condoId, isSuperAdmin);
    const filename = `avisos-erros-${new Date().toISOString().slice(0, 10)}.csv`;

    return new NextResponse(csvData, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (err: any) {
    console.error("Erro ao exportar incidentes:", err);
    return new NextResponse("Erro ao gerar exportação CSV", { status: 500 });
  }
}
