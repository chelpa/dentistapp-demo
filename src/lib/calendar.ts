import type { Appointment } from "./demo";

export const DAY_START = 8 * 60;
export const DAY_END = 20 * 60;
export const chairs = ["Sillón 1", "Sillón 2", "Sillón 3"];
export const appointmentStatuses = ["Confirmada", "En espera", "Completada", "Cancelada"] as const;
export type Slot = { date: string; time: string; dentist?: string; chair?: string };

export function validDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T12:00:00`);
  return Number.isFinite(date.getTime()) && localDay(date) === value;
}
export function localDay(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
export function addDays(value: string, days: number): string {
  if (!validDate(value)) throw new Error("Fecha inválida");
  const date = new Date(`${value}T12:00:00`);
  date.setDate(date.getDate() + days);
  return localDay(date);
}
export function weekDays(value: string, workingWeek = false): string[] {
  if (!validDate(value)) throw new Error("Fecha inválida");
  const date = new Date(`${value}T12:00:00`);
  const monday = addDays(value, -((date.getDay() + 6) % 7));
  return Array.from({ length: workingWeek ? 5 : 7 }, (_, i) => addDays(monday, i));
}
export function minutes(time: string): number {
  if (!/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(time)) return NaN;
  const [hours, mins] = time.split(":").map(Number);
  return hours * 60 + mins;
}
export function clockTime(value: number): string {
  return `${String(Math.floor(value / 60)).padStart(2, "0")}:${String(value % 60).padStart(2, "0")}`;
}
export function validAppointmentTime(a: Pick<Appointment, "date" | "time" | "duration">): boolean {
  const start = minutes(a.time);
  return validDate(a.date) && Number.isInteger(start) && start % 15 === 0 &&
    Number.isInteger(a.duration) && a.duration >= 15 && a.duration <= 240 && a.duration % 15 === 0 &&
    start >= DAY_START && start + a.duration <= DAY_END;
}
export function isPastAppointment(value: Pick<Appointment, "date" | "time">, now = new Date()): boolean {
  if (!validDate(value.date) || !Number.isFinite(minutes(value.time))) return true;
  return new Date(`${value.date}T${value.time}:00`).getTime() < now.getTime();
}
export function findConflict(candidate: Appointment, appointments: Appointment[]): Appointment | undefined {
  if (candidate.status === "Cancelada") return undefined;
  const start = minutes(candidate.time);
  return appointments.find(a => a.id !== candidate.id && a.status !== "Cancelada" && a.date === candidate.date &&
    (a.dentist === candidate.dentist || Boolean(candidate.chair && a.chair === candidate.chair)) &&
    start < minutes(a.time) + a.duration && start + candidate.duration > minutes(a.time));
}
export function filterAppointments(appointments: Appointment[], dentist: string, chair: string): Appointment[] {
  return appointments.filter(a => (!dentist || a.dentist === dentist) &&
    (!chair || (chair === "unassigned" ? !a.chair : a.chair === chair)));
}
export type PositionedAppointment = { appointment: Appointment; lane: number; lanes: number };
// Partition connected overlap groups into lanes; adjacent bookings share a lane.
export function appointmentLanes(appointments: Appointment[]): PositionedAppointment[] {
  const sorted = appointments.filter(validAppointmentTime).slice().sort((a, b) => minutes(a.time) - minutes(b.time) || a.id.localeCompare(b.id));
  const result: PositionedAppointment[] = [];
  let group: PositionedAppointment[] = [];
  let ends: number[] = [];
  let groupEnd = -1;
  const flush = () => { group.forEach(item => result.push({ ...item, lanes: ends.length })); group = []; ends = []; };
  for (const appointment of sorted) {
    const start = minutes(appointment.time);
    if (start >= groupEnd) flush();
    let lane = ends.findIndex(end => end <= start);
    if (lane === -1) lane = ends.length;
    ends[lane] = start + appointment.duration;
    groupEnd = Math.max(group.length ? groupEnd : -1, ends[lane]);
    group.push({ appointment, lane, lanes: 0 });
  }
  flush();
  return result;
}
