import { calculateProviderScore } from "./ranking";

export interface ServiceOffering {
  id: string;
  name: string;
  description: string;
  priceFrom: number;
  priceLabel?: string;
  unit?: string;
}

export interface PortfolioItem {
  id: string;
  title: string;
  category: string;
  imageUrl: string;
  description: string;
}

export interface VerifiedReview {
  id: string;
  authorName: string;
  unit: string;
  rating: number;
  comment: string;
  serviceDone: string;
  date: string;
  isVerifiedResident: boolean;
}

export interface MarketplaceProvider {
  id: number;
  name: string;
  company: string;
  category: string;
  rating: number;
  reviewsCount: number;
  score: number;
  isSponsored?: boolean;
  isPremium?: boolean;
  isVerified?: boolean;
  fastResponse?: boolean;
  availableToday?: boolean;
  nextAvailableSlot: string;
  responseTime: string;
  responseTimeMinutes: number;
  experienceYears: number;
  completionRate: number;
  startingPrice: number;
  regionCoverage: string;
  phone: string;
  bio: string;
  avatarUrl?: string;
  portfolio: PortfolioItem[];
  servicesOffered: ServiceOffering[];
  reviews: VerifiedReview[];
  ratingDistribution: { 5: number; 4: number; 3: number; 2: number; 1: number };
}

export const CATEGORIES_CONFIG = [
  { id: "Todas", name: "Todas as categorias", icon: "grid" as const, count: 8 },
  { id: "Elétrica", name: "Elétrica", icon: "zap" as const, count: 2 },
  { id: "Hidráulica", name: "Hidráulica", icon: "droplet" as const, count: 2 },
  { id: "Climatização", name: "Climatização", icon: "wind" as const, count: 1 },
  { id: "Pintura", name: "Pintura", icon: "pencil" as const, count: 1 },
  { id: "Marcenaria", name: "Marcenaria", icon: "wrench" as const, count: 1 },
  { id: "Carpintaria", name: "Carpintaria", icon: "hammer" as const, count: 1 },
  { id: "Segurança", name: "Segurança", icon: "shield" as const, count: 1 },
  { id: "Limpeza", name: "Limpeza", icon: "sparkles" as const, count: 1 },
];

const RAW_PROVIDERS: Omit<MarketplaceProvider, "score">[] = [
  {
    id: 1,
    name: "Carlos Eduardo Silva",
    company: "Volt & Luz Soluções Elétricas",
    category: "Elétrica",
    rating: 4.9,
    reviewsCount: 128,
    isSponsored: true,
    isPremium: true,
    isVerified: true,
    fastResponse: true,
    availableToday: true,
    nextAvailableSlot: "Hoje às 14:30",
    responseTime: "15 min",
    responseTimeMinutes: 15,
    experienceYears: 12,
    completionRate: 99,
    startingPrice: 80,
    regionCoverage: "Atende seu condomínio e raio de 10 km",
    phone: "(11) 98765-4321",
    bio: "Engenheiro Eletricista com mais de 12 anos de experiência residencial e predial. Especialista em quadros de distribuição modernos, substituição de fiação antiga, reparo de curto-circuitos e iluminação em LED com alta eficiência.",
    avatarUrl: "https://images.unsplash.com/photo-1540569014015-19a7be504e3a?w=200&h=200&fit=crop&crop=faces&q=80",
    servicesOffered: [
      { id: "e1", name: "Instalação de Chuveiro / Ducha", description: "Instalação completa com teste de carga e conector cerâmico", priceFrom: 90 },
      { id: "e2", name: "Troca de Disjuntor no Quadro", description: "Substituição e dimensionamento correto para evitar desarmes", priceFrom: 80 },
      { id: "e3", name: "Instalação de Luminárias e Pendentes", description: "Fixação e alinhamento em laje ou forro de gesso", priceFrom: 70 },
      { id: "e4", name: "Revisão Geral e Eliminação de Curto", description: "Diagnóstico com multímetro e termografia digital", priceFrom: 140 },
    ],
    portfolio: [
      {
        id: "p1",
        title: "Quadro de Distribuição Residencial",
        category: "Elétrica",
        imageUrl: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=800&h=600&fit=crop&q=80",
        description: "Reorganização completa de barramento e identificação de circuitos com disjuntores DIN."
      },
      {
        id: "p2",
        title: "Iluminação Linear em Forro de Gesso",
        category: "Elétrica",
        imageUrl: "https://images.unsplash.com/photo-1513694203232-719a280e022f?w=800&h=600&fit=crop&q=80",
        description: "Instalação de perfis de LED e circuitos dimerizáveis em sala integrada."
      },
    ],
    reviews: [
      {
        id: "r1",
        authorName: "Ana Ribeiro",
        unit: "Apto 302",
        rating: 5,
        serviceDone: "Substituição de disjuntor geral e chuveiro",
        comment: "Excelente profissional! Chegou exatamente no horário marcado, com todas as ferramentas e testou a voltagem várias vezes. Recomendo de olhos fechados!",
        date: "Há 4 dias",
        isVerifiedResident: true,
      },
      {
        id: "r2",
        authorName: "Lucas Mendes",
        unit: "Apto 104",
        rating: 5,
        serviceDone: "Instalação de luminárias na sala",
        comment: "Trabalho impecável e muito limpo. O forro de gesso não sofreu nenhum dano. Super atencioso.",
        date: "Há 2 semanas",
        isVerifiedResident: true,
      },
      {
        id: "r3",
        authorName: "Marina Duarte (Síndica)",
        unit: "Apto 501",
        rating: 5,
        serviceDone: "Manutenção do quadro elétrico do salão de festas",
        comment: "Carlos presta serviços para o condomínio há mais de um ano, sempre com notas fiscais e garantia técnica.",
        date: "Há 1 mês",
        isVerifiedResident: true,
      }
    ],
    ratingDistribution: { 5: 118, 4: 8, 3: 2, 2: 0, 1: 0 },
  },
  {
    id: 2,
    name: "AquaFix Manutenções",
    company: "AquaFix Engenharia Hidráulica",
    category: "Hidráulica",
    rating: 4.8,
    reviewsCount: 94,
    isSponsored: true,
    isPremium: true,
    isVerified: true,
    fastResponse: true,
    availableToday: true,
    nextAvailableSlot: "Hoje às 16:00",
    responseTime: "20 min",
    responseTimeMinutes: 20,
    experienceYears: 9,
    completionRate: 98,
    startingPrice: 90,
    regionCoverage: "Atende seu condomínio e bairros adjacentes",
    phone: "(11) 97654-3210",
    bio: "Especialistas em caça-vazamentos não destrutivos com geofone eletrônico, desentupimentos de alta pressão, reparo de caixas acopladas, registros e troca de tubulações de água quente e fria.",
    avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=faces&q=80",
    servicesOffered: [
      { id: "h1", name: "Caça-Vazamento Não Destrutivo", description: "Localização de infiltrações ocultas sem quebrar azulejos", priceFrom: 180 },
      { id: "h2", name: "Troca e Reparo de Caixa Acoplada", description: "Substituição de obturador, torre de entrada e boia", priceFrom: 90 },
      { id: "h3", name: "Desentupimento de Pia e Ralo", description: "Limpeza mecânica e eliminação de maus odores", priceFrom: 110 },
      { id: "h4", name: "Troca de Registro de Pressão e Gaveta", description: "Troca do reparo com vedação garantida", priceFrom: 120 },
    ],
    portfolio: [
      {
        id: "p3",
        title: "Substituição de Coluna Hidráulica",
        category: "Hidráulica",
        imageUrl: "https://images.unsplash.com/photo-1585704032915-c3400ca199e7?w=800&h=600&fit=crop&q=80",
        description: "Substituição preventiva de tubulação galvanizada por PPR termofusão."
      },
      {
        id: "p4",
        title: "Reparo em Registro Monocomando",
        category: "Hidráulica",
        imageUrl: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=800&h=600&fit=crop&q=80",
        description: "Revisão e troca de cartucho cerâmico sem vazamentos."
      },
    ],
    reviews: [
      {
        id: "r4",
        authorName: "Rodrigo Silveira",
        unit: "Apto 802",
        rating: 5,
        serviceDone: "Conserto de vazamento oculto no banheiro",
        comment: "Identificaram o vazamento em 20 minutos com o aparelho eletrônico e só abriram um quadradinho mínimo no rejunte. Sensacional.",
        date: "Ontem",
        isVerifiedResident: true,
      },
      {
        id: "r5",
        authorName: "Fernanda Costa",
        unit: "Apto 203",
        rating: 4,
        serviceDone: "Troca de torneira gourmet da cozinha",
        comment: "Muito profissionais e rápidos. O valor foi justo e não ficou nenhum respingo.",
        date: "Há 3 semanas",
        isVerifiedResident: true,
      }
    ],
    ratingDistribution: { 5: 82, 4: 10, 3: 2, 2: 0, 1: 0 },
  },
  {
    id: 3,
    name: "Roberto Marcenaria",
    company: "Arte em Madeira Studio",
    category: "Marcenaria",
    rating: 5.0,
    reviewsCount: 67,
    isVerified: true,
    fastResponse: false,
    availableToday: false,
    nextAvailableSlot: "Amanhã às 09:00",
    responseTime: "1h",
    responseTimeMinutes: 60,
    experienceYears: 16,
    completionRate: 100,
    startingPrice: 120,
    regionCoverage: "Atende seu condomínio",
    phone: "(11) 96543-2109",
    bio: "Marceneiro de ofício há 16 anos. Especialista em ajustes de portas de armários planejados, restauração de gavetas com corrediças telescópicas e amortecimento, painéis ripados e móveis sob medida.",
    avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop&crop=faces&q=80",
    servicesOffered: [
      { id: "m1", name: "Ajuste de Dobradiças e Portas", description: "Alinhamento de portas caídas com dobradiças com amortecedor", priceFrom: 120 },
      { id: "m2", name: "Troca de Corrediças de Gaveta", description: "Substituição de trilhos emperrados por corrediças suaves", priceFrom: 95 },
      { id: "m3", name: "Instalação de Painel de TV / Ripado", description: "Fixação reforçada com passagem oculta de fiação", priceFrom: 180 },
    ],
    portfolio: [
      {
        id: "p5",
        title: "Armário de Cozinha Restaurado",
        category: "Marcenaria",
        imageUrl: "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=800&h=600&fit=crop&q=80",
        description: "Troca de ferragens antigas por sistema de amortecimento Blum e fechamento suave."
      }
    ],
    reviews: [
      {
        id: "r6",
        authorName: "Carla Penteado",
        unit: "Apto 604",
        rating: 5,
        serviceDone: "Ajuste em todas as portas de armários do closet",
        comment: "O Roberto é um artista. Tudo agora abre e fecha com um toque suave, sem barulho. Nota 10!",
        date: "Há 1 semana",
        isVerifiedResident: true,
      }
    ],
    ratingDistribution: { 5: 67, 4: 0, 3: 0, 2: 0, 1: 0 },
  },
  {
    id: 4,
    name: "ClimaPrime Ar Condicionado",
    company: "ClimaPrime Engenharia Térmica",
    category: "Climatização",
    rating: 4.9,
    reviewsCount: 82,
    isPremium: true,
    isVerified: true,
    fastResponse: true,
    availableToday: true,
    nextAvailableSlot: "Hoje às 15:00",
    responseTime: "30 min",
    responseTimeMinutes: 30,
    experienceYears: 8,
    completionRate: 97,
    startingPrice: 150,
    regionCoverage: "Atende seu condomínio e região metropolitana",
    phone: "(11) 95432-1098",
    bio: "Empresa credenciada pelas principais fabricantes (Daikin, LG, Samsung). Realizamos higienização química profunda antibactericida, carga de gás ecológica, consertos de placas inverter e instalação de drenos embutidos.",
    avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop&crop=faces&q=80",
    servicesOffered: [
      { id: "c1", name: "Higienização Química Antibacteriana", description: "Limpeza de serpentina, turbina e bandejas com laudo", priceFrom: 150 },
      { id: "c2", name: "Carga de Gás R410A / R32", description: "Recarga por balança de precisão com teste de estanqueidade", priceFrom: 180 },
      { id: "c3", name: "Desentupimento de Dreno", description: "Eliminação de goteiras internas e limpeza de mangueiras", priceFrom: 120 },
    ],
    portfolio: [
      {
        id: "p6",
        title: "Higienização Profunda em Ar Split",
        category: "Climatização",
        imageUrl: "https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=800&h=600&fit=crop&q=80",
        description: "Bolsa coletora profissional sem sujar paredes ou piso do morador."
      }
    ],
    reviews: [
      {
        id: "r7",
        authorName: "Marcelo Dantas",
        unit: "Apto 402",
        rating: 5,
        serviceDone: "Limpeza de 2 aparelhos de ar-condicionado",
        comment: "Usaram bolsa protetora e não caiu uma gota de água na parede. O cheiro de ar fresco voltou na hora.",
        date: "Há 5 dias",
        isVerifiedResident: true,
      }
    ],
    ratingDistribution: { 5: 75, 4: 6, 3: 1, 2: 0, 1: 0 },
  },
  {
    id: 5,
    name: "Diego Pinturas & Texturas",
    company: "Color Master Residencial",
    category: "Pintura",
    rating: 4.8,
    reviewsCount: 53,
    isVerified: true,
    availableToday: true,
    nextAvailableSlot: "Hoje às 17:00",
    responseTime: "45 min",
    responseTimeMinutes: 45,
    experienceYears: 7,
    completionRate: 96,
    startingPrice: 100,
    regionCoverage: "Atende seu condomínio",
    phone: "(11) 94321-0987",
    bio: "Pintura residencial fina sem sujeira. Proteção completa de rodapés, tomadas e pisos com lona plástica e papelão ondulado. Especialista em massa corrida, cimento queimado e retoques de drywall.",
    avatarUrl: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=200&h=200&fit=crop&crop=faces&q=80",
    servicesOffered: [
      { id: "p1", name: "Pintura de Cômodo Completo", description: "Paredes e teto com duas demãos de tinta acrílica lavável", priceFrom: 220 },
      { id: "p2", name: "Tratamento de Infiltração e Mofo", description: "Aplicação de fundo preparador e antimofo impermeável", priceFrom: 130 },
      { id: "p3", name: "Retoque de Furos e Massa Corrida", description: "Nivelamento e lixamento com aspirador acoplado", priceFrom: 100 },
    ],
    portfolio: [
      {
        id: "p7",
        title: "Paredes com Cimento Queimado",
        category: "Pintura",
        imageUrl: "https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=800&h=600&fit=crop&q=80",
        description: "Aplicação em sala com acabamento aveludado e uniforme."
      }
    ],
    reviews: [
      {
        id: "r8",
        authorName: "Patricia Bueno",
        unit: "Apto 901",
        rating: 5,
        serviceDone: "Pintura da suíte máster e tratamento de teto",
        comment: "Muito caprichoso! Cobriu todos os móveis e não deixou cheiro forte. Entrega rápida.",
        date: "Há 1 semana",
        isVerifiedResident: true,
      }
    ],
    ratingDistribution: { 5: 45, 4: 7, 3: 1, 2: 0, 1: 0 },
  },
  {
    id: 6,
    name: "SegurMax Portaria & CFTV",
    company: "SegurMax Soluções Inteligentes",
    category: "Segurança",
    rating: 4.9,
    reviewsCount: 45,
    isPremium: true,
    isVerified: true,
    availableToday: true,
    nextAvailableSlot: "Hoje às 13:00",
    responseTime: "25 min",
    responseTimeMinutes: 25,
    experienceYears: 10,
    completionRate: 99,
    startingPrice: 95,
    regionCoverage: "Atende condomínios da capital e região",
    phone: "(11) 93210-9876",
    bio: "Instalação e configuração de fechaduras eletrônicas (biometria, senha e tag), interfonia IP, manutenção de câmeras de segurança e automação residencial compatível com Alexa e Google Home.",
    avatarUrl: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=200&h=200&fit=crop&crop=faces&q=80",
    servicesOffered: [
      { id: "s1", name: "Instalação de Fechadura Digital", description: "Furação e configuração completa para porta de entrada", priceFrom: 160 },
      { id: "s2", name: "Troca e Manutenção de Interfone", description: "Conserto de interfone chiando ou sem áudio", priceFrom: 95 },
      { id: "s3", name: "Instalação de Câmera Wi-Fi Interna", description: "Fixação e pareamento com aplicativo no celular", priceFrom: 110 },
    ],
    portfolio: [
      {
        id: "p8",
        title: "Fechadura Biométrica Intelbras",
        category: "Segurança",
        imageUrl: "https://images.unsplash.com/photo-1558002038-1055907df827?w=800&h=600&fit=crop&q=80",
        description: "Instalação em porta pivotante com acabamento milimétrico."
      }
    ],
    reviews: [
      {
        id: "r9",
        authorName: "Gustavo Paiva",
        unit: "Apto 1102",
        rating: 5,
        serviceDone: "Instalação de fechadura digital e interfone",
        comment: "Explicou todos os passos de cadastro das senhas e o fechamento automático ficou perfeito.",
        date: "Há 3 semanas",
        isVerifiedResident: true,
      }
    ],
    ratingDistribution: { 5: 41, 4: 4, 3: 0, 2: 0, 1: 0 },
  },
  {
    id: 7,
    name: "Julio Carpintaria & Decks",
    company: "Mestre da Madeira",
    category: "Carpintaria",
    rating: 4.7,
    reviewsCount: 31,
    isVerified: true,
    availableToday: false,
    nextAvailableSlot: "Em 2 dias",
    responseTime: "2h",
    responseTimeMinutes: 120,
    experienceYears: 5,
    completionRate: 95,
    startingPrice: 130,
    regionCoverage: "Atende seu condomínio",
    phone: "(11) 92109-8765",
    bio: "Construção e manutenção preventiva de decks modulares em varandas gourmet, restauração de pergolados, piso laminado e encaixe de rodapés em poliestireno.",
    avatarUrl: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&h=200&fit=crop&crop=faces&q=80",
    servicesOffered: [
      { id: "cp1", name: "Manutenção e Verniz em Deck de Varanda", description: "Lixamento e aplicação de stain impregnante hidrorrepelente", priceFrom: 250 },
      { id: "cp2", name: "Instalação de Rodapés de Poliestireno", description: "Corte em meia-esquadria de 45° e colagem profissional", priceFrom: 130 },
    ],
    portfolio: [
      {
        id: "p9",
        title: "Deck de Cumaru em Varanda Gourmet",
        category: "Carpintaria",
        imageUrl: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&h=600&fit=crop&q=80",
        description: "Restauração de cor original e proteção UV."
      }
    ],
    reviews: [
      {
        id: "r10",
        authorName: "Helena Sampaio",
        unit: "Apto 703",
        rating: 5,
        serviceDone: "Revitalização do deck da churrasqueira",
        comment: "O deck parecia novo após a raspagem e o verniz. Muito capricho com as paredes ao redor.",
        date: "Há 1 mês",
        isVerifiedResident: true,
      }
    ],
    ratingDistribution: { 5: 24, 4: 6, 3: 1, 2: 0, 1: 0 },
  },
  {
    id: 8,
    name: "CleanMaster Higienização",
    company: "CleanMaster Serviços Especializados",
    category: "Limpeza",
    rating: 4.8,
    reviewsCount: 48,
    isVerified: true,
    fastResponse: true,
    availableToday: true,
    nextAvailableSlot: "Hoje às 14:00",
    responseTime: "20 min",
    responseTimeMinutes: 20,
    experienceYears: 6,
    completionRate: 98,
    startingPrice: 70,
    regionCoverage: "Atende seu condomínio",
    phone: "(11) 91234-5678",
    bio: "Higienização profunda de estofados, colchões e tapetes com extratora de sucção alemã e produtos biodegradáveis atóxicos para pets e crianças.",
    avatarUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&h=200&fit=crop&crop=faces&q=80",
    servicesOffered: [
      { id: "l1", name: "Higienização de Sofá de 3 Lugares", description: "Lavagem a seco com extração profunda e secagem rápida", priceFrom: 160 },
      { id: "l2", name: "Higienização de Colchão Casal", description: "Eliminação de ácaros, fungos e bactérias com luz UV", priceFrom: 130 },
      { id: "l3", name: "Limpeza de Cadeiras de Jantar", description: "Remoção de manchas e odores por unidade", priceFrom: 40 },
    ],
    portfolio: [
      {
        id: "p10",
        title: "Higienização de Sofá Retrátil",
        category: "Limpeza",
        imageUrl: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&h=600&fit=crop&q=80",
        description: "Remoção de manchas de café e restauração da cor original do linho."
      }
    ],
    reviews: [
      {
        id: "r11",
        authorName: "Juliana Castro",
        unit: "Apto 301",
        rating: 5,
        serviceDone: "Lavagem de sofá e tapete felpudo",
        comment: "Ficou cheiroso e secou em poucas horas. Equipe muito educada e cuidadosa com o chão de madeira.",
        date: "Há 4 dias",
        isVerifiedResident: true,
      }
    ],
    ratingDistribution: { 5: 42, 4: 5, 3: 1, 2: 0, 1: 0 },
  }
];

// Enrich each provider with its calculated score
export const MARKETPLACE_PROVIDERS: MarketplaceProvider[] = RAW_PROVIDERS.map((provider) => {
  const score = calculateProviderScore({
    rating: provider.rating,
    reviewsCount: provider.reviewsCount,
    completionRate: provider.completionRate,
    responseTimeMinutes: provider.responseTimeMinutes,
    isVerified: Boolean(provider.isVerified),
  });

  return {
    ...provider,
    score,
  };
});
