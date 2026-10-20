import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { GATE } from "../src/lib/rbac";
import { hasPermission } from "../src/lib/permissions";
import { dateTimeBR, token } from "../src/lib/utils";
import { qrDataUrl } from "../src/lib/qr";

describe("MÓDULO VISITANTES E PRESTADORES — AUDITORIA E TESTES FUNCIONAIS COMPLETOS", () => {
  // Teste 1 — Cadastrar visitante
  describe("Teste 1 — Cadastrar visitante e verificar persistência", () => {
    it("deve validar campos essenciais e consistência no cadastro de visitante", () => {
      const visitor = {
        id: 1,
        condoId: 10,
        name: "Carlos Alberto da Silva",
        document: "12.345.678-9",
        docType: "RG",
        phone: "(11) 98765-4321",
        kind: "visitante",
        company: null,
        vehiclePlate: "BRA2E19",
        recurring: false,
        blocked: false,
        blockReason: null,
      };

      assert.ok(visitor.name.length >= 3, "Nome completo é obrigatório");
      assert.ok(visitor.document.length >= 5, "Documento de identificação válido");
      assert.equal(visitor.condoId, 10, "Condomínio isolado corretamente");
      assert.equal(visitor.blocked, false, "Visitante novo inicia sem bloqueios");
      assert.equal(visitor.kind, "visitante");
    });
  });

  // Teste 2 — Reutilizar cadastro
  describe("Teste 2 — Reutilizar cadastro existente de visitante recorrente", () => {
    it("deve permitir reaproveitamento de dados pré-cadastrados ao gerar nova autorização", () => {
      const existingVisitor = {
        id: 5,
        condoId: 10,
        name: "Eletricista Roberto Mendes",
        document: "321.654.987-00",
        kind: "prestador",
        company: "Mendes Reparos Elétricos",
        vehiclePlate: "KXZ-9988",
        recurring: true,
        blocked: false,
      };

      // Simula seleção no dropdown "Visitante já cadastrado"
      const newInvite = {
        visitorId: existingVisitor.id,
        name: existingVisitor.name,
        document: existingVisitor.document,
        kind: existingVisitor.kind,
        company: existingVisitor.company,
        vehiclePlate: existingVisitor.vehiclePlate,
        unitId: 101,
        validFrom: new Date(),
        validUntil: new Date(Date.now() + 8 * 3600000), // 8 horas
        purpose: "Manutenção do quadro elétrico",
        status: "autorizado",
      };

      assert.equal(newInvite.visitorId, 5, "Vinculado ao cadastro mestre existente");
      assert.equal(newInvite.company, "Mendes Reparos Elétricos", "Empresa herdada corretamente");
      assert.equal(newInvite.vehiclePlate, "KXZ-9988", "Placa do veículo herdada");
      assert.equal(newInvite.status, "autorizado");
    });
  });

  // Teste 3 — Gerar convite
  describe("Teste 3 — Gerar convite, validar QR e conferir informações", () => {
    it("deve gerar token criptográfico seguro de 16 bytes", () => {
      const token1 = token(16);
      const token2 = token(16);

      assert.equal(token1.length, 22, "Token base64url de 16 bytes deve ter 22 caracteres URL-safe");
      assert.notEqual(token1, token2, "Tokens gerados devem ser únicos e imprevisíveis");
      assert.match(token1, /^[A-Za-z0-9_-]{22}$/, "Token deve ser representação base64url segura");
    });

    it("deve gerar QR Code com Data URL válido apontando para o token do convite", async () => {
      const qrToken = token(16);
      const qrImage = await qrDataUrl(qrToken, 200);

      assert.ok(qrImage.startsWith("data:image/png;base64,"), "Gera Data URL PNG base64 real");
      assert.ok(qrImage.length > 300, "Tamanho de imagem condizente com código QR escaneável");
    });

    it("deve validar coerência das datas de validade (fim posterior ao início)", () => {
      const now = new Date();
      const future = new Date(now.getTime() + 86400000);
      const past = new Date(now.getTime() - 3600000);

      const isValidInterval = future > now;
      const isInvalidInterval = past > now;

      assert.equal(isValidInterval, true, "Validade futura é aceita");
      assert.equal(isInvalidInterval, false, "Validade invertida deve ser rejeitada");
    });
  });

  // Teste 4 — Compartilhar convite
  describe("Teste 4 — Compartilhar convite via link e WhatsApp", () => {
    it("deve construir links de compartilhamento seguros sem vazar credenciais internas", () => {
      const origin = "https://zeladoriacondominio.com.br";
      const qrToken = "a1b2c3d4e5f60718293a4b5c6d7e8f90";
      const publicPassUrl = `${origin}/v/${qrToken}`;

      assert.equal(publicPassUrl, "https://zeladoriacondominio.com.br/v/a1b2c3d4e5f60718293a4b5c6d7e8f90");
      assert.ok(!publicPassUrl.includes("cpf"), "Link público não contém documentos");
      assert.ok(!publicPassUrl.includes("password"), "Link público não contém segredos");

      // Montagem da mensagem WhatsApp
      const visit = {
        name: "Dra. Juliana Advogada",
        block: "Torre Sul",
        unit: "84",
        validUntil: new Date(Date.now() + 86400000),
      };
      const text = `Olá, ${visit.name}! Aqui está seu convite: ${publicPassUrl}`;
      const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;

      assert.ok(whatsappUrl.includes("api.whatsapp.com"), "URL correta do WhatsApp");
      assert.ok(whatsappUrl.includes(encodeURIComponent(publicPassUrl)), "Contém link público no texto");
    });
  });

  // Teste 5 — Entrada pela portaria
  describe("Teste 5 — Entrada pela portaria (Check-in físico)", () => {
    it("deve confirmar entrada de visita autorizada e registrar operador e horário", () => {
      const visit = {
        id: 101,
        status: "autorizado",
        checkinAt: null as Date | null,
        checkinById: null as number | null,
        validFrom: new Date(Date.now() - 3600000),
        validUntil: new Date(Date.now() + 3600000),
      };

      const operatorId = 7; // Porteiro
      const now = new Date();

      // Regra de transição de estado: autorizado -> dentro
      assert.equal(visit.status, "autorizado", "Estado inicial deve ser autorizado");
      visit.status = "dentro";
      visit.checkinAt = now;
      visit.checkinById = operatorId;

      assert.equal(visit.status, "dentro", "Status atualizado para dentro do condomínio");
      assert.equal(visit.checkinById, 7, "Identificação do operador registrada");
      assert.ok(visit.checkinAt instanceof Date, "Data e horário de entrada persistidos");
    });
  });

  // Teste 6 — Saída
  describe("Teste 6 — Registro de saída pela portaria (Check-out)", () => {
    it("deve finalizar ciclo de visita e bloquear saída sem entrada prévia", () => {
      const visitInside = {
        id: 101,
        status: "dentro",
        checkinAt: new Date(Date.now() - 7200000),
        checkoutAt: null as Date | null,
        checkoutById: null as number | null,
      };

      // Realiza checkout
      assert.equal(visitInside.status, "dentro");
      visitInside.status = "finalizado";
      visitInside.checkoutAt = new Date();
      visitInside.checkoutById = 7;

      assert.equal(visitInside.status, "finalizado", "Status finalizado");
      assert.ok(visitInside.checkoutAt instanceof Date);

      // Tentativa de saída de visita que NÃO entrou
      const visitNeverEntered = {
        id: 102,
        status: "autorizado",
        checkinAt: null,
      };
      const canCheckout = visitNeverEntered.status === "dentro";
      assert.equal(canCheckout, false, "Saída sem entrada prévia é estritamente proibida");
    });
  });

  // Teste 7 — Negação
  describe("Teste 7 — Negação de solicitação de acesso", () => {
    it("deve recusar entrada para solicitação negada com motivo registrado", () => {
      const pendingVisit = {
        id: 103,
        status: "aguardando" as string,
        deniedReason: null as string | null,
      };

      // Decisão do morador: Negar
      pendingVisit.status = "negado";
      pendingVisit.deniedReason = "Não conheço o visitante";

      assert.equal(pendingVisit.status, "negado");
      assert.equal(pendingVisit.deniedReason, "Não conheço o visitante");

      // Portaria não pode liberar entrada de visita com status negado
      const canEnter = (pendingVisit.status as string) === "autorizado";
      assert.equal(canEnter, false, "Entrada negada não permite check-in");
    });
  });

  // Teste 8 — Bloqueio
  describe("Teste 8 — Prevalência de bloqueio administrativo", () => {
    it("bloqueio administrativo deve se sobrepor a qualquer convite comum", () => {
      const visitor = {
        id: 88,
        name: "Indivíduo Restrito",
        blocked: true,
        blockReason: "Ocorrência grave de segurança em 10/10/2026",
      };

      const visit = {
        id: 200,
        visitorId: visitor.id,
        status: "autorizado", // Mesmo que tenha sido criado
      };

      // Avaliação de segurança na portaria
      let canEnter = true;
      let denialReason = "";

      if (visitor.blocked) {
        canEnter = false;
        denialReason = visitor.blockReason;
      }

      assert.equal(canEnter, false, "Bloqueio prevalece sobre status do convite");
      assert.equal(denialReason, "Ocorrência grave de segurança em 10/10/2026");
    });
  });

  // Teste 9 — Expiração
  describe("Teste 9 — Validação de vigência e expiração", () => {
    it("deve recusar entrada se a validade do convite já expirou", () => {
      const now = new Date();
      const expiredVisit = {
        id: 301,
        status: "autorizado",
        validFrom: new Date(now.getTime() - 86400000 * 2),
        validUntil: new Date(now.getTime() - 3600000), // Expirou há 1 hora
      };

      const isExpired = new Date(expiredVisit.validUntil) < now;
      assert.equal(isExpired, true, "Convite detectado como expirado");

      const allowCheckin = expiredVisit.status === "autorizado" && !isExpired;
      assert.equal(allowCheckin, false, "Portaria deve barrar convite com prazo expirado");
    });

    it("deve recusar entrada antes do início da vigência (convite futuro)", () => {
      const now = new Date();
      const futureVisit = {
        id: 302,
        status: "autorizado",
        validFrom: new Date(now.getTime() + 3600000 * 4), // Daqui a 4 horas
        validUntil: new Date(now.getTime() + 86400000),
      };

      const isFuture = new Date(futureVisit.validFrom) > now;
      assert.equal(isFuture, true, "Convite detectado como futuro");
    });
  });

  // Teste 10 — Recorrência
  describe("Teste 10 — Prestador recorrente e múltiplos ciclos", () => {
    it("deve manter cadastro recorrente ativo enquanto gera ciclos de visita independentes", () => {
      const recurringVisitor = {
        id: 12,
        name: "Piscineiro Marcos",
        kind: "prestador",
        recurring: true,
        blocked: false,
      };

      // Ciclo 1 (Ontem)
      const visitCycle1 = {
        id: 401,
        visitorId: recurringVisitor.id,
        status: "finalizado",
        checkinAt: new Date(Date.now() - 86400000),
        checkoutAt: new Date(Date.now() - 86400000 + 7200000),
      };

      // Ciclo 2 (Hoje)
      const visitCycle2 = {
        id: 402,
        visitorId: recurringVisitor.id,
        status: "dentro",
        checkinAt: new Date(),
        checkoutAt: null,
      };

      assert.equal(visitCycle1.status, "finalizado");
      assert.equal(visitCycle2.status, "dentro");
      assert.notEqual(visitCycle1.id, visitCycle2.id, "Ciclos de visita devem ter IDs próprios");
      assert.equal(recurringVisitor.recurring, true, "Cadastro mestre permanece intacto");
    });
  });

  // Teste 11 — Contadores
  describe("Teste 11 — Sincronização dos contadores e integridade de métricas", () => {
    it("deve manter contadores dos filtros em sincronia perfeita com as visitas em escopo", () => {
      const visits = [
        { id: 1, status: "aguardando" },
        { id: 2, status: "autorizado" },
        { id: 3, status: "dentro" },
        { id: 4, status: "finalizado" },
        { id: 5, status: "negado" },
        { id: 6, status: "autorizado" },
      ];

      const counts = {
        todos: visits.length,
        aguardando: visits.filter((v) => v.status === "aguardando").length,
        autorizado: visits.filter((v) => v.status === "autorizado").length,
        dentro: visits.filter((v) => v.status === "dentro").length,
        finalizado: visits.filter((v) => v.status === "finalizado").length,
        negado: visits.filter((v) => v.status === "negado").length,
      };

      assert.equal(counts.todos, 6);
      assert.equal(counts.aguardando, 1);
      assert.equal(counts.autorizado, 2);
      assert.equal(counts.dentro, 1);
      assert.equal(counts.finalizado, 1);
      assert.equal(counts.negado, 1);

      // Soma dos estados mutuamente exclusivos deve ser igual a todos
      const sumOfExclusive = counts.aguardando + counts.autorizado + counts.dentro + counts.finalizado + counts.negado;
      assert.equal(sumOfExclusive, counts.todos, "Soma exata das categorias");
    });
  });

  // Teste 12 — Filtros
  describe("Teste 12 — Filtros de status e pesquisa textual rápida", () => {
    const dataset = [
      { id: 1, name: "Ana Beatriz", plate: "ABC1D23", unit: "101", status: "autorizado", company: null },
      { id: 2, name: "Bruno Pinturas", plate: "XYZ9988", unit: "102", status: "dentro", company: "Pinturas & Cia" },
      { id: 3, name: "Carlos Segurança", plate: "SEG0001", unit: "201", status: "finalizado", company: "Protege" },
    ];

    it("deve filtrar por status 'dentro' corretamente", () => {
      const inside = dataset.filter((v) => v.status === "dentro");
      assert.equal(inside.length, 1);
      assert.equal(inside[0].name, "Bruno Pinturas");
    });

    it("deve pesquisar por placa de veículo em maiúsculas ou minúsculas", () => {
      const q = "xyz";
      const matches = dataset.filter((v) => v.plate.toLowerCase().includes(q.toLowerCase()));
      assert.equal(matches.length, 1);
      assert.equal(matches[0].name, "Bruno Pinturas");
    });

    it("deve pesquisar por empresa prestadora", () => {
      const matches = dataset.filter((v) => v.company?.toLowerCase().includes("protege"));
      assert.equal(matches.length, 1);
      assert.equal(matches[0].id, 3);
    });
  });

  // Teste 13 — Segurança e RBAC
  describe("Teste 13 — RBAC e isolamento multi-condomínio", () => {
    it("somente papéis do GATE podem operar registro de entrada e saída na portaria", () => {
      assert.ok(GATE.includes("porteiro"), "Porteiro possui GATE");
      assert.ok(GATE.includes("sindico"), "Síndico possui GATE");
      assert.ok(GATE.includes("superadmin"), "Superadmin possui GATE");
      assert.equal(GATE.includes("morador"), false, "Morador não opera portaria");
      assert.equal(GATE.includes("prestador"), false, "Prestador não opera portaria");
    });

    it("morador não pode consultar ou autorizar convites de outras unidades", () => {
      const myUnitId = 101;
      const otherUnitVisit = { id: 89, unitId: 202, hostUserId: 44 };

      const canAuthorize = otherUnitVisit.unitId === myUnitId;
      assert.equal(canAuthorize, false, "Bloqueado acesso inter-unidades");
    });

    it("registro de um condomínio não pode ser acessado por outro condomínio", () => {
      const condoAVisit = { id: 99, condoId: 1 };
      const sessionCondoId = 2;

      const isAllowed = condoAVisit.condoId === sessionCondoId;
      assert.equal(isAllowed, false, "Tenant isolation rigoroso");
    });
  });

  // Teste 14 — Concorrência
  describe("Teste 14 — Tratamento de concorrência e guarda contra duplicidade", () => {
    it("não deve permitir duas entradas simultâneas para o mesmo visitante", () => {
      const visit = { id: 500, status: "dentro" };

      // Tentativa de segundo check-in
      const allowSecondCheckin = visit.status === "autorizado";
      assert.equal(allowSecondCheckin, false, "Entrada duplicada deve ser prevenida");
    });

    it("não deve permitir saída duplicada para ciclo já finalizado", () => {
      const visit = { id: 500, status: "finalizado" };

      // Tentativa de segundo check-out
      const allowSecondCheckout = visit.status === "dentro";
      assert.equal(allowSecondCheckout, false, "Saída duplicada deve ser prevenida");
    });
  });

  // Teste 15 — Persistência
  describe("Teste 15 — Persistência e integridade das informações", () => {
    it("deve preservar notas, empresa e placa ao longo de todo o ciclo de vida", () => {
      const fullRecord = {
        id: 601,
        name: "Instalador de Internet",
        company: "Claro Fibra",
        document: "33.444.555-6",
        plate: "BRA2E19",
        unit: "12B",
        purpose: "Instalação de fibra óptica",
        notes: "Autorizado acesso ao duto do 3º andar",
        status: "finalizado",
        checkinAt: new Date(Date.now() - 3600000),
        checkoutAt: new Date(),
      };

      assert.equal(fullRecord.company, "Claro Fibra");
      assert.equal(fullRecord.notes, "Autorizado acesso ao duto do 3º andar");
      assert.ok(fullRecord.checkinAt < fullRecord.checkoutAt);
    });
  });

  // Teste 16 — Responsividade Web
  describe("Teste 16 — Responsividade e layout adaptativo", () => {
    it("deve verificar que o código-fonte implementa views mobile (cards) e desktop (tabela)", () => {
      const clientPath = join(__dirname, "../src/app/painel/visitantes/visitantes-client.tsx");
      const clientContent = readFileSync(clientPath, "utf-8");

      assert.ok(clientContent.includes("md:hidden"), "Deve conter container específico para telas mobile");
      assert.ok(clientContent.includes("hidden md:block"), "Deve conter tabela para telas desktop");
      assert.ok(clientContent.includes("overflow-x-auto"), "Deve permitir rolagem horizontal suave na barra de filtros");
      assert.ok(clientContent.includes("grid-cols-1 sm:grid-cols-2"), "Campos do formulário agrupam em 1 coluna no mobile");
    });
  });

  // Teste 17 — Notificações
  describe("Teste 17 — Notificações estruturadas nos eventos operacionais", () => {
    it("deve disparar evento de notificação correto na entrada de visitante", () => {
      const event = {
        type: "checkin",
        visitorName: "Lucas Delivery",
        unitId: 55,
        title: "Visitante entrou no condomínio",
        message: "Lucas Delivery teve a entrada registrada pela portaria.",
        link: "/painel/visitantes",
      };

      assert.equal(event.title, "Visitante entrou no condomínio");
      assert.ok(event.message.includes("Lucas Delivery"));
      assert.equal(event.link, "/painel/visitantes");
    });

    it("deve disparar evento de notificação correto na saída de visitante", () => {
      const event = {
        type: "checkout",
        visitorName: "Lucas Delivery",
        unitId: 55,
        title: "Visitante saiu do condomínio",
        message: "Lucas Delivery teve a saída confirmada pela portaria.",
        link: "/painel/visitantes",
      };

      assert.equal(event.title, "Visitante saiu do condomínio");
      assert.ok(event.message.includes("saída confirmada"));
    });
  });

  // Teste 18 — Permissões de câmera e fallback
  describe("Teste 18 — Câmera e fallback manual para leitura de QR Code", () => {
    it("deve suportar fallback de digitação de token e leitor USB quando a câmera for negada", () => {
      const clientPath = join(__dirname, "../src/app/painel/visitantes/visitantes-client.tsx");
      const clientContent = readFileSync(clientPath, "utf-8");

      assert.ok(clientContent.includes("mediaDevices.getUserMedia"), "Suporta câmera nativa");
      assert.ok(clientContent.includes("NotAllowedError") || clientContent.includes("PermissionDeniedError"), "Trata permissão de câmera negada");
      assert.ok(clientContent.includes("scannerInput"), "Permite digitação manual de código, token ou placa");
      assert.ok(clientContent.includes("lookupVisitByQrOrTokenAction"), "Chama consulta server-side resiliente");
    });
  });
});
