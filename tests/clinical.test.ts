import { test } from "node:test";
import assert from "node:assert/strict";
import { type DemoState, seedDemo } from "../src/lib/demo";
import { noteAppointmentOptions, validateNoteLink } from "../src/lib/clinical";

const TODAY = "2026-10-12";
const NOW = new Date("2026-10-12T12:00:00"); // local time, as in the browser
const fixture = (): DemoState => {
  const s = seedDemo();
  s.appointments = [
    { id: "own", patientId: "p1", date: TODAY, time: "09:00", duration: 45, dentist: "Dra. A", chair: "Sillón 1", type: "Control", status: "Confirmada" },
    { id: "past", patientId: "p1", date: "2026-10-01", time: "10:00", duration: 30, dentist: "Dra. A", chair: "Sillón 1", type: "Evaluación", status: "Completada" },
    { id: "otherPatient", patientId: "p2", date: TODAY, time: "11:00", duration: 30, dentist: "Dra. A", chair: "Sillón 2", type: "Control", status: "Confirmada" },
    { id: "otherDentist", patientId: "p1", date: TODAY, time: "12:00", duration: 30, dentist: "Dr. B", chair: "Sillón 2", type: "Control", status: "Confirmada" },
    { id: "cancelled", patientId: "p1", date: "2026-10-05", time: "12:00", duration: 30, dentist: "Dra. A", chair: "Sillón 2", type: "Control", status: "Cancelada" },
    { id: "future", patientId: "p1", date: "2026-10-20", time: "12:00", duration: 30, dentist: "Dra. A", chair: "Sillón 2", type: "Control", status: "Confirmada" },
  ];
  return s;
};
const note = (appointmentId?: string) => ({ patientId: "p1", author: "Dra. A", appointmentId });

test("options: same patient and professional, not cancelled, not future, most recent first", () => {
  assert.deepEqual(noteAppointmentOptions(fixture(), "p1", "Dra. A", NOW).map(a => a.id), ["own", "past"]);
});
test("a valid link and an unlinked note are both accepted", () => {
  assert.equal(validateNoteLink(fixture(), note("own"), NOW), null);
  assert.equal(validateNoteLink(fixture(), note("past"), NOW), null);
  assert.equal(validateNoteLink(fixture(), note(undefined), NOW), null);
});
test("rejections: other patient, other professional, nonexistent, cancelled, future", () => {
  assert.match(validateNoteLink(fixture(), note("otherPatient"), NOW)!, /otro paciente/);
  assert.match(validateNoteLink(fixture(), note("otherDentist"), NOW)!, /otro profesional/);
  assert.match(validateNoteLink(fixture(), note("nope"), NOW)!, /no existe/);
  assert.match(validateNoteLink(fixture(), note("cancelled"), NOW)!, /cancelada/);
  assert.match(validateNoteLink(fixture(), note("future"), NOW)!, /todavía no ocurre/);
});

test("REVIEW P2: an appointment later today has not happened yet (date and start time are compared)", () => {
  const data = fixture();
  data.appointments.push({ id: "tonight", patientId: "p1", date: TODAY, time: "19:45", duration: 15, dentist: "Dra. A", chair: "Sillón 3", type: "Control", status: "Confirmada" });
  const at = (clock: string) => new Date(`${TODAY}T${clock}:00`);
  assert.equal(noteAppointmentOptions(data, "p1", "Dra. A", at("09:00")).some(a => a.id === "tonight"), false, "not offered at 09:00");
  assert.match(validateNoteLink(data, note("tonight"), at("09:00"))!, /todavía no ocurre/);
  assert.match(validateNoteLink(data, note("tonight"), at("19:44"))!, /todavía no ocurre/);
  assert.equal(validateNoteLink(data, note("tonight"), at("19:45")), null, "allowed from the start instant");
  assert.equal(noteAppointmentOptions(data, "p1", "Dra. A", at("19:45")).some(a => a.id === "tonight"), true);
  assert.equal(validateNoteLink(data, note("tonight"), at("20:30")), null, "allowed after it");
  assert.match(validateNoteLink(data, note("own"), new Date("2026-10-12T08:59:00"))!, /todavía no ocurre/, "09:00 not started at 08:59");
  assert.match(validateNoteLink(data, note("future"), at("23:59"))!, /todavía no ocurre/, "next days stay future");
  assert.equal(validateNoteLink(data, note("past"), new Date("2026-10-01T10:00:00")), null, "past day at its start");
});
test("an appointment with an unreadable date or time can never be linked", () => {
  const data = fixture();
  data.appointments.push({ id: "broken", patientId: "p1", date: TODAY, time: "9h", duration: 15, dentist: "Dra. A", chair: "Sillón 3", type: "Control", status: "Confirmada" });
  assert.match(validateNoteLink(data, note("broken"), NOW)!, /todavía no ocurre/);
});
