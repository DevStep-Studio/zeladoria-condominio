import fs from "node:fs";
import path from "node:path";

export type SuggestionStatus = "recebida" | "em_analise" | "aceita" | "recusada" | "concluida";

export interface SuggestionItem {
  id: number;
  title: string;
  category: string;
  description: string;
  status: SuggestionStatus;
  date: string;
  unit: string;
  upvotes: number;
  authorName?: string;
  condoId?: number | null;
  feedbackAdmin?: string;
  feedbackAuthor?: string;
  feedbackDate?: string;
  createdAt?: string;
}

export const INITIAL_SUGGESTIONS: SuggestionItem[] = [
  {
    id: 1,
    title: "Instalação de ponto de recarga para carros elétricos",
    category: "Sustentabilidade",
    description: "Proponho a instalação de 2 estações de recarga compartilhada na garagem do subsolo com medição individualizada por tag.",
    status: "em_analise",
    date: "28/08/2026",
    unit: "Torre A · Apto 302",
    upvotes: 24,
    feedbackAdmin: "Orçamento preliminar solicitado para a assembleia de outubro. A equipe de zeladoria já realizou o levantamento elétrico no subsolo.",
    feedbackAuthor: "Zeladoria & Administração",
  },
  {
    id: 2,
    title: "Lixeira seletiva orgânica na praça central",
    category: "Melhorias",
    description: "Colocar lixeiras diferenciadas próximas aos bancos da praça central para incentivar o descarte correto.",
    status: "aceita",
    date: "15/08/2026",
    unit: "Torre B · Apto 104",
    upvotes: 18,
    feedbackAdmin: "Aprovado pela administração. Pedido em processo de compra sob supervisão da zeladoria.",
    feedbackAuthor: "Administração",
  },
  {
    id: 3,
    title: "Horta comunitária com composteira",
    category: "Áreas Comuns",
    description: "Aproveitar o canteiro desocupado ao lado do parquinho para criar uma horta com ervas e temperos para os moradores.",
    status: "concluida",
    date: "02/08/2026",
    unit: "Torre A · Apto 501",
    upvotes: 35,
    feedbackAdmin: "Horta implantada com auxílio da equipe de zeladoria e jardinagem!",
    feedbackAuthor: "Zeladoria",
  },
];

const STORAGE_DIR = path.join(process.cwd(), ".storage");
const STORAGE_FILE = path.join(STORAGE_DIR, "sugestoes-store.json");

function ensureStorageDir(): void {
  try {
    if (!fs.existsSync(STORAGE_DIR)) {
      fs.mkdirSync(STORAGE_DIR, { recursive: true });
    }
  } catch {
    // Silently ignore if filesystem isn't writable in certain environments
  }
}

function loadStorage(): SuggestionItem[] {
  ensureStorageDir();
  try {
    if (fs.existsSync(STORAGE_FILE)) {
      const content = fs.readFileSync(STORAGE_FILE, "utf-8");
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch {
    // fallback to initial
  }
  return INITIAL_SUGGESTIONS;
}

function saveStorage(items: SuggestionItem[]): void {
  ensureStorageDir();
  try {
    fs.writeFileSync(STORAGE_FILE, JSON.stringify(items, null, 2), "utf-8");
  } catch {
    // Silently ignore if not writable
  }
}

export function getAllSuggestions(condoId?: number | null): SuggestionItem[] {
  const all = loadStorage();
  if (condoId) {
    return all.filter((s) => !s.condoId || s.condoId === condoId);
  }
  return all;
}

export function createSuggestion(data: {
  title: string;
  category: string;
  description: string;
  unit: string;
  authorName?: string;
  condoId?: number | null;
}): SuggestionItem {
  const current = loadStorage();
  const today = new Date();
  const dateFormatted = `${String(today.getDate()).padStart(2, "0")}/${String(today.getMonth() + 1).padStart(2, "0")}/${today.getFullYear()}`;

  const newItem: SuggestionItem = {
    id: Date.now(),
    title: data.title.trim(),
    category: data.category,
    description: data.description.trim(),
    status: "recebida",
    date: dateFormatted,
    unit: data.unit || "Condomínio",
    upvotes: 1,
    authorName: data.authorName || "Morador",
    condoId: data.condoId ?? null,
    createdAt: new Date().toISOString(),
  };

  const updated = [newItem, ...current];
  saveStorage(updated);
  return newItem;
}

export function updateSuggestionStatus(
  id: number,
  status: SuggestionStatus,
  feedbackAdmin?: string,
  feedbackAuthor?: string
): SuggestionItem | null {
  const current = loadStorage();
  const itemIndex = current.findIndex((s) => s.id === id);
  if (itemIndex === -1) return null;

  const today = new Date();
  const dateFormatted = `${String(today.getDate()).padStart(2, "0")}/${String(today.getMonth() + 1).padStart(2, "0")}/${today.getFullYear()}`;

  const updatedItem: SuggestionItem = {
    ...current[itemIndex],
    status,
    feedbackAdmin: feedbackAdmin !== undefined ? feedbackAdmin.trim() : current[itemIndex].feedbackAdmin,
    feedbackAuthor: feedbackAuthor || current[itemIndex].feedbackAuthor || "Zeladoria",
    feedbackDate: dateFormatted,
  };

  current[itemIndex] = updatedItem;
  saveStorage(current);
  return updatedItem;
}

export function upvoteSuggestion(id: number): SuggestionItem | null {
  const current = loadStorage();
  const itemIndex = current.findIndex((s) => s.id === id);
  if (itemIndex === -1) return null;

  current[itemIndex].upvotes += 1;
  saveStorage(current);
  return current[itemIndex];
}

