# DentistApp MVP · PROTOTIPO

**Demo interactiva con datos 100 % ficticios. No ingresar datos de pacientes reales ni usar para atención clínica.**

Este proyecto es una copia de trabajo nueva y ejecutable. El ZIP original `dentistapp-platform-baseline00.zip` no fue modificado. El baseline contenía documentos de requisitos y arquitectura, un esquema Prisma dentro de otro ZIP y referencias visuales; no contenía frontend ejecutable.

## Ejecutar

Requisitos: Node.js 20.9 o superior y npm.

```bash
npm ci
npm run dev
```

Abrir [http://localhost:3000](http://localhost:3000). Para verificar la compilación:

```bash
npm run typecheck
npm run build
```

## Qué se puede probar

- **Inicio:** resumen del día, agenda y accesos rápidos.
- **Pacientes:** búsqueda por nombre o correo ficticio, perfil, citas y resumen.
- **Agenda:** alternar entre mes y día, navegar entre meses, seleccionar una fecha, crear una cita ficticia y cambiar su estado. La demo comprueba cruces en el navegador para el mismo profesional.
- **Ficha clínica:** notas de ejemplo y odontograma interactivo de 32 piezas organizado por cuadrantes, con tres estados, tratamientos asociados y una lista local de cambios de la demo.
- **Tratamientos:** vista general y cambio de estado.
- **Recepción:** inicio operativo, agenda de toda la clínica, creación de citas y contacto de pacientes. La ficha clínica no se muestra en esta vista.
- **Dentista:** selector de profesional, agenda y pacientes vinculados; notas, odontograma y cambios de estado de tratamientos.
- **Admin:** resumen general, consulta del estado de tratamientos y equipo con comparación de las tres vistas.

Las vistas cambian navegación, contenido y acciones de interfaz. **No autentican ni aplican autorización en el servidor.** Cualquier visitante puede cambiar de rol y los datos ficticios siguen en su navegador.

Los cambios se guardan en `localStorage` de este navegador. La versión 0.3 usa una nueva clave de almacenamiento para iniciar un recorrido actualizado con datos ficticios; no sobrescribe los registros locales de la versión anterior. El botón **Restablecer demo** recupera los datos ficticios iniciales. No hay servidor de datos, cuenta de usuario ni sincronización entre personas o dispositivos.

## Publicar una demo para clientes

Se incluye una guía [PUBLISH_DEMO.md](PUBLISH_DEMO.md) y un ZIP estático separado, `dentistapp-demo-static.zip`, listo para subir a un hosting de archivos estáticos. El proyecto editable permanece en `dentistapp-mvp/`.

## Arquitectura

- **Next.js 15 App Router + React + TypeScript:** una sola aplicación de interfaz.
- **Tailwind CSS:** diseño responsive y componentes de presentación.
- **`src/lib/demo.ts`:** tipos, datos ficticios y funciones de fecha.
- **`src/components/DentistApp.tsx`:** navegación y flujo interactivo de la demo.
- **`src/lib/demoRoles.ts`:** definición de vistas y filtrado de datos de demostración; no es autorización.
- **`src/components/DemoTeam.tsx`:** resumen del equipo y comparativa de vistas.
- **`src/components/MonthlyCalendar.tsx`:** calendario mensual y selección de día.
- **`src/components/Odontogram.tsx`:** representación de piezas y detalle interactivo.
- **`reference/schema.prisma`:** copia sin integrar del esquema Prisma incluido en el baseline. Es referencia de dominio, no se migra ni se conecta a una base de datos en este MVP.

No se necesitan claves, variables de entorno ni PostgreSQL para ejecutar la demo. El stack elegido sigue la dirección Next.js + TypeScript del baseline sin fingir que el esquema ya ofrece persistencia segura.

## Antes de usar datos reales o lanzar producción

1. Autenticación real, bootstrap del primer admin, sesiones revocables y permisos por rol, paciente y sede aplicados en el servidor. Resolver la estrategia de sesiones indicada en `auditoria_plan.md` antes de integrar Auth.js.
2. PostgreSQL y migraciones verificadas, incluida una restricción de base de datos que impida citas solapadas por profesional bajo concurrencia. La comprobación local de esta demo no sirve como garantía.
3. Revisión legal y técnica de privacidad de datos de salud en Chile: minimización, control de acceso, cifrado, retención y procedimientos de derechos de titulares.
4. Consentimiento clínico informado, mecanismo de firma y registro verificable según el caso de uso.
5. Historial clínico auditable e inmutable o versionado; la lista de cambios dentales de esta demo puede alterarse o borrarse en `localStorage`.
6. Backups, recuperación probada, observabilidad, controles de archivos y pruebas de seguridad.

Véase [AUDIT_NOTE.md](AUDIT_NOTE.md) para el contraste con el baseline y el orden sugerido de trabajo.

## Recorrido sugerido para una presentación

1. Comienza en Recepción: abre la agenda mensual, selecciona una fecha y crea una cita ficticia.
2. Cambia a Dentista y elige al profesional de la cita. Abre un paciente, selecciona Ficha clínica, marca una pieza y guarda una nota inventada.
3. Abre Tratamientos y cambia un plan de En curso a Finalizado.
4. Cambia a Admin para mostrar el resumen, el equipo y la comparación de vistas.
5. Usa Restablecer demo antes de una nueva presentación para recuperar citas relativas al día actual.
