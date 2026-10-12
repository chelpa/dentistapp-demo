import { test } from "node:test";
import assert from "node:assert/strict";
import { type DemoState, seedDemo } from "../src/lib/demo";
import { LEGACY_KEYS, STORE_KEY, backupAndReset, loadState, normalizeState, type KeyValueStore } from "../src/lib/storage";

class MemoryStore implements KeyValueStore {
  data = new Map<string, string>(); writes: string[] = [];
  constructor(initial: Record<string, string> = {}) { for (const [k, v] of Object.entries(initial)) this.data.set(k, v); }
  getItem(key: string) { return this.data.has(key) ? this.data.get(key)! : null; }
  setItem(key: string, value: string) { this.writes.push(key); this.data.set(key, value); }
  removeItem(key: string) { this.writes.push(`-${key}`); this.data.delete(key); }
}
const legacyState = (): Record<string, unknown> => {
  const s = seedDemo() as unknown as Record<string, unknown>;
  // A v1-era record: no chair on appointments, no tariffs/budgets collections.
  s.appointments = (s.appointments as Record<string, unknown>[]).map(({ chair: _chair, ...rest }) => rest);
  delete s.tariffs; delete s.budgets;
  return s;
};

test("uses the v4 key and never the keys of earlier versions", () => {
  assert.equal(STORE_KEY, "dentistapp-mvp-demo-v4");
  assert.deepEqual([...LEGACY_KEYS], ["dentistapp-mvp-demo-v1", "dentistapp-mvp-demo-v3"]);
});
test("first visit with earlier data: fresh seed, a notice, and earlier keys untouched", () => {
  const before = JSON.stringify(legacyState());
  const store = new MemoryStore({ "dentistapp-mvp-demo-v1": before, "dentistapp-mvp-demo-v3": "{}" });
  const result = loadState(store);
  assert.equal(result.state.appointments.length, seedDemo().appointments.length);
  assert.equal(result.notices.length, 1);
  assert.match(result.notices[0], /versiones anteriores siguen guardados/);
  assert.deepEqual(store.writes, []);
  assert.equal(store.getItem("dentistapp-mvp-demo-v1"), before);
});
test("first visit without earlier data: fresh seed and no notice", () => {
  const result = loadState(new MemoryStore());
  assert.deepEqual(result.notices, []);
});
test("valid v4 data loads as is, without writes", () => {
  const saved: DemoState = seedDemo();
  saved.appointments[0].status = "Completada";
  const store = new MemoryStore({ [STORE_KEY]: JSON.stringify(saved) });
  const result = loadState(store);
  assert.equal(result.state.appointments[0].status, "Completada");
  assert.deepEqual(store.writes, []);
});
test("normalisation never invents chairs; renderable but out-of-hours appointments are kept and reported", () => {
  const raw = legacyState();
  (raw.appointments as Record<string, unknown>[]).push({ id: "early", patientId: "p1", date: "2026-10-12", time: "07:00", duration: 45, dentist: "X", type: "Control", status: "Confirmada" });
  const out = normalizeState(raw)!;
  assert.ok(out);
  assert.equal(out.state.appointments.filter(a => a.id !== "early").every(a => a.chair === undefined), true);
  assert.equal(out.state.appointments.some(a => a.id === "early"), true);
  assert.equal(out.dropped, 0);
  assert.match(out.issues.join(" "), /1 citas guardadas están fuera del horario o de las reglas de duración/);
  assert.deepEqual(out.state.tariffs, seedDemo().tariffs);
  assert.deepEqual(out.state.budgets, []);
});
test("the fresh seed passes validation with no issues", () => {
  const out = normalizeState(seedDemo())!;
  assert.equal(out.dropped, 0);
  assert.deepEqual(out.issues, []);
});
test("REVIEW P2: a patient missing the fields the interface uses is set aside with its records, backed up and reported", () => {
  const raw = seedDemo() as unknown as Record<string, unknown>;
  (raw.patients as unknown[])[0] = { id: "p1" };
  const original = JSON.stringify(raw);
  const store = new MemoryStore({ [STORE_KEY]: original });
  const result = loadState(store, new Date("2026-10-12T21:00:00Z"));
  assert.ok(result.backupKey, "a backup is written before anything else");
  assert.equal(store.getItem(result.backupKey!), original);
  assert.equal(result.state.patients.some(p => p.id === "p1"), false);
  // Records that point to the incomplete patient cannot be shown safely either; none are invented.
  for (const list of [result.state.appointments, result.state.treatments, result.state.notes, result.state.teeth, result.state.toothEvents, result.state.budgets]) {
    assert.equal((list as { patientId: string }[]).some(r => r.patientId === "p1"), false);
  }
  assert.match(result.notices.join(" "), /1 pacientes guardados están incompletos/);
  assert.match(result.notices.join(" "), /registros que dependen de ellos/);
  assert.match(result.notices.join(" "), /copia sin cambios/);
});
test("REVIEW P2: invalid dates or broken references never reach the interface", () => {
  const raw = seedDemo() as unknown as Record<string, Record<string, unknown>[]>;
  raw.patients[1].lastVisit = "2026-13-40";
  raw.appointments[3].date = "mañana";
  raw.notes[0].date = "";
  raw.treatments[4].patientId = "no-existe";
  raw.toothEvents = [{ id: "e1", patientId: "p3", tooth: 16, status: "Tratado", date: "x", author: "A" }];
  raw.budgets = [{ id: "b1", patientId: "p4", date: "2026-10-12", lines: [{ tariffId: "tar1", quantity: "dos", tooth: null, unitPrice: 1 }], discount: 0, status: "Borrador" }];
  const out = normalizeState(raw)!;
  assert.ok(out.dropped > 0);
  const isoDate = /^\d{4}-\d{2}-\d{2}$/;
  const ids = new Set(out.state.patients.map(p => p.id));
  assert.equal(out.state.patients.every(p => isoDate.test(p.lastVisit) && typeof p.name === "string" && typeof p.email === "string"), true);
  for (const r of [...out.state.appointments, ...out.state.treatments, ...out.state.notes, ...out.state.toothEvents, ...out.state.budgets]) {
    assert.ok(ids.has(r.patientId), `reference ${r.patientId}`);
    assert.ok(isoDate.test((r as { date: string }).date), `date of ${(r as { id: string }).id}`);
  }
  assert.equal(out.state.budgets.length, 0);
});
test("recovery: backupAndReset keeps the original bytes and clears only the v4 key", () => {
  const store = new MemoryStore({ [STORE_KEY]: "{broken", "dentistapp-mvp-demo-v1": "old" });
  const key = backupAndReset(store, new Date("2026-10-12T21:00:00Z"));
  assert.equal(store.getItem(key!), "{broken");
  assert.equal(store.getItem(STORE_KEY), null);
  assert.equal(store.getItem("dentistapp-mvp-demo-v1"), "old");
});
test("unreadable entries are counted and the original bytes are backed up before use", () => {
  const raw = seedDemo() as unknown as Record<string, unknown>;
  (raw.notes as unknown[]).push("not a note", 42);
  const original = JSON.stringify(raw);
  const store = new MemoryStore({ [STORE_KEY]: original });
  const result = loadState(store, new Date("2026-10-12T21:00:00Z"));
  assert.equal(result.backupKey, `${STORE_KEY}-respaldo-2026-10-12T21:00:00.000Z`);
  assert.equal(store.getItem(result.backupKey!), original);
  assert.equal(result.state.notes.length, seedDemo().notes.length);
  assert.match(result.notices.join(" "), /2 registros guardados no se pudieron leer/);
});
test("corrupt JSON or missing collections: seed, backup of the original, explicit notice", () => {
  for (const original of ["{not json", JSON.stringify({ patients: [] })]) {
    const store = new MemoryStore({ [STORE_KEY]: original });
    const result = loadState(store, new Date("2026-10-12T21:00:00Z"));
    assert.equal(store.getItem(result.backupKey!), original);
    assert.equal(result.state.patients.length, seedDemo().patients.length);
    assert.match(result.notices[0], /no se pudieron leer/);
  }
});
test("a browser that blocks storage still gets a working demo", () => {
  const blocked: KeyValueStore = { getItem() { throw new Error("SecurityError"); }, setItem() { throw new Error("SecurityError"); } };
  const result = loadState(blocked);
  assert.equal(result.state.patients.length, seedDemo().patients.length);
  assert.match(result.notices[0], /no permite leer/);
});
