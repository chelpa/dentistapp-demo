import type { DemoState } from "./demo";

export type DemoRole = "reception" | "dentist" | "admin";
export const demoRoles = {
  reception: { label: "Recepción", title: "Todo listo para recibir pacientes", description: "Coordina citas, presupuestos y datos de contacto de la clínica." },
  dentist: { label: "Dentista", title: "Tu jornada clínica", description: "Revisa tu agenda, tus pacientes, evoluciones y planes de tratamiento ficticios." },
  admin: { label: "Admin", title: "La clínica, de un vistazo", description: "Consulta la actividad general, ajusta aranceles y explora la organización del equipo." },
} satisfies Record<DemoRole, { label: string; title: string; description: string }>;

// Presentation permissions only (plan §5b). They shape the interface; they do not
// authenticate anyone or protect stored data: any visitor can switch roles.
export const canSchedule = (role: DemoRole) => role !== "dentist";
export const canEditClinical = (role: DemoRole) => role === "dentist";
export const canViewClinical = (role: DemoRole) => role !== "reception";
export const canEditTreatments = canEditClinical;
export const canViewTreatments = canViewClinical;
export const canEditTariffs = (role: DemoRole) => role === "admin";
export const canCreateBudget = (role: DemoRole) => role !== "admin";
export const canViewTeam = (role: DemoRole) => role === "admin";

/**
 * Data each role sees on screen. Reception and Admin see the whole clinic.
 * A dentist sees their own appointments and treatments, and the patients linked to
 * them (plus budgets of those patients). Booking conflicts must NOT use this view:
 * they are always checked against the full data set.
 */
export function dataForRole(data: DemoState, role: DemoRole, professional: string): DemoState {
  if (role !== "dentist") return data;
  const appointments = data.appointments.filter(a => a.dentist === professional);
  const treatments = data.treatments.filter(t => t.dentist === professional);
  const patientIds = new Set([...appointments, ...treatments].map(item => item.patientId));
  data.notes.filter(note => note.author === professional).forEach(note => patientIds.add(note.patientId));
  return {
    patients: data.patients.filter(p => patientIds.has(p.id)), appointments, treatments,
    notes: data.notes.filter(n => patientIds.has(n.patientId)),
    teeth: data.teeth.filter(t => patientIds.has(t.patientId)),
    toothEvents: data.toothEvents.filter(e => patientIds.has(e.patientId)),
    tariffs: data.tariffs,
    budgets: data.budgets.filter(b => patientIds.has(b.patientId)),
  };
}
