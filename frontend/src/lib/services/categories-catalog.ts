import type { IconName } from "@/components/icon";

export interface CatalogServiceItem {
  id: string;
  name: string;
  description: string;
  estimatedDurationMinutes: number;
  warrantyDays: number;
  priceFromCents: number;
  priceType: "a_partir" | "fixo" | "por_hora" | "sob_consulta";
}

export interface CatalogCategory {
  id: string;
  name: string;
  description: string;
  icon: IconName;
  services: CatalogServiceItem[];
}

export const OFFICIAL_CATEGORIES: CatalogCategory[] = [
  {
    id: "eletricista",
    name: "Eletricista",
    description: "Instalações elétricas, quadros de distribuição, iluminação, tomadas e reparos.",
    icon: "zap",
    services: [
      {
        id: "ele-01",
        name: "Instalação / Troca de Chuveiro",
        description: "Substituição completa do aparelho, teste de voltagem e fiação adequada.",
        estimatedDurationMinutes: 45,
        warrantyDays: 90,
        priceFromCents: 9000,
        priceType: "a_partir",
      },
      {
        id: "ele-02",
        name: "Instalação de Tomadas e Interruptores",
        description: "Substituição ou adição de novos pontos elétricos padrão ABNT.",
        estimatedDurationMinutes: 30,
        warrantyDays: 90,
        priceFromCents: 5000,
        priceType: "a_partir",
      },
      {
        id: "ele-03",
        name: "Troca de Disjuntor / Revisão de Quadro",
        description: "Diagnóstico de sobrecarga, substituição de disjuntores DIN e balanceamento de fases.",
        estimatedDurationMinutes: 60,
        warrantyDays: 90,
        priceFromCents: 15000,
        priceType: "a_partir",
      },
      {
        id: "ele-04",
        name: "Instalação de Luminárias / Pendentes / Plafons",
        description: "Fixação e ligação elétrica de lustres, spots de LED e luminárias em geral.",
        estimatedDurationMinutes: 40,
        warrantyDays: 90,
        priceFromCents: 7500,
        priceType: "a_partir",
      },
    ],
  },
  {
    id: "encanador",
    name: "Encanador",
    description: "Reparo de vazamentos, torneiras, registros, descargas e desentupimentos.",
    icon: "droplet",
    services: [
      {
        id: "enc-01",
        name: "Reparo / Troca de Torneira ou Misturador",
        description: "Substituição de reparos internos, vedações ou instalação de nova torneira.",
        estimatedDurationMinutes: 30,
        warrantyDays: 90,
        priceFromCents: 7000,
        priceType: "a_partir",
      },
      {
        id: "enc-02",
        name: "Conserto de Caixa Acoplada / Válvula Hydra",
        description: "Ajuste e substituição de mecanismos de descarga para eliminar desperdício de água.",
        estimatedDurationMinutes: 45,
        warrantyDays: 90,
        priceFromCents: 9500,
        priceType: "a_partir",
      },
      {
        id: "enc-03",
        name: "Localização e Conserto de Vazamento",
        description: "Diagnóstico e reparo de tubulações em PVC, CPVC ou cobre.",
        estimatedDurationMinutes: 90,
        warrantyDays: 90,
        priceFromCents: 14000,
        priceType: "a_partir",
      },
      {
        id: "enc-04",
        name: "Desentupimento de Pia, Ralo ou Vaso",
        description: "Desobstrução manual ou mecânica com garantia de fluxo normal.",
        estimatedDurationMinutes: 45,
        warrantyDays: 90,
        priceFromCents: 11000,
        priceType: "a_partir",
      },
    ],
  },
  {
    id: "chaveiro",
    name: "Chaveiro",
    description: "Abertura de portas, troca de segredo, fechaduras digitais e convencionais.",
    icon: "key",
    services: [
      {
        id: "cha-01",
        name: "Abertura de Porta Residencial",
        description: "Abertura emergencial técnica sem danificar a estrutura da porta.",
        estimatedDurationMinutes: 30,
        warrantyDays: 90,
        priceFromCents: 12000,
        priceType: "a_partir",
      },
      {
        id: "cha-02",
        name: "Instalação de Fechadura Digital / Biométrica",
        description: "Furação e instalação de fechaduras eletrônicas inteligentes.",
        estimatedDurationMinutes: 60,
        warrantyDays: 90,
        priceFromCents: 18000,
        priceType: "a_partir",
      },
      {
        id: "cha-03",
        name: "Troca de Miolo / Cilindro e Fechadura",
        description: "Substituição com novas chaves para segurança residencial ou condominial.",
        estimatedDurationMinutes: 35,
        warrantyDays: 90,
        priceFromCents: 8500,
        priceType: "a_partir",
      },
    ],
  },
  {
    id: "pintura",
    name: "Pintura",
    description: "Pintura de paredes, tetos, portas, aplicação de massa e tratamento de umidade.",
    icon: "pencil",
    services: [
      {
        id: "pin-01",
        name: "Pintura de Cômodo Completo",
        description: "Lixamento, aplicação de massa para retoques e duas demãos de tinta.",
        estimatedDurationMinutes: 240,
        warrantyDays: 90,
        priceFromCents: 25000,
        priceType: "a_partir",
      },
      {
        id: "pin-02",
        name: "Retoque de Parede / Manchas de Umidade",
        description: "Tratamento localizado contra mofo e repintura na cor original.",
        estimatedDurationMinutes: 90,
        warrantyDays: 90,
        priceFromCents: 12000,
        priceType: "a_partir",
      },
      {
        id: "pin-03",
        name: "Pintura de Portas e Batentes",
        description: "Esmalte sintético ou base água com acabamento acetinado ou fosco.",
        estimatedDurationMinutes: 120,
        warrantyDays: 90,
        priceFromCents: 9000,
        priceType: "a_partir",
      },
    ],
  },
  {
    id: "instalacoes",
    name: "Instalações",
    description: "Fixação de suporte de TV, varais de teto, prateleiras, espelhos e cortinas.",
    icon: "wrench",
    services: [
      {
        id: "ins-01",
        name: "Instalação de Suporte de TV",
        description: "Fixação segura com nível a laser e buchas adequadas ao tipo de alvenaria.",
        estimatedDurationMinutes: 45,
        warrantyDays: 90,
        priceFromCents: 8000,
        priceType: "a_partir",
      },
      {
        id: "ins-02",
        name: "Instalação de Varal de Teto ou Parede",
        description: "Fixação e passagem de cordas com regulagem suave de roldanas.",
        estimatedDurationMinutes: 50,
        warrantyDays: 90,
        priceFromCents: 9000,
        priceType: "a_partir",
      },
      {
        id: "ins-03",
        name: "Instalação de Prateleiras / Espelhos / Cortinas",
        description: "Furação precisa com alinhamento perfeito e limpeza dos resíduos.",
        estimatedDurationMinutes: 40,
        warrantyDays: 90,
        priceFromCents: 6500,
        priceType: "a_partir",
      },
    ],
  },
  {
    id: "ar_condicionado",
    name: "Ar-condicionado",
    description: "Higienização profunda, instalação Split, recarga de gás e manutenção.",
    icon: "wind",
    services: [
      {
        id: "ac-01",
        name: "Higienização e Limpeza Completa de Split",
        description: "Limpeza bactericida da evaporadora, filtros e verificação da drenagem.",
        estimatedDurationMinutes: 60,
        warrantyDays: 90,
        priceFromCents: 13000,
        priceType: "a_partir",
      },
      {
        id: "ac-02",
        name: "Recarga de Gás Refrigerante (R410A / R32)",
        description: "Teste de pressão, eliminação de micro-vazamentos e carga conforme fabricante.",
        estimatedDurationMinutes: 70,
        warrantyDays: 90,
        priceFromCents: 18000,
        priceType: "a_partir",
      },
      {
        id: "ac-03",
        name: "Instalação de Ar-condicionado Split",
        description: "Instalação de unidade interna e condensadora externa com tubulação em cobre.",
        estimatedDurationMinutes: 180,
        warrantyDays: 90,
        priceFromCents: 45000,
        priceType: "a_partir",
      },
    ],
  },
  {
    id: "limpeza",
    name: "Limpeza",
    description: "Limpeza pós-obra, higienização de sofás e carpetes, e limpeza técnica predial.",
    icon: "sparkles",
    services: [
      {
        id: "lim-01",
        name: "Limpeza Pós-Obra Especializada",
        description: "Remoção de respingos de tinta, rejuntes, poeira pesada e resíduos de reforma.",
        estimatedDurationMinutes: 300,
        warrantyDays: 90,
        priceFromCents: 35000,
        priceType: "a_partir",
      },
      {
        id: "lim-02",
        name: "Higienização de Estofados e Sofás",
        description: "Lavagem a seco/extração profunda com produtos certificados antimicrobianos.",
        estimatedDurationMinutes: 90,
        warrantyDays: 90,
        priceFromCents: 16000,
        priceType: "a_partir",
      },
      {
        id: "lim-03",
        name: "Limpeza de Vidros e Fachadas",
        description: "Limpeza técnica interna e externa de esquadrias e panos de vidro.",
        estimatedDurationMinutes: 120,
        warrantyDays: 90,
        priceFromCents: 15000,
        priceType: "a_partir",
      },
    ],
  },
  {
    id: "jardinagem",
    name: "Jardinagem",
    description: "Poda de plantas, corte de grama, controle de pragas e paisagismo condominial.",
    icon: "sparkles",
    services: [
      {
        id: "jar-01",
        name: "Manutenção e Poda de Jardim",
        description: "Corte de grama, remoção de ervas daninhas e adubação orgânica.",
        estimatedDurationMinutes: 180,
        warrantyDays: 90,
        priceFromCents: 18000,
        priceType: "a_partir",
      },
      {
        id: "jar-02",
        name: "Poda de Pequenas e Médias Árvores",
        description: "Poda preventiva de galhos e contenção conforme normas ambientais.",
        estimatedDurationMinutes: 120,
        warrantyDays: 90,
        priceFromCents: 22000,
        priceType: "a_partir",
      },
    ],
  },
  {
    id: "manutencao_predial",
    name: "Manutenção predial",
    description: "Alvenaria, impermeabilização, reparo de calçadas, telhados e vistorias gerais.",
    icon: "building",
    services: [
      {
        id: "mp-01",
        name: "Revisão e Impermeabilização de Telhados / Lajes",
        description: "Aplicação de manta asfáltica, vedação de rufos e substituição de telhas.",
        estimatedDurationMinutes: 240,
        warrantyDays: 90,
        priceFromCents: 38000,
        priceType: "a_partir",
      },
      {
        id: "mp-02",
        name: "Reparo de Trincas e Reboco em Áreas Comuns",
        description: "Abertura técnica em V, tratamento de fissuras e acabamento com argamassa.",
        estimatedDurationMinutes: 180,
        warrantyDays: 90,
        priceFromCents: 19000,
        priceType: "a_partir",
      },
    ],
  },
  {
    id: "reparos_gerais",
    name: "Reparos gerais",
    description: "Marido de aluguel: pequenos consertos hidráulicos, elétricos e marcenaria.",
    icon: "wrench",
    services: [
      {
        id: "rep-01",
        name: "Pacote 2 Horas de Reparos Gerais",
        description: "Atendimento flexível para pequenos ajustes: portas, trincos, silicone, tomadas.",
        estimatedDurationMinutes: 120,
        warrantyDays: 90,
        priceFromCents: 14000,
        priceType: "a_partir",
      },
      {
        id: "rep-02",
        name: "Regulagem de Portas e Janelas",
        description: "Ajuste de dobradiças, alinhamento de esquadrias e troca de roldanas.",
        estimatedDurationMinutes: 45,
        warrantyDays: 90,
        priceFromCents: 7500,
        priceType: "a_partir",
      },
    ],
  },
  {
    id: "seguranca_eletronica",
    name: "Câmeras e segurança eletrônica",
    description: "Instalação e manutenção de CFTV, alarmes, interfonia e controle de acesso.",
    icon: "shield",
    services: [
      {
        id: "seg-01",
        name: "Instalação / Configuração de Câmera CFTV IP",
        description: "Cabeamento, fixação e configuração no DVR / NVR e aplicativo móvel.",
        estimatedDurationMinutes: 60,
        warrantyDays: 90,
        priceFromCents: 11000,
        priceType: "a_partir",
      },
      {
        id: "seg-02",
        name: "Manutenção de Interfonia Condominial",
        description: "Teste de ramais, identificação de curto na fiação e conserto de interfone.",
        estimatedDurationMinutes: 90,
        warrantyDays: 90,
        priceFromCents: 15000,
        priceType: "a_partir",
      },
    ],
  },
  {
    id: "portoes_eletronicos",
    name: "Portões eletrônicos",
    description: "Motores basculantes e deslizantes, troca de cabos de aço e placas de comando.",
    icon: "lock",
    services: [
      {
        id: "por-01",
        name: "Manutenção Preventiva / Ajuste de Motor de Portão",
        description: "Lubrificação, alinhamento de cremalheira e calibração de fim de curso.",
        estimatedDurationMinutes: 60,
        warrantyDays: 90,
        priceFromCents: 13000,
        priceType: "a_partir",
      },
      {
        id: "por-02",
        name: "Troca de Cabo de Aço de Portão Basculante",
        description: "Substituição do par de cabos com regulagem do contrapeso de segurança.",
        estimatedDurationMinutes: 90,
        warrantyDays: 90,
        priceFromCents: 21000,
        priceType: "a_partir",
      },
    ],
  },
  {
    id: "bombas_hidraulicas",
    name: "Bombas hidráulicas",
    description: "Revisão e manutenção de bombas de recalque, esgoto, poço e pressurizadores.",
    icon: "droplet",
    services: [
      {
        id: "bom-01",
        name: "Vistoria e Manutenção de Bomba de Recalque",
        description: "Inspeção de ruídos, gaxetas, vedações e quadro de comando automático.",
        estimatedDurationMinutes: 90,
        warrantyDays: 90,
        priceFromCents: 22000,
        priceType: "a_partir",
      },
      {
        id: "bom-02",
        name: "Instalação / Reparo de Pressurizador Predial",
        description: "Conexão hidráulica e elétrica com calibração do fluxostato/pressostato.",
        estimatedDurationMinutes: 80,
        warrantyDays: 90,
        priceFromCents: 18000,
        priceType: "a_partir",
      },
    ],
  },
  {
    id: "servicos_tecnicos",
    name: "Serviços técnicos",
    description: "Laudos técnicos, emissão de ART/RRT, vistoria de entrega e consultoria de engenharia.",
    icon: "clipboard",
    services: [
      {
        id: "st-01",
        name: "Vistoria Técnica com Emissão de Laudo / ART",
        description: "Inspeção por profissional habilitado (CREA/CFT) com relatório fotográfico.",
        estimatedDurationMinutes: 180,
        warrantyDays: 90,
        priceFromCents: 45000,
        priceType: "a_partir",
      },
    ],
  },
];

export function getCategoryById(id: string): CatalogCategory | undefined {
  return OFFICIAL_CATEGORIES.find((c) => c.id.toLowerCase() === id.toLowerCase());
}

export function getAllServices(): (CatalogServiceItem & { categoryId: string; categoryName: string })[] {
  return OFFICIAL_CATEGORIES.flatMap((c) =>
    c.services.map((s) => ({
      ...s,
      categoryId: c.id,
      categoryName: c.name,
    }))
  );
}
