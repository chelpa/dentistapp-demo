import { ArrowRight, ShieldAlert, Stethoscope, Users } from "lucide-react";
import { type DemoState, dentists } from "@/lib/demo";
import { type DemoRole, demoRoles } from "@/lib/demoRoles";

export default function DemoTeam({ data, today, onRole }: { data: DemoState; today: string; onRole: (role: DemoRole) => void }) {
  return <div className="space-y-6">
    <div><span className="eyebrow">Administración · demo</span><h1 className="mt-1 text-[27px] font-bold tracking-tight md:text-[32px]">Equipo y vistas de trabajo</h1><p className="mt-1 text-sm text-muted">Explora cómo se organiza la clínica con cuentas de ejemplo.</p></div>
    <div className="grid gap-4 md:grid-cols-3">{dentists.map((name, index) => {
      const appointments = data.appointments.filter(a => a.dentist === name && a.date === today);
      const treatments = data.treatments.filter(t => t.dentist === name && t.status !== "Finalizado");
      return <div key={name} className="card p-6"><span className="inline-flex rounded-2xl bg-pale p-3 text-teal"><Stethoscope size={23}/></span><h2 className="mt-4 text-base font-bold">{name}</h2><p className="mt-1 text-xs text-muted">Odontología general · Profesional demo {index + 1}</p><div className="mt-5 flex gap-6 border-t border-line pt-4"><div><strong className="text-2xl">{appointments.length}</strong><p className="text-xs text-muted">Citas hoy</p></div><div><strong className="text-2xl">{treatments.length}</strong><p className="text-xs text-muted">Planes activos</p></div></div></div>;
    })}</div>
    <div className="card p-5 sm:p-6"><div className="flex items-center gap-3"><span className="rounded-xl bg-pale p-2.5 text-teal"><Users size={20}/></span><div><h2 className="text-lg font-bold">Tres recorridos para mostrar el producto</h2><p className="text-xs text-muted">Elige una vista para recorrerla durante la presentación.</p></div></div><div className="mt-5 grid gap-3 md:grid-cols-3">{(Object.keys(demoRoles) as DemoRole[]).map(role => <button key={role} onClick={() => onRole(role)} className="rounded-2xl border border-line p-5 text-left transition hover:border-teal"><span className="flex items-center justify-between font-bold text-teal">{demoRoles[role].label}<ArrowRight size={16}/></span><p className="mt-2 text-xs leading-5 text-muted">{demoRoles[role].description}</p></button>)}</div></div>
    <div className="card overflow-hidden"><div className="border-b border-line px-5 py-4"><h2 className="text-lg font-bold">Comportamiento de las vistas demo</h2></div><div className="overflow-x-auto"><table className="w-full min-w-[540px] text-left text-sm"><thead className="bg-canvas text-xs text-muted"><tr>{["Función", "Recepción", "Dentista", "Admin"].map(label => <th key={label} className="px-5 py-3 font-semibold">{label}</th>)}</tr></thead><tbody className="divide-y divide-line">{[
      ["Agenda", "Toda la clínica", "Profesional elegido", "Toda la clínica"],
      ["Crear citas", "Sí", "Desde recepción", "Sí"],
      ["Pacientes", "Contacto y citas", "Pacientes vinculados", "Vista general"],
      ["Ficha y odontograma", "Sin vista clínica", "Consultar y editar", "Sin vista clínica"],
      ["Tratamientos", "Sin vista clínica", "Consultar y editar", "Consultar estado"],
      ["Equipo", "—", "—", "Consultar"],
    ].map(row => <tr key={row[0]}>{row.map((value, index) => <td key={index} className={`px-5 py-4 text-xs ${index === 0 ? "font-semibold text-ink" : "text-muted"}`}>{value}</td>)}</tr>)}</tbody></table></div></div>
    <div className="flex items-start gap-3 rounded-2xl border border-[#f2dfb7] bg-[#fffbf2] p-5 text-[#9c761f]"><ShieldAlert className="mt-0.5 shrink-0" size={19}/><p className="text-xs leading-5"><strong>Vistas simuladas.</strong> Cualquier visitante puede cambiar de rol. Todavía no existen cuentas, invitaciones ni permisos de servidor.</p></div>
  </div>;
}
