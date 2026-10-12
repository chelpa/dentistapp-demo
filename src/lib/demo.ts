export type AppointmentStatus = "Confirmada" | "En espera" | "Completada";
export type TreatmentStatus = "Planificado" | "En curso" | "Finalizado";
export type ToothStatus = "Sano" | "Observación" | "Tratado";
export type Patient = { id: string; name: string; initials: string; age: number; phone: string; email: string; lastVisit: string; note: string; color: string };
export type Appointment = { id: string; patientId: string; date: string; time: string; duration: number; dentist: string; type: string; status: AppointmentStatus };
export type Treatment = { id: string; patientId: string; name: string; tooth: number | null; status: TreatmentStatus; dentist: string; date: string };
export type ClinicalNote = { id: string; patientId: string; text: string; date: string; author: string };
export type ToothRecord = { patientId: string; tooth: number; status: ToothStatus };
export type ToothEvent = { id: string; patientId: string; tooth: number; status: ToothStatus; date: string; author: string };
export type DemoState = { patients: Patient[]; appointments: Appointment[]; treatments: Treatment[]; notes: ClinicalNote[]; teeth: ToothRecord[]; toothEvents: ToothEvent[] };
export const dentists = ["Dra. Valentina Rojas", "Dr. Tomás Fuentes", "Dra. Camila Muñoz"];
export const treatmentTypes = ["Evaluación", "Limpieza dental", "Control", "Restauración", "Endodoncia", "Ortodoncia"];
export const toDay = (date: Date) => `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,"0")}-${String(date.getDate()).padStart(2,"0")}`;
export const dayOffset = (n: number) => { const d = new Date(); d.setDate(d.getDate()+n); return toDay(d); };
export const formatDate = (value: string) => new Intl.DateTimeFormat("es-CL", { day: "numeric", month: "short", year: "numeric" }).format(new Date(`${value}T12:00:00`));
export const shortDate = (value: string) => new Intl.DateTimeFormat("es-CL", { weekday: "short", day: "numeric", month: "short" }).format(new Date(`${value}T12:00:00`));
export const seedDemo = (): DemoState => ({
  patients: [
    { id:"p1", name:"Sofía Martínez", initials:"SM", age:32, phone:"+56 9 0000 1001", email:"sofia.demo@example.com", lastVisit:dayOffset(-14), note:"Control preventivo semestral. Sin antecedentes declarados en esta demo.", color:"mint" },
    { id:"p2", name:"Mateo González", initials:"MG", age:27, phone:"+56 9 0000 1002", email:"mateo.demo@example.com", lastVisit:dayOffset(-5), note:"Evaluación inicial. Datos clínicos completamente ficticios.", color:"peach" },
    { id:"p3", name:"Isidora Pérez", initials:"IP", age:41, phone:"+56 9 0000 1003", email:"isidora.demo@example.com", lastVisit:dayOffset(-28), note:"Seguimiento de plan de tratamiento de ejemplo.", color:"lavender" },
    { id:"p4", name:"Benjamín Silva", initials:"BS", age:35, phone:"+56 9 0000 1004", email:"benjamin.demo@example.com", lastVisit:dayOffset(-9), note:"Consulta de control. No ingresar información de pacientes reales.", color:"sky" },
    { id:"p5", name:"Catalina Torres", initials:"CT", age:29, phone:"+56 9 0000 1005", email:"catalina.demo@example.com", lastVisit:dayOffset(-42), note:"Limpieza y educación preventiva de demostración.", color:"pink" },
    { id:"p6", name:"Vicente Herrera", initials:"VH", age:52, phone:"+56 9 0000 1006", email:"vicente.demo@example.com", lastVisit:dayOffset(-17), note:"Plan de rehabilitación de ejemplo.", color:"sand" }
  ],
  appointments: [
    { id:"a1", patientId:"p1", date:dayOffset(0), time:"09:00", duration:45, dentist:dentists[0], type:"Control", status:"Confirmada" },
    { id:"a2", patientId:"p2", date:dayOffset(0), time:"10:30", duration:60, dentist:dentists[1], type:"Evaluación", status:"Confirmada" },
    { id:"a3", patientId:"p3", date:dayOffset(0), time:"12:00", duration:45, dentist:dentists[0], type:"Restauración", status:"En espera" },
    { id:"a4", patientId:"p4", date:dayOffset(0), time:"15:00", duration:30, dentist:dentists[2], type:"Limpieza dental", status:"Confirmada" },
    { id:"a5", patientId:"p5", date:dayOffset(1), time:"09:30", duration:45, dentist:dentists[1], type:"Control", status:"Confirmada" },
    { id:"a6", patientId:"p6", date:dayOffset(2), time:"11:00", duration:60, dentist:dentists[2], type:"Endodoncia", status:"En espera" }
  ],
  treatments: [
    { id:"t1", patientId:"p1", name:"Limpieza preventiva", tooth:null, status:"Planificado", dentist:dentists[0], date:dayOffset(0) },
    { id:"t2", patientId:"p2", name:"Evaluación integral", tooth:null, status:"En curso", dentist:dentists[1], date:dayOffset(-5) },
    { id:"t3", patientId:"p3", name:"Restauración", tooth:16, status:"En curso", dentist:dentists[0], date:dayOffset(-12) },
    { id:"t4", patientId:"p3", name:"Profilaxis", tooth:null, status:"Finalizado", dentist:dentists[0], date:dayOffset(-28) },
    { id:"t5", patientId:"p6", name:"Endodoncia", tooth:36, status:"Planificado", dentist:dentists[2], date:dayOffset(2) }
  ],
  notes: [
    { id:"n1", patientId:"p1", text:"Evaluación de control: higiene adecuada. Se recomienda seguimiento preventivo.", date:dayOffset(-14), author:dentists[0] },
    { id:"n2", patientId:"p3", text:"Se revisa pieza 16. Plan de restauración conversado en esta simulación.", date:dayOffset(-12), author:dentists[0] }
  ],
  toothEvents: [],
  teeth: [
    { patientId:"p3", tooth:16, status:"Observación" },
    { patientId:"p3", tooth:26, status:"Tratado" },
    { patientId:"p6", tooth:36, status:"Observación" }
  ]
});
