import "server-only";
import { and, desc, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { blocks, serviceReviews, tickets, units, users, vendors } from "@/db/schema";
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

import { calculateHaversineKm } from "./geo";

/** Carrega os prestadores reais de um condomínio (tabela vendors) com métricas calculadas a partir dos tickets e contratações. */
export async function getMarketplaceProviders(
  condoId: number,
  options?: {
    currentUserId?: number;
    condoLat?: number | null;
    condoLng?: number | null;
  }
): Promise<MarketplaceProvider[]> {
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

  let serviceReviewRows: any[] = [];
  try {
    serviceReviewRows = await db
      .select({
        id: serviceReviews.id,
        vendorId: serviceReviews.vendorId,
        rating: serviceReviews.rating,
        comment: serviceReviews.comment,
        createdAt: serviceReviews.createdAt,
        authorName: users.name,
      })
      .from(serviceReviews)
      .leftJoin(users, eq(users.id, serviceReviews.customerId))
      .where(inArray(serviceReviews.vendorId, vendorIds));
  } catch {
    // Optional / empty
  }

  const byVendor = new Map<number, typeof ticketRows>();
  for (const t of ticketRows) {
    if (!t.vendorId) continue;
    const list = byVendor.get(t.vendorId) ?? [];
    list.push(t);
    byVendor.set(t.vendorId, list);
  }

  const reviewsByVendor = new Map<number, typeof serviceReviewRows>();
  for (const r of serviceReviewRows) {
    if (!r.vendorId) continue;
    const list = reviewsByVendor.get(r.vendorId) ?? [];
    list.push(r);
    reviewsByVendor.set(r.vendorId, list);
  }

  return vendorRows.map((v) => {
    const vendorTickets = byVendor.get(v.id) ?? [];
    const directReviews = reviewsByVendor.get(v.id) ?? [];

    const ratedTickets = vendorTickets.filter((t) => t.rating != null);
    const allRatings = [
      ...ratedTickets.map((t) => ({
        id: t.id,
        rating: t.rating ?? 5,
        comment: t.ratingComment,
        author: t.requesterName ?? "Morador do condomínio",
        unit: t.blockName && t.unitNumber ? `${t.blockName} ${t.unitNumber}` : "Unidade no condomínio",
        serviceDone: t.title,
        date: timeAgo(t.closedAt ?? t.createdAt),
        timestamp: (t.closedAt ?? t.createdAt).getTime(),
      })),
      ...directReviews.map((r) => ({
        id: r.id,
        rating: r.rating ?? 5,
        comment: r.comment,
        author: r.authorName ?? "Morador verificado",
        unit: "Unidade no condomínio",
        serviceDone: "Serviço residencial contratado",
        date: timeAgo(r.createdAt),
        timestamp: r.createdAt.getTime(),
      })),
    ];

    const reviewsCount = allRatings.length;
    const ratingSum = allRatings.reduce((acc, r) => acc + r.rating, 0);
    const computedRating = reviewsCount > 0 ? ratingSum / reviewsCount : (v.rating || 0);

    const completedOrCancelled = vendorTickets.filter((t) => t.status === "concluido" || t.status === "cancelado");
    const completionRate =
      completedOrCancelled.length > 0
        ? (vendorTickets.filter((t) => t.status === "concluido").length / completedOrCancelled.length) * 100
        : null;

    const ratingDistribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 } as MarketplaceProvider["ratingDistribution"];
    for (const r of allRatings) {
      const stars = Math.max(1, Math.min(5, Math.round(r.rating ?? 5))) as 1 | 2 | 3 | 4 | 5;
      ratingDistribution[stars] += 1;
    }

    const reviews: VerifiedReview[] = allRatings
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 20)
      .map((r) => ({
        id: r.id,
        authorName: r.author,
        unit: r.unit,
        rating: r.rating,
        comment: r.comment,
        serviceDone: r.serviceDone,
        date: r.date,
      }));

    const servicesOffered: ServiceOffering[] = Array.isArray(v.services)
      ? (v.services as ServiceOffering[])
      : [];
    const portfolio: PortfolioItem[] = Array.isArray(v.portfolio) ? (v.portfolio as PortfolioItem[]) : [];

    const score = calculateProviderScore({
      rating: computedRating,
      reviewsCount,
      completionRate,
      isVerified: v.verified,
    });

    // Distância real calculada quando as coordenadas estão disponíveis
    let distanceKm: number | null = null;
    if (
      options?.condoLat != null &&
      options?.condoLng != null &&
      v.lat != null &&
      v.lng != null
    ) {
      distanceKm = calculateHaversineKm(options.condoLat, options.condoLng, v.lat, v.lng);
    }

    const hasHiredBefore = options?.currentUserId
      ? vendorTickets.some((t) => t.openedById === options.currentUserId && t.status === "concluido")
      : false;

    const provider: MarketplaceProvider = {
      id: v.id,
      name: v.contactName || v.name,
      company: v.name,
      category: v.category,
      rating: Math.round(computedRating * 10) / 10,
      reviewsCount,
      score,
      isSponsored: v.sponsored,
      isVerified: v.verified,
      completionRate: completionRate === null ? null : Math.round(completionRate),
      hiredCount: vendorTickets.length,
      condoHiredCount: vendorTickets.length,
      hasHiredBefore,
      distanceKm,
      responseTimeMinutes: v.responseTimeMinutes || 15,
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
