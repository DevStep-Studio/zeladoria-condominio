import fs from "node:fs";
import path from "node:path";
import type { LostAndFoundItem } from "@/types/lost-and-found";

function getStorageDir(): string {
  // If running from frontend folder: ../backend/storage
  const candidate1 = path.resolve(process.cwd(), "..", "backend", "storage");
  if (fs.existsSync(candidate1)) return candidate1;

  // If running from repo root: ./backend/storage
  const candidate2 = path.resolve(process.cwd(), "backend", "storage");
  if (fs.existsSync(candidate2)) return candidate2;

  // Fallback local directory
  const candidate3 = path.resolve(process.cwd(), ".storage");
  if (!fs.existsSync(candidate3)) {
    try {
      fs.mkdirSync(candidate3, { recursive: true });
    } catch {
      // Ignora erro de permissão se filesystem restrito
    }
  }
  return candidate3;
}

const STORAGE_FILE_NAME = "lost-and-found-store.json";

function getStorageFilePath(): string {
  return path.join(getStorageDir(), STORAGE_FILE_NAME);
}

function ensureStorageDir(): void {
  try {
    const dir = getStorageDir();
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  } catch {
    // Ignora erro se não gravável
  }
}

function loadStorage(): LostAndFoundItem[] {
  ensureStorageDir();
  const filePath = getStorageFilePath();
  try {
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, "utf-8");
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (error) {
    console.warn("Aviso ao carregar armazenamento de achados e perdidos:", error);
  }
  return [];
}

function saveStorage(items: LostAndFoundItem[]): void {
  ensureStorageDir();
  const filePath = getStorageFilePath();
  try {
    fs.writeFileSync(filePath, JSON.stringify(items, null, 2), "utf-8");
  } catch (error) {
    console.error("Erro ao salvar itens no arquivo de achados e perdidos:", error);
  }
}

export function getAllLostAndFoundItems(condoId?: number | null): LostAndFoundItem[] {
  const all = loadStorage();
  if (condoId) {
    return all.filter((item) => !item.condoId || item.condoId === condoId);
  }
  return all;
}

export function getLostAndFoundItemById(id: string | number): LostAndFoundItem | null {
  const all = loadStorage();
  const found = all.find((item) => String(item.id) === String(id));
  return found || null;
}

export function createLostAndFoundItem(data: {
  type: LostAndFoundItem["type"];
  title: string;
  category: LostAndFoundItem["category"];
  date: string;
  location: string;
  description: string;
  imageUrl?: string;
  reportedBy: string;
  reportedByRole?: string;
  unit?: string;
  contactPhone?: string;
  condoId?: number | null;
}): LostAndFoundItem {
  const current = loadStorage();
  const nowIso = new Date().toISOString();
  const uniqueId = `item-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

  const newItem: LostAndFoundItem = {
    id: uniqueId,
    type: data.type,
    title: data.title.trim(),
    category: data.category,
    date: data.date,
    location: data.location.trim(),
    description: data.description.trim(),
    status: "OPEN",
    imageUrl: data.imageUrl || undefined,
    reportedBy: data.reportedBy.trim(),
    reportedByRole: data.reportedByRole,
    unit: data.unit,
    contactPhone: data.contactPhone,
    condoId: data.condoId ?? null,
    createdAt: nowIso,
    updatedAt: nowIso,
  };

  const updated = [newItem, ...current];
  saveStorage(updated);
  return newItem;
}

export function updateLostAndFoundItem(
  id: string | number,
  updates: Partial<LostAndFoundItem>
): LostAndFoundItem | null {
  const current = loadStorage();
  const index = current.findIndex((item) => String(item.id) === String(id));
  if (index === -1) return null;

  const updatedItem: LostAndFoundItem = {
    ...current[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  current[index] = updatedItem;
  saveStorage(current);
  return updatedItem;
}

export function claimLostAndFoundItem(
  id: string | number,
  claimedBy: string,
  claimMessage?: string,
  claimDate?: string
): LostAndFoundItem | null {
  const current = loadStorage();
  const index = current.findIndex((item) => String(item.id) === String(id));
  if (index === -1) return null;

  const dateStr = claimDate || new Date().toLocaleDateString("pt-BR");

  const updatedItem: LostAndFoundItem = {
    ...current[index],
    claimedBy: claimedBy.trim(),
    claimMessage: claimMessage ? claimMessage.trim() : undefined,
    claimDate: dateStr,
    updatedAt: new Date().toISOString(),
  };

  current[index] = updatedItem;
  saveStorage(current);
  return updatedItem;
}

export function reportFoundLostAndFoundItem(
  id: string | number,
  reporterName: string,
  locationNotes: string
): LostAndFoundItem | null {
  const current = loadStorage();
  const index = current.findIndex((item) => String(item.id) === String(id));
  if (index === -1) return null;

  const formattedMsg = `Morador informou localização: "${locationNotes.trim()}"`;

  const updatedItem: LostAndFoundItem = {
    ...current[index],
    claimedBy: reporterName.trim(),
    claimMessage: formattedMsg,
    updatedAt: new Date().toISOString(),
  };

  current[index] = updatedItem;
  saveStorage(current);
  return updatedItem;
}

export function resolveLostAndFoundItem(
  id: string | number,
  recipientName: string,
  notes?: string
): LostAndFoundItem | null {
  const current = loadStorage();
  const index = current.findIndex((item) => String(item.id) === String(id));
  if (index === -1) return null;

  const now = new Date();
  const resolvedAtString = `${now.toLocaleDateString("pt-BR")} às ${now.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  })}`;
  const resolvedByString = `Devolvido para ${recipientName.trim()}${
    notes && notes.trim() ? ` (${notes.trim()})` : ""
  }`;

  const updatedItem: LostAndFoundItem = {
    ...current[index],
    status: "RESOLVED",
    resolvedAt: resolvedAtString,
    resolvedBy: resolvedByString,
    updatedAt: now.toISOString(),
  };

  current[index] = updatedItem;
  saveStorage(current);
  return updatedItem;
}

export function deleteLostAndFoundItem(id: string | number): boolean {
  const current = loadStorage();
  const filtered = current.filter((item) => String(item.id) !== String(id));
  if (filtered.length === current.length) return false;
  saveStorage(filtered);
  return true;
}
