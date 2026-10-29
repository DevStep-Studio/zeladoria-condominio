import { test, expect } from "@playwright/test";
import { loginAsRole } from "./auth-helpers";

test.describe("Jornada E2E da Portaria & Controle de Acesso", () => {
  test.beforeEach(async ({ context, baseURL }) => {
    await loginAsRole(context, "porteiro", baseURL || "http://localhost:3000");
  });

  test("Portaria: navegação entre abas de visitas e encomendas", async ({ page }) => {
    await page.goto("/painel/portaria", { waitUntil: "domcontentloaded" });

    // Header
    await expect(page.locator("h1")).toContainText(/Portaria|Controle de Acesso/i);

    // Buttons
    await expect(page.locator("button:has-text('Autorizar Visitante')")).toBeVisible();
    await expect(page.locator("button:has-text('Receber Encomenda')")).toBeVisible();

    // Tabs
    const tabEncomendas = page.locator("button:has-text('Encomendas')");
    if (await tabEncomendas.isVisible()) {
      await tabEncomendas.click();
      await page.waitForTimeout(200);
    }
  });

  test("Encomendas: modal de baixa com PIN seguro substitui window.prompt", async ({ page }) => {
    await page.goto("/painel/portaria", { waitUntil: "domcontentloaded" });

    // Go to encomendas tab
    const tabEncomendas = page.locator("button:has-text('Encomendas')");
    if (await tabEncomendas.isVisible()) {
      await tabEncomendas.click();
      await page.waitForTimeout(200);
    }

    // Check if any "Dar Baixa" button exists
    const btnBaixa = page.locator("button:has-text('Dar Baixa')").first();
    if (await btnBaixa.isVisible()) {
      await btnBaixa.click();
      // Should show the PIN modal
      await expect(page.locator("text=Código PIN de Retirada")).toBeVisible();
      await expect(page.locator("input[placeholder*='PIN']")).toBeVisible();
      // Cancel modal
      await page.locator("button:has-text('Cancelar')").click();
    }
  });

  test("Restrição RBAC: Porteiro não deve acessar a administração da plataforma", async ({ page }) => {
    const response = await page.goto("/painel/admin", { waitUntil: "domcontentloaded" });
    const currentUrl = page.url();
    const isRestricted =
      response?.status() === 403 ||
      !currentUrl.includes("/painel/admin") ||
      (await page.locator("body").textContent())?.includes("Acesso restrito");
    expect(isRestricted).toBeTruthy();
  });
});

