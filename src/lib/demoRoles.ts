import type { DemoState } from "./demo";

export type DemoRole = "reception" | "dentist" | "admin";
export const demoRoles = {
  reception: { label: "Recepción", title: "Todo listo para recibir pacientes", description: "Coordina citas y consulta los datos de contacto de la clínica." },
  dentist: { label: "Dentista", title: "Tu jornada clínica", description: "Revisa tus pacientes, evoluciones y planes de tratamiento ficticios." },
  admin: { label: "Admin", title: "La clínica, de un vistazo", description: "Consulta la actividad general y explora la organización del equipo." },
} satisfies Record<DemoRole, { label: string; title: string; description: string }>;

// Presentation only. These functions do not authenticate or protect stored data.
export const canSchedule = (role: DemoRole) => role !== "dentist";
export const canEditClinical = (role: DemoRole) => role === "dentist";

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
  };
}
