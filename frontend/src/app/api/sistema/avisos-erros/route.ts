import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import {
  queryIncidents,
  createManualIncident,
  type IncidentPriority,
  type IncidentType,
} from "@/lib/services/system-incidents-storage";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const tab = (searchParams.get("tab") || "visao-geral") as any;
    const q = searchParams.get("q") || "";
    const priority = (searchParams.get("priority") || undefined) as IncidentPriority | undefined;
    const status = searchParams.get("status") || undefined;
    const sourceModule = searchParams.get("module") || undefined;
    const type = (searchParams.get("type") || undefined) as IncidentType | undefined;
    const assignee = searchParams.get("assignee") || undefined;
    const startDate = searchParams.get("startDate") || undefined;
    const endDate = searchParams.get("endDate") || undefined;
    const sortBy = searchParams.get("sortBy") || "last_seen_at";
    const sortDir = (searchParams.get("sortDir") || "desc") as "asc" | "desc";
    const page = parseInt(searchParams.get("page") || "1", 10);
    const perPage = parseInt(searchParams.get("perPage") || "15", 10);

    const isSuperAdmin = session.role === "superadmin" || session.user.isSuperAdmin;
    const condoId = isSuperAdmin
      ? (searchParams.get("condoId") ? parseInt(searchParams.get("condoId")!, 10) : (session.condo?.id ?? null))
      : (session.condo?.id ?? null);

    const result = queryIncidents({
      tab,
      q,
      priority,
      status,
      module: sourceModule,
      type,
      condoId,
      assignee,
      startDate,
      endDate,
      sortBy,
      sortDir,
      page,
      perPage,
      isSuperAdmin,
    });

    return NextResponse.json({ data: result });
  } catch (err: any) {
    console.error("Erro na API de incidentes:", err);
    return NextResponse.json({ error: "Erro interno ao listar incidentes" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    // Role check: superadmin, sindico, zelador can register manual alerts
    const allowed = ["superadmin", "sindico", "zelador"].includes(session.role);
    if (!allowed) {
      return NextResponse.json({ error: "Perfil não autorizado a registrar avisos manuais." }, { status: 403 });
    }

    const body = await request.json();
    if (!body.title || !body.description || !body.type || !body.priority) {
      return NextResponse.json({ error: "Campos obrigatórios ausentes (título, descrição, tipo, prioridade)." }, { status: 422 });
    }

    const incident = createManualIncident({
      title: String(body.title).trim(),
      description: String(body.description).trim(),
      type: body.type,
      priority: body.priority,
      category: body.category || "operacional",
      sourceModule: body.sourceModule || "Administração Condominial",
      condoId: session.role === "superadmin" && body.condoId !== undefined ? body.condoId : session.condo?.id ?? null,
      condoName: session.condo?.name ?? null,
      assigneeId: body.assigneeId || null,
      assigneeName: body.assigneeName || null,
      startDate: body.startDate || null,
      endDate: body.endDate || null,
      recommendedAction: body.recommendedAction || null,
      targetAudience: body.targetAudience || "todos",
      user: { id: session.user.id, name: session.user.name },
      notify: Boolean(body.notify),
    });

    return NextResponse.json({ data: incident }, { status: 201 });
  } catch (err: any) {
    console.error("Erro ao registrar aviso:", err);
    return NextResponse.json({ error: "Erro interno ao registrar aviso" }, { status: 500 });
  }
}
