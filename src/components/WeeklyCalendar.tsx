"use client";
import { useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { type AppointmentStatus, type DemoState, dentists, shortDate, dayOffset } from "@/lib/demo";
import { addDays, appointmentLanes, appointmentStatuses, chairs, clockTime, DAY_END, DAY_START, filterAppointments, minutes, type Slot, validAppointmentTime, validDate, weekDays } from "@/lib/calendar";
import ModalDialog from "./ModalDialog";

const statusClasses: Record<AppointmentStatus, string> = {
  Confirmada: "border-[#9ddac9] bg-[#e5f7f2] text-[#165f52]",
  "En espera": "border-[#e5c06e] bg-[#fff4df] text-[#795410]",
  Completada: "border-[#c5cfd5] bg-[#eef2f4] text-[#475965]",
  Cancelada: "border-[#e0b1b8] bg-[#fbecef] text-[#8d384b]"
};

type Props = { data: DemoState; selected: string; onSelect: (date: string) => void; onSlot: (slot: Slot) => void; onStatus: (id: string, status: AppointmentStatus) => string | undefined; onPatient: (id: string) => void };
export default function WeeklyCalendar({ data, selected, onSelect, onSlot, onStatus, onPatient }: Props) {
  const [workingWeek, setWorkingWeek] = useState(false);
  const [step, setStep] = useState<15 | 30>(30);
  const [dentist, setDentist] = useState("");
  const [chair, setChair] = useState("");
  const [detailError, setDetailError] = useState("");
  const [detailId, setDetailId] = useState<string | null>(null);
  const days = weekDays(selected, workingWeek);
  const mobileDay = days.includes(selected) ? selected : days[0];
  const filtered = filterAppointments(data.appointments, dentist, chair);
  const detail = data.appointments.find(a => a.id === detailId);
  const inWeek = filtered.filter(a => days.includes(a.date));
  const invalid = inWeek.filter(a => !validAppointmentTime(a));
  const legacy = inWeek.filter(a => !a.chair).length;
  const slots = Array.from({ length: (DAY_END - DAY_START) / step }, (_, i) => DAY_START + i * step);
  const rowHeight = step === 15 ? 36 : 72;
  const height = (DAY_END - DAY_START) / step * rowHeight;
  const createSlot = (date: string, time: string) => onSlot({ date, time, dentist: dentist || undefined, chair: chairs.includes(chair) ? chair : undefined });
  const renderDay = (date: string) => <div key={date} className="relative border-l border-line" style={{ height }}>
    {slots.map((minute, i) => <button key={minute} type="button" className="calendar-slot absolute left-0 w-full border-t border-line text-left hover:bg-pale"
      style={{ top: i * rowHeight, height: rowHeight }} data-calendar-slot={`${date}/${minute}`} onKeyDown={event => {
        let targetDate = date; let targetMinute = minute;
        if (event.key === "ArrowUp") targetMinute -= step;
        else if (event.key === "ArrowDown") targetMinute += step;
        else if (event.key === "ArrowLeft") targetDate = addDays(date, -1);
        else if (event.key === "ArrowRight") targetDate = addDays(date, 1);
        else if (event.key === "Home") targetMinute = DAY_START;
        else if (event.key === "End") targetMinute = DAY_END - step;
        else return;
        event.preventDefault();
        event.currentTarget.parentElement?.parentElement?.querySelector<HTMLButtonElement>(`[data-calendar-slot="${targetDate}/${targetMinute}"]`)?.focus();
      }} aria-label={`Nueva cita ${shortDate(date)} a las ${clockTime(minute)}${dentist ? `, ${dentist}` : ""}${chairs.includes(chair) ? `, ${chair}` : ""}`}
      onClick={() => createSlot(date, clockTime(minute))}><span className="sr-only">Crear cita</span></button>)}
    {appointmentLanes(filtered.filter(a => a.date === date)).map(({ appointment: a, lane, lanes }) => {
      const person = data.patients.find(p => p.id === a.patientId)?.name ?? "Paciente demo";
      const label = `${shortDate(date)}, ${a.time} a ${clockTime(minutes(a.time) + a.duration)}, ${person}, ${a.dentist}, ${a.chair ?? "Sillón sin asignar"}, ${a.status}`;
      return <button key={a.id} type="button" onClick={() => { setDetailError(""); setDetailId(a.id); }} title={label} aria-label={label}
        className={`calendar-booking absolute z-10 overflow-hidden rounded-lg border px-1.5 py-1 text-left text-[10px] leading-tight ${statusClasses[a.status]}`}
        style={{ top: (minutes(a.time) - DAY_START) * 2.4 + 1, height: a.duration * 2.4 - 2, left: `calc(${lane * 100 / lanes}% + 2px)`, width: `calc(${100 / lanes}% - 4px)` }}>
        <strong className="block truncate">{a.time} · {person}</strong><span className="block truncate">{a.duration} min · {a.status}</span><span className="block truncate">{a.dentist}</span><span className="block truncate">{a.chair ?? "Sin asignar"}</span>
      </button>;
    })}
  </div>;
  const timeAxis = <div className="relative bg-[#fafcfc]" style={{ height }}>{slots.map((minute, i) => <span key={minute} style={{ top: i * rowHeight }} className="absolute right-2 text-[10px] font-semibold text-muted">{clockTime(minute)}</span>)}<span className="absolute bottom-0 right-2 translate-y-full text-[10px] text-muted">20:00</span></div>;
  return <>
    <section className="card overflow-hidden" aria-label="Agenda semanal">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line p-4 sm:p-5">
        <div><p className="eyebrow">Vista semanal</p><h2 className="mt-1 font-bold capitalize" aria-live="polite">{shortDate(days[0])} — {shortDate(days.at(-1)!)}</h2><p className="mt-1 text-xs text-muted">08:00–20:00 · {inWeek.length} citas · Pulsa un espacio para agendar</p></div>
        <div className="flex flex-wrap items-center gap-2"><button type="button" className="btn-soft !px-3 !py-2 text-xs" onClick={() => onSelect(dayOffset(0))}>Hoy</button><button type="button" className="btn-soft !p-2" aria-label="Semana anterior" onClick={() => onSelect(addDays(selected, -7))}><ChevronLeft size={17}/></button><input type="date" className="field !w-auto" aria-label="Fecha de semana" value={selected} onChange={e => { if (validDate(e.target.value)) onSelect(e.target.value); }}/><button type="button" className="btn-soft !p-2" aria-label="Semana siguiente" onClick={() => onSelect(addDays(selected, 7))}><ChevronRight size={17}/></button></div>
      </div>
      <div className="grid gap-3 border-b border-line bg-[#f9fbfb] p-4 sm:grid-cols-2 xl:grid-cols-4">
        <label className="text-xs font-semibold">Profesional<select className="field mt-1" value={dentist} onChange={e => setDentist(e.target.value)}><option value="">Todos los profesionales</option>{dentists.map(d => <option key={d}>{d}</option>)}</select></label>
        <label className="text-xs font-semibold">Sillón<select className="field mt-1" value={chair} onChange={e => setChair(e.target.value)}><option value="">Todos los sillones</option>{chairs.map(c => <option key={c}>{c}</option>)}<option value="unassigned">Sin asignar (citas anteriores)</option></select></label>
        <label className="text-xs font-semibold">Días visibles<select className="field mt-1" value={workingWeek ? "work" : "all"} onChange={e => setWorkingWeek(e.target.value === "work")}><option value="all">Lunes a domingo</option><option value="work">Lunes a viernes</option></select></label>
        <label className="text-xs font-semibold">Intervalo<select className="field mt-1" value={step} onChange={e => setStep(Number(e.target.value) as 15 | 30)}><option value={15}>15 minutos</option><option value={30}>30 minutos</option></select></label>
      </div>
      <p className="px-4 pt-3 text-[11px] text-muted">Teclado: flechas para recorrer horarios, Inicio/Fin para extremos y Enter para crear.</p>
      <div className="flex flex-wrap gap-x-4 gap-y-2 px-4 py-3 text-[11px]" aria-label="Leyenda de estados">{appointmentStatuses.map(status => <span key={status} className={`rounded-full border px-2 py-1 ${statusClasses[status]}`}>{status}</span>)}</div>
      {legacy > 0 && <p className="px-4 pb-3 text-xs text-muted">{legacy} citas anteriores sin sillón asignado. Conservan su información; su ocupación de sillón está pendiente de revisión.</p>}
      {workingWeek && !days.includes(selected) && <p className="px-4 pb-3 text-xs text-muted">La fecha seleccionada cae en fin de semana. La vista laboral muestra lunes a viernes.</p>}
      {invalid.length > 0 && <p role="alert" className="px-4 pb-3 text-xs text-red-700">{invalid.length} citas tienen fecha, hora o duración inválida y no pueden dibujarse.</p>}
      <div className="p-4 sm:hidden"><label className="label" htmlFor="week-mobile-day">Día de la semana</label><select id="week-mobile-day" className="field" value={mobileDay} onChange={e => onSelect(e.target.value)}>{days.map(day => <option key={day} value={day}>{shortDate(day)}</option>)}</select></div>
      <div className="max-h-[620px] overflow-auto overscroll-contain pb-5 hidden sm:block" tabIndex={0} aria-label="Cuadrícula semanal desplazable">
        <div style={{ minWidth: workingWeek ? 850 : 1120 }}>
          <div className="sticky top-0 z-20 grid border-b border-line bg-white" style={{ gridTemplateColumns: `64px repeat(${days.length}, minmax(0, 1fr))` }}><div className="p-3 text-[10px] text-muted">Hora</div>{days.map(day => <button key={day} type="button" aria-pressed={day === selected} onClick={() => onSelect(day)} className={`border-l border-line px-2 py-3 text-xs font-bold capitalize ${day === selected ? "bg-pale text-tealDark" : "text-ink"}`}>{shortDate(day)}{day === dayOffset(0) ? " · Hoy" : ""}</button>)}</div>
          <div className="grid" style={{ gridTemplateColumns: `64px repeat(${days.length}, minmax(0, 1fr))` }}>{timeAxis}{days.map(renderDay)}</div>
        </div>
      </div>
      <div className="max-h-[560px] overflow-y-auto pb-5 sm:hidden" tabIndex={0} aria-label={`Horas de ${shortDate(mobileDay)}`}><div className="grid grid-cols-[56px_1fr]">{timeAxis}{renderDay(mobileDay)}</div></div>
    </section>
    <div className="card mt-4 p-4"><h3 className="font-bold capitalize">Citas de {shortDate(mobileDay)}</h3><p className="mt-1 text-xs text-muted">Resultados de los filtros activos. Abre una cita para revisar o cambiar su estado.</p><div className="mt-3 space-y-2">{filtered.filter(a => a.date === mobileDay).sort((a, b) => a.time.localeCompare(b.time)).map(a => <button key={a.id} onClick={() => { setDetailError(""); setDetailId(a.id); }} className={`flex w-full flex-wrap items-center justify-between gap-2 rounded-xl border p-3 text-left text-xs ${statusClasses[a.status]}`}><span><strong>{a.time} · {data.patients.find(p => p.id === a.patientId)?.name ?? "Paciente demo"}</strong><span className="mt-1 block">{a.duration} min · {a.dentist} · {a.chair ?? "Sillón sin asignar"}</span></span><span>{a.status}</span></button>)}{!filtered.some(a => a.date === mobileDay) && <p className="py-4 text-sm text-muted">Sin citas para estos filtros.</p>}</div></div>
    {detail && <ModalDialog title="Detalle de cita" onClose={() => setDetailId(null)}><div className="flex items-start justify-between gap-3"><h2 className="text-xl font-bold">{data.patients.find(p => p.id === detail.patientId)?.name ?? "Paciente demo"}</h2><button type="button" onClick={() => setDetailId(null)} aria-label="Cerrar detalle de cita" className="btn-soft !p-2"><X size={18}/></button></div><p className="mt-4 text-sm">{shortDate(detail.date)} · {detail.time} · {detail.duration} min</p><p className="mt-2 text-sm">{detail.type} · {detail.dentist}</p><p className="mt-2 text-sm">{detail.chair ?? "Sillón sin asignar: cita anterior"}</p><label className="label mt-5" htmlFor="weekly-status">Estado de la cita</label><select id="weekly-status" className="field" value={detail.status} onChange={e => setDetailError(onStatus(detail.id, e.target.value as AppointmentStatus) ?? "")}>{appointmentStatuses.map(status => <option key={status}>{status}</option>)}</select>{detailError && <p role="alert" className="mt-3 text-sm text-red-700">{detailError}</p>}<button type="button" className="btn-primary mt-5" onClick={() => { setDetailId(null); onPatient(detail.patientId); }}>Abrir ficha del paciente</button></ModalDialog>}
  </>;
}
