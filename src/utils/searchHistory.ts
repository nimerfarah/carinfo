import type { SearchHistoryItem } from "@/types/Dataset";
import { normalizeCarNumber } from "@/utils/formatters";

const STORAGE_KEY = "israeli-vehicle-search-history";
const MAX_ITEMS = 10;

export function loadSearchHistory(): SearchHistoryItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as SearchHistoryItem[];
    return Array.isArray(parsed) ? parsed.slice(0, MAX_ITEMS) : [];
  } catch {
    return [];
  }
}

export function saveSearchHistory(items: SearchHistoryItem[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items.slice(0, MAX_ITEMS)));
}

export function pushSearchHistory(carNumber: string): SearchHistoryItem[] {
  const normalized = normalizeCarNumber(carNumber);
  const existing = loadSearchHistory().filter(
    (item) => item.carNumber !== normalized,
  );
  const next: SearchHistoryItem[] = [
    { carNumber: normalized, searchedAt: new Date().toISOString() },
    ...existing,
  ].slice(0, MAX_ITEMS);
  saveSearchHistory(next);
  return next;
}

export function clearSearchHistory(): void {
  localStorage.removeItem(STORAGE_KEY);
}
