import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getMonitoringRules, updateMonitoringRule } from "@/lib/services/system-incidents-storage";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const rules = getMonitoringRules();
    return NextResponse.json({ data: rules });
  } catch (err: any) {
    console.error("Erro ao listar regras:", err);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "superadmin" && !session.user.isSuperAdmin)) {
      return NextResponse.json({ error: "Apenas administradores da plataforma podem alterar regras." }, { status: 403 });
    }

    const body = await request.json();
    const id = parseInt(body.id, 10);
    if (isNaN(id)) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    }

    const updated = updateMonitoringRule(id, {
      active: body.active !== undefined ? Boolean(body.active) : undefined,
      threshold: body.threshold !== undefined ? parseInt(body.threshold, 10) : undefined,
      windowMinutes: body.windowMinutes !== undefined ? parseInt(body.windowMinutes, 10) : undefined,
      priority: body.priority,
    });

    if (!updated) {
      return NextResponse.json({ error: "Regra não encontrada" }, { status: 404 });
    }

    return NextResponse.json({ data: updated });
  } catch (err: any) {
    console.error("Erro ao atualizar regra:", err);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
