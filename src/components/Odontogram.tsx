"use client";
import { Activity, Clock3 } from "lucide-react";
import { type DemoState, type ToothStatus, formatDate } from "@/lib/demo";

const quadrants = [
  { label: "Superior derecha", teeth: [18,17,16,15,14,13,12,11] },
  { label: "Superior izquierda", teeth: [21,22,23,24,25,26,27,28] },
  { label: "Inferior derecha", teeth: [48,47,46,45,44,43,42,41] },
  { label: "Inferior izquierda", teeth: [31,32,33,34,35,36,37,38] }
];
const statusStyle: Record<ToothStatus,string> = {
  Sano: "border-line bg-white text-[#8a9bab] hover:border-teal",
  "Observación": "border-[#ecd59e] bg-[#fff6e4] text-[#c28a31]",
  Tratado: "border-[#b7deca] bg-[#e8f6ed] text-[#3f956a]"
};
function ToothIcon() { return <svg viewBox="0 0 36 42" aria-hidden="true" className="h-6 w-6 sm:h-8 sm:w-8" fill="none"><path d="M8 3C3.8 4.4 3 9 4.1 14.6c.8 4.2 3.3 8.6 5.4 11.1 1 1.2 1.8 3.9 2.5 7.6.5 3 1.1 5.8 3.5 5.8 2.1 0 2.4-3 2.8-6.3.3-2.3.5-3.3 1.7-3.3s1.5 1 1.8 3.3c.4 3.3.7 6.3 2.8 6.3 2.4 0 3-2.8 3.5-5.8.7-3.7 1.5-6.4 2.5-7.6 2.1-2.5 4.6-6.9 5.4-11.1C33 9 32.2 4.4 28 3c-3.3-1.1-5.6 1.2-10 1.2S11.3 1.9 8 3Z" fill="currentColor" fillOpacity=".28" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round"/><path d="M9 12c2 2 5 2.9 9 2.9s7-.9 9-2.9" stroke="currentColor" strokeOpacity=".5" strokeWidth="1.4" strokeLinecap="round"/></svg>; }

export default function Odontogram({data, patientId, selected, onSelect, onStatus}: {data: DemoState; patientId: string; selected: number | null; onSelect: (tooth: number) => void; onStatus: (status: ToothStatus) => void}) {
  const getStatus = (tooth: number): ToothStatus => data.teeth.find(t => t.patientId === patientId && t.tooth === tooth)?.status ?? "Sano";
  const selectedStatus = selected === null ? null : getStatus(selected);
  const events = data.toothEvents.filter(e => e.patientId === patientId && e.tooth === selected).slice().reverse();
  const relatedTreatments = data.treatments.filter(t => t.patientId === patientId && t.tooth === selected);
  return <div className="card p-5 sm:p-6">
    <div className="flex items-center gap-3"><span className="rounded-xl bg-pale p-2.5 text-teal"><Activity size={20}/></span><div><h2 className="text-lg font-bold">Odontograma interactivo</h2><p className="text-xs text-muted">32 piezas permanentes · representación de prueba</p></div></div>
    <div className="mt-5 grid gap-3 md:grid-cols-2">{quadrants.map(q => <section key={q.label} className="min-w-0 rounded-2xl border border-line bg-[#fafcfc] p-3 sm:p-4"><h3 className="mb-3 text-[10px] font-bold uppercase tracking-[.1em] text-muted">{q.label}</h3><div className="grid grid-cols-8 gap-1 sm:gap-1.5">{q.teeth.map(n => { const status=getStatus(n); return <button key={n} onClick={() => onSelect(n)} aria-label={`Pieza ${n}, ${status}`} aria-pressed={selected===n} title={`Pieza ${n}: ${status}`} className={`flex min-w-0 flex-col items-center justify-center gap-0.5 rounded-xl border py-1.5 transition sm:py-2 ${statusStyle[status]} ${selected===n ? "ring-2 ring-teal ring-offset-1" : ""}`}><ToothIcon/><span className="text-[10px] font-bold sm:text-xs">{n}</span></button>; })}</div></section>)}</div>
    <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-[11px] text-muted"><span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-full border border-line bg-white"/>Sano</span><span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-full bg-[#f2c66e]"/>Observación</span><span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-full bg-[#87cfa9]"/>Tratado</span></div>
    {selected !== null && <div className="mt-5 rounded-2xl border border-line bg-white p-4"><div className="flex flex-wrap items-center gap-3"><div className="flex h-11 w-11 items-center justify-center rounded-xl bg-pale text-teal"><ToothIcon/></div><div className="min-w-0 flex-1"><p className="text-sm font-bold">Pieza {selected}</p><p className="text-xs text-muted">Estado actual: {selectedStatus}</p></div><div className="flex flex-wrap gap-1.5">{(["Sano","Observación","Tratado"] as ToothStatus[]).map(status => <button key={status} onClick={() => onStatus(status)} className={`rounded-lg px-2.5 py-1.5 text-[11px] font-semibold ${selectedStatus===status ? "bg-teal text-white" : "bg-canvas text-muted hover:text-teal"}`}>{status}</button>)}</div></div>
      {relatedTreatments.length > 0 && <div className="mt-4 border-t border-line pt-3"><p className="text-[10px] font-bold uppercase tracking-[.1em] text-muted">Tratamientos asociados</p>{relatedTreatments.map(t => <p key={t.id} className="mt-1 text-xs font-semibold text-ink">{t.name} <span className="font-normal text-muted">· {t.status}</span></p>)}</div>}
      <div className="mt-4 border-t border-line pt-3"><p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[.1em] text-muted"><Clock3 size={12}/> Cambios de esta demo</p>{events.length ? events.map(event => <p key={event.id} className="mt-2 text-xs text-[#4b6071]">{formatDate(event.date)} · {event.status} · {event.author}</p>) : <p className="mt-2 text-xs text-muted">Sin cambios registrados durante esta demo.</p>}</div>
    </div>}
    <p className="mt-4 text-[11px] leading-5 text-muted">Este dibujo no registra superficies, diagnóstico ni antecedentes clínicos verificables. Usa solo datos inventados.</p>
  </div>;
}
