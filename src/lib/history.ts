export interface HistoryEntry {
  id: string;
  createdAt: number;
  targetId: string;
  input: string;
  output: string;
}

const STORAGE_KEY = "promptlab:history:v1";
const MAX_ENTRIES = 100;
const EMPTY: HistoryEntry[] = [];

function isEntry(value: unknown): value is HistoryEntry {
  if (typeof value !== "object" || value === null) return false;
  const entry = value as Record<string, unknown>;
  return (
    typeof entry.id === "string" &&
    typeof entry.createdAt === "number" &&
    typeof entry.targetId === "string" &&
    typeof entry.input === "string" &&
    typeof entry.output === "string"
  );
}

function readStorage(): HistoryEntry[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY;
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return EMPTY;
    return parsed.filter(isEntry);
  } catch {
    return EMPTY;
  }
}

/**
 * Tiny external store over localStorage so React components can consume
 * history via useSyncExternalStore without effects or hydration mismatches.
 */
let cache: HistoryEntry[] | null = null;
const listeners = new Set<() => void>();

function persist(entries: HistoryEntry[]): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch {
    // Storage full or unavailable: history stays in memory only.
  }
}

function setEntries(entries: HistoryEntry[]): void {
  cache = entries;
  persist(entries);
  listeners.forEach((listener) => listener());
}

export const historyStore = {
  subscribe(listener: () => void): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  getSnapshot(): HistoryEntry[] {
    cache ??= readStorage();
    return cache;
  },
  getServerSnapshot(): HistoryEntry[] {
    return EMPTY;
  },
  add(entry: Omit<HistoryEntry, "id" | "createdAt">): HistoryEntry {
    const full: HistoryEntry = {
      ...entry,
      id: crypto.randomUUID(),
      createdAt: Date.now(),
    };
    setEntries([full, ...historyStore.getSnapshot()].slice(0, MAX_ENTRIES));
    return full;
  },
  remove(id: string): void {
    setEntries(historyStore.getSnapshot().filter((entry) => entry.id !== id));
  },
};

export function entryTitle(entry: HistoryEntry): string {
  const clean = entry.input.replace(/\s+/g, " ").trim();
  return clean.length > 60 ? `${clean.slice(0, 60)}…` : clean || "Untitled";
}
