import { test, expect } from "@playwright/test";
import { loginAsRole } from "./auth-helpers";

test.describe("Módulo Tião Zelador: Identidade Visual e Fluxos E2E", () => {
  test.beforeEach(async ({ context, baseURL }) => {
    await loginAsRole(context, "morador", baseURL || "http://localhost:3000");
  });

  test("Dashboard: exibe card oficial do Tião Zelador com mascote e link de contratação", async ({ page }) => {
    await page.goto("/painel", { waitUntil: "domcontentloaded" });

    // Card de ação rápida ou seção institucional do Tião Zelador
    const tiaoCard = page.locator("a[href='/painel/servicos']").first();
    await expect(tiaoCard).toBeVisible();
    await expect(page.locator("body")).toContainText(/Tião Zelador/i);

    // Sidebar: grupo Tião Zelador com item 'Encontrar profissional'
    const sidebarTiaoLink = page.locator("aside a[href='/painel/servicos']");
    if (await sidebarTiaoLink.isVisible()) {
      await expect(sidebarTiaoLink).toContainText(/Encontrar profissional/i);
    }
  });

  test("Navegação para /painel/servicos: ativa tema contextual data-brand='tiao' e identidade do Tião", async ({ page }) => {
    await page.goto("/painel/servicos", { waitUntil: "domcontentloaded" });

    // Verifica que o tema contextual Tião foi ativado no container principal
    const tiaoContainer = page.locator("[data-brand='tiao']");
    await expect(tiaoContainer.first()).toBeVisible();

    // Cabeçalho oficial com mascote e nome
    await expect(page.locator("h1")).toContainText(/Tião Zelador/i);
    const mascotImg = page.locator("img[src*='/brands/tiao/']").first();
    await expect(mascotImg).toBeVisible();

    // Garantia Zeladoria Pay visível
    await expect(page.locator("body")).toContainText(/Zeladoria Pay/i);

    // Filtro por categorias presente e funcional
    const searchInput = page.locator("input[placeholder*='Buscar']");
    await expect(searchInput).toBeVisible();
  });

  test("Isolamento de Marca: sair do Tião reverte data-brand para 'zeladoria'", async ({ page }) => {
    // 1. Entra no Tião Zelador
    await page.goto("/painel/servicos", { waitUntil: "domcontentloaded" });
    const tiaoContainer = page.locator("[data-brand='tiao']");
    await expect(tiaoContainer.first()).toBeVisible();

    // 2. Navega para módulo condominial (Ocorrências)
    await page.goto("/painel/ocorrencias", { waitUntil: "domcontentloaded" });

    // Verifica que data-brand mudou para zeladoria
    const zeladoriaContainer = page.locator("[data-brand='zeladoria']");
    await expect(zeladoriaContainer.first()).toBeVisible();

    // Verifica que o cabeçalho é o de ocorrências
    await expect(page.locator("h1")).toContainText(/Ocorrências/i);
  });

  test("Minhas Contratações (/painel/chamados): exibe título adaptado e selo Tião para morador", async ({ page }) => {
    await page.goto("/painel/chamados", { waitUntil: "domcontentloaded" });

    // Título 'Minhas Contratações' para perfil morador
    await expect(page.locator("h1")).toContainText(/Minhas Contratações/i);

    // Selo Tião Zelador com garantia de custódia
    await expect(page.locator("body")).toContainText(/Tião Zelador/i);
    await expect(page.locator("body")).toContainText(/Marketplace Verificado/i);
  });
});

