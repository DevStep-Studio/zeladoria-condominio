/**
 * ZELADORIA SERVIÇOS - PROMOTION SERVICE (PUBLICIDADE INTERNA)
 *
 * Responsável pela governança, elegibilidade e entrega de prestadores patrocinados:
 * 1. Separação Estrita: O pagamento NUNCA altera o ranking orgânico ou nota do prestador.
 * 2. Relevância Categórica: Anúncio de "Eletricista" NUNCA aparece na busca de "Pintor".
 * 3. Relevância Geográfica: Anúncio fora do raio do condomínio nunca é exibido.
 * 4. Limite Saudável: Máximo configurável de 1 a 2 patrocinados por bloco/seção de resultados.
 * 5. Expiração Automática: Campanhas vencidas deixam de aparecer de imediato por checagem de data.
 * 6. Sem Medalhas Falsas: Anúncio nunca ganha selo '#1 Melhor Avaliado'.
 */

export interface PromotionFilter {
  condoId?: number;
  category?: string;
  region?: string;
  limit?: number;
}

export interface ActivePromotion {
  id: number;
  condoId: number;
  vendorId: number;
  planId?: number | null;
  type: string; // 'categoria' | 'regiao' | 'home' | 'busca'
  categoryId?: string | null;
  region?: string | null;
  startsAt: Date;
  endsAt: Date;
  status: string;
  amountCents: number;
  paymentStatus: string;
  impressions: number;
  clicks: number;
  vendor?: any;
}

/**
 * Verifica se uma campanha está formalmente ativa e dentro da vigência temporal
 */
export function isPromotionActive(promo: {
  status: string;
  paymentStatus?: string;
  startsAt: Date | string;
  endsAt: Date | string;
}): boolean {
  if (promo.status !== "ACTIVE") return false;
  if (promo.paymentStatus && promo.paymentStatus !== "paid") return false;

  const now = Date.now();
  const start = new Date(promo.startsAt).getTime();
  const end = new Date(promo.endsAt).getTime();

  return now >= start && now <= end;
}

/**
 * Filtra e seleciona patrocinados elegíveis e relevantes para o contexto atual
 */
export function selectEligiblePromotions<T extends {
  id: number;
  vendorId: number;
  status: string;
  paymentStatus?: string;
  startsAt: Date | string;
  endsAt: Date | string;
  categoryId?: string | null;
  region?: string | null;
  vendorCategory?: string | null;
  vendorSuspended?: boolean;
}>(
  promotions: T[],
  filters: {
    category?: string;
    region?: string;
    maxLimit?: number;
  }
): T[] {
  const max = filters.maxLimit ?? 2;
  const targetCategory = filters.category?.trim().toLowerCase();
  const targetRegion = filters.region?.trim().toLowerCase();

  const eligible = promotions.filter((promo) => {
    // 1. Checa vigência e status ativo
    if (!isPromotionActive(promo)) return false;

    // 2. Prestador não pode estar suspenso
    if (promo.vendorSuspended) return false;

    // 3. Relevância Categórica Estrita:
    // Se há filtro de categoria, só exibe anúncios da mesma categoria!
    if (targetCategory && targetCategory !== "todos") {
      const promoCat = (promo.categoryId || promo.vendorCategory || "").toLowerCase();
      if (promoCat && promoCat !== targetCategory) {
        return false;
      }
    }

    // 4. Relevância Geográfica:
    if (targetRegion && promo.region) {
      if (!promo.region.toLowerCase().includes(targetRegion) && !targetRegion.includes(promo.region.toLowerCase())) {
        return false;
      }
    }

    return true;
  });

  // Retorna no máximo 1-2 patrocinados por bloco para não poluir
  return eligible.slice(0, max);
}

/**
 * Planos padrão do marketplace configurados pelo sistema
 */
export const DEFAULT_PROMOTION_PLANS = [
  {
    id: 1,
    name: "Destaque na Categoria (7 dias)",
    type: "categoria",
    durationDays: 7,
    priceCents: 2990, // R$ 29,90
    badge: "Patrocinado",
    description: "Seu perfil em destaque no topo da sua categoria de serviço por 1 semana.",
    active: true,
  },
  {
    id: 2,
    name: "Destaque na Categoria (30 dias)",
    type: "categoria",
    durationDays: 30,
    priceCents: 8990, // R$ 89,90
    badge: "Patrocinado",
    description: "Maior exposição do seu perfil durante um mês inteiro na sua especialidade.",
    active: true,
  },
  {
    id: 3,
    name: "Destaque Regional no Condomínio (15 dias)",
    type: "regiao",
    durationDays: 15,
    priceCents: 4990, // R$ 49,90
    badge: "Patrocinado",
    description: "Apareça em destaque prioritário para os moradores deste condomínio e região.",
    active: true,
  },
];
