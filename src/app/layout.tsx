import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "Zeladoria Condomínio | Gestão e Operação Condominial",
  description:
    "Plataforma completa para zeladoria, controle de portaria, ocorrências, mapa em tempo real, agendamentos e administração condominial.",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/favicon.png", type: "image/png" },
      { url: "/favicon.ico", sizes: "any" },
    ],
    shortcut: "/favicon.png",
    apple: "/favicon.png",
  },
  applicationName: "Zeladoria Condomínio",
  appleWebApp: { capable: true, title: "Zeladoria Condomínio", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  themeColor: "#1355FF",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className="antialiased">{children}</body>
    </html>
  );
}
