"use server";

import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/auth";
import {
  getIntegrationsSummary,
  getRecentApiLogs,
  toggleIntegration,
  type IntegrationServiceId,
} from "@/lib/services/integrations/usage-tracker";
import { geocodeAddress, reverseGeocode } from "@/lib/services/integrations/geoapify";
import { lookupCompanyByCnpj } from "@/lib/services/integrations/brasilapi";
import { lookupCep } from "@/lib/services/cep";
import { sendTransactionalEmail, buildHtmlTemplate } from "@/lib/services/integrations/resend";
import { dispatchOneSignalPush } from "@/lib/services/integrations/onesignal";
import { calculateHaversineMeters, isWithinCoverageRadius } from "@/lib/services/geo";

export async function getIntegrationsDashboardAction() {
  const session = await requireSession();
  if (session.role !== "superadmin") {
    throw new Error("Não autorizado.");
  }

  return {
    statusList: getIntegrationsSummary(),
    recentLogs: getRecentApiLogs(),
  };
}

export async function toggleIntegrationAction(service: IntegrationServiceId, enabled: boolean) {
  const session = await requireSession();
  if (session.role !== "superadmin") {
    throw new Error("Não autorizado.");
  }

  const result = toggleIntegration(service, enabled);
  revalidatePath("/painel/admin/integracoes");
  return { success: result };
}

export async function testIntegrationAction(service: IntegrationServiceId, testParam?: string) {
  const session = await requireSession();
  if (session.role !== "superadmin") {
    throw new Error("Não autorizado.");
  }

  const startTime = Date.now();

  try {
    switch (service) {
      case "geoapify": {
        const query = testParam?.trim() || "Avenida Paulista, 1000, São Paulo, SP";
        const results = await geocodeAddress(query, { countryCode: "br", limit: 3 });
        return {
          success: results.length > 0,
          service,
          durationMs: Date.now() - startTime,
          data: results,
          message: results.length > 0
            ? `Geocodificação concluída: ${results[0].formatted} (Lat: ${results[0].lat}, Lng: ${results[0].lng})`
            : "Nenhum resultado retornado pelo Geoapify.",
        };
      }

      case "viacep": {
        const cep = testParam?.replace(/\D/g, "") || "01310100";
        const result = await lookupCep(cep);
        return {
          success: Boolean(result),
          service,
          durationMs: Date.now() - startTime,
          data: result,
          message: result
            ? `CEP validado: ${result.street}, ${result.neighborhood} - ${result.city}/${result.state} (Coords: ${result.lat}, ${result.lng})`
            : "CEP não localizado.",
        };
      }

      case "brasilapi": {
        const cnpj = testParam?.replace(/\D/g, "") || "00000000000191"; // Banco do Brasil S.A.
        const result = await lookupCompanyByCnpj(cnpj);
        return {
          success: Boolean(result),
          service,
          durationMs: Date.now() - startTime,
          data: result,
          message: result
            ? `Empresa confirmada: ${result.razaoSocial} (Situação: ${result.situacaoCadastral})`
            : "CNPJ não localizado na BrasilAPI.",
        };
      }

      case "resend": {
        const targetEmail = testParam?.trim() || "ian.mellofla@gmail.com";
        const html = buildHtmlTemplate({
          title: "Teste de Integração de E-mail Transacional",
          greeting: "Olá, Administrador!",
          contentHtml: `
            <p>Este é um e-mail de validação do sistema <strong>Zeladoria Condomínio</strong>.</p>
            <p>Se você recebeu esta mensagem, a integração oficial com a API do <strong>Resend</strong> está 100% operacional no plano gratuito, com controle de cota ativo e templates padronizados.</p>
          `,
          buttonText: "Acessar Painel do Condomínio",
          buttonUrl: "https://zeladoriacondominio.com.br",
          footerNote: "Disparado via Resend API (Plano Free: 100 e-mails/dia).",
        });

        const sendResult = await sendTransactionalEmail({
          to: targetEmail,
          subject: "Teste de Conexão — Zeladoria Condomínio",
          html,
        });

        return {
          success: sendResult.success,
          service,
          durationMs: Date.now() - startTime,
          data: sendResult,
          message: sendResult.success
            ? `E-mail transacional disparado com sucesso para ${targetEmail} (ID: ${sendResult.messageId})`
            : `Falha no envio Resend: ${sendResult.error}`,
        };
      }

      case "onesignal": {
        const pushResult = await dispatchOneSignalPush({
          userId: session.user.id,
          condoId: session.condo?.id || 1,
          title: "Teste de Notificação Push",
          body: "A integração com OneSignal e Web Push está operando normalmente no condomínio.",
          url: "/painel",
        });

        return {
          success: pushResult.success,
          service,
          durationMs: Date.now() - startTime,
          data: pushResult,
          message: pushResult.externalDelivered
            ? "Push entregue com sucesso via OneSignal REST API."
            : `Notificação interna persistida (provedor: ${pushResult.provider})`,
        };
      }

      case "postgis": {
        // Teste de cálculo esférico de distância e raio em metros
        // Exemplo: Condomínio na Av. Paulista (-23.5615, -46.6559) e Prestador nos Jardins (-23.5700, -46.6600)
        const condoLat = -23.5615;
        const condoLng = -46.6559;
        const vendorLat = -23.5700;
        const vendorLng = -46.6600;
        const radiusMeters = 5000; // 5 km

        const distanceMeters = calculateHaversineMeters(condoLat, condoLng, vendorLat, vendorLng);
        const coverage = isWithinCoverageRadius({
          providerLat: vendorLat,
          providerLng: vendorLng,
          providerRadiusMeters: radiusMeters,
          targetLat: condoLat,
          targetLng: condoLng,
        });

        return {
          success: true,
          service,
          durationMs: Date.now() - startTime,
          data: { distanceMeters, radiusMeters, withinCoverage: coverage.within },
          message: `Cálculo geoespacial esférico concluído: Distância de ${distanceMeters} metros (Raio de ${radiusMeters} m: ${coverage.within ? "Dentro da cobertura ✓" : "Fora da cobertura"})`,
        };
      }

      default:
        return { success: false, message: "Serviço não reconhecido.", durationMs: 0 };
    }
  } catch (err: any) {
    return {
      success: false,
      service,
      durationMs: Date.now() - startTime,
      message: err?.message || "Exceção ao testar integração.",
    };
  }
}
