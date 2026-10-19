/**
 * ZELADORIA SERVIÇOS - SISTEMA DE RANKING E SCORE CENTRALIZADO
 *
 * Fórmula de Score do Prestador (ProviderScore):
 * O ranking orgânico NUNCA é determinado apenas pela nota absoluta (5 estrelas com 1 avaliação
 * não pode ultrapassar 4.9 estrelas com centenas de avaliações verificadas).
 *
 * Componentes ponderados, todos calculados a partir de dados reais registrados no condomínio
 * (avaliações e chamados concluídos via tickets) — nenhum valor é estimado ou inventado:
 * 1. Média das Avaliações (Rating): peso 40%
 * 2. Confiança do Volume de Avaliações (Volume Bayesiano Logarítmico): peso 25%
 * 3. Taxa de Conclusão de Chamados (Completion Rate): peso 25%
 * 4. Bônus de Verificação documental pelo condomínio: peso 10%
 *
 * Regra Ética: O status PATROCINADO nunca altera o ProviderScore nem distorce o
 * ranking orgânico dos melhores profissionais.
 */

export interface ScoreInput {
  rating: number; // 0.0 a 5.0 (média real das avaliações do condomínio)
  reviewsCount: number; // quantidade real de avaliações
  completionRate: number | null; // 0 a 100%, ou null se não houver chamados suficientes
  isVerified: boolean;
}

/**
 * Calcula a pontuação normalizada de 0 a 100 para o prestador.
 */
export function calculateProviderScore(input: ScoreInput): number {
  // 1. Rating ponderado (0 a 5 -> 0 a 40 pontos)
  const safeRating = Math.max(0, Math.min(5, input.rating || 0));
  const ratingPoints = (safeRating / 5) * 40;

  // 2. Volume logarítmico (0 a 100+ avaliações -> 0 a 25 pontos)
  // log10(100) = 2. Com 100 avaliações atinge pontuação máxima de volume.
  const volumeFactor = Math.min(1, Math.log10((input.reviewsCount || 0) + 1) / 2);
  const volumePoints = volumeFactor * 25;

  // 3. Taxa de conclusão (0 a 100% -> 0 a 25 pontos); sem histórico, pontuação neutra (metade)
  const completionPoints = input.completionRate === null ? 12.5 : (Math.max(0, Math.min(100, input.completionRate)) / 100) * 25;

  // 4. Bônus de verificação documental pelo condomínio (10 pontos)
  const verificationPoints = input.isVerified ? 10 : 3;

  const totalScore = ratingPoints + volumePoints + completionPoints + verificationPoints;
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
  { query: "chuveiro", category: "eletrica", serviceTitle: "Instalação e troca de resistência de chuveiro", badge: "Mais buscado" },
  { query: "disjuntor", category: "eletrica", serviceTitle: "Troca de disjuntor e reparo de quadro elétrico" },
  { query: "tomada", category: "eletrica", serviceTitle: "Instalação de tomadas 110V/220V e interruptores" },
  { query: "luminaria", category: "eletrica", serviceTitle: "Instalação de luminárias, spots e fitas LED" },
  { query: "curto", category: "eletrica", serviceTitle: "Diagnóstico e reparo de curto-circuito", badge: "Urgência" },
  { query: "eletricista", category: "eletrica", serviceTitle: "Serviços gerais de eletricista residencial" },

  // Hidráulica
  { query: "vazamento", category: "hidraulica", serviceTitle: "Detecção de vazamento e caça-vazamento", badge: "Urgência" },
  { query: "torneira", category: "hidraulica", serviceTitle: "Troca e conserto de torneiras e misturadores" },
  { query: "descarga", category: "hidraulica", serviceTitle: "Conserto de caixa acoplada e válvula Hydra" },
  { query: "desentupimento", category: "hidraulica", serviceTitle: "Desentupimento de pias, ralos e vasos", badge: "Mais buscado" },
  { query: "encanador", category: "hidraulica", serviceTitle: "Serviços gerais de encanador predial" },

  // Climatização
  { query: "ar-condicionado", category: "climatizacao", serviceTitle: "Higienização e limpeza de ar-condicionado", badge: "Mais buscado" },
  { query: "ar condicionado", category: "climatizacao", serviceTitle: "Instalação de ar-condicionado split" },
  { query: "gas", category: "climatizacao", serviceTitle: "Recarga de gás ecológico e manutenção preventiva" },

  // Pintura
  { query: "pintura", category: "pintura", serviceTitle: "Pintura de paredes, tetos e áreas gourmet" },
  { query: "umidade", category: "pintura", serviceTitle: "Tratamento de bolor, infiltração e umidade" },
  { query: "massa corrida", category: "pintura", serviceTitle: "Aplicação de massa corrida e lixamento" },
  { query: "pintor", category: "pintura", serviceTitle: "Pintor profissional para apartamentos" },

  // Marcenaria e Carpintaria
  { query: "armario", category: "marcenaria", serviceTitle: "Ajuste de portas de armário e troca de dobradiças" },
  { query: "porta", category: "marcenaria", serviceTitle: "Ajuste de portas raspando e alinhamento" },
  { query: "marceneiro", category: "marcenaria", serviceTitle: "Móveis sob medida e restauração" },
  { query: "deck", category: "carpintaria", serviceTitle: "Manutenção e restauração de decks de madeira" },

  // Segurança e Portaria
  { query: "fechadura", category: "seguranca", serviceTitle: "Instalação de fechadura eletrônica digital", badge: "Alta procura" },
  { query: "chaveiro", category: "seguranca", serviceTitle: "Abertura de portas e cópia de chaves" },
  { query: "camera", category: "seguranca", serviceTitle: "Instalação e configuração de câmeras CFTV" },

  // Limpeza
  { query: "limpeza", category: "limpeza", serviceTitle: "Limpeza pós-obra e faxina especializada" },
  { query: "sofa", category: "limpeza", serviceTitle: "Higienização profunda de sofás e estofados" },
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
