/**
 * Tokens oficiais de Design do Tião Zelador & Tião Parceiros
 * Diretrizes: Fundo neutro/branco, Laranja sólido (#FB6B01) para marca, CTA e seleção.
 * Disponibilidade é estritamente verde (#10B981), nunca laranja.
 */

export const tiaoTokens = {
  primary: "#FB6B01",
  primaryHover: "#E05F00",
  primaryActive: "#C2410C",
  primarySoft: "#FFF7ED",
  primaryBorder: "#FFEDD5",

  // Disponibilidade (Estritamente Verde)
  available: "#10B981",
  availableSoft: "#ECFDF5",
  availableBorder: "#A7F3D0",

  // Textos
  textPrimary: "#0F172A",
  textSecondary: "#475569",
  textMuted: "#64748B",
  textLight: "#94A3B8",

  // Superfícies
  background: "#F8FAFC",
  surface: "#FFFFFF",
  surfaceSubtle: "#F1F5F9",
  border: "#E2E8F0",
  borderLight: "#F1F5F9",
} as const;

export type TiaoTokens = typeof tiaoTokens;

