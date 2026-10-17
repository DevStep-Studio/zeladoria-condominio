import { db } from "@/db";
import { serviceRequests, serviceReviews, vendors } from "@/db/schema";
import { and, desc, eq, isNotNull, sql } from "drizzle-orm";

export interface CategoryMetric {
  category: string;
  count: number;
  completedCount: number;
  averageRating: number;
  averageHours: number;
}

export interface ProviderEfficiency {
  vendorId: number;
  vendorName: string;
  completedJobs: number;
  rating: number;
  averageHours: number;
}

export interface EfficiencyMetricsResult {
  totalRequests: number;
  completedRequests: number;
  inProgressRequests: number;
  pendingRequests: number;
  tmaHours: number;
  resolutionRatePercent: number;
  firstTimeRightPercent: number;
  averageCsat: number;
  totalReviews: number;
  categories: CategoryMetric[];
  topProviders: ProviderEfficiency[];
}

/**
 * Calcula métricas consolidadas de eficiência operacional para o condomínio
 */
export async function getOperationalEfficiencyMetrics(
  condoId: number
): Promise<EfficiencyMetricsResult> {
  // 1. Busca todas as solicitações do condomínio
  const requests = await db
    .select({
      id: serviceRequests.id,
      category: serviceRequests.category,
      status: serviceRequests.status,
      vendorId: serviceRequests.vendorId,
      correctionNotes: serviceRequests.correctionNotes,
      createdAt: serviceRequests.createdAt,
      completedAt: serviceRequests.completedAt,
    })
    .from(serviceRequests)
    .where(eq(serviceRequests.condoId, condoId));

  const totalRequests = requests.length;
  const completed = requests.filter((r) => r.status === "concluido" || r.completedAt !== null);
  const inProgress = requests.filter((r) =>
    ["aceito", "a_caminho", "chegou", "em_atendimento", "prestador_concluiu", "correcao_solicitada"].includes(r.status)
  );
  const pending = requests.filter((r) =>
    ["solicitado", "buscando_prestador", "aguardando_orcamento"].includes(r.status)
  );

  // 2. Calcula Tempo Médio de Atendimento (TMA) em horas
  let totalHours = 0;
  let countWithDuration = 0;
  let firstTimeRightCount = 0;

  for (const r of completed) {
    if (r.createdAt && r.completedAt) {
      const diffMs = new Date(r.completedAt).getTime() - new Date(r.createdAt).getTime();
      const hours = Math.max(0.1, diffMs / (1000 * 60 * 60));
      totalHours += hours;
      countWithDuration++;
    }
    if (!r.correctionNotes) {
      firstTimeRightCount++;
    }
  }

  const tmaHours = countWithDuration > 0
    ? Math.round((totalHours / countWithDuration) * 10) / 10
    : 0;

  const resolutionRatePercent = totalRequests > 0
    ? Math.round((completed.length / totalRequests) * 100)
    : 100;

  const firstTimeRightPercent = completed.length > 0
    ? Math.round((firstTimeRightCount / completed.length) * 100)
    : 100;

  // 3. Avaliações (CSAT) dos chamados do condomínio
  const reviews = await db
    .select({
      id: serviceReviews.id,
      requestId: serviceReviews.requestId,
      vendorId: serviceReviews.vendorId,
      rating: serviceReviews.rating,
    })
    .from(serviceReviews)
    .innerJoin(serviceRequests, eq(serviceReviews.requestId, serviceRequests.id))
    .where(eq(serviceRequests.condoId, condoId));

  const totalReviews = reviews.length;
  const averageCsat = totalReviews > 0
    ? Math.round((reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews) * 10) / 10
    : 5.0;

  // 4. Breakdown por Categoria
  const catMap = new Map<string, { count: number; completed: number; totalHours: number; hoursCount: number; ratings: number[] }>();

  for (const r of requests) {
    const cat = r.category || "outros";
    const entry = catMap.get(cat) || { count: 0, completed: 0, totalHours: 0, hoursCount: 0, ratings: [] };
    entry.count++;
    if (r.status === "concluido") {
      entry.completed++;
      if (r.createdAt && r.completedAt) {
        const h = Math.max(0.1, (new Date(r.completedAt).getTime() - new Date(r.createdAt).getTime()) / (1000 * 60 * 60));
        entry.totalHours += h;
        entry.hoursCount++;
      }
    }
    catMap.set(cat, entry);
  }

  for (const rev of reviews) {
    const matchedReq = requests.find((r) => r.id === rev.requestId);
    if (matchedReq) {
      const cat = matchedReq.category || "outros";
      const entry = catMap.get(cat);
      if (entry) entry.ratings.push(rev.rating);
    }
  }

  const categories: CategoryMetric[] = Array.from(catMap.entries()).map(([category, val]) => ({
    category,
    count: val.count,
    completedCount: val.completed,
    averageRating: val.ratings.length > 0
      ? Math.round((val.ratings.reduce((a, b) => a + b, 0) / val.ratings.length) * 10) / 10
      : 5.0,
    averageHours: val.hoursCount > 0
      ? Math.round((val.totalHours / val.hoursCount) * 10) / 10
      : 0,
  })).sort((a, b) => b.count - a.count);

  // 5. Ranking de Prestadores
  const vendorMap = new Map<number, { completed: number; totalHours: number; count: number }>();
  for (const r of completed) {
    if (r.vendorId) {
      const v = vendorMap.get(r.vendorId) || { completed: 0, totalHours: 0, count: 0 };
      v.completed++;
      if (r.createdAt && r.completedAt) {
        v.totalHours += (new Date(r.completedAt).getTime() - new Date(r.createdAt).getTime()) / (1000 * 60 * 60);
        v.count++;
      }
      vendorMap.set(r.vendorId, v);
    }
  }

  const topProviders: ProviderEfficiency[] = [];
  for (const [vendorId, stat] of vendorMap.entries()) {
    const [vendor] = await db.select().from(vendors).where(eq(vendors.id, vendorId)).limit(1);
    if (vendor) {
      topProviders.push({
        vendorId,
        vendorName: vendor.name,
        completedJobs: stat.completed,
        rating: vendor.rating ?? 5,
        averageHours: stat.count > 0 ? Math.round((stat.totalHours / stat.count) * 10) / 10 : 0,
      });
    }
  }

  topProviders.sort((a, b) => b.completedJobs - a.completedJobs);

  return {
    totalRequests,
    completedRequests: completed.length,
    inProgressRequests: inProgress.length,
    pendingRequests: pending.length,
    tmaHours,
    resolutionRatePercent,
    firstTimeRightPercent,
    averageCsat,
    totalReviews,
    categories,
    topProviders: topProviders.slice(0, 5),
  };
}
