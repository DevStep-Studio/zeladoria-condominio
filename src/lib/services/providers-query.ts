import "server-only";
import { and, desc, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { blocks, tickets, units, users, vendors } from "@/db/schema";
import { calculateProviderScore } from "./ranking";
import type { MarketplaceProvider, PortfolioItem, ServiceOffering, VerifiedReview } from "./providers-data";

function timeAgo(date: Date): string {
  const diffMs = Date.now() - date.getTime();
  const days = Math.floor(diffMs / 86400000);
  if (days <= 0) return "Hoje";
  if (days === 1) return "Ontem";
  if (days < 7) return `Há ${days} dias`;
  if (days < 30) return `Há ${Math.floor(days / 7)} semana(s)`;
  if (days < 365) return `Há ${Math.floor(days / 30)} mes(es)`;
  return `Há ${Math.floor(days / 365)} ano(s)`;
}

/** Carrega os prestadores reais de um condomínio (tabela vendors) com métricas calculadas a partir dos tickets. */
export async function getMarketplaceProviders(condoId: number): Promise<MarketplaceProvider[]> {
  try {
    const vendorRows = await db
      .select()
      .from(vendors)
      .where(and(eq(vendors.condoId, condoId), eq(vendors.active, true)))
      .orderBy(desc(vendors.sponsored), desc(vendors.verified), vendors.name);

    if (vendorRows.length === 0) return [];

  const vendorIds = vendorRows.map((v) => v.id);

  const ticketRows = await db
    .select({
      id: tickets.id,
      vendorId: tickets.vendorId,
      title: tickets.title,
      status: tickets.status,
      rating: tickets.rating,
      ratingComment: tickets.ratingComment,
      closedAt: tickets.closedAt,
      createdAt: tickets.createdAt,
      openedById: tickets.openedById,
      unitNumber: units.number,
      blockName: blocks.name,
      requesterName: users.name,
    })
    .from(tickets)
    .leftJoin(units, eq(units.id, tickets.unitId))
    .leftJoin(blocks, eq(blocks.id, units.blockId))
    .leftJoin(users, eq(users.id, tickets.openedById))
    .where(and(eq(tickets.condoId, condoId), inArray(tickets.vendorId, vendorIds)));

  const byVendor = new Map<number, typeof ticketRows>();
  for (const t of ticketRows) {
    if (!t.vendorId) continue;
    const list = byVendor.get(t.vendorId) ?? [];
    list.push(t);
    byVendor.set(t.vendorId, list);
  }

  return vendorRows.map((v) => {
    const vendorTickets = byVendor.get(v.id) ?? [];
    const ratedTickets = vendorTickets.filter((t) => t.rating != null);
    const reviewsCount = ratedTickets.length;
    const ratingSum = ratedTickets.reduce((acc, t) => acc + (t.rating ?? 0), 0);
    const rating = reviewsCount > 0 ? ratingSum / reviewsCount : 0;

    const completedOrCancelled = vendorTickets.filter((t) => t.status === "concluido" || t.status === "cancelado");
    const completionRate =
      completedOrCancelled.length > 0
        ? (vendorTickets.filter((t) => t.status === "concluido").length / completedOrCancelled.length) * 100
        : null;

    const ratingDistribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 } as MarketplaceProvider["ratingDistribution"];
    for (const t of ratedTickets) {
      const stars = Math.max(1, Math.min(5, Math.round(t.rating ?? 0))) as 1 | 2 | 3 | 4 | 5;
      ratingDistribution[stars] += 1;
    }

    const reviews: VerifiedReview[] = ratedTickets
      .sort((a, b) => (b.closedAt?.getTime() ?? b.createdAt.getTime()) - (a.closedAt?.getTime() ?? a.createdAt.getTime()))
      .slice(0, 20)
      .map((t) => ({
        id: t.id,
        authorName: t.requesterName ?? "Morador do condomínio",
        unit: t.blockName && t.unitNumber ? `${t.blockName} ${t.unitNumber}` : "Unidade não informada",
        rating: t.rating ?? 0,
        comment: t.ratingComment,
        serviceDone: t.title,
        date: timeAgo(t.closedAt ?? t.createdAt),
      }));

    const servicesOffered: ServiceOffering[] = Array.isArray(v.services)
      ? (v.services as ServiceOffering[])
      : [];
    const portfolio: PortfolioItem[] = Array.isArray(v.portfolio) ? (v.portfolio as PortfolioItem[]) : [];

    const score = calculateProviderScore({
      rating,
      reviewsCount,
      completionRate,
      isVerified: v.verified,
    });

    const provider: MarketplaceProvider = {
      id: v.id,
      name: v.contactName || v.name,
      company: v.name,
      category: v.category,
      rating: Math.round(rating * 10) / 10,
      reviewsCount,
      score,
      isSponsored: v.sponsored,
      isVerified: v.verified,
      completionRate: completionRate === null ? null : Math.round(completionRate),
      hiredCount: vendorTickets.length,
      startingPriceCents: v.priceFromCents,
      regionCoverage: v.serviceArea,
      slug: v.slug,
      isOnline: v.isOnline,
      availableNow: v.availableNow,
      serviceRadiusKm: v.serviceRadiusKm,
      coverUrl: v.coverUrl,
      workingHours: v.workingHours,
      phone: v.phone,
      whatsapp: v.whatsapp,
      bio: v.description,
      avatarUrl: v.photoUrl,
      portfolio,
      servicesOffered,
      reviews,
      ratingDistribution,
    };
    return provider;
  });
  } catch (error) {
    console.warn("Could not load marketplace providers from database:", error);
    return [];
  }
}
