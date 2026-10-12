"use client";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { type Appointment, type DemoState, toDay } from "@/lib/demo";

const weekdays = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
const dateAtNoon = (iso: string) => new Date(`${iso}T12:00:00`);
const monthTitle = (iso: string) => { const value = new Intl.DateTimeFormat("es-CL", { month: "long", year: "numeric" }).format(dateAtNoon(iso)); return value[0].toUpperCase() + value.slice(1); };

export default function MonthlyCalendar({ data, selected, onSelect }: { data: DemoState; selected: string; onSelect: (iso: string) => void }) {
  const selectedDate = dateAtNoon(selected);
  const year = selectedDate.getFullYear();
  const month = selectedDate.getMonth();
  const first = new Date(year, month, 1, 12);
  const leading = (first.getDay() + 6) % 7;
  const totalDays = new Date(year, month + 1, 0, 12).getDate();
  const cells = Array.from({ length: Math.ceil((leading + totalDays) / 7) * 7 }, (_, index) => {
    const d = new Date(year, month, index - leading + 1, 12);
    return { iso: toDay(d), day: d.getDate(), current: d.getMonth() === month };
  });
  const counts = new Map<string, Appointment[]>();
  data.appointments.forEach(a => counts.set(a.date, [...(counts.get(a.date) ?? []), a]));
  const changeMonth = (delta: number) => onSelect(toDay(new Date(year, month + delta, 1, 12)));
  const today = toDay(new Date());
  return <div className="card overflow-hidden">
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-4 py-4 sm:px-6">
      <div>
        <p className="eyebrow">Vista mensual</p>
        <h2 className="mt-1 text-lg font-bold">{monthTitle(selected)}</h2>
      </div>
      <div className="flex items-center gap-2">
        <button onClick={() => onSelect(today)} className="btn-soft !px-3 !py-2 text-xs">Hoy</button>
        <button onClick={() => changeMonth(-1)} aria-label="Mes anterior" className="btn-soft !p-2"><ChevronLeft size={17}/></button>
        <button onClick={() => changeMonth(1)} aria-label="Mes siguiente" className="btn-soft !p-2"><ChevronRight size={17}/></button>
      </div>
    </div>
    <div className="grid grid-cols-7 border-b border-line bg-[#f9fbfb]">{weekdays.map(day => <div key={day} className="py-3 text-center text-[10px] font-bold uppercase tracking-[.08em] text-muted sm:text-xs">{day}</div>)}</div>
    <div className="grid grid-cols-7 gap-px bg-line">{cells.map(cell => {
      const items = counts.get(cell.iso) ?? [];
      const isSelected = cell.iso === selected;
      const isToday = cell.iso === today;
      return <button key={cell.iso} type="button" onClick={() => onSelect(cell.iso)} aria-label={`${cell.day} de ${monthTitle(cell.iso)}, ${items.length} ${items.length === 1 ? "cita" : "citas"}`} aria-pressed={isSelected} className={`min-h-[70px] bg-white p-1.5 text-left transition hover:bg-pale sm:min-h-[112px] sm:p-2.5 ${!cell.current ? "opacity-45" : ""} ${isSelected ? "bg-[#eaf8f5] ring-2 ring-inset ring-teal" : ""}`}>
        <span className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold sm:h-7 sm:w-7 ${isToday ? "bg-teal text-white" : "text-[#637587]"}`}>{cell.day}</span>
        {items.length > 0 && <>
          <div className="mt-1 flex gap-1 sm:hidden">{items.slice(0,3).map(a => <span key={a.id} className={`h-1.5 w-1.5 rounded-full ${a.status === "En espera" ? "bg-amber" : "bg-teal"}`}/>)}</div>
          <div className="mt-1 hidden space-y-1 sm:block">{items.slice(0,2).map(a => <div key={a.id} className={`truncate rounded px-1.5 py-1 text-[10px] font-semibold ${a.status === "En espera" ? "bg-[#fff2dc] text-[#a67b28]" : "bg-pale text-tealDark"}`}>{a.time} · {data.patients.find(p => p.id === a.patientId)?.name.split(" ")[0]}</div>)}{items.length > 2 && <div className="px-1 text-[10px] font-semibold text-muted">+{items.length-2} más</div>}</div>
        </>}
      </button>;
    })}</div>
    <p className="border-t border-line px-4 py-3 text-xs text-muted sm:px-6">Selecciona un día para ver sus citas. Los puntos indican citas en pantallas pequeñas.</p>
  </div>;
}
