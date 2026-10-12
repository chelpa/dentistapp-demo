import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { addDays, appointmentLanes, chairs, filterAppointments, findConflict, isPastAppointment, minutes, validAppointmentTime, validDate, weekDays } from "../src/lib/calendar";
import { type Appointment, seedDemo } from "../src/lib/demo";

const booking = (overrides: Partial<Appointment> = {}): Appointment => ({ id: "new", patientId: "p1", date: "2026-10-12", time: "09:00", duration: 45, dentist: "A", chair: "Sillón 1", type: "Control", status: "Confirmada", ...overrides });

test("Sunday anchors to Monday; work week excludes weekend", () => {
  assert.deepEqual(weekDays("2026-10-18"), ["2026-10-12", "2026-10-13", "2026-10-14", "2026-10-15", "2026-10-16", "2026-10-17", "2026-10-18"]);
  assert.equal(weekDays("2026-10-18", true).length, 5);
});
test("week navigation crosses months and years", () => {
  assert.deepEqual(weekDays("2027-01-01"), ["2026-12-28", "2026-12-29", "2026-12-30", "2026-12-31", "2027-01-01", "2027-01-02", "2027-01-03"]);
  assert.equal(addDays("2026-12-28", 7), "2027-01-04");
  assert.equal(addDays("2027-01-04", -7), "2026-12-28");
});
test("civil date navigation does not drift across Chile daylight saving", () => {
  assert.equal(addDays("2026-09-05", 1), "2026-09-06");
  assert.equal(addDays("2026-09-06", 1), "2026-09-07");
  assert.equal(weekDays("2026-09-06")[6], "2026-09-06");
});
test("date validation rejects empty, malformed, nonexistent and rollover dates", () => {
  for (const date of ["", "2026-2-03", "2026-02-29", "2026-04-31", "2026-13-01", "invalid", "2026-10-12T00:00:00"]) assert.equal(validDate(date), false, date);
  assert.equal(validDate("2028-02-29"), true);
  assert.throws(() => weekDays("invalid"));
});
test("valid bounds: 08:00, 19:45 plus 15 min, end exactly 20:00", () => {
  assert.equal(validAppointmentTime(booking({ time: "08:00" })), true);
  assert.equal(validAppointmentTime(booking({ time: "19:45", duration: 15 })), true);
  assert.equal(validAppointmentTime(booking({ time: "19:00", duration: 60 })), true);
});
test("reject invalid times, hours and duration granularity", () => {
  for (const time of ["", "9:00", "24:00", "09:60", "xx:00", "07:45", "20:00", "09:07"]) assert.equal(validAppointmentTime(booking({ time })), false, time);
  for (const duration of [0, -15, 14, 20, 241, NaN]) assert.equal(validAppointmentTime(booking({ duration })), false, `${duration}`);
  assert.equal(validAppointmentTime(booking({ time: "19:45", duration: 30 })), false);
  assert.ok(Number.isNaN(minutes("bad")));
});
test("same dentist conflicts even on different chair and patient", () => {
  const existing = booking({ id: "old", chair: "Sillón 2", patientId: "p2" });
  assert.equal(findConflict(booking({ time: "09:30" }), [existing])?.id, "old");
});
test("same chair conflicts with different dentist", () => {
  assert.equal(findConflict(booking(), [booking({ id: "old", dentist: "B" })])?.id, "old");
});
test("adjacent appointments do not conflict; overlap by 15 minutes does", () => {
  const old = booking({ id: "old" });
  assert.equal(findConflict(booking({ time: "09:45" }), [old]), undefined);
  assert.equal(findConflict(booking({ time: "09:30" }), [old])?.id, "old");
  assert.equal(findConflict(booking({ time: "08:15" }), [old]), undefined);
});
test("different date or both independent resources permit simultaneous appointments", () => {
  assert.equal(findConflict(booking(), [booking({ id: "old", date: "2026-10-13" })]), undefined);
  assert.equal(findConflict(booking(), [booking({ id: "old", dentist: "B", chair: "Sillón 2" })]), undefined);
});
test("cancelled appointments release resources but reactivating must recheck conflicts", () => {
  const cancelled = booking({ id: "old", status: "Cancelada" });
  assert.equal(findConflict(booking(), [cancelled]), undefined);
  assert.equal(findConflict(cancelled, [booking()]), undefined);
  assert.equal(findConflict({ ...cancelled, status: "Confirmada" }, [booking()])?.id, "new");
});
test("waiting and completed appointments still occupy their reserved time", () => {
  for (const status of ["En espera", "Completada"] as const) assert.equal(findConflict(booking(), [booking({ id: "old", status })])?.id, "old");
});
test("a status update excludes its own appointment", () => {
  assert.equal(findConflict(booking({ status: "Completada" }), [booking()]), undefined);
});
test("legacy appointments keep no fabricated chair; dentist conflicts remain enforced", () => {
  // v0.4 seeds fresh demo data with chairs; legacy data (no chair) is covered by the booking fixture
  // below and by normalizeState tests. The seed itself must only use known chairs and be conflict-free.
  const seed = seedDemo().appointments;
  assert.equal(seed.every(a => a.chair !== undefined && chairs.includes(a.chair)), true);
  for (const a of seed) assert.equal(findConflict(a, seed), undefined, a.id);
  const legacy = booking({ id: "old", chair: undefined });
  assert.equal(findConflict(booking(), [legacy])?.id, "old");
  assert.equal(findConflict(booking({ dentist: "B" }), [legacy]), undefined);
});
test("resource filters combine and expose unassigned legacy bookings", () => {
  const appointments = [booking({ id: "a" }), booking({ id: "b", dentist: "B", chair: "Sillón 2" }), booking({ id: "c", chair: undefined })];
  assert.deepEqual(filterAppointments(appointments, "A", "Sillón 1").map(a => a.id), ["a"]);
  assert.deepEqual(filterAppointments(appointments, "", "unassigned").map(a => a.id), ["c"]);
  assert.equal(filterAppointments(appointments, "", "").length, 3);
});
test("simultaneous appointments occupy separate lanes", () => {
  const lanes = appointmentLanes([booking({ id: "a" }), booking({ id: "b", dentist: "B", chair: "Sillón 2" }), booking({ id: "c", time: "09:45" })]);
  assert.deepEqual(lanes.map(({ appointment, lane, lanes }) => [appointment.id, lane, lanes]), [["a", 0, 2], ["b", 1, 2], ["c", 0, 1]]);
});
test("nested and chained overlaps receive safe shared lane counts", () => {
  const lanes = appointmentLanes([booking({ id: "a", duration: 120 }), booking({ id: "b", time: "09:15", duration: 15 }), booking({ id: "c", time: "09:30", duration: 30 }), booking({ id: "d", time: "09:45", duration: 60 })]);
  for (const item of lanes) assert.equal(item.lanes, 3);
  for (const a of lanes) for (const b of lanes) {
    if (a.appointment.id === b.appointment.id) continue;
    if (minutes(a.appointment.time) < minutes(b.appointment.time) + b.appointment.duration && minutes(b.appointment.time) < minutes(a.appointment.time) + a.appointment.duration) assert.notEqual(a.lane, b.lane);
  }
});
test("lane calculation skips invalid entries without mutating appointments", () => {
  const appointments = [booking({ id: "valid" }), booking({ id: "bad", time: "invalid" })];
  const before = JSON.stringify(appointments);
  assert.equal(appointmentLanes(appointments).length, 1);
  assert.equal(JSON.stringify(appointments), before);
});

test("creation rejects past time today and historical dates with injectable clock", () => {
  const now = new Date("2026-10-12T09:30:00");
  assert.equal(isPastAppointment(booking({ time: "08:00" }), now), true);
  assert.equal(isPastAppointment(booking({ time: "09:30" }), now), false);
  assert.equal(isPastAppointment(booking({ time: "09:45" }), now), false);
  assert.equal(isPastAppointment(booking({ date: "2026-10-11", time: "19:45" }), now), true);
  assert.equal(isPastAppointment(booking({ date: "2026-10-13", time: "08:00" }), now), false);
  assert.equal(isPastAppointment(booking({ time: "invalid" }), now), true);
});

test("RADO evidence logs retain the exact bytes bound by the manifest", () => {
  const directory = "docs/calendar-001/evidence/";
  const manifest = JSON.parse(readFileSync(`${directory}manifest.json`, "utf8")) as { sourceDigest: string; sources: { path: string; sha256: string }[]; runs: { log: string; logSha256: string }[] };
  const digest = (bytes: string | Buffer) => createHash("sha256").update(bytes).digest("hex");
  assert.equal(digest(JSON.stringify(manifest.sources)), manifest.sourceDigest);
  for (const run of manifest.runs) assert.equal(digest(readFileSync(`${directory}${run.log}`)), run.logSha256, run.log);
});
