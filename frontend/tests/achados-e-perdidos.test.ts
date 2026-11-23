import { test } from "node:test";
import assert from "node:assert/strict";
import {
  createLostAndFoundItem,
  getAllLostAndFoundItems,
  getLostAndFoundItemById,
  claimLostAndFoundItem,
  reportFoundLostAndFoundItem,
  resolveLostAndFoundItem,
  deleteLostAndFoundItem,
} from "../src/lib/services/lost-and-found-storage";

test("Achados e Perdidos - Fluxo completo de persistência", async (t) => {
  const testCondoId = 99999;

  await t.test("deve criar um item encontrado com status OPEN", () => {
    const created = createLostAndFoundItem({
      type: "FOUND",
      title: "Chaveiro com controle de portão",
      category: "Chaves",
      date: "23/11/2026",
      location: "Bicicletário Subsolo",
      description: "Chaveiro preto com tag azul e chave Yale",
      reportedBy: "Carlos Porteiro",
      reportedByRole: "porteiro",
      unit: "Portaria Central",
      condoId: testCondoId,
    });

    assert.ok(created.id, "Item deve possuir ID gerado");
    assert.equal(created.type, "FOUND");
    assert.equal(created.status, "OPEN");
    assert.equal(created.title, "Chaveiro com controle de portão");
    assert.equal(created.condoId, testCondoId);

    // Verifica se busca por ID funciona
    const found = getLostAndFoundItemById(created.id);
    assert.ok(found, "Item deve ser encontrado pelo ID no storage");
    assert.equal(found.title, "Chaveiro com controle de portão");
  });

  await t.test("deve criar um item perdido e listá-lo no condomínio", () => {
    const lostItem = createLostAndFoundItem({
      type: "LOST",
      title: "Óculos de sol Rayban",
      category: "Outros",
      date: "22/11/2026",
      location: "Piscina ou Deck",
      description: "Armação preta fosca com lente degradê",
      reportedBy: "Mariana Moradora",
      reportedByRole: "morador",
      unit: "Torre A · 501",
      condoId: testCondoId,
    });

    assert.equal(lostItem.type, "LOST");
    assert.equal(lostItem.status, "OPEN");

    const items = getAllLostAndFoundItems(testCondoId);
    assert.ok(items.length >= 2, "Condomínio deve conter pelo menos 2 registros");
    const hasItem = items.some((i) => i.id === lostItem.id);
    assert.ok(hasItem, "Item perdido deve estar presente na listagem do condomínio");
  });

  await t.test("deve permitir que um morador informe localização de um item perdido", () => {
    const items = getAllLostAndFoundItems(testCondoId);
    const lostItem = items.find((i) => i.type === "LOST");
    assert.ok(lostItem, "Deve existir um item perdido");

    const updated = reportFoundLostAndFoundItem(
      lostItem.id,
      "Pedro Vizinho",
      "Vi o óculos na mesinha do quiosque da piscina"
    );

    assert.ok(updated);
    assert.equal(updated.claimedBy, "Pedro Vizinho");
    assert.ok(updated.claimMessage?.includes("quiosque da piscina"));
  });

  await t.test("deve permitir reivindicar um item encontrado", () => {
    const items = getAllLostAndFoundItems(testCondoId);
    const foundItem = items.find((i) => i.type === "FOUND");
    assert.ok(foundItem, "Deve existir um item achado");

    const claimed = claimLostAndFoundItem(
      foundItem.id,
      "Roberto Síndico",
      "É o controle extra da zeladoria"
    );

    assert.ok(claimed);
    assert.equal(claimed.claimedBy, "Roberto Síndico");
    assert.equal(claimed.claimMessage, "É o controle extra da zeladoria");
  });

  await t.test("deve concluir a devolução do item marcando como RESOLVED", () => {
    const items = getAllLostAndFoundItems(testCondoId);
    const item = items[0];
    assert.ok(item, "Deve existir ao menos um item");

    const resolved = resolveLostAndFoundItem(
      item.id,
      "Roberto Proprietário",
      "Documento RG conferido"
    );

    assert.ok(resolved);
    assert.equal(resolved.status, "RESOLVED");
    assert.ok(resolved.resolvedAt, "Deve ter data de resolução");
    assert.ok(resolved.resolvedBy?.includes("Roberto Proprietário"));
  });

  await t.test("deve permitir a exclusão do item", () => {
    const items = getAllLostAndFoundItems(testCondoId);
    for (const item of items) {
      const ok = deleteLostAndFoundItem(item.id);
      assert.ok(ok, "Item deve ser excluído com sucesso");
    }

    const remaining = getAllLostAndFoundItems(testCondoId);
    assert.equal(remaining.length, 0, "Todos os itens de teste devem ter sido excluídos");
  });
});
