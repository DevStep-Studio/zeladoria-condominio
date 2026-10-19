/**
 * ZELADORIA SERVIÇOS - GESTÃO DE COMPLETUDE DE PERFIL DO PRESTADOR
 *
 * Centraliza o cálculo da completude do perfil (0 a 100%) e os itens faltantes
 * para orientação amigável do prestador sem inventar promessas de ganhos irreais.
 *
 * Pesos definidos:
 * - Foto / Logo: 15%
 * - Descrição: 10%
 * - Serviços cadastrados: 20%
 * - Portfólio de trabalhos: 20%
 * - Disponibilidade e horários: 10%
 * - Área de atendimento e raio: 10%
 * - Documentação / CNPJ: 15%
 */

export interface ProfileCompletenessResult {
  percentage: number;
  missingItems: { key: string; label: string; actionUrl: string }[];
  breakdown: {
    photo: boolean; // 15%
    description: boolean; // 10%
    services: boolean; // 20%
    portfolio: boolean; // 20%
    availability: boolean; // 10%
    serviceArea: boolean; // 10%
    documentation: boolean; // 15%
  };
}

export function calculateProfileCompleteness(vendor: {
  photoUrl?: string | null;
  coverUrl?: string | null;
  description?: string | null;
  services?: any[] | null;
  portfolio?: any[] | null;
  workingHours?: string | null;
  availableNow?: boolean | null;
  serviceArea?: string | null;
  serviceRadiusKm?: number | null;
  cnpj?: string | null;
  documents?: any[] | null;
}): ProfileCompletenessResult {
  const missingItems: { key: string; label: string; actionUrl: string }[] = [];

  // 1. Foto / Logo (15%)
  const hasPhoto = Boolean(vendor?.photoUrl && vendor.photoUrl.trim().length > 0);
  if (!hasPhoto) {
    missingItems.push({
      key: "photo",
      label: "Adicionar foto profissional ou logo",
      actionUrl: "/prestador/perfil",
    });
  }

  // 2. Descrição (10%)
  const hasDesc = Boolean(vendor?.description && vendor.description.trim().length >= 20);
  if (!hasDesc) {
    missingItems.push({
      key: "description",
      label: "Descrever sua experiência e diferenciais (mín. 20 caracteres)",
      actionUrl: "/prestador/perfil",
    });
  }

  // 3. Serviços (20%)
  const hasServices = Boolean(Array.isArray(vendor?.services) && vendor.services.length > 0);
  if (!hasServices) {
    missingItems.push({
      key: "services",
      label: "Cadastrar pelo menos 1 serviço e faixa de preço",
      actionUrl: "/prestador/servicos",
    });
  }

  // 4. Portfólio (20%)
  const hasPortfolio = Boolean(Array.isArray(vendor?.portfolio) && vendor.portfolio.length >= 1);
  if (!hasPortfolio) {
    missingItems.push({
      key: "portfolio",
      label: "Adicionar fotos dos seus trabalhos realizados",
      actionUrl: "/prestador/portfolio",
    });
  }

  // 5. Disponibilidade (10%)
  const hasAvailability = Boolean(
    vendor?.workingHours && vendor.workingHours.trim().length > 0 && vendor?.availableNow !== undefined
  );
  if (!hasAvailability) {
    missingItems.push({
      key: "availability",
      label: "Configurar dias e horários de atendimento",
      actionUrl: "/prestador/disponibilidade",
    });
  }

  // 6. Área de atendimento (10%)
  const hasServiceArea = Boolean(
    vendor?.serviceArea &&
    vendor.serviceArea.trim().length > 0 &&
    Number(vendor?.serviceRadiusKm ?? 0) > 0
  );
  if (!hasServiceArea) {
    missingItems.push({
      key: "serviceArea",
      label: "Definir cidades/bairros e raio de atendimento",
      actionUrl: "/prestador/perfil",
    });
  }

  // 7. Documentação / Identificação (15%)
  const hasDocs = Boolean(
    (vendor?.cnpj && vendor.cnpj.trim().length >= 8) ||
    (Array.isArray(vendor?.documents) && vendor.documents.length > 0)
  );
  if (!hasDocs) {
    missingItems.push({
      key: "documentation",
      label: "Adicionar comprovante profissional ou CNPJ",
      actionUrl: "/prestador/perfil",
    });
  }

  let total = 0;
  if (hasPhoto) total += 15;
  if (hasDesc) total += 10;
  if (hasServices) total += 20;
  if (hasPortfolio) total += 20;
  if (hasAvailability) total += 10;
  if (hasServiceArea) total += 10;
  if (hasDocs) total += 15;

  return {
    percentage: Math.min(100, Math.max(0, total)),
    missingItems,
    breakdown: {
      photo: hasPhoto,
      description: hasDesc,
      services: hasServices,
      portfolio: hasPortfolio,
      availability: hasAvailability,
      serviceArea: hasServiceArea,
      documentation: hasDocs,
    },
  };
}
