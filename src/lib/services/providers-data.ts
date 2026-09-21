import type { IconName } from "@/components/icon";

export interface ServiceOffering {
  id: string;
  name: string;
  description: string;
  priceFromCents: number | null;
}

export interface PortfolioItem {
  url: string;
  caption: string;
}

export interface VerifiedReview {
  id: number;
  authorName: string;
  unit: string;
  rating: number;
  comment: string | null;
  serviceDone: string;
  date: string;
}

export interface MarketplaceProvider {
  id: number;
  name: string;
  company: string;
  category: string;
  rating: number;
  reviewsCount: number;
  score: number;
  isSponsored: boolean;
  isVerified: boolean;
  completionRate: number | null;
  hiredCount: number;
  startingPriceCents: number | null;
  regionCoverage: string | null;
  phone: string | null;
  whatsapp: string | null;
  bio: string | null;
  avatarUrl: string | null;
  portfolio: PortfolioItem[];
  servicesOffered: ServiceOffering[];
  reviews: VerifiedReview[];
  ratingDistribution: { 5: number; 4: number; 3: number; 2: number; 1: number };
}

export const CATEGORY_ICONS: Record<string, IconName> = {
  eletrica: "zap",
  hidraulica: "droplet",
  climatizacao: "wind",
  pintura: "pencil",
  marcenaria: "wrench",
  carpintaria: "hammer",
  seguranca: "shield",
  limpeza: "sparkles",
  jardinagem: "sparkles",
  elevadores: "building",
  portoes: "shield",
  servicos: "briefcase",
};

export function categoryIcon(category: string): IconName {
  return CATEGORY_ICONS[category.toLowerCase()] ?? "briefcase";
}

export const CATEGORY_LABELS: Record<string, string> = {
  eletrica: "Elétrica",
  hidraulica: "Hidráulica",
  climatizacao: "Climatização",
  pintura: "Pintura",
  marcenaria: "Marcenaria",
  carpintaria: "Carpintaria",
  seguranca: "Segurança",
  limpeza: "Limpeza",
  jardinagem: "Jardinagem",
  elevadores: "Elevadores",
  portoes: "Portões",
  servicos: "Serviços gerais",
};

export function categoryLabel(category: string): string {
  return CATEGORY_LABELS[category.toLowerCase()] ?? category;
}

export interface CategoryOption {
  id: string;
  name: string;
  icon: IconName;
  count: number;
}

/** Deriva as opções de categoria a partir dos prestadores reais carregados (nunca de uma lista fixa). */
export function buildCategoriesConfig(providers: MarketplaceProvider[]): CategoryOption[] {
  const counts = new Map<string, number>();
  for (const p of providers) {
    counts.set(p.category, (counts.get(p.category) ?? 0) + 1);
  }
  const categories: CategoryOption[] = [
    { id: "Todas", name: "Todas as categorias", icon: "grid", count: providers.length },
  ];
  for (const [id, count] of counts) {
    categories.push({ id, name: categoryLabel(id), icon: categoryIcon(id), count });
  }
  return categories;
}
