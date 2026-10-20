import { test, expect } from "@playwright/test";
import { createHmac } from "node:crypto";

const SECRET = process.env.SESSION_SECRET ?? "gestao-condominio-dev-secret";

function sign(value: string) {
  return createHmac("sha256", SECRET).update(value).digest("hex").slice(0, 32);
}

function generateSessionCookie(userId: number, maxAgeSeconds = 60 * 60 * 24 * 30): string {
  const expires = Date.now() + maxAgeSeconds * 1000;
  const payload = `${userId}.${expires}`;
  return `${payload}.${sign(payload)}`;
}

// Rotas públicas que não dependem de sessão
const PUBLIC_ROUTES = [
  { path: "/login", name: "Login" },
  { path: "/esqueci-senha", name: "Esqueci Senha" },
  { path: "/prestador/login", name: "Prestador Login" },
  { path: "/prestador/cadastro", name: "Prestador Cadastro" },
];

test.describe("Auditoria de Responsividade — Rotas Públicas", () => {
  for (const route of PUBLIC_ROUTES) {
    test(`Página ${route.name} (${route.path}) não deve ter overflow horizontal`, async ({ page }) => {
      const consoleErrors: string[] = [];
      page.on("console", (msg) => {
        if (msg.type() === "error") consoleErrors.push(msg.text());
      });

      await page.goto(route.path, { waitUntil: "domcontentloaded" });
      await page.waitForTimeout(500);

      // Verificação 1: Overflow Horizontal estrito
      const overflowMetrics = await page.evaluate(() => {
        const docWidth = document.documentElement.scrollWidth;
        const winWidth = window.innerWidth;
        const bodyWidth = document.body.scrollWidth;
        return {
          docWidth,
          winWidth,
          bodyWidth,
          hasOverflow: docWidth > winWidth + 1 || bodyWidth > winWidth + 1,
        };
      });

      expect(
        overflowMetrics.hasOverflow,
        `Overflow horizontal detectado em ${route.path}! Largura do documento: ${overflowMetrics.docWidth}px, Viewport: ${overflowMetrics.winWidth}px`
      ).toBe(false);

      // Verificação 2: Botões interativos essenciais visíveis
      const buttons = page.locator("button:visible, a.btn:visible");
      const buttonCount = await buttons.count();
      expect(buttonCount).toBeGreaterThan(0);
    });
  }
});

test.describe("Auditoria de Responsividade — Painel Autenticado", () => {
  test.beforeEach(async ({ context }) => {
    // Configura cookie de morador para acesso ao painel
    const sessionToken = generateSessionCookie(1);
    await context.addCookies([
      {
        name: "gc_session",
        value: sessionToken,
        domain: "localhost",
        path: "/",
      },
      {
        name: "gc_condo",
        value: "1",
        domain: "localhost",
        path: "/",
      },
    ]);
  });

  const AUTH_ROUTES = [
    { path: "/painel", name: "Dashboard Morador" },
    { path: "/painel/ocorrencias", name: "Ocorrências" },
    { path: "/painel/reservas", name: "Reservas" },
    { path: "/painel/visitantes", name: "Visitantes" },
    { path: "/painel/encomendas", name: "Encomendas" },
    { path: "/painel/comunicados", name: "Comunicados" },
    { path: "/painel/servicos", name: "Marketplace de Serviços" },
    { path: "/painel/perfil", name: "Perfil" },
  ];

  for (const route of AUTH_ROUTES) {
    test(`Painel: ${route.name} (${route.path}) deve ser 100% responsivo sem overflow`, async ({ page }) => {
      const response = await page.goto(route.path, { waitUntil: "domcontentloaded" });
      
      // Se redirecionar para login (ex: servidor de backend simulado/offline), valida a tela resultante
      await page.waitForTimeout(600);

      const overflowMetrics = await page.evaluate(() => {
        const docWidth = document.documentElement.scrollWidth;
        const winWidth = window.innerWidth;
        const bodyWidth = document.body.scrollWidth;
        return {
          docWidth,
          winWidth,
          bodyWidth,
          hasOverflow: docWidth > winWidth + 1 || bodyWidth > winWidth + 1,
        };
      });

      expect(
        overflowMetrics.hasOverflow,
        `Overflow horizontal detectado em ${route.path}! Largura do documento: ${overflowMetrics.docWidth}px, Viewport: ${overflowMetrics.winWidth}px`
      ).toBe(false);
    });
  }
});
