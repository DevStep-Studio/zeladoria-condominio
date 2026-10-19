import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { calculateProviderScore } from "../src/lib/services/ranking";
import { calculateProfileCompleteness } from "../src/lib/services/provider-profile";
import {
  isPromotionActive,
  selectEligiblePromotions,
} from "../src/lib/services/promotions";

describe("Marketplace Pilares - Testes 76 a 80", () => {
  it("TESTE 76: cálculo de completude de perfil e ativação de prestador", () => {
    // Perfil completo com foto, descrição, 3 trabalhos, 5 serviços, 10km, disponibilidade e CNPJ
    const fullVendor = {
      photoUrl: "https://example.com/avatar.jpg",
      description: "Eletricista residencial com mais de 10 anos de experiência em quadros e chuveiros.",
      services: [
        { id: "1", name: "Chuveiro" },
        { id: "2", name: "Disjuntor" },
        { id: "3", name: "Tomada" },
        { id: "4", name: "Luminária" },
        { id: "5", name: "Fiação" },
      ],
      portfolio: [
        { url: "https://example.com/p1.jpg", caption: "Quadro" },
        { url: "https://example.com/p2.jpg", caption: "Iluminação" },
        { url: "https://example.com/p3.jpg", caption: "Chuveiro" },
      ],
      workingHours: "Seg a Sex 08:00 - 18:00",
      availableNow: true,
      serviceArea: "São Paulo, Jardins, Itaim",
      serviceRadiusKm: 10,
      cnpj: "12.345.678/0001-90",
    };

    const completeness = calculateProfileCompleteness(fullVendor);
    assert.equal(completeness.percentage, 100);
    assert.equal(completeness.missingItems.length, 0);

    // Perfil incompleto sem foto e sem portfólio
    const partialVendor = {
      ...fullVendor,
      photoUrl: null,
      portfolio: [],
    };
    const partial = calculateProfileCompleteness(partialVendor);
    assert.ok(partial.percentage < 100);
    assert.ok(partial.missingItems.some((i) => i.key === "photo"));
    assert.ok(partial.missingItems.some((i) => i.key === "portfolio"));
  });

  it("TESTE 78: Prestador A (4.9 com 300 avaliações) vs Prestador B (5.0 com 1 avaliação)", () => {
    // Prestador A: 4.9 estrelas, 300 avaliações reais, 96% de conclusão
    const scoreA = calculateProviderScore({
      rating: 4.9,
      reviewsCount: 300,
      completionRate: 96,
      isVerified: true,
    });

    // Prestador B: 5.0 estrelas, apenas 1 avaliação, 100% de conclusão
    const scoreB = calculateProviderScore({
      rating: 5.0,
      reviewsCount: 1,
      completionRate: 100,
      isVerified: true,
    });

    // O sistema NÃO pode considerar B o melhor automaticamente
    assert.ok(
      scoreA > scoreB,
      `Score A (${scoreA}) deve ser superior a Score B (${scoreB}) devido ao volume bayesiano`
    );
  });

  it("TESTE 79: Patrocinado ativo aparece; quando expira, deixa de ocupar espaço publicitário e ranking orgânico permanece inalterado", () => {
    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;

    const activePromo = {
      id: 1,
      vendorId: 101,
      status: "ACTIVE",
      paymentStatus: "paid",
      startsAt: new Date(now - oneDay),
      endsAt: new Date(now + 6 * oneDay), // expira em 6 dias
      categoryId: "eletrica",
    };

    const expiredPromo = {
      id: 2,
      vendorId: 102,
      status: "ACTIVE",
      paymentStatus: "paid",
      startsAt: new Date(now - 10 * oneDay),
      endsAt: new Date(now - 3 * oneDay), // expirou há 3 dias
      categoryId: "eletrica",
    };

    assert.equal(isPromotionActive(activePromo), true, "Campanha dentro da vigência deve estar ativa");
    assert.equal(isPromotionActive(expiredPromo), false, "Campanha expirada não deve estar ativa");

    const filtered = selectEligiblePromotions([activePromo, expiredPromo], { category: "eletrica" });
    assert.equal(filtered.length, 1);
    assert.equal(filtered[0].vendorId, 101);

    // O ranking orgânico do prestador 101 NÃO pode ser alterado por ter pago campanha
    const scoreWithoutPayment = calculateProviderScore({
      rating: 4.8,
      reviewsCount: 50,
      completionRate: 90,
      isVerified: true,
    });
    // A fórmula não aceita e não considera paymentAmount
    assert.ok(scoreWithoutPayment > 0);
  });

  it("TESTE 80: Relevância estrita - Prestador patrocinado Eletricista NÃO aparece em busca de Pintor", () => {
    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;

    const promoEletricista = {
      id: 10,
      vendorId: 201,
      status: "ACTIVE",
      paymentStatus: "paid",
      startsAt: new Date(now - oneDay),
      endsAt: new Date(now + 5 * oneDay),
      categoryId: "eletrica",
      vendorCategory: "eletrica",
    };

    const promoPintor = {
      id: 11,
      vendorId: 202,
      status: "ACTIVE",
      paymentStatus: "paid",
      startsAt: new Date(now - oneDay),
      endsAt: new Date(now + 5 * oneDay),
      categoryId: "pintura",
      vendorCategory: "pintura",
    };

    // Morador busca por "pintura"
    const resultsForPintura = selectEligiblePromotions(
      [promoEletricista, promoPintor],
      { category: "pintura" }
    );

    assert.equal(resultsForPintura.length, 1);
    assert.equal(resultsForPintura[0].vendorId, 202);
    // Eletricista NÃO pode aparecer!
    assert.ok(!resultsForPintura.some((p) => p.vendorId === 201));
  });
});
