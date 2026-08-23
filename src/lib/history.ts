export interface Exchange {
  input: string;
  output: string;
}

export interface HistoryEntry {
  id: string;
  createdAt: number;
  targetId: string;
  exchanges: Exchange[];
}

const STORAGE_KEY = "promptlab:history:v2";
const LEGACY_KEY = "promptlab:history:v1";
const MAX_ENTRIES = 100;
const EMPTY: HistoryEntry[] = [];

function isExchange(value: unknown): value is Exchange {
  if (typeof value !== "object" || value === null) return false;
  const e = value as Record<string, unknown>;
  return typeof e.input === "string" && typeof e.output === "string";
}

function isEntry(value: unknown): value is HistoryEntry {
  if (typeof value !== "object" || value === null) return false;
  const e = value as Record<string, unknown>;
  return (
    typeof e.id === "string" &&
    typeof e.createdAt === "number" &&
    typeof e.targetId === "string" &&
    Array.isArray(e.exchanges) &&
    e.exchanges.every(isExchange)
  );
}

function migrateLegacy(): HistoryEntry[] {
  try {
    const raw = window.localStorage.getItem(LEGACY_KEY);
    if (!raw) return EMPTY;
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return EMPTY;
    const migrated = parsed
      .filter(
        (v): v is Record<string, string | number> =>
          typeof v === "object" && v !== null,
      )
      .filter(
        (v) => typeof v.input === "string" && typeof v.output === "string",
      )
      .map((v) => ({
        id: String(v.id ?? crypto.randomUUID()),
        createdAt: Number(v.createdAt ?? Date.now()),
        targetId: String(v.targetId ?? "claude"),
        exchanges: [{ input: String(v.input), output: String(v.output) }],
      }));
    window.localStorage.removeItem(LEGACY_KEY);
    return migrated;
  } catch {
    return EMPTY;
  }
}

function readStorage(): HistoryEntry[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return migrateLegacy();
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return EMPTY;
    return parsed.filter(isEntry);
  } catch {
    return EMPTY;
  }
}

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
  create(targetId: string, exchange: Exchange): HistoryEntry {
    const entry: HistoryEntry = {
      id: crypto.randomUUID(),
      createdAt: Date.now(),
      targetId,
      exchanges: [exchange],
    };
    setEntries([entry, ...historyStore.getSnapshot()].slice(0, MAX_ENTRIES));
    return entry;
  },
  appendExchange(id: string, exchange: Exchange): void {
    setEntries(
      historyStore
        .getSnapshot()
        .map((entry) =>
          entry.id === id
            ? { ...entry, exchanges: [...entry.exchanges, exchange] }
            : entry,
        ),
    );
  },
  remove(id: string): void {
    setEntries(historyStore.getSnapshot().filter((entry) => entry.id !== id));
  },
  find(id: string): HistoryEntry | undefined {
    return historyStore.getSnapshot().find((entry) => entry.id === id);
  },
};

export function entryTitle(entry: HistoryEntry): string {
  const clean = entry.exchanges[0]?.input.replace(/\s+/g, " ").trim() ?? "";
  return clean.length > 60 ? `${clean.slice(0, 60)}…` : clean || "Untitled";
}
