import { type DemoState, seedDemo } from "./demo";
import { appointmentStatuses, minutes, validAppointmentTime, validDate } from "./calendar";

export const STORE_KEY = "dentistapp-mvp-demo-v4";
/** Keys written by earlier demo versions. They are read only to inform the visitor; never modified. */
export const LEGACY_KEYS = ["dentistapp-mvp-demo-v1", "dentistapp-mvp-demo-v3"] as const;

export type KeyValueStore = { getItem(key: string): string | null; setItem(key: string, value: string): void };
export type ResettableStore = KeyValueStore & { removeItem(key: string): void };
export type LoadResult = { state: DemoState; notices: string[]; backupKey?: string };

const REQUIRED = ["patients", "appointments", "treatments", "notes", "teeth"] as const;
type Rec = Record<string, unknown>;
const isRecord = (value: unknown): value is Rec => typeof value === "object" && value !== null && !Array.isArray(value);
const isText = (v: unknown): v is string => typeof v === "string";
const isId = (v: unknown): v is string => typeof v === "string" && v.trim() !== "";
const isNumber = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v);
const oneOf = (values: readonly string[]) => (v: unknown) => typeof v === "string" && values.includes(v);
const toothStatus = oneOf(["Sano", "Observación", "Tratado"]);
const treatmentStatus = oneOf(["Planificado", "En curso", "Finalizado"]);
const budgetStatus = oneOf(["Borrador", "Entregado", "Aceptado"]);
const appointmentStatus = oneOf(appointmentStatuses);
const validDay = (v: unknown) => typeof v === "string" && validDate(v);

// Minimal fields each screen reads (review P2): a record missing any of them, or with an
// unreadable date, would break rendering, so it is set aside instead of being shown.
const VALID = {
  patients: (p: Rec) => isId(p.id) && isId(p.name) && isText(p.initials) && isNumber(p.age) && isText(p.phone) && isText(p.email) && validDay(p.lastVisit) && isText(p.note) && isText(p.color),
  appointments: (a: Rec) => isId(a.id) && isId(a.patientId) && validDay(a.date) && isText(a.time) && Number.isFinite(minutes(a.time)) && isNumber(a.duration) && a.duration > 0 && isId(a.dentist) && isText(a.type) && appointmentStatus(a.status) && (a.chair === undefined || isText(a.chair)),
  treatments: (t: Rec) => isId(t.id) && isId(t.patientId) && isId(t.name) && (t.tooth === null || isNumber(t.tooth)) && treatmentStatus(t.status) && isText(t.dentist) && validDay(t.date),
  notes: (n: Rec) => isId(n.id) && isId(n.patientId) && isText(n.text) && validDay(n.date) && isText(n.author) && (n.appointmentId === undefined || isText(n.appointmentId)),
  teeth: (t: Rec) => isId(t.patientId) && isNumber(t.tooth) && toothStatus(t.status),
  toothEvents: (e: Rec) => isId(e.id) && isId(e.patientId) && isNumber(e.tooth) && toothStatus(e.status) && validDay(e.date) && isText(e.author),
  tariffs: (t: Rec) => isId(t.id) && isId(t.name) && isNumber(t.price) && t.price >= 0,
  budgets: (b: Rec) => isId(b.id) && isId(b.patientId) && validDay(b.date) && Array.isArray(b.lines) && b.lines.every(l => isRecord(l) && isId(l.tariffId) && isNumber(l.quantity) && (l.tooth === null || isNumber(l.tooth)) && isNumber(l.unitPrice)) && isNumber(b.discount) && budgetStatus(b.status) && (b.createdBy === undefined || isText(b.createdBy)),
} satisfies Record<keyof DemoState, (r: Rec) => boolean>;
const DEPENDENT = ["appointments", "treatments", "notes", "teeth", "toothEvents", "budgets"] as const;

/**
 * Validates stored data without inventing or silently losing information:
 * - records that are not objects, lack a field the interface reads, have an unreadable
 *   date, or point to a patient that was set aside are excluded and counted in `dropped`
 *   (the caller keeps a byte-for-byte backup before saving anything);
 * - missing chairs stay missing; appointments that are readable but outside the agenda
 *   rules are kept and reported; optional collections get defaults.
 */
export function normalizeState(raw: unknown): { state: DemoState; dropped: number; issues: string[] } | null {
  if (!isRecord(raw) || REQUIRED.some(key => !Array.isArray(raw[key]))) return null;
  let unreadable = 0, incompletePatients = 0, incompleteOthers = 0, dependents = 0;
  const pick = <K extends keyof DemoState>(key: K): DemoState[K] => {
    const value = raw[key];
    if (!Array.isArray(value)) return (key === "tariffs" ? seedDemo().tariffs : []) as DemoState[K];
    const objects = value.filter(isRecord);
    unreadable += value.length - objects.length;
    const valid = objects.filter(VALID[key]);
    if (key === "patients") incompletePatients += objects.length - valid.length;
    else incompleteOthers += objects.length - valid.length;
    return valid as unknown as DemoState[K];
  };
  const state = {} as DemoState;
  for (const key of Object.keys(VALID) as (keyof DemoState)[]) (state as Record<string, unknown>)[key] = pick(key);
  const patientIds = new Set(state.patients.map(p => p.id));
  for (const key of DEPENDENT) {
    const list = state[key] as { patientId: string }[];
    const kept = list.filter(r => patientIds.has(r.patientId));
    dependents += list.length - kept.length;
    (state as Record<string, unknown>)[key] = kept;
  }
  const issues: string[] = [];
  if (unreadable) issues.push(`${unreadable} registros guardados no se pudieron leer.`);
  if (incompletePatients) issues.push(`${incompletePatients} pacientes guardados están incompletos o tienen fechas inválidas y se apartaron.`);
  if (incompleteOthers) issues.push(`${incompleteOthers} registros guardados (citas, tratamientos, notas, piezas, aranceles o presupuestos) están incompletos y se apartaron.`);
  if (dependents) issues.push(`${dependents} registros que dependen de ellos se apartaron también.`);
  const outOfRules = state.appointments.filter(a => !validAppointmentTime(a)).length;
  if (outOfRules) issues.push(`${outOfRules} citas guardadas están fuera del horario o de las reglas de duración: se conservan, pero no se dibujan en la agenda.`);
  return { state, dropped: unreadable + incompletePatients + incompleteOthers + dependents, issues };
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

/**
 * Recovery used by the error screen: copies the current v4 bytes to a backup key and
 * clears only the v4 key, so the next load starts from the seed. Earlier keys are untouched.
 * Returns the backup key, or null when there was nothing to back up.
 */
export function backupAndReset(storage: ResettableStore, now: Date = new Date()): string | null {
  const raw = storage.getItem(STORE_KEY);
  let key: string | null = null;
  if (raw !== null) { key = `${STORE_KEY}-respaldo-${now.toISOString()}`; storage.setItem(key, raw); }
  storage.removeItem(STORE_KEY);
  return key;
}
