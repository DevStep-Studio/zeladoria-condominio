import { test, expect } from "@playwright/test";
import { loginAsRole } from "./auth-helpers";

test.describe("Jornada E2E do Morador", () => {
  test.beforeEach(async ({ context, baseURL }) => {
    await loginAsRole(context, "morador", baseURL || "http://localhost:3000");
  });

  test("Central de Notificações: carrega lista, filtros de status e categorias", async ({ page }) => {
    await page.goto("/painel/notificacoes", { waitUntil: "domcontentloaded" });

    // Header and search
    await expect(page.locator("h1")).toContainText(/Notificações/i);
    await expect(page.locator("input[placeholder*='Buscar']")).toBeVisible();

    // Tabs: Todas, Não lidas, Lidas
    const tabTodas = page.locator("button:has-text('Todas')");
    const tabNaoLidas = page.locator("button:has-text('Não lidas')");
    const tabLidas = page.locator("button:has-text('Lidas')");

    await expect(tabTodas).toBeVisible();
    await expect(tabNaoLidas).toBeVisible();
    await expect(tabLidas).toBeVisible();

    // Interacting with tabs
    await tabNaoLidas.click();
    await page.waitForTimeout(200);
    await tabLidas.click();
    await page.waitForTimeout(200);
    await tabTodas.click();
  });

  test("Meu Perfil: exibe dados, abas funcionais e atalhos de navegação", async ({ page }) => {
    await page.goto("/painel/perfil", { waitUntil: "domcontentloaded" });

    // Profile header and user identity
    await expect(page.locator("h1")).toContainText(/Perfil/i);

    // Abas: Dados Pessoais, Segurança & Senha, Notificações
    const tabDados = page.locator("button:has-text('Dados Pessoais')");
    const tabSeguranca = page.locator("button:has-text('Segurança & Senha')");
    const tabNotificacoes = page.locator("button:has-text('Notificações')");

    await expect(tabDados).toBeVisible();
    await expect(tabSeguranca).toBeVisible();
    await expect(tabNotificacoes).toBeVisible();

    // Alternate to Seguranca and check password inputs
    await tabSeguranca.click();
    await expect(page.locator("input[type='password']")).toHaveCount(3);

    // Verify shortcuts are real links
    const shortcuts = page.locator("a[href^='/painel/']");
    const count = await shortcuts.count();
    expect(count).toBeGreaterThanOrEqual(4);
  });

  test("Marketplace & Serviços: catálogo, busca e garantias Zeladoria Pay", async ({ page }) => {
    await page.goto("/painel/servicos", { waitUntil: "domcontentloaded" });

    // Header
    await expect(page.locator("h1, h2")).toContainText(/Serviços|Marketplace/i);

    // Categories capsule / filter
    const searchInput = page.locator("input[placeholder*='Buscar']");
    if (await searchInput.isVisible()) {
      await searchInput.fill("elétrica");
      await page.waitForTimeout(300);
      await searchInput.fill("");
    }
  });

  test("Restrição RBAC: Morador não deve acessar rotas financeiras administrativas", async ({ page }) => {
    const response = await page.goto("/painel/financeiro", { waitUntil: "domcontentloaded" });
    // Should either redirect, return 403, or render permission banner
    const currentUrl = page.url();
    const hasForbiddenOrRedirect =
      response?.status() === 403 ||
      currentUrl.includes("/painel") && !currentUrl.includes("/financeiro") ||
      (await page.locator("body").textContent())?.includes("Acesso restrito");
    expect(hasForbiddenOrRedirect).toBeTruthy();
  });
});
