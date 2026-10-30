"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";

export type BrandType = "zeladoria" | "tiao";

export const TIAO_TOKENS = {
  primary: "#FB6B01",
  primaryHover: "#E05F00",
  primaryPressed: "#C75400",
  primarySoft: "#FFF7ED",
  primaryBorder: "#FED7AA",
  text: "#0F172A",
  textMuted: "#64748B",
  background: "#FFFFFF",
  surface: "#F8FAFC",
  border: "#E2E8F0",
} as const;

export const ZELADORIA_TOKENS = {
  primary: "#1355FF",
  primaryHover: "#0D47E6",
  primaryPressed: "#0936B8",
  primarySoft: "#EFF6FF",
  primaryBorder: "#BFDBFE",
  text: "#0F172A",
  textMuted: "#64748B",
  background: "#FFFFFF",
  surface: "#F8FAFC",
  border: "#E2E8F0",
} as const;

export function resolveBrandFromPath(pathname: string | null | undefined): BrandType {
  if (!pathname) return "zeladoria";
  const p = pathname.toLowerCase();
  if (
    p.startsWith("/painel/servicos") ||
    p.startsWith("/painel/chamados") ||
    p.startsWith("/prestador")
  ) {
    return "tiao";
  }
  return "zeladoria";
}

interface BrandContextValue {
  brand: BrandType;
  isTiao: boolean;
  tokens: typeof TIAO_TOKENS | typeof ZELADORIA_TOKENS;
}

const BrandContext = createContext<BrandContextValue>({
  brand: "zeladoria",
  isTiao: false,
  tokens: ZELADORIA_TOKENS,
});

export function BrandProvider({
  children,
  forcedBrand,
}: {
  children: React.ReactNode;
  forcedBrand?: BrandType;
}) {
  const pathname = usePathname();
  const currentBrand = forcedBrand || resolveBrandFromPath(pathname);
  const isTiao = currentBrand === "tiao";

  const value = useMemo(
    () => ({
      brand: currentBrand,
      isTiao,
      tokens: isTiao ? TIAO_TOKENS : ZELADORIA_TOKENS,
    }),
    [currentBrand, isTiao]
  );

  return (
    <BrandContext.Provider value={value}>
      <div data-brand={currentBrand} className="contents">
        {children}
      </div>
    </BrandContext.Provider>
  );
}

export function useBrand() {
  return useContext(BrandContext);
}
