import { test } from "node:test";
import assert from "node:assert/strict";
import { type DemoState, seedDemo } from "../src/lib/demo";
import { LEGACY_KEYS, STORE_KEY, loadState, normalizeState, type KeyValueStore } from "../src/lib/storage";

class MemoryStore implements KeyValueStore {
  data = new Map<string, string>(); writes: string[] = [];
  constructor(initial: Record<string, string> = {}) { for (const [k, v] of Object.entries(initial)) this.data.set(k, v); }
  getItem(key: string) { return this.data.has(key) ? this.data.get(key)! : null; }
  setItem(key: string, value: string) { this.writes.push(key); this.data.set(key, value); }
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
test("normalisation never invents chairs and keeps invalid appointments (reported)", () => {
  const raw = legacyState();
  (raw.appointments as Record<string, unknown>[]).push({ id: "bad", patientId: "p1", date: "2026-13-40", time: "25:00", duration: 7, dentist: "X", type: "Control", status: "Confirmada" });
  const out = normalizeState(raw)!;
  assert.ok(out);
  assert.equal(out.state.appointments.filter(a => a.id !== "bad").every(a => a.chair === undefined), true);
  assert.equal(out.state.appointments.some(a => a.id === "bad"), true);
  assert.equal(out.dropped, 0);
  assert.match(out.issues.join(" "), /1 citas guardadas tienen fecha, hora o duración inválida/);
  assert.deepEqual(out.state.tariffs, seedDemo().tariffs);
  assert.deepEqual(out.state.budgets, []);
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
