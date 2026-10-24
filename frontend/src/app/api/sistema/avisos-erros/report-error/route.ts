import { NextRequest, NextResponse } from "next/server";
import { reportTechnicalError } from "@/lib/services/system-incidents-storage";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (!body.message) {
      return NextResponse.json({ error: "Mensagem do erro é obrigatória." }, { status: 422 });
    }

    const result = reportTechnicalError({
      message: String(body.message),
      errorType: body.errorType,
      sourceModule: body.sourceModule || "Frontend Client",
      condoId: body.condoId || null,
      correlationId: body.correlationId,
      stackTrace: body.stackTrace,
      context: body.context,
      environment: body.environment || "production",
      appVersion: body.appVersion || "1.0.0",
    });

    return NextResponse.json({ data: result }, { status: 201 });
  } catch (err: any) {
    console.error("Erro ao reportar falha técnica:", err);
    return NextResponse.json({ error: "Erro interno ao processar falha técnica" }, { status: 500 });
  }
}
