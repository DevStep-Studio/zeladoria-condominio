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
  slug?: string | null;
  isOnline?: boolean;
  availableNow?: boolean;
  serviceRadiusKm?: number | null;
  coverUrl?: string | null;
  workingHours?: string | null;
  phone: string | null;
  whatsapp: string | null;
  bio: string | null;
  avatarUrl: string | null;
  portfolio: PortfolioItem[];
  distanceKm?: number | null;
  condoHiredCount?: number;
  hasHiredBefore?: boolean;
  responseTimeMinutes?: number | null;
  servicesOffered: ServiceOffering[];
  reviews: VerifiedReview[];
  ratingDistribution: { 5: number; 4: number; 3: number; 2: number; 1: number };
  isCompany?: boolean;
  teamMembers?: { name: string; role: string; avatarUrl?: string }[];
}

export const SUBCATEGORIES_BY_CATEGORY: Record<string, string[]> = {
  eletrica: ["Chuveiro", "Tomadas", "Iluminação", "Disjuntores", "Quadro elétrico", "Curto-circuito", "Instalação elétrica"],
  hidraulica: ["Vazamento", "Torneira", "Descarga", "Pia", "Caixa d’água", "Entupimento", "Tubulação"],
  climatizacao: ["Higienização / Limpeza", "Instalação Split", "Carga de gás", "Vazamento de água", "Manutenção preventiva"],
  pintura: ["Pintura interna", "Retoque de manchas", "Massa corrida", "Pintura de portas", "Umidade e infiltração"],
  marcenaria: ["Regulagem de dobradiças", "Troca de puxadores", "Montagem de móveis", "Ajuste de portas", "Móveis sob medida"],
  seguranca: ["Fechadura digital", "Chaveiro residencial", "Câmeras CFTV", "Alarme", "Controle de acesso"],
  portoes: ["Motor de portão", "Fechadura eletrônica", "Troca de miolo", "Mola aérea"],
  limpeza: ["Limpeza pós-obra", "Higienização de sofá", "Limpeza de vidros", "Limpeza pesada"],
  jardinagem: ["Poda de plantas", "Corte de grama", "Adubação e paisagismo"],
  servicos: ["Instalação de varal", "Suporte de TV", "Pequenos reparos gerais"],
};

export function getCategorySubcategories(category: string): string[] {
  return SUBCATEGORIES_BY_CATEGORY[category.toLowerCase()] ?? [];
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

export const CATEGORY_IMAGES: Record<string, string> = {
  eletrica: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=400&q=80",
  hidraulica: "https://images.unsplash.com/photo-1585704032915-c3400ca199e7?auto=format&fit=crop&w=400&q=80",
  climatizacao: "https://images.unsplash.com/photo-1621905252507-b35492cc74b4?auto=format&fit=crop&w=400&q=80",
  pintura: "https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&w=400&q=80",
  marcenaria: "https://images.unsplash.com/photo-1538688525198-9b88f6f53126?auto=format&fit=crop&w=400&q=80",
  carpintaria: "https://images.unsplash.com/photo-1538688525198-9b88f6f53126?auto=format&fit=crop&w=400&q=80",
  seguranca: "https://images.unsplash.com/photo-1558002038-1055907df827?auto=format&fit=crop&w=400&q=80",
  limpeza: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=400&q=80",
  jardinagem: "https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?auto=format&fit=crop&w=400&q=80",
  elevadores: "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=400&q=80",
  portoes: "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=400&q=80",
  servicos: "https://images.unsplash.com/photo-1581244277943-fe4a9c777189?auto=format&fit=crop&w=400&q=80",
};

export function categoryImage(category: string): string | null {
  return CATEGORY_IMAGES[category.toLowerCase()] ?? null;
}

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
  imageUrl?: string | null;
  count: number;
}

/** Deriva as opções de categoria a partir dos prestadores reais carregados (nunca de uma lista fixa). */
export function buildCategoriesConfig(providers: MarketplaceProvider[]): CategoryOption[] {
  const counts = new Map<string, number>();
  for (const p of providers) {
    counts.set(p.category, (counts.get(p.category) ?? 0) + 1);
  }
  const categories: CategoryOption[] = [
    { id: "Todas", name: "Todas as categorias", icon: "grid", imageUrl: null, count: providers.length },
  ];
  for (const [id, count] of counts) {
    categories.push({
      id,
      name: categoryLabel(id),
      icon: categoryIcon(id),
      imageUrl: categoryImage(id),
      count,
    });
  }
  return categories;
}
