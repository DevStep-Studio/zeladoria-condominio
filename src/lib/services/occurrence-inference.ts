/**
 * Heurísticas de Inferência de Ocorrências
 * 
 * Analisa a descrição do morador para extrair:
 * 1. Título curto e conciso sugerido
 * 2. Categoria (entre as 15 categorias oficiais do sistema)
 * 3. Severidade sugerida (baixa, media, alta, urgente)
 * 4. Detecção preventiva de risco/emergência (incêndio, gás, choque, elevador com pessoas presas)
 */

export type OccurrenceCategoryKey =
  | "iluminacao"
  | "vazamento"
  | "hidraulica"
  | "eletrica"
  | "elevador"
  | "portao"
  | "garagem"
  | "limpeza"
  | "seguranca"
  | "piscina"
  | "jardinagem"
  | "estrutura"
  | "infiltracao"
  | "ruido"
  | "outros";

export interface CategoryDefinition {
  key: OccurrenceCategoryKey;
  label: string;
  icon: string;
  description: string;
  keywords: string[];
}

export const CATEGORIES_CATALOG: CategoryDefinition[] = [
  {
    key: "iluminacao",
    label: "Iluminação",
    icon: "sun",
    description: "Lâmpadas, luminárias, refletores e luzes apagadas ou piscando",
    keywords: [
      "lâmpada", "lampada", "lampadas", "lâmpadas", "luz", "luzes", "refletor", "refletores",
      "apagada", "apagado", "piscando", "luminária", "luminaria", "luminarias", "led", "spot",
      "lustre", "escuro", "escuridão", "poste", "arandela", "queimada", "queimou a luz", "luz queimada"
    ],
  },
  {
    key: "vazamento",
    label: "Vazamento",
    icon: "droplet",
    description: "Vazamento ativo de água, goteiras, canos estourados ou poças",
    keywords: [
      "vazamento", "vazando", "vazar", "goteira", "goteiras", "pingando", "pinga", "pingando água",
      "escorrendo", "poça", "alagando", "inundando", "cano estourou", "esguichando", "vaza"
    ],
  },
  {
    key: "hidraulica",
    label: "Hidráulica",
    icon: "droplet",
    description: "Canos, torneiras, registros, descargas, esgoto e abastecimento de água",
    keywords: [
      "cano", "canos", "torneira", "torneiras", "registro", "registros", "descarga", "vaso",
      "sanitário", "sanitario", "privada", "ralo", "ralos", "sifão", "sifao", "encanamento",
      "encanador", "esgoto", "entupido", "entupida", "entupimento", "sem água", "falta de água",
      "pressão de água", "caixa d'água", "bóia"
    ],
  },
  {
    key: "eletrica",
    label: "Elétrica",
    icon: "zap",
    description: "Tomadas, disjuntores, fiação, curto-circuito e quadros de força",
    keywords: [
      "tomada", "tomadas", "disjuntor", "disjuntores", "curto", "curto-circuito", "faísca",
      "faisca", "fiação", "fiacao", "fio solto", "fio desencapado", "quadro de energia",
      "quadro de luz", "chave geral", "sem energia", "falta de luz no bloco", "queda de energia",
      "estalo elétrico", "choque"
    ],
  },
  {
    key: "elevador",
    label: "Elevador",
    icon: "panel",
    description: "Elevadores parados, barulhos, desnível ou portas travadas",
    keywords: [
      "elevador", "elevadores", "cabine", "porta do elevador", "travado no andar", "desnivelado",
      "botão do elevador", "painel do elevador", "parou entre andares", "tranco", "elevador social",
      "elevador de serviço"
    ],
  },
  {
    key: "portao",
    label: "Portão",
    icon: "lock",
    description: "Portões de pedestre e veículos, motores, cancelas e fechaduras",
    keywords: [
      "portão", "portao", "portões", "cancela", "motor do portão", "trava", "tranca", "não fecha",
      "não abre", "bateu o portão", "fechadura", "catraca", "tag", "sensor do portão"
    ],
  },
  {
    key: "garagem",
    label: "Garagem",
    icon: "truck",
    description: "Vagas, manobras, manchas de óleo, demarcações e subsolo",
    keywords: [
      "garagem", "vaga", "vagas", "estacionamento", "carro parado", "óleo", "oleo", "mancha de óleo",
      "subsolo", "vaga presa", "bloqueando passagem", "cone", "demarcação de vaga", "espelho convexo"
    ],
  },
  {
    key: "limpeza",
    label: "Limpeza",
    icon: "sparkles",
    description: "Lixo, sujeira, odores desagradáveis e conservação de áreas",
    keywords: [
      "sujeira", "sujo", "suja", "lixo", "lixeira", "lixeiras", "mau cheiro", "cheiro ruim",
      "entulho", "chão grudento", "mancha no piso", "vômito", "vomito", "fezes", "xixi de pet",
      "limpar", "faxina", "varrer", "poeira excessiva"
    ],
  },
  {
    key: "seguranca",
    label: "Segurança",
    icon: "shield",
    description: "Acessos não autorizados, câmeras, interfonia e portaria",
    keywords: [
      "segurança", "seguranca", "suspeito", "estranho", "invasão", "invasor", "arrombamento",
      "câmera", "camera", "câmeras", "interfone", "sem interfone", "alarme", "cerca elétrica",
      "vigilância", "portaria deserta", "portaria"
    ],
  },
  {
    key: "piscina",
    label: "Piscina",
    icon: "activity",
    description: "Água da piscina, bordas, bombas, duchas e deck",
    keywords: [
      "piscina", "piscinas", "água verde", "cloro", "borda da piscina", "filtro da piscina",
      "bomba da piscina", "deck", "espreguiçadeira", "ducha da piscina", "guarda-sol"
    ],
  },
  {
    key: "jardinagem",
    label: "Jardinagem",
    icon: "globe",
    description: "Gramado, canteiros, podas de árvores, galhos e plantas",
    keywords: [
      "jardim", "jardins", "grama", "gramado", "planta", "plantas", "árvore", "arvore", "galho",
      "galhos", "poda", "podar", "folhagem", "canteiro", "vaso quebrado", "mato alto"
    ],
  },
  {
    key: "estrutura",
    label: "Estrutura",
    icon: "building",
    description: "Rachaduras, pisos soltos, forros, corrimãos e alvenaria",
    keywords: [
      "rachadura", "trinca", "fissura", "reboco", "gesso caindo", "forro", "teto caído",
      "corrimão", "corrimao", "degrau", "escada", "piso solto", "azulejo", "alvenaria",
      "porta quebrada", "vidro trincado", "janela quebrada"
    ],
  },
  {
    key: "infiltracao",
    label: "Infiltração",
    icon: "droplet",
    description: "Umidade nas paredes, bolor, mofo e descolamento de pintura",
    keywords: [
      "infiltração", "infiltracao", "mofo", "bolor", "umidade", "parede úmida", "teto manchado",
      "descascando tinta", "tinta descascando", "salitre", "paredes úmidas"
    ],
  },
  {
    key: "ruido",
    label: "Ruído",
    icon: "bell",
    description: "Barulho excessivo, som alto, festas, obras fora de horário",
    keywords: [
      "barulho", "ruído", "ruido", "som alto", "música alta", "festa", "gritaria", "latido",
      "cachorro latindo", "furadeira", "obra", "martelo", "fora de hora", "salto alto", "eco"
    ],
  },
  {
    key: "outros",
    label: "Outros",
    icon: "more",
    description: "Demais ocorrências e solicitações gerais",
    keywords: ["outro", "outros", "geral", "diversos", "solicitação"],
  },
];

export interface EmergencySignal {
  isEmergency: boolean;
  reason?: string;
  advice: string;
}

const EMERGENCY_KEYWORDS = [
  { trigger: "incêndio", reason: "Possível princípio de incêndio" },
  { trigger: "incendio", reason: "Possível princípio de incêndio" },
  { trigger: "fogo", reason: "Presença de fogo detectada" },
  { trigger: "fumaça preta", reason: "Fumaça densa identificada" },
  { trigger: "fumaca preta", reason: "Fumaça densa identificada" },
  { trigger: "cheiro de gás", reason: "Possível vazamento de gás" },
  { trigger: "cheiro de gas", reason: "Possível vazamento de gás" },
  { trigger: "vazamento de gás", reason: "Vazamento de gás ativo" },
  { trigger: "pessoa presa", reason: "Pessoa retida no elevador" },
  { trigger: "preso no elevador", reason: "Pessoa presa no elevador" },
  { trigger: "presa no elevador", reason: "Pessoa presa no elevador" },
  { trigger: "choque elétrico", reason: "Risco grave de choque elétrico" },
  { trigger: "fio desencapado soltando faísca", reason: "Curto de alto risco" },
  { trigger: "desabamento", reason: "Risco estrutural grave" },
];

/**
 * Detecta se a descrição contém sinais de urgência ou emergência imediata
 */
export function detectEmergency(text: string): EmergencySignal {
  if (!text) return { isEmergency: false, advice: "" };
  const lower = text.toLowerCase();

  for (const item of EMERGENCY_KEYWORDS) {
    if (lower.includes(item.trigger)) {
      return {
        isEmergency: true,
        reason: item.reason,
        advice: "Se houver risco iminente à vida ou ao condomínio, acione a portaria ou os serviços de emergência (Bombeiros 193 / SAMU 192).",
      };
    }
  }

  return { isEmergency: false, advice: "" };
}

/**
 * Infere a categoria mais provável a partir do texto
 */
export function inferCategory(text: string): CategoryDefinition {
  if (!text || text.trim().length === 0) {
    return CATEGORIES_CATALOG.find((c) => c.key === "iluminacao") || CATEGORIES_CATALOG[0];
  }

  const lower = text.toLowerCase();

  let bestMatch: CategoryDefinition = CATEGORIES_CATALOG[0];
  let highestScore = 0;

  for (const cat of CATEGORIES_CATALOG) {
    let score = 0;
    for (const kw of cat.keywords) {
      if (lower.includes(kw)) {
        // Frases exatas ganham peso maior que palavras soltas
        score += kw.includes(" ") ? 3 : 1;
      }
    }

    if (score > highestScore) {
      highestScore = score;
      bestMatch = cat;
    }
  }

  // Se nenhum keyword pontuou, se contém "vaza" cai em vazamento, senão "iluminacao" como default amigável
  if (highestScore === 0) {
    return CATEGORIES_CATALOG.find((c) => c.key === "iluminacao") || CATEGORIES_CATALOG[0];
  }

  return bestMatch;
}

/**
 * Infere a severidade sugerida para a ocorrência
 */
export function inferSeverity(text: string): "baixa" | "media" | "alta" | "urgente" {
  if (!text) return "media";
  const lower = text.toLowerCase();

  // Urgência máxima
  if (
    lower.includes("incêndio") ||
    lower.includes("fogo") ||
    lower.includes("gás") ||
    lower.includes("pessoa presa") ||
    lower.includes("choque") ||
    lower.includes("desabamento")
  ) {
    return "urgente";
  }

  // Alta prioridade
  if (
    lower.includes("vazamento forte") ||
    lower.includes("vazando muito") ||
    lower.includes("estourou") ||
    lower.includes("elevador parado") ||
    lower.includes("sem água") ||
    lower.includes("sem luz") ||
    lower.includes("portão travado") ||
    lower.includes("portão quebrado") ||
    lower.includes("inundando") ||
    lower.includes("alagando")
  ) {
    return "alta";
  }

  // Baixa prioridade
  if (
    lower.includes("sugestão") ||
    lower.includes("ajuste simples") ||
    lower.includes("planta") ||
    lower.includes("grama alta") ||
    lower.includes("estético")
  ) {
    return "baixa";
  }

  return "media";
}

/**
 * Gera automaticamente um título curto, conciso e profissional a partir da descrição
 */
export function generateSuggestedTitle(description: string, categoryLabel?: string): string {
  if (!description || !description.trim()) {
    return categoryLabel ? `Ocorrência de ${categoryLabel}` : "Nova Ocorrência";
  }

  let clean = description.trim();

  // Remove quebras de linha múltiplas
  clean = clean.replace(/\r?\n+/g, " ");

  // Remove saudações e prefixos coloquiais comuns
  const prefixesToRemove = [
    /^olá,?\s*/i,
    /^oi,?\s*/i,
    /^boa tarde,?\s*/i,
    /^bom dia,?\s*/i,
    /^boa noite,?\s*/i,
    /^gostaria de (informar|avisar|relatar) que\s*/i,
    /^queria avisar que\s*/i,
    /^venho por meio desta informar que\s*/i,
    /^estou reportando que\s*/i,
    /^aconteceu que\s*/i,
    /^por favor,?\s*(verificar|checar)\s*/i,
    /^tem um(a)?\s+/i,
    /^há um(a)?\s+/i,
    /^está tendo\s+/i,
  ];

  for (const regex of prefixesToRemove) {
    clean = clean.replace(regex, "");
  }

  // Pega a primeira oração ou ponto final
  const firstSentence = clean.split(/[.!?;\n]/)[0].trim();
  let candidate = firstSentence || clean;

  // Se for muito longa, corta respeitando palavras
  if (candidate.length > 55) {
    const trimmed = candidate.slice(0, 52);
    const lastSpace = trimmed.lastIndexOf(" ");
    candidate = (lastSpace > 20 ? trimmed.slice(0, lastSpace) : trimmed) + "...";
  }

  // Se a primeira frase ficou muito curta (ex: "olha só"), usa fallback com a categoria
  if (candidate.length < 5) {
    return categoryLabel ? `Ocorrência de ${categoryLabel}` : "Nova ocorrência registrada";
  }

  // Primeira letra maiúscula
  return candidate.charAt(0).toUpperCase() + candidate.slice(1);
}
