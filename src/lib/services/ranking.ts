/**
 * ZELADORIA SERVIÇOS - SISTEMA DE RANKING E SCORE CENTRALIZADO
 * 
 * Fórmula de Score do Prestador (ProviderScore):
 * O ranking orgânico NUNCA é determinado apenas pela nota absoluta (5 estrelas com 1 avaliação
 * não pode ultrapassar 4.9 estrelas com centenas de avaliações verificadas).
 * 
 * Componentes ponderados:
 * 1. Média das Avaliações (Rating): peso 35%
 * 2. Confiança do Volume de Avaliações (Volume Bayesiano Logarítmico): peso 20%
 * 3. Taxa de Conclusão de Chamados (Completion Rate): peso 20%
 * 4. Velocidade do Tempo de Resposta (Response Speed): peso 15%
 * 5. Bônus de Verificação e Confiabilidade (Verification Bonus): peso 10%
 * 
 * Regra Ética: O selo PREMIUM e o status PATROCINADO nunca alteram o ProviderScore
 * nem distorcem o ranking orgânico dos melhores profissionais.
 */

export interface ScoreInput {
  rating: number; // 0.0 a 5.0
  reviewsCount: number; // quantidade total de avaliações
  completionRate: number; // 0 a 100%
  responseTimeMinutes: number; // ex: 15 min, 30 min, 120 min
  isVerified: boolean;
}

/**
 * Calcula a pontuação normalizada de 0 a 100 para o prestador.
 */
export function calculateProviderScore(input: ScoreInput): number {
  // 1. Rating ponderado (0 a 5 -> 0 a 35 pontos)
  const safeRating = Math.max(0, Math.min(5, input.rating || 0));
  const ratingPoints = (safeRating / 5) * 35;

  // 2. Volume logarítmico (0 a 100+ avaliações -> 0 a 20 pontos)
  // log10(100) = 2. Com 100 avaliações atinge pontuação máxima de volume.
  const volumeFactor = Math.min(1, Math.log10((input.reviewsCount || 0) + 1) / 2);
  const volumePoints = volumeFactor * 20;

  // 3. Taxa de conclusão (0 a 100% -> 0 a 20 pontos)
  const safeCompletion = Math.max(0, Math.min(100, input.completionRate || 0));
  const completionPoints = (safeCompletion / 100) * 20;

  // 4. Velocidade de resposta (≤15 min = 15 pts, ≤30 min = 12 pts, ≤60 min = 8 pts, >120 min = 4 pts)
  let speedPoints = 5;
  const minutes = input.responseTimeMinutes || 60;
  if (minutes <= 15) {
    speedPoints = 15;
  } else if (minutes <= 30) {
    speedPoints = 12;
  } else if (minutes <= 60) {
    speedPoints = 9;
  } else if (minutes <= 120) {
    speedPoints = 6;
  }

  // 5. Bônus de verificação por documentação/condomínio (10 pontos)
  const verificationPoints = input.isVerified ? 10 : 3;

  const totalScore = ratingPoints + volumePoints + completionPoints + speedPoints + verificationPoints;
  return Math.round(totalScore * 10) / 10;
}

/**
 * Dicionário inteligente de sinônimos e problemas comuns para Autocomplete
 */
export interface SearchSuggestion {
  query: string;
  category: string;
  serviceTitle: string;
  badge?: string;
}

export const SEARCH_AUTOCOMPLETE_DICTIONARY: SearchSuggestion[] = [
  // Elétrica
  { query: "chuveiro", category: "Elétrica", serviceTitle: "Instalação e troca de resistência de chuveiro", badge: "Mais buscado" },
  { query: "disjuntor", category: "Elétrica", serviceTitle: "Troca de disjuntor e reparo de quadro elétrico" },
  { query: "tomada", category: "Elétrica", serviceTitle: "Instalação de tomadas 110V/220V e interruptores" },
  { query: "luminaria", category: "Elétrica", serviceTitle: "Instalação de luminárias, spots e fitas LED" },
  { query: "curto", category: "Elétrica", serviceTitle: "Diagnóstico e reparo de curto-circuito", badge: "Urgência" },
  { query: "eletricista", category: "Elétrica", serviceTitle: "Serviços gerais de eletricista residencial" },

  // Hidráulica
  { query: "vazamento", category: "Hidráulica", serviceTitle: "Detecção de vazamento e caça-vazamento", badge: "Urgência" },
  { query: "torneira", category: "Hidráulica", serviceTitle: "Troca e conserto de torneiras e misturadores" },
  { query: "descarga", category: "Hidráulica", serviceTitle: "Conserto de caixa acoplada e válvula Hydra" },
  { query: "desentupimento", category: "Hidráulica", serviceTitle: "Desentupimento de pias, ralos e vasos", badge: "Mais buscado" },
  { query: "encanador", category: "Hidráulica", serviceTitle: "Serviços gerais de encanador predial" },

  // Climatização
  { query: "ar-condicionado", category: "Climatização", serviceTitle: "Higienização e limpeza de ar-condicionado", badge: "Mais buscado" },
  { query: "ar condicionado", category: "Climatização", serviceTitle: "Instalação de ar-condicionado split" },
  { query: "gas", category: "Climatização", serviceTitle: "Recarga de gás ecológico e manutenção preventiva" },

  // Pintura
  { query: "pintura", category: "Pintura", serviceTitle: "Pintura de paredes, tetos e áreas gourmet" },
  { query: "umidade", category: "Pintura", serviceTitle: "Tratamento de bolor, infiltração e umidade" },
  { query: "massa corrida", category: "Pintura", serviceTitle: "Aplicação de massa corrida e lixamento" },
  { query: "pintor", category: "Pintura", serviceTitle: "Pintor profissional para apartamentos" },

  // Marcenaria e Carpintaria
  { query: "armario", category: "Marcenaria", serviceTitle: "Ajuste de portas de armário e troca de dobradiças" },
  { query: "porta", category: "Marcenaria", serviceTitle: "Ajuste de portas raspando e alinhamento" },
  { query: "marceneiro", category: "Marcenaria", serviceTitle: "Móveis sob medida e restauração" },
  { query: "deck", category: "Carpintaria", serviceTitle: "Manutenção e restauração de decks de madeira" },

  // Segurança e Portaria
  { query: "fechadura", category: "Segurança", serviceTitle: "Instalação de fechadura eletrônica digital", badge: "Alta procura" },
  { query: "chaveiro", category: "Segurança", serviceTitle: "Abertura de portas e cópia de chaves" },
  { query: "camera", category: "Segurança", serviceTitle: "Instalação e configuração de câmeras CFTV" },

  // Limpeza
  { query: "limpeza", category: "Limpeza", serviceTitle: "Limpeza pós-obra e faxina especializada" },
  { query: "sofa", category: "Limpeza", serviceTitle: "Higienização profunda de sofás e estofados" },
];

/**
 * Busca sugestões com autocomplete a partir do termo digitado
 */
export function getSearchSuggestions(rawQuery: string): SearchSuggestion[] {
  const query = rawQuery.trim().toLowerCase();
  if (!query || query.length < 2) return [];

  return SEARCH_AUTOCOMPLETE_DICTIONARY.filter(
    (item) =>
      item.query.toLowerCase().includes(query) ||
      item.serviceTitle.toLowerCase().includes(query) ||
      item.category.toLowerCase().includes(query)
  ).slice(0, 5);
}
