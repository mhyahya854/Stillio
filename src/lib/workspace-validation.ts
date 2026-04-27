import { toLocalDateKey } from "@/lib/workspace-helpers";

export function normalizeDateKey(value: unknown, fallback: string) {
  if (typeof value !== "string") return fallback;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return fallback;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const candidate = new Date(year, month - 1, day);

  if (candidate.getFullYear() !== year || candidate.getMonth() !== month - 1 || candidate.getDate() !== day) {
    return fallback;
  }

  return value;
}

export function normalizeOptionalDateKey(value: unknown) {
  if (typeof value !== "string") return undefined;
  const normalized = normalizeDateKey(value, "");
  return normalized || undefined;
}

export function normalizeTime(value: unknown, fallback = "09:00") {
  if (typeof value !== "string") return fallback;
  const match = /^(\d{2}):(\d{2})$/.exec(value);
  if (!match) return fallback;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return fallback;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

export function normalizeDurationMinutes(value: unknown, fallback = 30) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(15, Math.min(24 * 60, Math.round(parsed)));
}

export function getTodayDateKey() {
  return toLocalDateKey(new Date());
}
