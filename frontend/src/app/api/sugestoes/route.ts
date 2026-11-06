import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import {
  getAllSuggestions,
  createSuggestion,
  updateSuggestionStatus,
  upvoteSuggestion,
  type SuggestionStatus,
} from "@/lib/services/sugestoes-storage";
import { notify } from "@/lib/audit";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const condoId = session.condo?.id ?? null;
    const items = getAllSuggestions(condoId);
    return NextResponse.json({ data: items });
  } catch (error: any) {
    console.error("Erro ao listar sugestões:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const { title, category, description } = body;

    if (!title || !description) {
      return NextResponse.json(
        { error: "Título e descrição são obrigatórios" },
        { status: 400 }
      );
    }

    const condoId = session.condo?.id ?? null;
    const activeMembership = session.memberships?.find((m) => m.condoId === condoId);
    const unitLabel = activeMembership?.unitLabel || session.user?.name || "Minha Unidade";

    const created = createSuggestion({
      title,
      category: category || "Melhorias",
      description,
      unit: unitLabel,
      authorName: session.user?.name || "Morador",
      condoId,
    });

    // Notifica equipe operacional (Zeladoria e Síndico)
    if (condoId) {
      try {
        await notify(
          condoId,
          [],
          `Nova sugestão de morador: ${title}`,
          `Recebida de ${unitLabel}. Acesse a Central de Sugestões para revisar.`,
          "/painel/sugestoes"
        );
      } catch {
        // Notification is non-blocking
      }
    }

    return NextResponse.json({ data: created }, { status: 201 });
  } catch (error: any) {
    console.error("Erro ao cadastrar sugestão:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const { id, status, feedbackAdmin, isUpvote } = body;

    if (!id) {
      return NextResponse.json({ error: "ID é obrigatório" }, { status: 400 });
    }

    if (isUpvote) {
      const upvoted = upvoteSuggestion(Number(id));
      if (!upvoted) {
        return NextResponse.json({ error: "Sugestão não encontrada" }, { status: 404 });
      }
      return NextResponse.json({ data: upvoted });
    }

    // Apenas Zelador, Síndico, Portaria e Superadmin podem alterar status/dar feedback
    const isStaff = [
      "zelador",
      "sindico",
      "porteiro",
      "superadmin",
      "admin",
      "conselho",
    ].includes(session.role.toLowerCase());

    if (!isStaff) {
      return NextResponse.json(
        { error: "Apenas a zeladoria e administração podem alterar o status de sugestões." },
        { status: 403 }
      );
    }

    const feedbackAuthor = session.role === "zelador" ? "Zeladoria Predial" : "Administração";

    const updated = updateSuggestionStatus(
      Number(id),
      status as SuggestionStatus,
      feedbackAdmin,
      feedbackAuthor
    );

    if (!updated) {
      return NextResponse.json({ error: "Sugestão não encontrada" }, { status: 404 });
    }

    return NextResponse.json({ data: updated });
  } catch (error: any) {
    console.error("Erro ao atualizar sugestão:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

