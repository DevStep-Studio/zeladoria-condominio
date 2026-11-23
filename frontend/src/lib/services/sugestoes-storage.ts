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

export const INITIAL_SUGGESTIONS: SuggestionItem[] = [];

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

