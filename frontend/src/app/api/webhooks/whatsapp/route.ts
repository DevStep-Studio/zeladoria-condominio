import { NextRequest, NextResponse } from "next/server";
import { processWhatsAppDeliveryWebhook } from "@/lib/services/whatsapp/whatsapp-service";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Valida estrutura mínima do webhook
    if (!body?.messageId || !body?.event) {
      return NextResponse.json(
        { success: false, error: "Parâmetros inválidos: messageId e event são obrigatórios." },
        { status: 400 }
      );
    }

    const result = processWhatsAppDeliveryWebhook({
      messageId: body.messageId,
      event: body.event,
      timestamp: body.timestamp,
      error: body.error,
    });

    return NextResponse.json({
      success: true,
      processed: result.success,
      data: result.updatedStatus,
    });
  } catch (err: any) {
    console.error("Erro ao processar webhook do WhatsApp:", err);
    return NextResponse.json(
      { success: false, error: err?.message || "Erro interno no webhook." },
      { status: 400 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    status: "active",
    subsystem: "Zeladoria WhatsApp Webhook Controller",
    timestamp: new Date().toISOString(),
  });
}
