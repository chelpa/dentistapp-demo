import { test } from "node:test";
import assert from "node:assert/strict";
import { seedDemo } from "../src/lib/demo";
import { canCreateBudget, canEditClinical, canEditTariffs, canEditTreatments, canSchedule, canViewClinical, canViewTeam, canViewTreatments, dataForRole, type DemoRole } from "../src/lib/demoRoles";

test("presentation permissions follow the approved matrix (plan §5b)", () => {
  const row = (r: DemoRole) => [canSchedule(r), canViewClinical(r), canEditClinical(r), canViewTreatments(r), canEditTreatments(r), canEditTariffs(r), canCreateBudget(r), canViewTeam(r)];
  assert.deepEqual(row("reception"), [true, false, false, false, false, false, true, false]);
  assert.deepEqual(row("dentist"), [false, true, true, true, true, false, true, false]);
  assert.deepEqual(row("admin"), [true, true, false, true, false, true, false, true]);
});
test("reception and admin see the whole clinic", () => {
  const data = seedDemo();
  assert.equal(dataForRole(data, "reception", "x"), data);
  assert.equal(dataForRole(data, "admin", "x"), data);
});
test("a dentist sees own agenda, linked patients, all tariffs and only their patients' budgets", () => {
  const data = seedDemo();
  data.budgets = [
    { id: "b1", patientId: "p1", date: "2026-10-12", lines: [], discount: 0, status: "Borrador", createdBy: "Recepción" },
    { id: "b2", patientId: "p2", date: "2026-10-12", lines: [], discount: 0, status: "Borrador", createdBy: "Recepción" },
  ];
  const view = dataForRole(data, "dentist", "Dra. Valentina Rojas");
  assert.ok(view.appointments.length > 0 && view.appointments.every(a => a.dentist === "Dra. Valentina Rojas"));
  assert.deepEqual(view.patients.map(p => p.id), ["p1", "p3"]);
  assert.deepEqual(view.budgets.map(b => b.id), ["b1"]);
  assert.equal(view.tariffs, data.tariffs);
  assert.ok(view.notes.every(n => ["p1", "p3"].includes(n.patientId)));
  // The filtered view never replaces the full data: the source keeps everything.
  assert.equal(data.budgets.length, 2);
});
