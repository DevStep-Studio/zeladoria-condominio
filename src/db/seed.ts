import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { ensureDatabase } from "@/db/setup";
import {
  agendaEvents,
  amenities,
  announcements,
  assemblies,
  assemblyAgenda,
  assemblyAttendance,
  assemblyMinuteVersions,
  assemblyMinutes,
  assemblyVotes,
  assets,
  auditLogs,
  blocks,
  budgets,
  charges,
  condominiums,
  contracts,
  documents,
  helpArticles,
  importJobs,
  lostItems,
  maintenanceOrders,
  maintenancePlans,
  memberships,
  moveRequests,
  notifications,
  occurrenceComments,
  occurrences,
  parcels,
  pollOptions,
  pollVotes,
  polls,
  reservations,
  shifts,
  supportTickets,
  ticketComments,
  tickets,
  transactions,
  units,
  users,
  vendors,
  visitors,
  visits,
} from "@/db/schema";
import { randomBytes, scryptSync } from "node:crypto";
import { isoDate, pickupCode, sequence, token } from "@/lib/utils";

function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 32).toString("hex");
  return `${salt}:${hash}`;
}

let seeding: Promise<void> | null = null;

function at(daysOffset: number, hour = 9, minute = 0) {
  const d = new Date();
  d.setDate(d.getDate() + daysOffset);
  d.setHours(hour, minute, 0, 0);
  return d;
}

function day(offset: number) {
  return isoDate(at(offset));
}

export async function ensureSeed() {
  if (seeding) return seeding;
  seeding = (async () => {
    try {
      await ensureDatabase();
      const [row] = await db.select({ n: sql<number>`count(*)::int` }).from(condominiums);
      if (Number(row?.n ?? 0) === 0) {
        await seed();
      }

      // Garantir que a conta do prestador Carlos existe
      const [existingCarlos] = await db
        .select()
        .from(users)
        .where(eq(users.email, "carlos@eletrica.com.br"))
        .limit(1);

      if (!existingCarlos) {
        const pass = hashPassword("demo1234");
        const [newCarlos] = await db
          .insert(users)
          .values({
            name: "Carlos Eduardo Silva",
            email: "carlos@eletrica.com.br",
            passwordHash: pass,
            phone: "(41) 99111-2233",
            lastLoginAt: new Date(),
            firstAccessAt: new Date(),
          })
          .returning();

        if (newCarlos) {
          const [carlosVendor] = await db
            .select()
            .from(vendors)
            .where(eq(vendors.slug, "carlos-eletrica"))
            .limit(1);

          if (carlosVendor) {
            await db
              .update(vendors)
              .set({ userId: newCarlos.id })
              .where(eq(vendors.id, carlosVendor.id));
          }
        }
      }
    } catch (error) {
      seeding = null;
      console.warn("seed skipped:", error);
    }
  })();
  return seeding;
}

async function seed() {
  const pass = hashPassword("demo1234");

  const [condoA, condoB] = await db
    .insert(condominiums)
    .values([
      {
        name: "Residencial Parque das Águas",
        slug: "parque-das-aguas",
        cnpj: "12.345.678/0001-90",
        address: "Av. das Nações, 1200",
        city: "Curitiba",
        state: "PR",
        plan: "enterprise",
        modules: ["portaria", "financeiro", "assembleias", "manutencao"],
        onboardingStep: 9,
        onboardingDone: true,
        storageUsedMb: 1840,
        latitude: -23.5855,
        longitude: -46.6784,
      },
      {
        name: "Edifício Vista Marina",
        slug: "vista-marina",
        cnpj: "98.765.432/0001-10",
        address: "Rua Beira Mar, 45",
        city: "Florianópolis",
        state: "SC",
        plan: "pro",
        modules: ["portaria", "assembleias"],
        onboardingStep: 4,
        onboardingDone: false,
        storageUsedMb: 240,
        latitude: -27.5954,
        longitude: -48.5480,
      },
    ])
    .returning();

  const blockRows = await db
    .insert(blocks)
    .values([
      { condoId: condoA.id, name: "Bloco A", floors: 8 },
      { condoId: condoA.id, name: "Bloco B", floors: 8 },
      { condoId: condoA.id, name: "Bloco C", floors: 4 },
      { condoId: condoB.id, name: "Torre Única", floors: 12 },
    ])
    .returning();

  const unitValues: (typeof units.$inferInsert)[] = [];
  for (const block of blockRows) {
    const perFloor = block.condoId === condoA.id ? 4 : 2;
    const floors = block.condoId === condoA.id ? 4 : 6;
    for (let f = 1; f <= floors; f++) {
      for (let u = 1; u <= perFloor; u++) {
        unitValues.push({
          condoId: block.condoId,
          blockId: block.id,
          number: `${f}0${u}`,
          floor: f,
          fraction: (0.9 + u * 0.05).toFixed(2),
          kind: "apartamento",
          status: f === 4 && u === 4 ? "vaga" : "ocupada",
          parkingSpots: u % 2 === 0 ? 2 : 1,
        });
      }
    }
  }
  const unitRows = await db.insert(units).values(unitValues).returning();
  const unitsA = unitRows.filter((u) => u.condoId === condoA.id);
  const A302 = unitsA.find((u) => u.number === "302" && u.blockId === blockRows[0].id) ?? unitsA[0];
  const A201 = unitsA.find((u) => u.number === "201" && u.blockId === blockRows[0].id) ?? unitsA[1];
  const B101 = unitsA.find((u) => u.blockId === blockRows[1].id) ?? unitsA[2];

  const userRows = await db
    .insert(users)
    .values([
      {
        name: "Rafael Monteiro",
        email: "admin@portariamais.com.br",
        passwordHash: pass,
        isSuperAdmin: true,
        phone: "(41) 99999-0001",
        document: "010.223.445-90",
        emergencyContacts: [{ name: "Central de Suporte", phone: "(41) 3000-0001", relationship: "Operações" }],
        vehicles: [{ plate: "ADM-9988", model: "Toyota Corolla Preto", color: "Preto", parkingSpot: "G1-01" }],
        lastLoginAt: at(-1, 8),
      },
      {
        name: "Marina Duarte",
        email: "sindico@portariamais.com.br",
        passwordHash: pass,
        phone: "(41) 99888-1122",
        document: "882.331.220-11",
        emergencyContacts: [{ name: "Roberto Duarte (Esposo)", phone: "(41) 99888-1133", relationship: "Cônjuge" }],
        vehicles: [{ plate: "SIN-2026", model: "Jeep Renegade Prata", color: "Prata", parkingSpot: "A-12" }],
        lastLoginAt: at(0, 7),
        firstAccessAt: at(-120),
      },
      { name: "Carlos Nogueira", email: "portaria@portariamais.com.br", passwordHash: pass, phone: "(41) 99777-3344", lastLoginAt: at(0, 6), firstAccessAt: at(-90) },
      { name: "Rita Bezerra", email: "portaria2@portariamais.com.br", passwordHash: pass, phone: "(41) 99777-5566", lastLoginAt: at(-1, 22), firstAccessAt: at(-88) },
      { name: "Jonas Alencar", email: "zelador@portariamais.com.br", passwordHash: pass, phone: "(41) 99666-1010", lastLoginAt: at(-2, 10), firstAccessAt: at(-70) },
      { name: "Helena Prado", email: "conselho@portariamais.com.br", passwordHash: pass, phone: "(41) 99555-2020", lastLoginAt: at(-3, 19), firstAccessAt: at(-65) },
      {
        name: "Ana Ribeiro",
        email: "morador@portariamais.com.br",
        passwordHash: pass,
        phone: "(41) 98888-7070",
        document: "455.221.980-04",
        emergencyContacts: [
          { name: "Marcos Ribeiro (Irmão)", phone: "(41) 98888-7071", relationship: "Irmão" },
          { name: "Dra. Beatriz Santos (Médica)", phone: "(41) 98877-1234", relationship: "Contato Médico" },
        ],
        dependents: [
          { name: "Lucas Ribeiro", relationship: "Filho", birthDate: "2016-04-12" },
          { name: "Camila Ribeiro", relationship: "Filha", birthDate: "2019-09-25" },
        ],
        vehicles: [
          { plate: "ABC-1234", model: "Honda Civic Sedan", color: "Cinza Chumbo", parkingSpot: "A-302" },
          { plate: "XYZ-9876", model: "Vespa Elétrica", color: "Branco", parkingSpot: "A-302 (M)" },
        ],
        lastLoginAt: at(0, 8),
        firstAccessAt: at(-60),
      },
      { name: "Bruno Tavares", email: "bruno@portariamais.com.br", passwordHash: pass, phone: "(41) 98777-6060", lastLoginAt: at(-5, 20), firstAccessAt: at(-40) },
      { name: "Clara Souza", email: "clara@portariamais.com.br", passwordHash: pass, phone: "(41) 98666-5050", status: "convidado" },
      { name: "Diego Martins", email: "diego@portariamais.com.br", passwordHash: pass, phone: "(41) 98555-4040", status: "convidado" },
      { name: "Eduarda Lima", email: "eduarda@portariamais.com.br", passwordHash: pass, lastLoginAt: at(-12, 15), firstAccessAt: at(-30) },
      { name: "Sérgio Bastos", email: "sindico.marina@portariamais.com.br", passwordHash: pass, phone: "(48) 99444-3030", lastLoginAt: at(-4, 11), firstAccessAt: at(-20) },
    ])
    .returning();

  const [admin, sindica, porteiro1, porteiro2, zelador, conselheira, moradorA, moradorB, convidada, convidado2, moradoraE, sindicoB] = userRows;

  await db.insert(memberships).values([
    { userId: sindica.id, condoId: condoA.id, role: "sindico", acceptedAt: at(-120) },
    { userId: porteiro1.id, condoId: condoA.id, role: "porteiro", acceptedAt: at(-90) },
    { userId: porteiro2.id, condoId: condoA.id, role: "porteiro", acceptedAt: at(-88) },
    { userId: zelador.id, condoId: condoA.id, role: "zelador", acceptedAt: at(-70) },
    { userId: conselheira.id, condoId: condoA.id, role: "conselho", unitId: unitsA[5].id, acceptedAt: at(-65) },
    { userId: moradorA.id, condoId: condoA.id, role: "morador", unitId: A302.id, relation: "proprietario", acceptedAt: at(-60) },
    { userId: moradorB.id, condoId: condoA.id, role: "morador", unitId: B101.id, relation: "inquilino", acceptedAt: at(-40) },
    { userId: convidada.id, condoId: condoA.id, role: "morador", unitId: A201.id, status: "convidado", invitedAt: at(-6) },
    { userId: convidado2.id, condoId: condoA.id, role: "morador", unitId: unitsA[7].id, status: "convidado", invitedAt: at(-2) },
    { userId: moradoraE.id, condoId: condoA.id, role: "morador", unitId: unitsA[9].id, acceptedAt: at(-30) },
    { userId: admin.id, condoId: condoA.id, role: "superadmin", acceptedAt: at(-200) },
    { userId: sindicoB.id, condoId: condoB.id, role: "sindico", acceptedAt: at(-20) },
    { userId: sindica.id, condoId: condoB.id, role: "conselho", acceptedAt: at(-18) },
  ]);

  /* ------------------------------------------------------------ portaria */
  const visitorRows = await db
    .insert(visitors)
    .values([
      { condoId: condoA.id, name: "Paulo Henrique Dias", document: "021.334.556-70", phone: "(41) 98111-2233", kind: "visitante" },
      { condoId: condoA.id, name: "Fernanda Rocha", document: "882.114.223-01", phone: "(41) 98122-4455", kind: "visitante" },
      { condoId: condoA.id, name: "Marcelo Prestes", document: "551.220.334-88", kind: "prestador", company: "Clean Vidros Ltda", recurring: true, vehiclePlate: "AZR-4H12" },
      { condoId: condoA.id, name: "Luciana Prado", document: "334.220.115-90", kind: "prestador", company: "Pet Care Curitiba", recurring: true },
      { condoId: condoA.id, name: "João Vitor Alves", document: "110.554.332-19", kind: "entrega", company: "Rapidex Log" },
      { condoId: condoA.id, name: "Roberto Camargo", document: "998.221.334-55", kind: "visitante", blocked: true, blockReason: "Desacato à equipe de portaria em 12/03. Entrada apenas com autorização do síndico." },
      { condoId: condoA.id, name: "Simone Faria", document: "445.998.221-33", kind: "prestador", company: "Diarista autônoma", recurring: true },
      { condoId: condoA.id, name: "Equipe Elevatec", document: "22.334.556/0001-77", docType: "CNPJ", kind: "prestador", company: "Elevatec Manutenção", recurring: true, vehiclePlate: "QPD-2C34" },
    ])
    .returning();

  await db.insert(visits).values([
    {
      condoId: condoA.id, visitorId: visitorRows[0].id, unitId: A302.id, hostUserId: moradorA.id, purpose: "Visita familiar",
      status: "dentro", qrToken: token(), validFrom: at(0, 8), validUntil: at(0, 23), authorizedById: moradorA.id, authorizedAt: at(0, 8),
      checkinAt: at(0, 14), checkinById: porteiro1.id, createdById: moradorA.id,
    },
    {
      condoId: condoA.id, visitorId: visitorRows[1].id, unitId: A302.id, hostUserId: moradorA.id, purpose: "Jantar",
      status: "autorizado", qrToken: token(), validFrom: at(0, 12), validUntil: at(1, 2), authorizedById: moradorA.id, authorizedAt: at(0, 9), createdById: moradorA.id,
    },
    {
      condoId: condoA.id, visitorId: visitorRows[2].id, unitId: B101.id, hostUserId: moradorB.id, purpose: "Limpeza de vidros",
      status: "aguardando", qrToken: token(), validFrom: at(0, 7), validUntil: at(2, 18), createdById: porteiro1.id,
    },
    {
      condoId: condoA.id, visitorId: visitorRows[3].id, unitId: A302.id, hostUserId: moradorA.id, purpose: "Passeio com o pet",
      status: "autorizado", qrToken: token(), validFrom: at(0, 6), validUntil: at(7, 20), authorizedById: moradorA.id, authorizedAt: at(-1, 20), createdById: moradorA.id,
    },
    {
      condoId: condoA.id, visitorId: visitorRows[4].id, unitId: B101.id, hostUserId: moradorB.id, purpose: "Entrega de móvel",
      status: "finalizado", qrToken: token(), validFrom: at(-1, 8), validUntil: at(-1, 18), authorizedById: moradorB.id, authorizedAt: at(-1, 8),
      checkinAt: at(-1, 10), checkinById: porteiro2.id, checkoutAt: at(-1, 11, 30), checkoutById: porteiro2.id, createdById: porteiro2.id,
    },
    {
      condoId: condoA.id, visitorId: visitorRows[6].id, unitId: A201.id, purpose: "Serviço doméstico semanal",
      status: "finalizado", qrToken: token(), validFrom: at(-2, 7), validUntil: at(-2, 18), authorizedById: sindica.id, authorizedAt: at(-2, 7),
      checkinAt: at(-2, 8), checkinById: porteiro1.id, checkoutAt: at(-2, 17), checkoutById: porteiro1.id, createdById: porteiro1.id,
    },
    {
      condoId: condoA.id, visitorId: visitorRows[5].id, unitId: A302.id, purpose: "Visita não anunciada",
      status: "negado", qrToken: token(), validFrom: at(-3, 19), validUntil: at(-3, 22), deniedReason: "Visitante consta na lista de bloqueio.", createdById: porteiro2.id,
    },
    {
      condoId: condoA.id, visitorId: visitorRows[7].id, purpose: "Manutenção preventiva dos elevadores",
      status: "dentro", qrToken: token(), validFrom: at(0, 7), validUntil: at(0, 19), authorizedById: sindica.id, authorizedAt: at(-1, 16),
      checkinAt: at(0, 8, 10), checkinById: porteiro1.id, createdById: sindica.id, vehiclePlate: "QPD-2C34",
    },
  ]);

  await db.insert(parcels).values([
    { condoId: condoA.id, unitId: A302.id, code: sequence("ENC", 1), carrier: "Correios", trackingCode: "BR992134556BR", description: "Caixa média", shelf: "Prateleira A2", pickupCode: pickupCode(), receivedById: porteiro1.id, receivedAt: at(0, 10) },
    { condoId: condoA.id, unitId: A302.id, code: sequence("ENC", 2), kind: "correspondencia", carrier: "Correios", description: "Correspondência bancária", shelf: "Escaninho 302", pickupCode: pickupCode(), receivedById: porteiro1.id, receivedAt: at(-1, 11) },
    { condoId: condoA.id, unitId: B101.id, code: sequence("ENC", 3), carrier: "Mercado Livre", trackingCode: "ML-778213", description: "Pacote grande - eletrodoméstico", shelf: "Depósito", pickupCode: pickupCode(), receivedById: porteiro2.id, receivedAt: at(-4, 15) },
    { condoId: condoA.id, unitId: A201.id, code: sequence("ENC", 4), carrier: "Shopee", description: "Envelope acolchoado", shelf: "Prateleira B1", pickupCode: pickupCode(), receivedById: porteiro1.id, receivedAt: at(-9, 9) },
    { condoId: condoA.id, unitId: unitsA[5].id, code: sequence("ENC", 5), carrier: "Amazon", description: "Livros", shelf: "Prateleira A1", pickupCode: pickupCode(), status: "entregue", receivedById: porteiro2.id, receivedAt: at(-6, 14), pickedUpAt: at(-5, 19), pickedUpBy: "Helena Prado", pickedUpDocument: "334.221.110-98", signature: "Helena Prado" },
    { condoId: condoA.id, unitId: B101.id, code: sequence("ENC", 6), kind: "delivery", carrier: "iFood", description: "Pedido de comida", pickupCode: pickupCode(), status: "entregue", receivedById: porteiro1.id, receivedAt: at(-1, 20), pickedUpAt: at(-1, 20, 12), pickedUpBy: "Bruno Tavares", signature: "Bruno Tavares" },
    { condoId: condoA.id, unitId: unitsA[9].id, code: sequence("ENC", 7), carrier: "Jadlog", description: "Caixa pequena", shelf: "Prateleira C3", pickupCode: pickupCode(), receivedById: porteiro2.id, receivedAt: at(-13, 16) },
  ]);

  const shiftRows = await db
    .insert(shifts)
    .values([
      { condoId: condoA.id, userId: porteiro2.id, period: "noite", status: "encerrado", startedAt: at(-1, 22), endedAt: at(0, 6), handoverToId: porteiro1.id, handoverNotes: "Portão social com ruído no motor. Chaves do salão conferidas. Ronda 03h sem intercorrências.", pendingItems: "Aguardando retirada de 3 encomendas antigas.", checklist: { radios: true, chaves: true, cameras: true, extintores: false, interfone: true } },
      { condoId: condoA.id, userId: porteiro1.id, period: "manha", status: "aberto", startedAt: at(0, 6), checklist: { radios: true, chaves: true, cameras: true, extintores: true, interfone: true } },
      { condoId: condoA.id, userId: porteiro1.id, period: "tarde", status: "encerrado", startedAt: at(-2, 14), endedAt: at(-2, 22), handoverToId: porteiro2.id, handoverNotes: "Obra do 402 encerrada às 17h. Elevador de serviço liberado.", checklist: { radios: true, chaves: true, cameras: true, extintores: true, interfone: true } },
    ])
    .returning();

  const occurrenceRows = await db.insert(occurrences).values([
    {
      condoId: condoA.id,
      shiftId: shiftRows[1].id,
      code: sequence("OC", 101),
      visibility: "publica",
      category: "portao",
      severity: "alta",
      status: "em_execucao",
      title: "Portão social da garagem travando na abertura",
      description: "Motor do portão principal do Bloco A está superaquecendo e parando no meio do curso.",
      exactLocation: "Entrada da Garagem - Portão G1",
      latitude: -23.5858,
      longitude: -46.6787,
      actionsTaken: "Acionada a empresa Portec para envio de técnico em caráter de urgência.",
      occurredAt: at(0, 7, 40),
      reportedById: porteiro1.id,
      assignedToId: zelador.id,
      estimatedDeadline: at(1, 18),
    },
    {
      condoId: condoA.id,
      shiftId: shiftRows[0].id,
      code: sequence("OC", 102),
      visibility: "publica",
      category: "ruido",
      severity: "baixa",
      status: "resolvida",
      title: "Ruído excessivo no salão de festas após horário limite",
      description: "Música em volume elevado após as 22h00 durante confraternização.",
      exactLocation: "Salão de Festas Principal",
      latitude: -23.5851,
      longitude: -46.6781,
      actionsTaken: "Contato telefônico efetuado com a moradora responsável; som normalizado às 22h15.",
      occurredAt: at(-1, 22, 10),
      reportedById: porteiro2.id,
      unitId: A201.id,
      ackById: sindica.id,
      ackAt: at(0, 9),
      resolvedAt: at(-1, 22, 30),
      residentRating: 5,
      residentComment: "Atendimento cortês e rápido da portaria.",
    },
    {
      condoId: condoA.id,
      shiftId: shiftRows[0].id,
      code: sequence("OC", 103),
      visibility: "sigilosa",
      category: "seguranca",
      severity: "urgente",
      status: "em_analise",
      title: "Tentativa de acesso por pessoa não cadastrada",
      description: "Indivíduo tentou ingressar pela clausura acompanhando veículo de morador.",
      exactLocation: "Portaria Principal - Eclusa de Pedestres",
      latitude: -23.5854,
      longitude: -46.6791,
      actionsTaken: "Acesso bloqueado imediatamente pela portaria e gravação das câmeras isolada para auditoria.",
      occurredAt: at(-1, 23, 20),
      reportedById: porteiro2.id,
      ackById: sindica.id,
      ackAt: at(0, 8, 30),
    },
    {
      condoId: condoA.id,
      shiftId: shiftRows[2].id,
      code: sequence("OC", 104),
      visibility: "publica",
      category: "vazamento",
      severity: "alta",
      status: "em_execucao",
      title: "Gotejamento contínuo na tubulação do subsolo",
      description: "Identificado vazamento de água limpa próximo à bomba de recalque 2.",
      exactLocation: "Subsolo 1 - Casa de Máquinas",
      latitude: -23.5859,
      longitude: -46.6783,
      actionsTaken: "Válvula secundária fechada e empresa de manutenção hidráulica notificada.",
      occurredAt: at(-2, 16),
      reportedById: zelador.id,
      assignedToId: zelador.id,
      estimatedDeadline: at(2, 12),
    },
    {
      condoId: condoA.id,
      code: sequence("OC", 105),
      visibility: "publica",
      category: "iluminacao",
      severity: "baixa",
      status: "recebida",
      title: "Lâmpadas queimadas no hall dos elevadores do 3º andar",
      description: "Duas lâmpadas de LED apagadas, deixando o corredor escuro.",
      exactLocation: "Bloco A - Pavimento 3",
      latitude: -23.5852,
      longitude: -46.6778,
      occurredAt: at(0, 9, 15),
      reportedById: moradorA.id,
      unitId: A302.id,
    },
    {
      condoId: condoA.id,
      code: sequence("OC", 106),
      visibility: "publica",
      category: "elevador",
      severity: "alta",
      status: "em_execucao",
      title: "Elevador Social Torre B com desnível na parada",
      description: "Cabine parando cerca de 5cm abaixo do nível do piso no 5º andar.",
      exactLocation: "Bloco B - Torre 2",
      latitude: -23.5856,
      longitude: -46.6779,
      occurredAt: at(-1, 14, 20),
      reportedById: moradorB.id,
      assignedToId: zelador.id,
    },
    {
      condoId: condoA.id,
      code: sequence("OC", 107),
      visibility: "publica",
      category: "limpeza",
      severity: "baixa",
      status: "resolvida",
      title: "Mancha de óleo na vaga de garagem 104",
      description: "Derramamento de fluido de freio na vaga descoberta.",
      exactLocation: "Garagem Externa - Vaga 104",
      latitude: -23.5861,
      longitude: -46.6786,
      occurredAt: at(-3, 10, 0),
      reportedById: porteiro1.id,
      resolvedAt: at(-3, 16, 0),
    },
    {
      condoId: condoA.id,
      code: sequence("OC", 108),
      visibility: "publica",
      category: "piscina",
      severity: "media",
      status: "recebida",
      title: "Aquecedor da piscina com baixa vazão",
      description: "Temperatura da água abaixo do programado para o fim de semana.",
      exactLocation: "Área de Lazer - Deck da Piscina",
      latitude: -23.5862,
      longitude: -46.6780,
      occurredAt: at(0, 11, 30),
      reportedById: conselheira.id,
    },
  ]).returning();

  await db.insert(occurrenceComments).values([
    {
      occurrenceId: occurrenceRows[0].id,
      userId: zelador.id,
      body: "Verifiquei os sensores ópticos do portão. O problema é na placa controladora do motor.",
    },
    {
      occurrenceId: occurrenceRows[0].id,
      userId: sindica.id,
      body: "Chamado técnico autorizado com a Portec sob protocolo 99281.",
      internal: true,
    },
    {
      occurrenceId: occurrenceRows[3].id,
      userId: zelador.id,
      body: "Técnico da Hidrotec esteve no local e encomendou a luva de vedação de 50mm.",
    },
  ]);

  /* ------------------------------------------------------------- geral */
  const amenityRows = await db
    .insert(amenities)
    .values([
      {
        condoId: condoA.id,
        name: "Salão de Festas Nobre",
        category: "salao",
        description: "Espaço sofisticado e climatizado, ideal para celebrações familiares, jantares e aniversários inesquecíveis.",
        capacity: 60,
        feeCents: 15000,
        depositCents: 30000,
        pricingType: "fixo",
        reservationModel: "periodo_unico",
        rules: "• Permitido som até as 22h nos dias de semana e 23h aos finais de semana.\n• Limpeza obrigatória inclusa na taxa.\n• Proibido fumar no ambiente interno.\n• Entrega das chaves no dia seguinte até as 09:00.",
        images: ["/amenities/salao-festas.jpg"],
        features: ["wifi", "ar_condicionado", "cozinha", "geladeira", "mesas", "cadeiras", "banheiro", "acessibilidade"],
        openTime: "10:00",
        closeTime: "23:00",
        intervalMinutes: 60,
        maxHours: 8,
        minAdvanceHours: 24,
        maxAdvanceDays: 90,
        limitPerUnit: 2,
        limitInterval: "mes",
        cancellationDeadlineHours: 48,
        requestGuestList: true,
        requiresApproval: true,
      },
      {
        condoId: condoA.id,
        name: "Churrasqueira Gourmet",
        category: "churrasqueira",
        description: "Área externa com churrasqueira a carvão, bancada de apoio em granito e vista privilegiada para o jardim.",
        capacity: 25,
        feeCents: 8000,
        depositCents: 0,
        pricingType: "fixo",
        reservationModel: "horario_livre",
        rules: "• Carvão e utensílios por conta do condômino.\n• Proibido garrafas e recipientes de vidro na área externa.\n• Encerramento pontual às 22h com recolhimento do lixo.",
        images: ["/amenities/churrasqueira.jpg"],
        features: ["churrasqueira", "geladeira", "mesas", "cadeiras", "banheiro", "wifi"],
        openTime: "11:00",
        closeTime: "22:00",
        intervalMinutes: 60,
        maxHours: 6,
        minAdvanceHours: 4,
        maxAdvanceDays: 60,
        limitPerUnit: 4,
        limitInterval: "mes",
        cancellationDeadlineHours: 24,
        requestGuestList: false,
        requiresApproval: true,
      },
      {
        condoId: condoA.id,
        name: "Quadra Poliesportiva",
        category: "quadra",
        description: "Quadra com piso emborrachado para futsal, basquete e vôlei com iluminação em LED.",
        capacity: 20,
        feeCents: 0,
        depositCents: 0,
        pricingType: "gratis",
        reservationModel: "slot_fixo",
        rules: "• Uso exclusivo com calçado apropriado (tênis solado liso).\n• Luzes desligadas automaticamente às 22h.\n• Proibido levar alimentos ou bebidas alcoólicas para a quadra.",
        images: ["/amenities/quadra.jpg"],
        features: ["iluminacao", "vestiario", "acessibilidade"],
        openTime: "07:00",
        closeTime: "22:00",
        intervalMinutes: 0,
        maxHours: 2,
        minAdvanceHours: 1,
        maxAdvanceDays: 30,
        limitPerUnit: 3,
        limitInterval: "semana",
        cancellationDeadlineHours: 2,
        requestGuestList: false,
        requiresApproval: false,
      },
      {
        condoId: condoA.id,
        name: "Espaço Coworking & Reuniões",
        category: "coworking",
        description: "Ambiente silencioso, mesas ergonômicas, sala de reunião privativa e internet fibra dedicada.",
        capacity: 10,
        feeCents: 0,
        depositCents: 0,
        pricingType: "gratis",
        reservationModel: "horario_livre",
        rules: "• Manter tom de voz baixo para preservar o foco de todos.\n• Chamadas telefônicas apenas em fone de ouvido ou cabine.\n• Deixar a estação de trabalho limpa ao sair.",
        images: ["/amenities/coworking.jpg"],
        features: ["wifi", "ar_condicionado", "tomadas", "tv", "cafe", "banheiro"],
        openTime: "06:00",
        closeTime: "23:00",
        intervalMinutes: 0,
        maxHours: 4,
        minAdvanceHours: 1,
        maxAdvanceDays: 30,
        limitPerUnit: 5,
        limitInterval: "semana",
        cancellationDeadlineHours: 2,
        requestGuestList: false,
        requiresApproval: false,
      },
      {
        condoId: condoA.id,
        name: "Espaço Kids & Playground",
        category: "playground",
        description: "Brinquedoteca interna com piso anti-impacto e brinquedos lúdicos higienizados diariamente.",
        capacity: 15,
        feeCents: 0,
        depositCents: 0,
        pricingType: "gratis",
        reservationModel: "horario_livre",
        rules: "• Crianças menores de 8 anos devem estar obrigatoriamente acompanhadas pelos pais ou responsáveis.\n• Não é permitido entrar com calçados sujos da rua.",
        images: ["/amenities/salao-festas.jpg"],
        features: ["ar_condicionado", "brinquedos", "banheiro", "acessibilidade"],
        openTime: "08:00",
        closeTime: "20:00",
        intervalMinutes: 0,
        maxHours: 3,
        minAdvanceHours: 1,
        maxAdvanceDays: 30,
        limitPerUnit: 4,
        limitInterval: "semana",
        cancellationDeadlineHours: 2,
        requestGuestList: false,
        requiresApproval: false,
      },
      {
        condoId: condoB.id,
        name: "Salão de Festas Panorâmico",
        category: "salao",
        description: "Salão no rooftop com vista 360 da cidade, churrasqueira integrada e som ambiente.",
        capacity: 40,
        feeCents: 12000,
        depositCents: 20000,
        pricingType: "fixo",
        reservationModel: "periodo_unico",
        rules: "Som permitido até as 22h. Limpeza inclusa na taxa.",
        images: ["/amenities/salao-festas.jpg"],
        features: ["wifi", "ar_condicionado", "churrasqueira", "cozinha", "mesas", "cadeiras"],
        openTime: "10:00",
        closeTime: "22:00",
        requiresApproval: true,
      },
    ])
    .returning();

  await db.insert(reservations).values([
    { condoId: condoA.id, amenityId: amenityRows[0].id, unitId: A302.id, userId: moradorA.id, date: day(6), startTime: "16:00", endTime: "23:00", guests: 35, status: "aprovada", qrToken: token(8), notes: "Aniversário infantil do Lucas." },
    { condoId: condoA.id, amenityId: amenityRows[1].id, unitId: B101.id, userId: moradorB.id, date: day(2), startTime: "12:00", endTime: "17:00", guests: 12, status: "pendente", qrToken: token(8), notes: "Almoço em família." },
    { condoId: condoA.id, amenityId: amenityRows[2].id, unitId: A201.id, userId: conselheira.id, date: day(0), startTime: "19:00", endTime: "20:00", guests: 6, status: "aprovada", qrToken: token(8) },
    { condoId: condoA.id, amenityId: amenityRows[3].id, unitId: A302.id, userId: moradorA.id, date: day(1), startTime: "09:00", endTime: "12:00", status: "aprovada", qrToken: token(8), notes: "Reunião de trabalho online com clientes." },
    { condoId: condoA.id, amenityId: amenityRows[0].id, unitId: unitsA[9].id, userId: moradoraE.id, date: day(-10), startTime: "18:00", endTime: "23:00", guests: 40, status: "concluida", qrToken: token(8), checkinAt: at(-10, 18) },
  ]);

  /* ------------------------------------------------------------- agenda */
  await db.insert(agendaEvents).values([
    {
      condoId: condoA.id,
      title: "Assembleia Geral Ordinária 2026",
      description: "Deliberação sobre prestação de contas, previsão orçamentária e eleição de síndico e conselho.",
      category: "assembleia",
      date: day(4),
      startTime: "19:00",
      endTime: "21:30",
      location: "Salão de Festas Nobre / Transmissão Online",
      responsible: "Marina Duarte (Síndica)",
      audienceScope: "todos",
      status: "agendado",
      createdById: sindica.id,
    },
    {
      condoId: condoA.id,
      title: "Manutenção Preventiva dos Elevadores (Elevatec)",
      description: "Inspeção obrigatória mensal nos elevadores sociais e de serviço dos Blocos A e B.",
      category: "manutencao",
      date: day(3),
      startTime: "08:30",
      endTime: "12:00",
      location: "Casas de Máquinas e Cabines",
      responsible: "Elevatec Manutenção",
      audienceScope: "todos",
      status: "agendado",
      createdById: sindica.id,
    },
    {
      condoId: condoA.id,
      title: "Dedetização Semestral das Áreas Comuns",
      description: "Aplicação preventiva de inseticida e raticida em garagens, lixeiras, jardins e corredores.",
      category: "inspecao",
      date: day(8),
      startTime: "08:00",
      endTime: "14:00",
      location: "Áreas Comuns e Perímetro",
      responsible: "EcoPragas Controle Ambiental",
      audienceScope: "todos",
      status: "agendado",
      createdById: zelador.id,
    },
    {
      condoId: condoA.id,
      title: "Reunião Mensal do Conselho Consultivo",
      description: "Análise das cotações da reforma de fachada e conferência dos balancetes do mês anterior.",
      category: "reuniao",
      date: day(1),
      startTime: "19:30",
      endTime: "21:00",
      location: "Espaço Coworking & Reuniões",
      responsible: "Helena Prado (Presidente do Conselho)",
      audienceScope: "proprietarios",
      status: "agendado",
      createdById: conselheira.id,
    },
    {
      condoId: condoA.id,
      title: "Limpeza Semestral das Caixas d'Água",
      description: "Higienização e desinfecção dos reservatórios superior e inferior. Abastecimento temporariamente racionado.",
      category: "manutencao",
      date: day(15),
      startTime: "07:00",
      endTime: "17:00",
      location: "Reservatórios Superior e Inferior",
      responsible: "Hidrotec Serviços",
      audienceScope: "todos",
      status: "agendado",
      createdById: zelador.id,
    },
    {
      condoId: condoA.id,
      title: "Torneio de Futebol Infantil de Fim de Semana",
      description: "Atividade de integração para as crianças moradoras de todos os blocos.",
      category: "evento",
      date: day(9),
      startTime: "09:00",
      endTime: "12:00",
      location: "Quadra Poliesportiva",
      responsible: "Comissão de Moradores",
      audienceScope: "todos",
      status: "agendado",
      createdById: moradorA.id,
    },
  ]);

  await db.insert(announcements).values([
    { condoId: condoA.id, title: "Manutenção preventiva dos elevadores", body: "Nesta quinta-feira, das 8h às 12h, o elevador social do Bloco A ficará indisponível para manutenção preventiva da Elevatec. Utilize o elevador de serviço.", category: "manutencao", priority: "alta", authorId: sindica.id, pinned: true, publishedAt: at(-1, 9) },
    { condoId: condoA.id, title: "Nova rotina de retirada de encomendas", body: "As encomendas passam a ser retiradas mediante código enviado no aplicativo. A portaria registrará a assinatura digital de quem retirar.", category: "portaria", priority: "normal", authorId: sindica.id, publishedAt: at(-3, 10) },
    { condoId: condoA.id, title: "Assembleia Geral Ordinária 2026", body: "Convocação publicada com pauta, quórum e instruções para participação híbrida. Documentos disponíveis na área de assembleias.", category: "assembleia", priority: "alta", authorId: sindica.id, publishedAt: at(-5, 14) },
    { condoId: condoA.id, title: "Dedetização das áreas comuns", body: "Serviço realizado no sábado, das 7h às 11h. Mantenha portas e janelas fechadas nesse período.", category: "geral", priority: "normal", authorId: zelador.id, publishedAt: at(-8, 8) },
  ]);

  const vendorRows = await db
    .insert(vendors)
    .values([
      {
        condoId: condoA.id,
        name: "Carlos Eduardo Silva",
        companyName: "Volt & Luz Soluções Elétricas",
        slug: "carlos-eletrica",
        cnpj: "11.222.333/0001-99",
        category: "eletrica",
        contactName: "Carlos Eduardo Silva",
        phone: "(41) 99111-2233",
        whatsapp: "(41) 99111-2233",
        email: "carlos@voltluz.com.br",
        rating: 5,
        photoUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&h=256&q=80",
        coverUrl: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=1200&q=80",
        lat: -25.4320,
        lng: -49.2780,
        active: true,
        verified: true,
        sponsored: true,
        isOnline: true,
        availableNow: true,
        serviceArea: "Curitiba e Região Metropolitana",
        description: "Eletricista residencial com mais de 10 anos de experiência em condomínios. Especialista em instalações elétricas, chuveiros, disjuntores, luminárias e quadros de força.",
        priceFromCents: 8000,
        portfolio: [
          { url: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=600&q=80", caption: "Troca e modernização de quadro elétrico no condomínio", category: "eletrica" },
          { url: "https://images.unsplash.com/photo-1558227691-41ea78d1f631?auto=format&fit=crop&w=600&q=80", caption: "Instalação de luminárias e pendentes em sala de estar", category: "eletrica" },
          { url: "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=600&q=80", caption: "Instalação de chuveiro elétrico pressurizado", category: "eletrica" },
        ],
        services: [
          { id: "elt-1", name: "Troca de Chuveiro / Resistência", description: "Instalação e teste de fiação, disjuntor e aterramento", priceFromCents: 8000 },
          { id: "elt-2", name: "Substituição de Disjuntor / Quadro", description: "Troca e balanceamento de carga do quadro de força", priceFromCents: 14000 },
          { id: "elt-3", name: "Instalação de Tomadas e Interruptores", description: "Novos pontos ou substituição estética", priceFromCents: 5000 },
          { id: "elt-4", name: "Instalação de Luminárias / Fitas LED", description: "Iluminação decorativa e spots embutidos", priceFromCents: 9000 },
        ],
      },
      {
        condoId: condoA.id,
        name: "AquaFix Manutenções",
        companyName: "Hidrotec Serviços & Desentupimentos",
        slug: "aquafix-hidraulica",
        cnpj: "33.221.998/0001-45",
        category: "hidraulica",
        contactName: "Márcia Reis",
        phone: "(41) 3222-8899",
        whatsapp: "(41) 99222-8899",
        email: "atendimento@hidrotec.com.br",
        rating: 5,
        photoUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=256&h=256&q=80",
        coverUrl: "https://images.unsplash.com/photo-1585704032915-c3400ca199e7?auto=format&fit=crop&w=1200&q=80",
        lat: -25.4410,
        lng: -49.2890,
        active: true,
        verified: true,
        isOnline: true,
        availableNow: true,
        serviceArea: "Curitiba e Região",
        description: "Equipe técnica especializada em caça-vazamentos, registros, válvulas Hydra e desentupimentos rápidos com equipamento profissional.",
        priceFromCents: 9000,
        portfolio: [
          { url: "https://images.unsplash.com/photo-1585704032915-c3400ca199e7?auto=format&fit=crop&w=600&q=80", caption: "Detecção e reparo de vazamento em tubulação embutida", category: "hidraulica" },
          { url: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=600&q=80", caption: "Substituição completa de válvula Hydra e torneira gourmet", category: "hidraulica" },
        ],
        services: [
          { id: "hid-1", name: "Conserto de Vazamento ou Registro", description: "Reparo de tubulações, sifões, torneiras e registros", priceFromCents: 12000 },
          { id: "hid-2", name: "Troca de Válvula de Descarga / Caixa", description: "Regulagem ou substituição completa", priceFromCents: 15000 },
          { id: "hid-3", name: "Desentupimento de Pia ou Ralo", description: "Desobstrução rápida com equipamento profissional", priceFromCents: 9000 },
        ],
      },
      {
        condoId: condoA.id,
        name: "ClimaMax Refrigeração",
        companyName: "ClimaMax Ar-Condicionado",
        slug: "climamax-ar",
        cnpj: "77.888.999/0001-22",
        category: "climatizacao",
        contactName: "Fabio Mendes",
        phone: "(41) 99333-4455",
        whatsapp: "(41) 99333-4455",
        email: "contato@climamax.com.br",
        rating: 5,
        photoUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=256&h=256&q=80",
        coverUrl: "https://images.unsplash.com/photo-1621905252507-b35492cc74b4?auto=format&fit=crop&w=1200&q=80",
        lat: -25.4200,
        lng: -49.2650,
        active: true,
        verified: true,
        isOnline: true,
        availableNow: true,
        serviceArea: "Curitiba",
        description: "Instalação, limpeza química e manutenção preventiva de ar-condicionado Split e Inverter.",
        priceFromCents: 18000,
        portfolio: [
          { url: "https://images.unsplash.com/photo-1621905252507-b35492cc74b4?auto=format&fit=crop&w=600&q=80", caption: "Instalação de ar Split Inverter com tubulação embutida", category: "climatizacao" },
          { url: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80", caption: "Higienização completa com bactericida hospitalar", category: "climatizacao" },
        ],
        services: [
          { id: "cli-1", name: "Higienização e Limpeza Completa", description: "Limpeza de filtros, turbina e aplicação de bactericida", priceFromCents: 18000 },
          { id: "cli-2", name: "Instalação de Ar Split 9000 a 18000 BTUs", description: "Tubulação de cobre, teste de vácuo e suporte", priceFromCents: 45000 },
          { id: "cli-3", name: "Carga de Gás e Verificação de Vazamento", description: "Recarga de fluido refrigerante R410A / R32", priceFromCents: 22000 },
        ],
      },
      {
        condoId: condoA.id,
        name: "Roberto Marcenaria Fina",
        companyName: "Arte em Madeira Curitiba",
        slug: "roberto-marcenaria",
        cnpj: "88.999.000/0001-33",
        category: "marcenaria",
        contactName: "Roberto Marcenaria",
        phone: "(41) 99444-5566",
        rating: 5,
        photoUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=256&h=256&q=80",
        coverUrl: "https://images.unsplash.com/photo-1538688525198-9b88f6f53126?auto=format&fit=crop&w=1200&q=80",
        lat: -25.4450,
        lng: -49.2950,
        active: true,
        verified: true,
        isOnline: true,
        serviceArea: "Curitiba",
        description: "Reparos em móveis planejados, regulagem de portas e gavetas, troca de dobradiças amortecedoras e corrediças.",
        priceFromCents: 10000,
        portfolio: [
          { url: "https://images.unsplash.com/photo-1538688525198-9b88f6f53126?auto=format&fit=crop&w=600&q=80", caption: "Ajuste de armários planejados e troca de dobradiças soft-close", category: "marcenaria" },
        ],
        services: [
          { id: "mar-1", name: "Ajuste e Regulagem de Portas / Dobradiças", description: "Alinhamento de portas e troca de pistões a gás", priceFromCents: 10000 },
          { id: "mar-2", name: "Troca de Corrediças Telescópicas", description: "Substituição para fechamento suave (soft-close)", priceFromCents: 12000 },
          { id: "mar-3", name: "Montagem e Desmontagem de Móveis", description: "Montagem profissional com fixação segura", priceFromCents: 15000 },
        ],
      },
      {
        condoId: condoA.id,
        name: "Elevatec Manutenção",
        companyName: "Elevatec Manutenção Ltda",
        slug: "elevatec-manutencao",
        cnpj: "22.334.556/0001-77",
        category: "elevadores",
        contactName: "Sandro Melo",
        phone: "(41) 3333-1122",
        email: "contato@elevatec.com.br",
        rating: 5,
        photoUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=256&h=256&q=80",
        coverUrl: "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1200&q=80",
        active: true,
        services: [
          { id: "elv-1", name: "Manutenção Preventiva de Elevador", description: "Inspeção mensal e lubrificação", priceFromCents: 45000 },
        ],
      },
      {
        condoId: condoA.id,
        name: "Portec Automatizadores",
        companyName: "Portec Segurança Eletrônica",
        cnpj: "44.110.223/0001-12",
        category: "portoes",
        contactName: "Everton Luz",
        phone: "(41) 3555-4433",
        rating: 4,
        active: true,
        services: [
          { id: "por-1", name: "Manutenção de Motor de Portão", description: "Troca de placa e alinhamento de cremalheira", priceFromCents: 16000 },
        ],
      },
      {
        condoId: condoA.id,
        name: "SegFire Extintores & Segurança",
        cnpj: "55.998.112/0001-31",
        category: "seguranca",
        contactName: "Paula Nunes",
        phone: "(41) 3666-7788",
        rating: 5,
        active: true,
      },
      {
        condoId: condoA.id,
        name: "Verde Vivo Jardinagem",
        cnpj: "66.223.114/0001-08",
        category: "jardinagem",
        contactName: "Ricardo Gomes",
        phone: "(41) 3777-2211",
        rating: 4,
        active: true,
      },
      // VENDORS PARA CONDO B (Edifício Vista Marina)
      {
        condoId: condoB.id,
        name: "EletroMarina Reparos",
        companyName: "EletroMarina Serviços Floripa",
        category: "eletrica",
        contactName: "Juliano Costa",
        phone: "(48) 99888-7711",
        whatsapp: "(48) 99888-7711",
        rating: 5,
        active: true,
        verified: true,
        isOnline: true,
        availableNow: true,
        serviceArea: "Florianópolis",
        description: "Serviços elétricos em geral, automação, iluminação e manutenções residenciais.",
        priceFromCents: 8500,
        services: [
          { id: "mb-1", name: "Troca de Chuveiro e Disjuntor", description: "Instalação elétrica segura", priceFromCents: 8500 },
          { id: "mb-2", name: "Instalação de Tomadas e Spots", description: "Pontos novos ou substituição", priceFromCents: 6000 },
        ],
      },
      {
        condoId: condoB.id,
        name: "IlhaFix Hidráulica",
        companyName: "IlhaFix Manutenções",
        category: "hidraulica",
        contactName: "Tiago Ramos",
        phone: "(48) 99777-6622",
        whatsapp: "(48) 99777-6622",
        rating: 5,
        active: true,
        verified: true,
        isOnline: true,
        availableNow: true,
        serviceArea: "Florianópolis",
        description: "Vazamentos, torneiras, registros, bombas e desentupimentos.",
        priceFromCents: 10000,
        services: [
          { id: "ih-1", name: "Reparo de Vazamento e Registros", description: "Conserto rápido sem quebra-quebra", priceFromCents: 12000 },
          { id: "ih-2", name: "Desentupimento de Pias e Ralos", description: "Desobstrução imediata", priceFromCents: 10000 },
        ],
      },
    ])
    .returning();

  const ticketRows = await db
    .insert(tickets)
    .values([
      {
        condoId: condoA.id,
        code: sequence("SRV", 101),
        unitId: A302.id,
        title: "Reparo de vazamento no registro do chuveiro",
        description: "Registro com gotejamento constante, causando umidade na parede divisória.",
        category: "hidraulica",
        priority: "alta",
        status: "agendado",
        location: "Apto 302 - Banheiro da Suíte",
        preferredTime: "Quinta-feira à tarde (14h às 17h)",
        vendorId: vendorRows[1]?.id ?? 1,
        scheduledFor: day(2),
        costCents: 15000,
        openedById: moradorA.id,
        dueAt: at(2, 18),
      },
      {
        condoId: condoA.id,
        code: sequence("SRV", 102),
        unitId: B101.id,
        title: "Substituição de disjuntor do quadro elétrico",
        description: "Disjuntor geral desarmando com uso simultâneo do forno elétrico e chuveiro.",
        category: "eletrica",
        priority: "alta",
        status: "concluido",
        location: "Apto 101 - Hall de Entrada",
        preferredTime: "Manhã",
        costCents: 9500,
        report: "Substituído disjuntor bifásico de 40A para 50A e reapertados os bornes.",
        rating: 5,
        ratingComment: "Excelente atendimento do eletricista, resolveu rapidamente.",
        vendorId: vendorRows[0]?.id ?? 1,
        openedById: moradorB.id,
        closedAt: at(-2, 16),
      },
      {
        condoId: condoA.id,
        code: sequence("SRV", 103),
        title: "Ajuste na mola hidráulica da porta corta-fogo",
        description: "Porta do 4º andar batendo com força excessiva ao fechar.",
        category: "manutencao",
        priority: "media",
        status: "em_analise",
        location: "Escadaria de Emergência - 4º Andar",
        preferredTime: "Horário comercial",
        openedById: zelador.id,
      },
      {
        condoId: condoA.id,
        code: sequence("SRV", 104),
        unitId: A201.id,
        title: "Pintura de retoque na parede externa da varanda",
        description: "Pequena descamação de tinta após o último temporal.",
        category: "pintura",
        priority: "baixa",
        status: "solicitado",
        location: "Apto 201 - Sacada",
        preferredTime: "Sábado pela manhã",
        openedById: conselheira.id,
      },
      {
        condoId: condoA.id,
        code: sequence("SRV", 105),
        title: "Poda preventiva de galhos próximos à fiação",
        description: "Galhos da árvore lateral encostando nos cabos de fibra óptica do condomínio.",
        category: "jardinagem",
        priority: "media",
        status: "aprovado",
        location: "Jardim Lateral - Bloco B",
        vendorId: vendorRows[4]?.id ?? 5,
        scheduledFor: day(5),
        costCents: 32000,
        openedById: zelador.id,
      },
      {
        condoId: condoA.id,
        code: sequence("SRV", 106),
        unitId: A302.id,
        title: "Instalação de Chuveiro Elétrico e Fiação",
        description: "Instalação de chuveiro blindado 7500W com novo disjuntor.",
        category: "eletrica",
        priority: "alta",
        status: "concluido",
        location: "Apto 302 - Banheiro",
        costCents: 12000,
        report: "Instalado chuveiro com disjuntor dedicado e teste de aquecimento ok.",
        rating: 5,
        ratingComment: "Excelente profissional! Pontual, muito caprichoso e limpou tudo.",
        vendorId: vendorRows[0]?.id ?? 1,
        openedById: moradorA.id,
        closedAt: at(-5, 14),
      },
      {
        condoId: condoA.id,
        code: sequence("SRV", 107),
        unitId: B101.id,
        title: "Troca de Reparo de Válvula Hydra",
        description: "Descarga travando e vazando água continuamente no vaso sanitário.",
        category: "hidraulica",
        priority: "alta",
        status: "concluido",
        location: "Apto 101 - Banheiro Social",
        costCents: 15000,
        report: "Substituído cartucho de reparo Hydra e ajustada vazão de água.",
        rating: 5,
        ratingComment: "Chegou rápido, identificou o defeito e resolveu o vazamento na hora.",
        vendorId: vendorRows[1]?.id ?? 2,
        openedById: moradorB.id,
        closedAt: at(-4, 11),
      },
      {
        condoId: condoA.id,
        code: sequence("SRV", 108),
        unitId: A201.id,
        title: "Higienização e Carga de Gás Split Inverter",
        description: "Ar condicionado da sala não estava resfriando e com ruído no ventilador.",
        category: "climatizacao",
        priority: "normal",
        status: "concluido",
        location: "Apto 201 - Sala",
        costCents: 22000,
        report: "Higienização completa da turbina e serpentina, recarga de gás R410A.",
        rating: 5,
        ratingComment: "Muito atencioso, técnico excelente. O ar está gelando perfeitamente.",
        vendorId: vendorRows[2]?.id ?? 3,
        openedById: conselheira.id,
        closedAt: at(-1, 15),
      },
    ])
    .returning();

  await db.insert(ticketComments).values([
    { ticketId: ticketRows[0].id, userId: zelador.id, body: "Inspeção realizada. Vazamento vem da prumada do 402. Empresa Hidrotec agendada para quinta." },
    { ticketId: ticketRows[0].id, userId: moradorA.id, body: "Obrigada! Estarei em casa a partir das 14h." },
    { ticketId: ticketRows[0].id, userId: sindica.id, body: "Custo aprovado no orçamento de manutenção corretiva.", internal: true },
    { ticketId: ticketRows[3].id, userId: sindica.id, body: "Mediação realizada com as duas partes. Acordo registrado em ata interna." },
  ]);

  await db.insert(documents).values([
    { condoId: condoA.id, title: "Convenção do condomínio", category: "juridico", description: "Documento registrado em cartório.", fileName: "convencao.pdf", sizeKb: 2400, visibility: "moradores", uploadedById: sindica.id },
    { condoId: condoA.id, title: "Regimento interno 2026", category: "juridico", fileName: "regimento-2026.pdf", sizeKb: 900, visibility: "moradores", version: "3.1", uploadedById: sindica.id },
    { condoId: condoA.id, title: "Prestação de contas - mês anterior", category: "financeiro", fileName: "prestacao-contas.pdf", sizeKb: 640, visibility: "moradores", uploadedById: sindica.id },
    { condoId: condoA.id, title: "Laudo de inspeção predial", category: "tecnico", fileName: "laudo-predial.pdf", sizeKb: 5100, visibility: "administrativo", uploadedById: zelador.id },
    { condoId: condoA.id, title: "Ata da última assembleia", category: "assembleia", fileName: "ata-age.pdf", sizeKb: 380, visibility: "moradores", uploadedById: sindica.id },
    { condoId: condoA.id, title: "Contrato de portaria", category: "contrato", fileName: "contrato-portaria.pdf", sizeKb: 720, visibility: "administrativo", uploadedById: sindica.id },
  ]);

  const [poll1, poll2] = await db
    .insert(polls)
    .values([
      { condoId: condoA.id, question: "Qual horário prefere para a manutenção da piscina?", description: "Consulta não deliberativa para organizar a agenda.", status: "aberta", endsAt: at(5, 20), createdById: sindica.id },
      { condoId: condoA.id, question: "Devemos instalar tomadas para carros elétricos na garagem?", description: "Consulta prévia à assembleia.", status: "encerrada", endsAt: at(-2, 20), createdById: sindica.id },
    ])
    .returning();

  const optionRows = await db
    .insert(pollOptions)
    .values([
      { pollId: poll1.id, label: "Segunda a sexta, pela manhã" },
      { pollId: poll1.id, label: "Segunda a sexta, à tarde" },
      { pollId: poll1.id, label: "Aos sábados" },
      { pollId: poll2.id, label: "Sim, com rateio entre interessados" },
      { pollId: poll2.id, label: "Sim, custeado pelo fundo de reserva" },
      { pollId: poll2.id, label: "Não instalar por enquanto" },
    ])
    .returning();

  await db.insert(pollVotes).values([
    { pollId: poll1.id, optionId: optionRows[0].id, userId: moradorA.id, unitId: A302.id },
    { pollId: poll1.id, optionId: optionRows[2].id, userId: moradorB.id, unitId: B101.id },
    { pollId: poll1.id, optionId: optionRows[0].id, userId: conselheira.id, unitId: unitsA[5].id },
    { pollId: poll2.id, optionId: optionRows[3].id, userId: moradorA.id, unitId: A302.id },
    { pollId: poll2.id, optionId: optionRows[5].id, userId: moradorB.id, unitId: B101.id },
    { pollId: poll2.id, optionId: optionRows[3].id, userId: moradoraE.id, unitId: unitsA[9].id },
  ]);

  /* -------------------------------------------------- manutenção/vendors */
  await db.insert(contracts).values([
    { condoId: condoA.id, vendorId: vendorRows[0].id, title: "Manutenção mensal de elevadores", object: "Duas visitas mensais e atendimento emergencial 24h.", startAt: day(-330), endAt: day(35), valueCents: 189000, adjustmentIndex: "IGPM" },
    { condoId: condoA.id, vendorId: vendorRows[3].id, title: "Recarga e inspeção de extintores", object: "Inspeção anual e recarga conforme NBR.", startAt: day(-200), endAt: day(20), valueCents: 420000, billingCycle: "anual", adjustmentIndex: "IPCA" },
    { condoId: condoA.id, vendorId: vendorRows[4].id, title: "Jardinagem quinzenal", object: "Poda, adubação e limpeza das áreas verdes.", startAt: day(-150), endAt: day(215), valueCents: 96000 },
    { condoId: condoA.id, vendorId: vendorRows[2].id, title: "Manutenção de portões automáticos", object: "Preventiva trimestral com peças inclusas.", startAt: day(-400), endAt: day(-10), valueCents: 78000, status: "vencido" },
  ]);

  const assetRows = await db
    .insert(assets)
    .values([
      { condoId: condoA.id, name: "Elevador social - Bloco A", category: "elevador", location: "Bloco A", brand: "Atlas", serial: "ELV-A-2019", installedAt: day(-2200) },
      { condoId: condoA.id, name: "Elevador de serviço - Bloco A", category: "elevador", location: "Bloco A", brand: "Atlas", serial: "ELV-B-2019", installedAt: day(-2200), status: "atencao" },
      { condoId: condoA.id, name: "Bomba de recalque 2", category: "hidraulica", location: "Subsolo", brand: "Schneider", serial: "BR-002", installedAt: day(-1400) },
      { condoId: condoA.id, name: "Portão social automatizado", category: "portao", location: "Entrada principal", brand: "Portec", serial: "PT-901", status: "manutencao" },
      { condoId: condoA.id, name: "Extintores - pavimentos", category: "seguranca", location: "Todos os blocos", brand: "SegFire" },
      { condoId: condoA.id, name: "CFTV - 32 câmeras", category: "seguranca", location: "Perímetro", brand: "Intelbras", serial: "CFTV-32" },
      { condoId: condoB.id, name: "Elevador Panorâmico - Torre Única", category: "elevador", location: "Torre Central", brand: "Schindler", serial: "SCH-2021", installedAt: day(-1800) },
      { condoId: condoB.id, name: "Conjunto Moto-bomba de Pressurização", category: "hidraulica", location: "Barrilete Superior", brand: "Dancor", serial: "MB-101", installedAt: day(-1200) },
      { condoId: condoB.id, name: "Gerador de Emergência a Diesel", category: "eletrica", location: "Subsolo Garagem", brand: "Stemac", serial: "STM-55KVA", installedAt: day(-900) },
    ])
    .returning();

  await db.insert(maintenancePlans).values([
    { condoId: condoA.id, assetId: assetRows[0].id, title: "Preventiva mensal do elevador social", frequencyDays: 30, vendorId: vendorRows[0].id, responsible: "Elevatec", nextDueAt: day(3), lastDoneAt: day(-27), checklist: ["Cabos e polias", "Freios de emergência", "Nivelamento", "Interfone da cabine"] },
    { condoId: condoA.id, assetId: assetRows[2].id, title: "Inspeção das bombas de recalque", frequencyDays: 60, vendorId: vendorRows[1].id, responsible: "Hidrotec", nextDueAt: day(-2), lastDoneAt: day(-62), checklist: ["Pressão", "Vedações", "Quadro elétrico"] },
    { condoId: condoA.id, assetId: assetRows[4].id, title: "Inspeção de extintores", frequencyDays: 180, vendorId: vendorRows[3].id, responsible: "SegFire", nextDueAt: day(12), lastDoneAt: day(-168), checklist: ["Pressão", "Lacre", "Validade", "Sinalização"] },
    { condoId: condoA.id, assetId: assetRows[3].id, title: "Preventiva do portão automatizado", frequencyDays: 90, vendorId: vendorRows[2].id, responsible: "Portec", nextDueAt: day(-6), lastDoneAt: day(-96), checklist: ["Motor", "Sensores", "Cremalheira"] },
    { condoId: condoA.id, assetId: assetRows[5].id, title: "Limpeza e conferência das câmeras", frequencyDays: 45, responsible: "Zelador", nextDueAt: day(9), lastDoneAt: day(-36), checklist: ["Foco", "Gravação 30 dias", "Nobreak"] },
    { condoId: condoB.id, assetId: assetRows[6].id, title: "Manutenção mensal elevador panorâmico", frequencyDays: 30, vendorId: vendorRows[0].id, responsible: "Schindler Manutenção", nextDueAt: day(4), lastDoneAt: day(-26), checklist: ["Testes de segurança", "Lubrificação", "Cabos de tração"] },
    { condoId: condoB.id, assetId: assetRows[8].id, title: "Teste de carga e nível de óleo do gerador", frequencyDays: 15, responsible: "Zelador Geral", nextDueAt: day(2), lastDoneAt: day(-13), checklist: ["Bateria de partida", "Nível de diesel", "Filtros e vazamentos"] },
  ]);

  await db.insert(maintenanceOrders).values([
    { condoId: condoA.id, assetId: assetRows[0].id, kind: "preventiva", title: "Preventiva mensal elevador social", scheduledFor: day(3), status: "programada", vendorId: vendorRows[0].id, technician: "Sandro Melo", costCents: 189000 },
    { condoId: condoA.id, assetId: assetRows[3].id, kind: "corretiva", title: "Troca do motor do portão social", description: "Motor apresenta ruído e falha intermitente.", scheduledFor: day(1), status: "em_andamento", vendorId: vendorRows[2].id, technician: "Everton Luz", costCents: 265000 },
    { condoId: condoA.id, assetId: assetRows[2].id, kind: "corretiva", title: "Reparo de vazamento na bomba 2", scheduledFor: day(-2), completedAt: day(-1), status: "concluida", vendorId: vendorRows[1].id, technician: "Márcia Reis", costCents: 82000, report: "Substituída vedação e reapertados flanges." },
    { condoId: condoA.id, assetId: assetRows[1].id, kind: "corretiva", title: "Nivelamento do elevador de serviço", scheduledFor: day(-20), completedAt: day(-19), status: "concluida", vendorId: vendorRows[0].id, costCents: 45000, report: "Ajuste eletrônico realizado." },
    { condoId: condoA.id, assetId: assetRows[4].id, kind: "preventiva", title: "Inspeção semestral de extintores", scheduledFor: day(12), status: "programada", vendorId: vendorRows[3].id, costCents: 420000 },
    { condoId: condoB.id, assetId: assetRows[6].id, kind: "preventiva", title: "Inspeção mensal preventiva de elevador", scheduledFor: day(4), status: "programada", vendorId: vendorRows[0].id, technician: "Carlos Eduardo", costCents: 210000 },
    { condoId: condoB.id, assetId: assetRows[7].id, kind: "corretiva", title: "Substituição do pressostato da bomba", description: "Bomba desarmando por oscilação de pressão.", scheduledFor: day(-5), completedAt: day(-4), status: "concluida", vendorId: vendorRows[1].id, technician: "Roberto Dias", costCents: 78000, report: "Novo pressostato Schneider instalado e calibrado a 4 bar." },
  ]);

  /* ---------------------------------------------------------- assembleia */
  const [assembly1, assembly2] = await db
    .insert(assemblies)
    .values([
      { condoId: condoA.id, title: "Assembleia Geral Ordinária 2026", kind: "ordinaria", mode: "hibrida", noticeAt: at(-15, 9), firstCallAt: at(4, 19), secondCallAt: at(4, 19, 30), startTime: "19:00", endTime: "21:30", location: "Salão de festas principal", onlineLink: "https://meet.exemplo/age-2026", quorumFirst: 50, quorumSecond: 25, status: "convocacao_enviada", createdById: sindica.id, responsibleName: sindica.name, guidelines: "Favor trazer documento de identificação com foto e procuração se for representar outra unidade." },
      { condoId: condoA.id, title: "AGE - Aprovação da obra da fachada", kind: "extraordinaria", mode: "presencial", noticeAt: at(-90, 9), firstCallAt: at(-60, 19), location: "Salão de festas", status: "ata_publicada", minutes: "Aprovada por 68% das frações a execução da obra de recuperação da fachada, com pagamento em 6 parcelas.", recordingUrl: "https://video.exemplo/age-fachada", createdById: sindica.id, responsibleName: sindica.name },
    ])
    .returning();

  const [assembly3] = await db
    .insert(assemblies)
    .values([
      { condoId: condoB.id, title: "Assembleia de Eleição de Síndico e Conselho 2026", kind: "ordinaria", mode: "hibrida", noticeAt: at(-20, 9), firstCallAt: at(6, 19), secondCallAt: at(6, 19, 30), startTime: "19:30", endTime: "21:30", location: "Auditório Central", onlineLink: "https://meet.exemplo/age-marina", quorumFirst: 50, quorumSecond: 25, status: "convocacao_enviada", createdById: sindicoB.id, responsibleName: sindicoB.name, guidelines: "Chapas concorrentes devem registrar candidatura com 48h de antecedência." },
    ])
    .returning();

  const agendaRows = await db
    .insert(assemblyAgenda)
    .values([
      { assemblyId: assembly1.id, position: 1, title: "Prestação de contas do exercício anterior", description: "Análise e votação das contas apresentadas pela síndica.", votingType: "unidade" },
      { assemblyId: assembly1.id, position: 2, title: "Previsão orçamentária e taxa condominial", description: "Aprovação do orçamento anual e reajuste da taxa.", votingType: "fracao" },
      { assemblyId: assembly1.id, position: 3, title: "Contratação de portaria remota noturna", description: "Proposta de projeto piloto por 6 meses.", votingType: "fracao" },
      { assemblyId: assembly3.id, position: 1, title: "Eleição da administração e conselho fiscal", description: "Votação dos representantes para o biênio 2026-2028.", votingType: "unidade" },
      { assemblyId: assembly3.id, position: 2, title: "Aprovação do plano de pintura da torre", description: "Apresentação de 3 orçamentos comparativos.", votingType: "fracao" },
    ])
    .returning();

  await db.insert(assemblyAttendance).values([
    { assemblyId: assembly1.id, unitId: A302.id, userId: moradorA.id, status: "confirmado" },
    { assemblyId: assembly1.id, unitId: B101.id, userId: moradorB.id, status: "confirmado" },
    { assemblyId: assembly1.id, unitId: unitsA[5].id, userId: conselheira.id, status: "confirmado", proxyForUnitId: unitsA[7].id, proxyDoc: "Procuração digitalizada - unidade 402" },
  ]);

  await db.insert(assemblyVotes).values([
    { assemblyId: assembly1.id, agendaId: agendaRows[0].id, unitId: A302.id, userId: moradorA.id, choice: "sim", weight: "1.05" },
    { assemblyId: assembly1.id, agendaId: agendaRows[0].id, unitId: B101.id, userId: moradorB.id, choice: "sim", weight: "0.95" },
    { assemblyId: assembly1.id, agendaId: agendaRows[0].id, unitId: unitsA[5].id, userId: conselheira.id, choice: "abstencao", weight: "1.00" },
  ]);

  const [minuteRecord] = await db.insert(assemblyMinutes).values([
    {
      assemblyId: assembly2.id,
      condoId: condoA.id,
      status: "publicada",
      currentVersion: "1.0",
      fileName: "ata-assembleia-fachada-2026.pdf",
      fileUrl: `/api/assemblies/${assembly2.id}/minutes/download`,
      fileSizeKb: 420,
      fileFormat: "pdf",
      content: "Ata da Assembleia Geral Extraordinária do Residencial Parque das Águas realizada em auditório principal.\n\nDeliberação: Aprovada por 68% das frações a execução da obra de recuperação da fachada.",
      summary: "• ASSUNTOS PRINCIPAIS: Obra de recuperação estrutural da fachada bloco A.\n• DECISÕES TOMADAS: Aprovada por 68% dos votos presentes.\n• VALORES APROVADOS: R$ 120.000,00 divididos em 6 parcelas na taxa extra.\n• RESPONSÁVEIS E PRAZOS: Síndica e empresa contratada com início em 30 dias.",
      summaryStatus: "aprovado",
      summaryApprovedById: sindica.id,
      summaryApprovedAt: at(-55, 14),
      publishedAt: at(-55, 14),
      publishedById: sindica.id,
    },
  ]).returning();

  await db.insert(assemblyMinuteVersions).values([
    {
      minutesId: minuteRecord.id,
      assemblyId: assembly2.id,
      version: "1.0",
      fileName: "ata-assembleia-fachada-2026.pdf",
      fileUrl: `/api/assemblies/${assembly2.id}/minutes/download`,
      fileSizeKb: 420,
      content: minuteRecord.content,
      summary: minuteRecord.summary,
      changeReason: "Publicação inicial da ata aprovada pela comissão",
      createdById: sindica.id,
      createdAt: at(-55, 14),
    },
  ]);

  /* ----------------------------------------------------------- financeiro */
  const expenseCats = [
    ["Folha de pagamento", "pessoal", 1840000],
    ["Energia elétrica áreas comuns", "utilidades", 412000],
    ["Água e esgoto", "utilidades", 386000],
    ["Contrato de elevadores", "manutencao", 189000],
    ["Jardinagem", "manutencao", 96000],
    ["Material de limpeza", "suprimentos", 78000],
    ["Seguro predial", "administrativo", 145000],
    ["Taxa de administração", "administrativo", 210000],
  ] as const;

  const txValues: (typeof transactions.$inferInsert)[] = [];
  for (let m = 0; m < 3; m++) {
    for (const [description, category, amount] of expenseCats) {
      txValues.push({
        condoId: condoA.id,
        kind: "despesa",
        category,
        costCenter: category === "pessoal" ? "pessoal" : "administracao",
        description,
        amountCents: amount + m * 1500,
        dueDate: day(-m * 30 - 5),
        paidDate: m === 0 ? null : day(-m * 30 - 4),
        status: m === 0 ? "pendente" : "pago",
        createdById: sindica.id,
      });
    }
    txValues.push({
      condoId: condoA.id,
      kind: "receita",
      category: "taxa_condominial",
      description: "Arrecadação de taxas condominiais",
      amountCents: 4120000,
      dueDate: day(-m * 30 - 10),
      paidDate: day(-m * 30 - 10),
      status: "pago",
      createdById: sindica.id,
    });
    txValues.push({
      condoId: condoA.id,
      kind: "receita",
      category: "fundo_reserva",
      description: "Aporte no fundo de reserva",
      amountCents: 412000,
      dueDate: day(-m * 30 - 10),
      paidDate: day(-m * 30 - 10),
      status: "pago",
      reserveFund: true,
      createdById: sindica.id,
    });
  }
  txValues.push({ condoId: condoA.id, kind: "despesa", category: "manutencao", description: "Troca do motor do portão social", amountCents: 265000, dueDate: day(8), status: "pendente", vendorId: vendorRows[2].id, createdById: sindica.id });
  txValues.push({ condoId: condoA.id, kind: "despesa", category: "manutencao", description: "Reparo hidráulico bomba 2", amountCents: 82000, dueDate: day(-3), status: "atrasado", vendorId: vendorRows[1].id, createdById: sindica.id });

  // Transações Condo B (Edifício Vista Marina)
  for (let m = 0; m < 2; m++) {
    txValues.push({
      condoId: condoB.id,
      kind: "receita",
      category: "taxa_condominial",
      description: "Arrecadação de taxas condominiais",
      amountCents: 2850000,
      dueDate: day(-m * 30 - 10),
      paidDate: day(-m * 30 - 10),
      status: "pago",
      createdById: sindicoB.id,
    });
    txValues.push({
      condoId: condoB.id,
      kind: "despesa",
      category: "utilidades",
      description: "Energia elétrica e água áreas comuns",
      amountCents: 620000,
      dueDate: day(-m * 30 - 5),
      paidDate: m === 0 ? null : day(-m * 30 - 4),
      status: m === 0 ? "pendente" : "pago",
      createdById: sindicoB.id,
    });
    txValues.push({
      condoId: condoB.id,
      kind: "despesa",
      category: "manutencao",
      description: "Manutenção de bombas e elevador",
      amountCents: 450000,
      dueDate: day(-m * 30 - 3),
      paidDate: m === 0 ? null : day(-m * 30 - 2),
      status: m === 0 ? "pendente" : "pago",
      createdById: sindicoB.id,
    });
  }

  await db.insert(transactions).values(txValues);

  await db.insert(budgets).values([
    { condoId: condoA.id, year: new Date().getFullYear(), category: "pessoal", plannedCents: 22000000 },
    { condoId: condoA.id, year: new Date().getFullYear(), category: "utilidades", plannedCents: 9600000 },
    { condoId: condoA.id, year: new Date().getFullYear(), category: "manutencao", plannedCents: 6000000 },
    { condoId: condoA.id, year: new Date().getFullYear(), category: "administrativo", plannedCents: 4200000 },
    { condoId: condoA.id, year: new Date().getFullYear(), category: "suprimentos", plannedCents: 1200000 },
    { condoId: condoB.id, year: new Date().getFullYear(), category: "utilidades", plannedCents: 7500000 },
    { condoId: condoB.id, year: new Date().getFullYear(), category: "manutencao", plannedCents: 5400000 },
    { condoId: condoB.id, year: new Date().getFullYear(), category: "administrativo", plannedCents: 3200000 },
  ]);

  const chargeValues: (typeof charges.$inferInsert)[] = [];
  unitsA.forEach((unit, index) => {
    for (let m = 0; m < 2; m++) {
      const overdue = index % 7 === 0 && m === 0;
      chargeValues.push({
        condoId: condoA.id,
        unitId: unit.id,
        reference: day(-m * 30).slice(0, 7),
        amountCents: 78000 + index * 350,
        dueDate: day(-m * 30 + 5),
        paidAt: overdue ? null : day(-m * 30 + 3),
        status: overdue ? "vencida" : "paga",
        method: overdue ? null : "pix",
      });
    }
  });

  const unitsB = unitRows.filter((u) => u.condoId === condoB.id);
  unitsB.forEach((unit, index) => {
    for (let m = 0; m < 2; m++) {
      const overdue = index === 2 && m === 0;
      chargeValues.push({
        condoId: condoB.id,
        unitId: unit.id,
        reference: day(-m * 30).slice(0, 7),
        amountCents: 95000,
        dueDate: day(-m * 30 + 5),
        paidAt: overdue ? null : day(-m * 30 + 3),
        status: overdue ? "vencida" : "paga",
        method: overdue ? null : "pix",
      });
    }
  });

  await db.insert(charges).values(chargeValues);

  /* --------------------------------------------- achados / mudanças / etc */
  await db.insert(lostItems).values([
    { condoId: condoA.id, title: "Chaveiro com 3 chaves e controle", description: "Chaveiro de couro marrom.", foundLocation: "Hall do Bloco B", foundAt: day(-3), status: "guardado", discardAfter: day(87), registeredById: porteiro1.id },
    { condoId: condoA.id, title: "Óculos de sol infantil", foundLocation: "Playground", foundAt: day(-11), status: "guardado", discardAfter: day(79), registeredById: porteiro2.id },
    { condoId: condoA.id, title: "Guarda-chuva azul", foundLocation: "Portaria", foundAt: day(-25), status: "devolvido", claimedBy: "Ana Ribeiro", claimedUnitId: A302.id, claimedAt: at(-20, 19), registeredById: porteiro1.id },
    { condoId: condoA.id, title: "Garrafa térmica", foundLocation: "Quadra", foundAt: day(-120), status: "descartado", discardAfter: day(-30), registeredById: porteiro2.id },
  ]);

  await db.insert(moveRequests).values([
    { condoId: condoA.id, unitId: B101.id, requestedById: moradorB.id, kind: "mudanca", scheduledDate: day(3), startTime: "08:00", endTime: "12:00", elevator: "Serviço", carrierName: "Mudanças Rápidas ME", carrierDoc: "12.998.334/0001-22", vehiclePlate: "MUD-2A33", termAccepted: true, status: "aprovada", reviewedById: sindica.id },
    { condoId: condoA.id, unitId: A302.id, requestedById: moradorA.id, kind: "obra", scheduledDate: day(10), startTime: "09:00", endTime: "17:00", description: "Reforma de banheiro com troca de louças e revestimento.", artUrl: "art-123456.pdf", workers: "José Silva (RG 8.221.334), Marcos Lima (RG 9.112.443)", termAccepted: true, status: "pendente", deadlineAt: day(40) },
    { condoId: condoA.id, unitId: A201.id, requestedById: conselheira.id, kind: "entrega_grande", scheduledDate: day(-6), startTime: "14:00", endTime: "16:00", elevator: "Serviço", carrierName: "Móveis Bento", termAccepted: true, status: "concluida", reviewedById: sindica.id },
  ]);

  await db.insert(supportTickets).values([
    { condoId: condoA.id, userId: sindica.id, subject: "Como importar moradores em massa?", body: "Preciso atualizar a lista de moradores do Bloco C.", category: "duvida", status: "respondido", answer: "Use Implantação > Importar moradores. Baixe o modelo de planilha, preencha e valide antes de confirmar.", satisfaction: 5 },
    { condoId: condoA.id, userId: porteiro1.id, subject: "Leitor de QR Code não abre no tablet", body: "Ao tocar em validar, a câmera não inicia.", category: "incidente", priority: "alta", status: "em_atendimento" },
    { condoId: condoB.id, userId: sindicoB.id, subject: "Solicito treinamento da equipe de portaria", body: "Gostaríamos de agendar treinamento remoto.", category: "treinamento", status: "aberto" },
  ]);

  await db.insert(helpArticles).values([
    { slug: "primeiro-acesso", title: "Primeiro acesso e configuração da conta", category: "primeiros-passos", body: "Ao receber o convite, defina sua senha, confirme seus dados e escolha o condomínio ativo no topo da barra lateral. Moradores visualizam apenas a própria unidade.", tags: "login,conta,convite" },
    { slug: "registrar-visitante", title: "Como registrar e autorizar um visitante", category: "portaria", body: "O morador cria o convite em Visitantes, define validade e compartilha o QR Code. Na chegada, a portaria valida o código, confirma documento e registra a entrada. O morador recebe um aviso automático.", tags: "visitante,qrcode,portaria", videoUrl: "https://video.exemplo/visitantes" },
    { slug: "registrar-encomenda", title: "Registro e retirada de encomendas", category: "portaria", body: "A portaria registra a encomenda com transportadora, prateleira e foto opcional. O morador recebe o código de retirada. Na entrega, informe o código, o nome e o documento de quem retirou para gerar a confirmação digital.", tags: "encomenda,retirada" },
    { slug: "livro-ocorrencias", title: "Livro de ocorrências e passagem de turno", category: "portaria", body: "Cada turno registra ocorrências públicas, administrativas ou sigilosas. O registro não pode ser apagado: correções geram nova versão auditada. Ao encerrar o turno, informe pendências e o porteiro que assume.", tags: "ocorrencia,turno,auditoria" },
    { slug: "assembleia-hibrida", title: "Como conduzir uma assembleia híbrida", category: "assembleias", body: "Publique a convocação com pauta e quóruns, colete confirmações e procurações, faça o check-in das unidades e registre a votação por unidade ou fração ideal. Ao final, gere a ata e anexe a gravação.", tags: "assembleia,quorum,ata" },
    { slug: "importar-moradores", title: "Importação de moradores em massa", category: "implantacao", body: "Baixe o modelo CSV, preencha bloco, unidade, nome, e-mail e telefone. O sistema valida duplicidades e formatos antes de confirmar, e registra erros para correção.", tags: "importacao,csv,implantacao" },
  ]);

  await db.insert(importJobs).values([
    { condoId: condoA.id, kind: "moradores", fileName: "moradores-bloco-c.csv", total: 48, succeeded: 46, failed: 2, errors: ["Linha 12: e-mail inválido", "Linha 33: unidade C-999 inexistente"], createdById: sindica.id },
    { condoId: condoB.id, kind: "unidades", fileName: "unidades-torre.csv", total: 72, succeeded: 72, failed: 0, errors: [], createdById: sindicoB.id },
  ]);

  await db.insert(notifications).values([
    { condoId: condoA.id, userId: moradorA.id, title: "Visitante autorizado entrou", body: "Paulo Henrique Dias entrou às 14h e está no condomínio.", link: "/painel/visitantes" },
    { condoId: condoA.id, userId: moradorA.id, title: "Encomenda disponível", body: "Encomenda dos Correios registrada na portaria. Código de retirada disponível.", link: "/painel/encomendas" },
    { condoId: condoA.id, userId: sindica.id, title: "Contrato próximo do vencimento", body: "Manutenção mensal de elevadores vence em 35 dias.", link: "/painel/fornecedores" },
    { condoId: condoA.id, userId: sindica.id, title: "Ocorrência sigilosa registrada", body: "Tentativa de acesso não autorizado registrada pela portaria.", link: "/painel/livro" },
  ]);

  await db.insert(auditLogs).values([
    { condoId: condoA.id, userId: sindica.id, userName: "Marina Duarte", action: "publicar", entity: "comunicado", entityId: "1", summary: "Publicou comunicado sobre manutenção dos elevadores", origin: "painel", ip: "189.22.10.4" },
    { condoId: condoA.id, userId: porteiro1.id, userName: "Carlos Nogueira", action: "checkin", entity: "visita", entityId: "1", summary: "Registrou entrada de Paulo Henrique Dias", origin: "portaria", ip: "10.0.0.22" },
    { condoId: condoA.id, userId: porteiro2.id, userName: "Rita Bezerra", action: "criar", entity: "ocorrencia", entityId: "3", summary: "Registrou ocorrência sigilosa de tentativa de acesso", origin: "portaria", critical: true, ip: "10.0.0.23" },
    { condoId: condoA.id, userId: admin.id, userName: "Rafael Monteiro", action: "acesso_suporte", entity: "condominio", entityId: String(condoA.id), summary: "Acesso de suporte para diagnóstico de importação", origin: "suporte", critical: true, ip: "200.155.3.90" },
  ]);
}
