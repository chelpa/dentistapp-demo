import type { Appointment, DemoState } from "./demo";

/**
 * Appointments an evolution note can be linked to: same patient, same professional
 * (the note's author), not cancelled and not in the future. Most recent first.
 */
export function noteAppointmentOptions(data: DemoState, patientId: string, professional: string, today: string): Appointment[] {
  return data.appointments
    .filter(a => a.patientId === patientId && a.dentist === professional && a.status !== "Cancelada" && a.date <= today)
    .sort((a, b) => b.date.localeCompare(a.date) || b.time.localeCompare(a.time));
}

/** Returns an error message when the link is not allowed, or null when it is valid (or absent). */
export function validateNoteLink(data: DemoState, note: { patientId: string; author: string; appointmentId?: string }, today: string): string | null {
  if (!note.appointmentId) return null;
  const appointment = data.appointments.find(a => a.id === note.appointmentId);
  if (!appointment) return "La atención seleccionada no existe.";
  if (appointment.patientId !== note.patientId) return "La atención pertenece a otro paciente.";
  if (appointment.dentist !== note.author) return "La atención corresponde a otro profesional.";
  if (appointment.status === "Cancelada") return "No se puede vincular una cita cancelada.";
  if (appointment.date > today) return "Esa atención todavía no ocurre.";
  return null;
}
