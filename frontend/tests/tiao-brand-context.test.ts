import { test } from "node:test";
import assert from "node:assert/strict";

// Resolve brand based on pathname
export function resolveBrandFromPath(pathname: string): "zeladoria" | "tiao" {
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

test("resolveBrandFromPath: deve ativar 'tiao' para rotas de serviços e marketplace", () => {
  assert.equal(resolveBrandFromPath("/painel/servicos"), "tiao");
  assert.equal(resolveBrandFromPath("/painel/servicos/eletricista"), "tiao");
  assert.equal(resolveBrandFromPath("/painel/chamados"), "tiao");
  assert.equal(resolveBrandFromPath("/painel/chamados/123"), "tiao");
  assert.equal(resolveBrandFromPath("/prestador"), "tiao");
  assert.equal(resolveBrandFromPath("/prestador/chamados"), "tiao");
  assert.equal(resolveBrandFromPath("/prestador/ganhos"), "tiao");
});

test("resolveBrandFromPath: deve preservar 'zeladoria' para rotas de gestão condominial", () => {
  assert.equal(resolveBrandFromPath("/painel"), "zeladoria");
  assert.equal(resolveBrandFromPath("/painel/notificacoes"), "zeladoria");
  assert.equal(resolveBrandFromPath("/painel/ocorrencias"), "zeladoria");
  assert.equal(resolveBrandFromPath("/painel/reservas"), "zeladoria");
  assert.equal(resolveBrandFromPath("/painel/financeiro"), "zeladoria");
  assert.equal(resolveBrandFromPath("/painel/moradores"), "zeladoria");
  assert.equal(resolveBrandFromPath("/painel/portaria"), "zeladoria");
});

