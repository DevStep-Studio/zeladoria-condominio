import { NextRequest, NextResponse } from "next/server";
import { processPaymentWebhook } from "@/lib/services/payments/payment-service";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ gateway: string }> }
) {
  try {
    const { gateway } = await params;
    const normalizedGateway = gateway.toLowerCase();

    if (normalizedGateway !== "asaas") {
      return NextResponse.json(
        { error: `Gateway '${gateway}' não suportado.` },
        { status: 400 }
      );
    }

    const rawBody = await req.text();
    const headersRecord: Record<string, string> = {};

    req.headers.forEach((value, key) => {
      headersRecord[key.toLowerCase()] = value;
    });

    const result = await processPaymentWebhook(rawBody, headersRecord);

    return NextResponse.json({
      success: true,
      result,
      receivedAt: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error("Erro no processamento de webhook de pagamento:", err);
    return NextResponse.json(
      { error: err?.message || "Erro interno ao processar webhook." },
      { status: err?.message?.includes("Assinatura") ? 401 : 500 }
    );
  }
}
