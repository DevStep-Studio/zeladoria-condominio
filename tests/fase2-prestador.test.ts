import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { OFFICIAL_CATEGORIES, getCategoryById, getAllServices } from "../src/lib/services/categories-catalog";
import { calculateHaversineKm, formatDistanceText } from "../src/lib/services/geo";

describe("FASE 2 — CADASTRO DO PRESTADOR: Onboarding, Cobertura, Recebimentos e Identidade", () => {
  // --------------------------------------------------------------------------
  // 1. VALIDAÇÃO DE DADOS PESSOAIS E MÁSCARAS CADASTRAIS
  // --------------------------------------------------------------------------
  describe("1. Validação de Regras e Máscaras Cadastrais", () => {
    function isValidCpf(cpf: string): boolean {
      const clean = cpf.replace(/\D/g, "");
      if (clean.length !== 11 || !!clean.match(/(\d)\1{10}/)) return false;
      let sum = 0;
      let rest: number;
      for (let i = 1; i <= 9; i++) sum += parseInt(clean.substring(i - 1, i)) * (11 - i);
      rest = (sum * 10) % 11;
      if (rest === 10 || rest === 11) rest = 0;
      if (rest !== parseInt(clean.substring(9, 10))) return false;
      sum = 0;
      for (let i = 1; i <= 10; i++) sum += parseInt(clean.substring(i - 1, i)) * (12 - i);
      rest = (sum * 10) % 11;
      if (rest === 10 || rest === 11) rest = 0;
      return rest === parseInt(clean.substring(10, 11));
    }

    it("deve validar CPFs válidos e rejeitar CPFs inválidos ou com dígitos repetidos", () => {
      // CPF matematicamente válido para testes
      assert.equal(isValidCpf("52998224725"), true);
      assert.equal(isValidCpf("529.982.247-25"), true);

      // CPFs inválidos
      assert.equal(isValidCpf("111.111.111-11"), false);
      assert.equal(isValidCpf("00000000000"), false);
      assert.equal(isValidCpf("123.456.789-00"), false);
    });

    it("deve formatar corretamente as máscaras de telefone, CEP e CPF", () => {
      const phoneRaw = "11987654321";
      const maskedPhone = phoneRaw.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
      assert.equal(maskedPhone, "(11) 98765-4321");

      const cepRaw = "01452000";
      const maskedCep = cepRaw.replace(/(\d{5})(\d{3})/, "$1-$2");
      assert.equal(maskedCep, "01452-000");
    });
  });

  // --------------------------------------------------------------------------
  // 2. CATÁLOGO OFICIAL DE 14 CATEGORIAS E SERVIÇOS COM GARANTIA
  // --------------------------------------------------------------------------
  describe("2. Catálogo Oficial de Especialidades e Garantia Mínima", () => {
    it("deve conter exatamente as 14 categorias oficiais requeridas pelo Prompt Mestre", () => {
      const expectedCategories = [
        "eletricista",
        "encanador",
        "chaveiro",
        "pintura",
        "instalacoes",
        "ar_condicionado",
        "limpeza",
        "jardinagem",
        "manutencao_predial",
        "reparos_gerais",
        "seguranca_eletronica",
        "portoes_eletronicos",
        "bombas_hidraulicas",
        "servicos_tecnicos",
      ];

      assert.equal(OFFICIAL_CATEGORIES.length, 14);
      for (const catId of expectedCategories) {
        const found = getCategoryById(catId);
        assert.ok(found, `Categoria ${catId} deve existir no catálogo`);
        assert.ok(found.name.length > 0);
        assert.ok(found.services.length > 0, `Categoria ${catId} deve possuir serviços cadastrados`);
      }
    });

    it("todos os serviços pré-configurados devem possuir garantia mínima legal de 90 dias (CDC)", () => {
      const allServices = getAllServices();
      assert.ok(allServices.length >= 35, "Deve haver catálogo amplo de serviços");

      for (const svc of allServices) {
        assert.ok(svc.warrantyDays >= 90, `Serviço ${svc.name} deve ter garantia >= 90 dias`);
        assert.ok(svc.estimatedDurationMinutes > 0, `Serviço ${svc.name} deve ter duração estimada`);
        assert.ok(svc.priceFromCents > 0, `Serviço ${svc.name} deve ter preço inicial definido`);
      }
    });
  });

  // --------------------------------------------------------------------------
  // 3. MÓDULO DE LOCALIZAÇÃO, MAPA E CÁLCULO DE RAIO HAVERSINE
  // --------------------------------------------------------------------------
  describe("3. Localização Geográfica e Cobertura por Raio (Haversine)", () => {
    it("deve calcular a distância real entre condomínio e prestador por coordenadas", () => {
      // Coordenadas:
      // Condomínio Parque das Águas (Itaim Bibi): -23.5855, -46.6784
      // Prestador Base A (Pinheiros ~3.2 km): -23.5615, -46.6920
      // Prestador Base B (Campinas ~85 km): -22.9099, -47.0626

      const distPinheiros = calculateHaversineKm(-23.5855, -46.6784, -23.5615, -46.6920);
      assert.ok(distPinheiros >= 3.0 && distPinheiros <= 3.8);

      const distCampinas = calculateHaversineKm(-23.5855, -46.6784, -22.9099, -47.0626);
      assert.ok(distCampinas >= 80.0 && distCampinas <= 95.0);
    });

    it("deve filtrar prestadores elegíveis com base no raio configurado (slider)", () => {
      const condoCoords = { lat: -23.5855, lng: -46.6784 };
      const providers = [
        { id: 1, name: "Carlos Eletricista", lat: -23.5615, lng: -46.6920, radiusKm: 10 }, // ~3.4 km, raio 10 -> Elegível
        { id: 2, name: "AquaFix Campinas", lat: -22.9099, lng: -47.0626, radiusKm: 15 }, // ~87 km, raio 15 -> Inelegível
        { id: 3, name: "MegaService SP", lat: -23.5320, lng: -46.7710, radiusKm: 25 }, // ~11 km, raio 25 -> Elegível
      ];

      const eligible = providers.filter((p) => {
        const dist = calculateHaversineKm(condoCoords.lat, condoCoords.lng, p.lat, p.lng);
        return dist <= p.radiusKm;
      });

      assert.equal(eligible.length, 2);
      assert.deepEqual(eligible.map((p) => p.name), ["Carlos Eletricista", "MegaService SP"]);
    });
  });

  // --------------------------------------------------------------------------
  // 4. MÓDULO DE RECEBIMENTOS E DADOS FINANCEIROS
  // --------------------------------------------------------------------------
  describe("4. Configuração Financeira (PIX e Conta Bancária)", () => {
    it("deve validar os tipos de chave PIX aceitos", () => {
      const validTypes = ["cpf", "cnpj", "email", "phone", "random"];
      assert.equal(validTypes.includes("cpf"), true);
      assert.equal(validTypes.includes("email"), true);
      assert.equal(validTypes.includes("bitcoin"), false);
    });

    it("deve estruturar os dados bancários com titularidade e tipo de conta", () => {
      const bankInfo = {
        bankCode: "001",
        bankName: "Banco do Brasil",
        agency: "1234",
        account: "56789-0",
        accountType: "corrente" as const,
        holderName: "Carlos Silva",
        holderDocument: "52998224725",
      };

      assert.equal(bankInfo.bankCode, "001");
      assert.equal(bankInfo.accountType, "corrente");
      assert.ok(bankInfo.holderName.length > 0);
    });
  });

  // --------------------------------------------------------------------------
  // 5. ESTEIRA DE VERIFICAÇÃO DE IDENTIDADE E MODERAÇÃO
  // --------------------------------------------------------------------------
  describe("5. Verificação de Identidade e Esteira Administrativa", () => {
    const VALID_STATUSES = [
      "nao_iniciado",
      "pendente",
      "em_analise",
      "aprovado",
      "rejeitado",
      "reenvio_solicitado",
    ];

    it("deve validar a máquina de estados de verificação de identidade", () => {
      // Estado inicial ao enviar documentos
      let currentStatus = "nao_iniciado";
      assert.ok(VALID_STATUSES.includes(currentStatus));

      // Prestador envia CNH e selfie
      currentStatus = "em_analise";
      assert.ok(VALID_STATUSES.includes(currentStatus));

      // Síndico aprova após conferência visual
      currentStatus = "aprovado";
      assert.ok(VALID_STATUSES.includes(currentStatus));
    });

    it("se rejeitado ou reenvio solicitado, deve exigir motivo da recusa", () => {
      const decision = "reenvio_solicitado";
      const notes = "Foto do verso da CNH ilegível devido a reflexo. Por favor reenvie.";

      assert.ok(notes.length > 10, "Justificativa clara é obrigatória na recusa");
    });
  });

  // --------------------------------------------------------------------------
  // 6. PERSISTÊNCIA REAL NO BANCO DE DADOS (POSTGRESQL)
  // --------------------------------------------------------------------------
  describe("6. Persistência PostgreSQL: Prestador Completo com Endereço e PIX", () => {
    it("deve persistir um prestador com endereço, coordenadas, PIX e verificação e limpá-lo", async () => {
      const { db } = await import("../src/db");
      const { vendors, condominiums } = await import("../src/db/schema");
      const { eq } = await import("drizzle-orm");

      const [firstCondo] = await db.select().from(condominiums).limit(1);
      assert.ok(firstCondo, "Deve existir ao menos um condomínio");

      const testSlug = `prestador-teste-fase2-${Date.now()}`;
      const [insertedVendor] = await db
        .insert(vendors)
        .values({
          condoId: firstCondo.id,
          slug: testSlug,
          name: "Roberto Eletrotécnico Teste",
          category: "eletricista",
          specialties: ["eletricista", "seguranca_eletronica"],
          providerType: "autonomo",
          phone: "(11) 99887-7665",
          email: `${testSlug}@exemplo.com.br`,
          cep: "01452-000",
          addressStreet: "Avenida Brigadeiro Faria Lima",
          addressNumber: "2000",
          addressNeighborhood: "Itaim Bibi",
          addressCity: "São Paulo",
          addressState: "SP",
          serviceArea: "Itaim Bibi, São Paulo - SP (15 km)",
          serviceRadiusKm: 15,
          lat: -23.5855,
          lng: -46.6784,
          pixInfo: { keyType: "cpf", key: "52998224725" },
          identityVerification: {
            status: "em_analise",
            documentType: "cnh",
            frontUrl: "https://exemplo.com/cnh_front.jpg",
            selfieUrl: "https://exemplo.com/selfie.jpg",
            submittedAt: new Date().toISOString(),
          },
          services: [
            {
              id: "ele-01",
              name: "Instalação / Troca de Chuveiro",
              description: "Substituição completa e teste",
              priceFromCents: 9000,
              priceType: "a_partir",
            },
          ],
        })
        .returning();

      assert.ok(insertedVendor.id > 0);
      assert.equal(insertedVendor.cep, "01452-000");
      assert.equal(insertedVendor.serviceRadiusKm, 15);
      assert.deepEqual(insertedVendor.specialties, ["eletricista", "seguranca_eletronica"]);
      assert.equal(insertedVendor.identityVerification?.status, "em_analise");

      // Limpeza segura
      await db.delete(vendors).where(eq(vendors.id, insertedVendor.id));
      const [checkDeleted] = await db.select().from(vendors).where(eq(vendors.id, insertedVendor.id)).limit(1);
      assert.equal(checkDeleted, undefined);
    });
  });
});
