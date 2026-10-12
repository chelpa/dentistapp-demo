import { type DemoState, seedDemo } from "./demo";
import { validAppointmentTime } from "./calendar";

export const STORE_KEY = "dentistapp-mvp-demo-v4";
/** Keys written by earlier demo versions. They are read only to inform the visitor; never modified. */
export const LEGACY_KEYS = ["dentistapp-mvp-demo-v1", "dentistapp-mvp-demo-v3"] as const;

export type KeyValueStore = { getItem(key: string): string | null; setItem(key: string, value: string): void };
export type LoadResult = { state: DemoState; notices: string[]; backupKey?: string };

const REQUIRED = ["patients", "appointments", "treatments", "notes", "teeth"] as const;
const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null && !Array.isArray(value);

/**
 * Validates stored data without inventing information: missing chairs stay missing,
 * invalid appointments are kept (and reported), optional collections get defaults.
 * Entries that are not objects cannot be used; they are counted in `dropped` so the
 * caller can keep a backup before saving.
 */
export function normalizeState(raw: unknown): { state: DemoState; dropped: number; issues: string[] } | null {
  if (!isRecord(raw) || REQUIRED.some(key => !Array.isArray(raw[key]))) return null;
  let dropped = 0;
  const list = <T,>(value: unknown, fallback: T[]): T[] => {
    if (!Array.isArray(value)) return fallback;
    const kept = value.filter(isRecord);
    dropped += value.length - kept.length;
    return kept as T[];
  };
  const state: DemoState = {
    patients: list(raw.patients, []), appointments: list(raw.appointments, []), treatments: list(raw.treatments, []),
    notes: list(raw.notes, []), teeth: list(raw.teeth, []), toothEvents: list(raw.toothEvents, []),
    tariffs: Array.isArray(raw.tariffs) ? list(raw.tariffs, []) : seedDemo().tariffs,
    budgets: list(raw.budgets, []),
  };
  const issues: string[] = [];
  const invalid = state.appointments.filter(a => !validAppointmentTime(a)).length;
  if (invalid) issues.push(`${invalid} citas guardadas tienen fecha, hora o duración inválida: se conservan, pero no se dibujan en la agenda.`);
  if (dropped) issues.push(`${dropped} registros guardados no se pudieron leer.`);
  return { state, dropped, issues };
}

/** Loads the demo state for this version. Never deletes or overwrites earlier keys. */
export function loadState(storage: KeyValueStore, now: Date = new Date()): LoadResult {
  let raw: string | null;
  try { raw = storage.getItem(STORE_KEY); }
  catch { return { state: seedDemo(), notices: ["El navegador no permite leer datos guardados: la demo usa los datos ficticios iniciales."] }; }
  if (raw === null) {
    const legacy = LEGACY_KEYS.filter(key => { try { return storage.getItem(key) !== null; } catch { return false; } });
    return { state: seedDemo(), notices: legacy.length ? ["DentistApp 0.4 empieza con datos ficticios nuevos. Los datos de versiones anteriores siguen guardados en este navegador, sin cambios."] : [] };
  }
  let parsed: unknown;
  try { parsed = JSON.parse(raw); } catch { parsed = undefined; }
  const normalized = parsed === undefined ? null : normalizeState(parsed);
  if (normalized && normalized.dropped === 0) return { state: normalized.state, notices: normalized.issues };
  // Keep the original bytes before anything overwrites them.
  const backupKey = `${STORE_KEY}-respaldo-${now.toISOString()}`;
  let backedUp = true;
  try { storage.setItem(backupKey, raw); } catch { backedUp = false; }
  const saved = backedUp ? `Se guardó una copia sin cambios en «${backupKey}».` : "No se pudo guardar una copia: el navegador lo impidió.";
  if (!normalized) return { state: seedDemo(), notices: [`Los datos guardados no se pudieron leer y la demo volvió a los datos iniciales. ${saved}`], backupKey: backedUp ? backupKey : undefined };
  return { state: normalized.state, notices: [...normalized.issues, saved], backupKey: backedUp ? backupKey : undefined };
}
