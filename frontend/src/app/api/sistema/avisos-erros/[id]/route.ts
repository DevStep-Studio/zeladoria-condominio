import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import {
  getIncidentDetail,
  updateIncidentStatus,
  updateIncidentAssignee,
  updateIncidentPriority,
  addIncidentComment,
  silenceIncident,
  type IncidentStatus,
  type IncidentPriority,
} from "@/lib/services/system-incidents-storage";

export const dynamic = "force-dynamic";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { id } = await params;
    const incidentId = parseInt(id, 10);
    if (isNaN(incidentId)) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    }

    const isSuperAdmin = session.role === "superadmin" || session.user.isSuperAdmin;
    const detail = getIncidentDetail(incidentId, isSuperAdmin);

    if (!detail) {
      return NextResponse.json({ error: "Incidente não encontrado" }, { status: 404 });
    }

    // Tenancy isolation check
    if (!isSuperAdmin && detail.incident.condoId && session.condo?.id && detail.incident.condoId !== session.condo.id) {
      return NextResponse.json({ error: "Acesso restrito ao condomínio correspondente" }, { status: 403 });
    }

    return NextResponse.json({ data: detail });
  } catch (err: any) {
    console.error("Erro ao obter detalhes do incidente:", err);
    return NextResponse.json({ error: "Erro interno ao carregar detalhes" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { id } = await params;
    const incidentId = parseInt(id, 10);
    if (isNaN(incidentId)) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    }

    const body = await request.json();
    const action = body.action as string;

    const user = { id: session.user.id, name: session.user.name };

    if (action === "status") {
      const status = body.status as IncidentStatus;
      if (!["aberto", "reconhecido", "em_analise", "resolvido", "encerrado"].includes(status)) {
        return NextResponse.json({ error: "Status inválido" }, { status: 422 });
      }

      if (status === "resolvido" && (!body.resolutionNotes || String(body.resolutionNotes).trim().length < 5)) {
        return NextResponse.json(
          { error: "A descrição da solução adotada é obrigatória para marcar o incidente como resolvido." },
          { status: 422 }
        );
      }

      const updated = updateIncidentStatus(incidentId, status, body.resolutionNotes || null, user);
      if (!updated) return NextResponse.json({ error: "Incidente não encontrado" }, { status: 404 });
      return NextResponse.json({ data: updated });
    }

    if (action === "assignee") {
      if (!body.assigneeName || String(body.assigneeName).trim() === "") {
        return NextResponse.json({ error: "Nome do responsável é obrigatório" }, { status: 422 });
      }
      const updated = updateIncidentAssignee(incidentId, String(body.assigneeName).trim(), body.assigneeId || null, user);
      if (!updated) return NextResponse.json({ error: "Incidente não encontrado" }, { status: 404 });
      return NextResponse.json({ data: updated });
    }

    if (action === "priority") {
      const priority = body.priority as IncidentPriority;
      if (!["P0", "P1", "P2", "P3"].includes(priority)) {
        return NextResponse.json({ error: "Prioridade inválida" }, { status: 422 });
      }
      const updated = updateIncidentPriority(incidentId, priority, body.reason || null, user);
      if (!updated) return NextResponse.json({ error: "Incidente não encontrado" }, { status: 404 });
      return NextResponse.json({ data: updated });
    }

    if (action === "silence") {
      const silenced = Boolean(body.silenced);
      const updated = silenceIncident(incidentId, silenced, user);
      if (!updated) return NextResponse.json({ error: "Incidente não encontrado" }, { status: 404 });
      return NextResponse.json({ data: updated });
    }

    return NextResponse.json({ error: "Ação não suportada" }, { status: 400 });
  } catch (err: any) {
    console.error("Erro ao atualizar incidente:", err);
    return NextResponse.json({ error: "Erro interno ao atualizar incidente" }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { id } = await params;
    const incidentId = parseInt(id, 10);
    if (isNaN(incidentId)) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    }

    const body = await request.json();
    if (!body.comment || String(body.comment).trim().length < 2) {
      return NextResponse.json({ error: "Comentário não pode ser vazio" }, { status: 422 });
    }

    const user = { id: session.user.id, name: session.user.name };
    const activity = addIncidentComment(incidentId, String(body.comment).trim(), user);

    if (!activity) {
      return NextResponse.json({ error: "Incidente não encontrado" }, { status: 404 });
    }

    return NextResponse.json({ data: activity }, { status: 201 });
  } catch (err: any) {
    console.error("Erro ao adicionar comentário:", err);
    return NextResponse.json({ error: "Erro interno ao comentar" }, { status: 500 });
  }
}
