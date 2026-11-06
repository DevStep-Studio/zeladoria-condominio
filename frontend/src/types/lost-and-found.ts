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
}

export const CATEGORIES_LIST: ItemCategory[] = [
  "Documentos",
  "Eletrônicos",
  "Chaves",
  "Roupas",
  "Outros",
];

export const MOCK_LOST_AND_FOUND_ITEMS: LostAndFoundItem[] = [
  {
    id: "item-1",
    type: "FOUND",
    title: "Chaveiro com chave de carro e controle azul",
    description: "Chaveiro com chave codificada de veículo (alarme embutido), 2 chaves residenciais simples e fita azul marinho com pingente metálico. Encontrado próximo à vaga 42 no subsolo 1.",
    category: "Chaves",
    date: "05/11/2026",
    location: "Garagem Subsolo 1 (G1 - Vaga 42)",
    status: "OPEN",
    imageUrl: "https://images.unsplash.com/photo-1582139329536-e7284fece509?auto=format&fit=crop&w=800&q=80",
    reportedBy: "Seu Antenor (Portaria)",
    reportedByRole: "Porteiro",
    unit: "Portaria Central",
    contactPhone: "(11) 98877-6655",
  },
  {
    id: "item-2",
    type: "LOST",
    title: "AirPods Pro (Estojo branco com capa preta)",
    description: "Perdi meus fones sem fio AirPods Pro com capinha de silicone preta na academia do condomínio por volta das 19h de terça-feira enquanto treinava na esteira.",
    category: "Eletrônicos",
    date: "04/11/2026",
    location: "Academia / Espaço Fitness",
    status: "OPEN",
    imageUrl: "https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?auto=format&fit=crop&w=800&q=80",
    reportedBy: "Mariana Souza",
    reportedByRole: "Morador",
    unit: "Torre A · Apto 804",
    contactPhone: "(11) 97123-4567",
  },
  {
    id: "item-3",
    type: "FOUND",
    title: "Óculos de Sol Ray-Ban armação tartaruga",
    description: "Óculos de sol modelo tartaruga com armação marrom escura e lentes degradê em estojo de couro. Deixado sobre a mesa de apoio próxima à churrasqueira principal.",
    category: "Outros",
    date: "03/11/2026",
    location: "Quiosque da Churrasqueira 2",
    status: "OPEN",
    imageUrl: "https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&w=800&q=80",
    reportedBy: "Carlos Alberto (Zeladoria)",
    reportedByRole: "Zelador",
    unit: "Zeladoria Central",
    contactPhone: "(11) 98111-2233",
  },
  {
    id: "item-4",
    type: "LOST",
    title: "Carteira de habilitação (CNH) de Lucas Lima",
    description: "Perdi o documento original de CNH plastificado dentro de uma capinha plástica transparente no trajeto entre a portaria e o hall de entrada do Bloco B.",
    category: "Documentos",
    date: "02/11/2026",
    location: "Caminho central em frente ao Bloco B",
    status: "OPEN",
    reportedBy: "Lucas Lima",
    reportedByRole: "Morador",
    unit: "Bloco B · Apto 201",
    contactPhone: "(11) 99876-5432",
  },
  {
    id: "item-5",
    type: "FOUND",
    title: "Casaco infantil corta-vento azul marinho",
    description: "Casaco infantil tamanho 6 anos, cor azul marinho com capuz forrado e estampa sutil de dinossauro. Esquecido no banco de madeira ao lado do escorregador.",
    category: "Roupas",
    date: "01/11/2026",
    location: "Playground Infantil",
    status: "OPEN",
    imageUrl: "https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=800&q=80",
    reportedBy: "Camila Rodrigues",
    reportedByRole: "Morador",
    unit: "Torre C · Apto 112",
    contactPhone: "(11) 97654-3210",
  },
  {
    id: "item-6",
    type: "FOUND",
    title: "Garrafa térmica Stanley 500ml verde oliva",
    description: "Garrafa térmica em inox com tampa de rosca, cor verde escuro com adesivo de montanhas. Deixada no suporte de bicicletas do bicicletário.",
    category: "Outros",
    date: "29/10/2026",
    location: "Bicicletário Bloco A",
    status: "RESOLVED",
    imageUrl: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80",
    reportedBy: "Portaria Principal",
    reportedByRole: "Porteiro",
    unit: "Portaria Central",
    resolvedAt: "30/10/2026 às 14:20",
    resolvedBy: "Entregue a Bruno Fernandes mediante apresentação de documento",
    claimedBy: "Bruno Fernandes (Torre A · Apto 502)",
  },
  {
    id: "item-7",
    type: "LOST",
    title: "Aliança de casamento em ouro com gravação",
    description: "Aliança dourada tradicional esquecida na borda da piscina infantil no último domingo à tarde. Possui gravação interna de data e iniciais.",
    category: "Outros",
    date: "28/10/2026",
    location: "Borda da Piscina Infantil",
    status: "OPEN",
    reportedBy: "Renata Vasconcelos",
    reportedByRole: "Morador",
    unit: "Bloco A · Apto 402",
    contactPhone: "(11) 98711-2299",
  },
];

