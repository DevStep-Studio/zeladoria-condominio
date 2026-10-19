import type { MarketplaceProvider } from "./providers-data";

type ProviderRecord = { id: number; active?: boolean; onboardingStatus?: string; services?: unknown; [key: string]: unknown };

export function resolveRebookProvider(id: number, providers: MarketplaceProvider[], records: ProviderRecord[]) {
  const profile = providers.find((provider) => provider.id === id);
  const record = records.find((provider) => provider.id === id);
  if (!profile && !record) return null;
  return { ...profile, ...record, services: record?.services ?? profile?.servicesOffered ?? [] };
}

export function canRebookProvider(provider: { active?: boolean; onboardingStatus?: string } | null): boolean {
  return provider?.active === true && !["suspenso", "rejeitado"].includes(provider.onboardingStatus ?? "");
}
