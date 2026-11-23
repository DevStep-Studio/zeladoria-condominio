import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import {
  getAllLostAndFoundItems,
  getLostAndFoundItemById,
  createLostAndFoundItem,
  updateLostAndFoundItem,
  claimLostAndFoundItem,
  reportFoundLostAndFoundItem,
  resolveLostAndFoundItem,
  deleteLostAndFoundItem,
} from "@/lib/services/lost-and-found-storage";
import { notify } from "@/lib/audit";
import type { ItemCategory, ItemType } from "@/types/lost-and-found";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    const condoId = session?.condo?.id ?? null;
    const items = getAllLostAndFoundItems(condoId);
    return NextResponse.json({ data: items });
  } catch (error) {
    console.error("Erro ao listar itens de achados e perdidos:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    const body = await request.json();
    const {
      type,
      title,
      category,
      date,
      location,
      description,
      imageUrl,
      reportedBy,
      reportedByRole,
      unit,
      contactPhone,
      condoId: reqCondoId,
    } = body;

    if (!title || !description || !location || !type) {
      return NextResponse.json(
        { error: "Título, tipo, localização e descrição são obrigatórios." },
        { status: 400 }
      );
    }

    const condoId = session?.condo?.id ?? reqCondoId ?? null;
    const activeMembership = session?.memberships?.find((m) => m.condoId === condoId);
    const resolvedUnit = unit || activeMembership?.unitLabel || "Condomínio";
    const resolvedReporter = reportedBy || session?.user?.name || "Morador";
    const resolvedRole = reportedByRole || session?.role || "morador";

    const created = createLostAndFoundItem({
      type: type as ItemType,
      title: String(title),
      category: (category as ItemCategory) || "Outros",
      date: date || new Date().toISOString().split("T")[0],
      location: String(location),
      description: String(description),
      imageUrl: imageUrl ? String(imageUrl) : undefined,
      reportedBy: resolvedReporter,
      reportedByRole: resolvedRole,
      unit: resolvedUnit,
      contactPhone: contactPhone ? String(contactPhone) : undefined,
      condoId,
    });

    // Notificação se houver condoId
    if (condoId) {
      try {
        const typeLabel = created.type === "FOUND" ? "encontrado" : "perdido";
        await notify(
          condoId,
          [],
          `Item ${typeLabel}: ${created.title}`,
          `Local: ${created.location}. Registrado por ${created.reportedBy} (${resolvedUnit}).`,
          "/painel/achados-e-perdidos"
        );
      } catch {
        // Notificação não-bloqueante
      }
    }

    return NextResponse.json({ data: created }, { status: 201 });
  } catch (error) {
    console.error("Erro ao cadastrar item de achados e perdidos:", error);
    return NextResponse.json({ error: "Erro interno ao cadastrar item." }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getSession();
    const body = await request.json();
    const { id, action } = body;

    if (!id) {
      return NextResponse.json({ error: "ID do item é obrigatório." }, { status: 400 });
    }

    const existing = getLostAndFoundItemById(id);
    if (!existing) {
      return NextResponse.json({ error: "Item não encontrado." }, { status: 404 });
    }

    let updated = null;

    if (action === "claim") {
      const claimedBy = body.claimedBy || session?.user?.name || "Morador";
      const claimMessage = body.claimMessage || "Morador declarou posse do item.";
      const claimDate = body.claimDate || new Date().toLocaleDateString("pt-BR");
      updated = claimLostAndFoundItem(id, claimedBy, claimMessage, claimDate);
    } else if (action === "report_found") {
      const reporterName = body.reporterName || session?.user?.name || "Morador";
      const locationNotes = body.locationNotes || "Localizado por morador.";
      updated = reportFoundLostAndFoundItem(id, reporterName, locationNotes);
    } else if (action === "resolve") {
      // Devolução: Staff ou usuário que registrou
      const recipientName = body.recipientName || "Proprietário";
      const notes = body.notes || "";
      updated = resolveLostAndFoundItem(id, recipientName, notes);
    } else {
      // Atualização genérica de campos
      const { ...fields } = body;
      delete fields.id;
      delete fields.action;
      updated = updateLostAndFoundItem(id, fields);
    }

    if (!updated) {
      return NextResponse.json({ error: "Não foi possível atualizar o item." }, { status: 400 });
    }

    return NextResponse.json({ data: updated });
  } catch (error) {
    console.error("Erro ao atualizar item de achados e perdidos:", error);
    return NextResponse.json({ error: "Erro interno ao atualizar item." }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getSession();
    const isStaff =
      !session ||
      [
        "zelador",
        "sindico",
        "porteiro",
        "superadmin",
        "admin",
        "conselho",
      ].includes(session.role.toLowerCase()) ||
      session.user?.isSuperAdmin;

    if (!isStaff) {
      return NextResponse.json(
        { error: "Apenas funcionários ou administradores podem excluir itens." },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "ID do item é obrigatório." }, { status: 400 });
    }

    const deleted = deleteLostAndFoundItem(id);
    if (!deleted) {
      return NextResponse.json({ error: "Item não encontrado." }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erro ao excluir item de achados e perdidos:", error);
    return NextResponse.json({ error: "Erro interno ao excluir item." }, { status: 500 });
  }
}
