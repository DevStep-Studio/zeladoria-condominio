import { NextRequest, NextResponse } from "next/server";
import { processPaymentWebhook } from "@/lib/services/payments/payment-service";

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const headersMap: Record<string, string> = {};

    req.headers.forEach((value, key) => {
      headersMap[key.toLowerCase()] = value;
    });

    const result = await processPaymentWebhook(rawBody, headersMap);

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (err: any) {
    console.error("Erro no processamento de webhook de pagamento:", err);
    return NextResponse.json(
      {
        success: false,
        error: err?.message || "Erro interno no webhook.",
      },
      { status: 400 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    status: "active",
    subsystem: "Zeladoria Pay Webhook Controller",
    timestamp: new Date().toISOString(),
  });
}
