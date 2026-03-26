import { defaultHanjaData, HanjaItem } from "./hanja-data";

const STORAGE_KEY = "hanja-items";

export function getHanjaItems(): HanjaItem[] {
  if (typeof window === "undefined") {
    return defaultHanjaData;
  }

  const saved = window.localStorage.getItem(STORAGE_KEY);

  if (!saved) {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultHanjaData));
    return defaultHanjaData;
  }

  try {
    const parsed = JSON.parse(saved) as HanjaItem[];
    if (!Array.isArray(parsed) || parsed.length === 0) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultHanjaData));
      return defaultHanjaData;
    }
    return parsed;
  } catch {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultHanjaData));
    return defaultHanjaData;
  }
}

export function saveHanjaItems(items: HanjaItem[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export function resetHanjaItems() {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultHanjaData));
}