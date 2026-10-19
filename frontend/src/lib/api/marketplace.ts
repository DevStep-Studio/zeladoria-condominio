import "server-only";
import { cache } from "react";
import { ApiError, backendRequest } from "./server";
import type { DomainModels } from "./models";

export const getPublicProvider = cache(async (slug: string): Promise<{ vendor: DomainModels["vendors"]; reviews: (DomainModels["serviceReviews"] & { authorName: string; customerName: string })[] } | null> => {
  try { return await backendRequest(`/prestadores/${encodeURIComponent(slug)}`); }
  catch (error) { if (error instanceof ApiError && error.status === 404) return null; throw error; }
});
