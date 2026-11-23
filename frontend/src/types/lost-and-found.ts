export type ItemType = "LOST" | "FOUND";
export type ItemStatus = "OPEN" | "RESOLVED";
export type ItemCategory = "Documentos" | "Eletrônicos" | "Chaves" | "Roupas" | "Outros";

export interface LostAndFoundItem {
  id: string | number;
  type: ItemType; // 'LOST' (Perdido) | 'FOUND' (Encontrado)
  title: string; // Ex: Chave do carro, Óculos de sol
  description: string; // Detalhes, cor, marca
  category: ItemCategory; // 'Documentos' | 'Eletrônicos' | 'Chaves' | 'Roupas' | 'Outros'
  date: string; // Data que foi perdido ou encontrado
  location: string; // Local onde foi achado ou visto pela última vez, ex: "Piscina", "Elevador Bloco A"
  status: ItemStatus; // 'OPEN' (Aberto) | 'RESOLVED' (Devolvido/Encontrado)
  imageUrl?: string; // Foto do item - opcional
  reportedBy: string; // Nome do usuário que registrou
  reportedByRole?: string; // Papel do usuário (Morador, Zelador, Porteiro, Síndico)
  unit?: string; // Ex: Torre A · Apto 302
  contactPhone?: string; // Telefone opcional
  resolvedAt?: string; // Data de devolução
  resolvedBy?: string; // Quem retirou ou devolveu
  claimMessage?: string; // Mensagem de quem reivindicou o item
  claimedBy?: string; // Nome de quem reivindicou
  claimDate?: string; // Data da reivindicação
  condoId?: number | null;
  createdAt?: string;
  updatedAt?: string;
}

export const CATEGORIES_LIST: ItemCategory[] = [
  "Documentos",
  "Eletrônicos",
  "Chaves",
  "Roupas",
  "Outros",
];

export const MOCK_LOST_AND_FOUND_ITEMS: LostAndFoundItem[] = [];

