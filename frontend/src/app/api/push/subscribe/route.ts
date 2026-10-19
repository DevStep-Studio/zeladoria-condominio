import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { savePushSubscription, removePushSubscription } from "@/lib/services/push/push-service";

export async function POST(req: NextRequest) {
  try {
    const session = await requireSession();
    const body = await req.json();

    if (!body?.subscription) {
      return NextResponse.json(
        { success: false, error: "Objeto de inscrição push ausente." },
        { status: 400 }
      );
    }

    const result = await savePushSubscription(
      session.user.id,
      body.subscription,
      session.condo?.id ?? null
    );

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (err: any) {
    console.error("Erro ao registrar push subscription:", err);
    return NextResponse.json(
      { success: false, error: err?.message || "Não autorizado ou erro interno." },
      { status: 401 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body?.endpoint) {
      return NextResponse.json({ success: false, error: "Endpoint obrigatório" }, { status: 400 });
    }

    await removePushSubscription(body.endpoint);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message }, { status: 500 });
  }
}
