import { test } from "node:test";
import assert from "node:assert/strict";
import { type DemoState, seedDemo } from "../src/lib/demo";
import { noteAppointmentOptions, validateNoteLink } from "../src/lib/clinical";

const TODAY = "2026-10-12";
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
  assert.deepEqual(noteAppointmentOptions(fixture(), "p1", "Dra. A", TODAY).map(a => a.id), ["own", "past"]);
});
test("a valid link and an unlinked note are both accepted", () => {
  assert.equal(validateNoteLink(fixture(), note("own"), TODAY), null);
  assert.equal(validateNoteLink(fixture(), note("past"), TODAY), null);
  assert.equal(validateNoteLink(fixture(), note(undefined), TODAY), null);
});
test("rejections: other patient, other professional, nonexistent, cancelled, future", () => {
  assert.match(validateNoteLink(fixture(), note("otherPatient"), TODAY)!, /otro paciente/);
  assert.match(validateNoteLink(fixture(), note("otherDentist"), TODAY)!, /otro profesional/);
  assert.match(validateNoteLink(fixture(), note("nope"), TODAY)!, /no existe/);
  assert.match(validateNoteLink(fixture(), note("cancelled"), TODAY)!, /cancelada/);
  assert.match(validateNoteLink(fixture(), note("future"), TODAY)!, /todavía no ocurre/);
});
