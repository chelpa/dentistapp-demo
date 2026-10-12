import type { Appointment, DemoState } from "./demo";
import { minutes, validDate } from "./calendar";

/**
 * An attention has happened (or is happening) once its start instant is reached.
 * Compares date AND start time in local civil time, like appointment creation does
 * (review P2: comparing only the day let a 19:45 appointment be linked at 09:00).
 * Unreadable dates or times never count as started.
 */
export function hasStarted(appointment: Pick<Appointment, "date" | "time">, now: Date): boolean {
  if (!validDate(appointment.date) || !Number.isFinite(minutes(appointment.time))) return false;
  return new Date(`${appointment.date}T${appointment.time}:00`).getTime() <= now.getTime();
}

/**
 * Appointments an evolution note can be linked to: same patient, same professional
 * (the note's author), not cancelled and already started. Most recent first.
 */
export function noteAppointmentOptions(data: DemoState, patientId: string, professional: string, now: Date): Appointment[] {
  return data.appointments
    .filter(a => a.patientId === patientId && a.dentist === professional && a.status !== "Cancelada" && hasStarted(a, now))
    .sort((a, b) => b.date.localeCompare(a.date) || b.time.localeCompare(a.time));
}

/** Returns an error message when the link is not allowed, or null when it is valid (or absent). Same rule as the options. */
export function validateNoteLink(data: DemoState, note: { patientId: string; author: string; appointmentId?: string }, now: Date): string | null {
  if (!note.appointmentId) return null;
  const appointment = data.appointments.find(a => a.id === note.appointmentId);
  if (!appointment) return "La atención seleccionada no existe.";
  if (appointment.patientId !== note.patientId) return "La atención pertenece a otro paciente.";
  if (appointment.dentist !== note.author) return "La atención corresponde a otro profesional.";
  if (appointment.status === "Cancelada") return "No se puede vincular una cita cancelada.";
  if (!hasStarted(appointment, now)) return "Esa atención todavía no ocurre.";
  return null;
}
