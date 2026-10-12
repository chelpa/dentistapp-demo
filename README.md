# DentistApp MVP 0.4 · PROTOTIPO

**Demo interactiva con datos 100 % ficticios. No ingresar datos de pacientes reales ni usar para atención clínica.**

Este proyecto es una copia de trabajo nueva y ejecutable. El ZIP original `dentistapp-platform-baseline00.zip` no fue modificado. El baseline contenía documentos de requisitos y arquitectura, un esquema Prisma dentro de otro ZIP y referencias visuales; no contenía frontend ejecutable.

## Ejecutar

Requisitos: Node.js 20.9 o superior y npm.

```bash
npm ci
npm run dev
```

Abrir [http://localhost:3000](http://localhost:3000). Para verificar:

```bash
npm test                 # pruebas unitarias (agenda, roles, almacenamiento, evoluciones)
npm run typecheck
DENTISTAPP_BASE_PATH=/dentistapp-demo npm run build:static
npx playwright install chromium   # una vez
npm run test:e2e         # recorridos por rol, teclado, axe y anchos 320–1440 px sobre out/
```

## Qué se puede probar

- **Agenda:** vistas Semana (por defecto), Mes y Día. Semana de lunes a domingo o laboral, intervalos de 15/30 minutos, filtros por profesional y sillón, carriles para citas simultáneas y creación desde un bloque libre (clic o Enter). Día con grilla de 15 minutos por profesional.
- **Citas:** duración de 15 a 240 minutos, sillón obligatorio, horario 08:00–20:00, sin horas pasadas. Se rechazan cruces del mismo profesional o del mismo sillón, incluso sobre una cita Completada; las citas contiguas se permiten y una Cancelada libera el horario.
- **Pacientes y ficha clínica:** búsqueda, perfil con pestañas, odontograma de 32 piezas, tratamientos y **evoluciones vinculadas a la atención** (misma cita, paciente y profesional).
- **Aranceles y presupuestos:** tarifas base en CLP, presupuestos con prestaciones, cantidad y descuento; un presupuesto guardado conserva su precio aunque cambie el arancel.

Vistas de demostración (permisos de interfaz, ver plan §5b):

| | Recepción | Dentista | Admin |
|---|---|---|---|
| Agenda | Toda la clínica; agenda citas | Solo la suya | Toda la clínica; agenda citas |
| Ficha, odontograma, evoluciones | — | Consultar y editar | Solo lectura |
| Tratamientos | — | Consultar y editar | Solo lectura |
| Aranceles | Consultar | Consultar | Consultar y editar |
| Presupuestos | Crear y ver todos | Crear y ver los de sus pacientes | Ver todos |
| Equipo y vistas | — | — | Sí |

Las vistas cambian navegación, contenido y acciones de interfaz. **No autentican ni aplican autorización en el servidor.** Cualquier visitante puede cambiar de rol y los datos ficticios siguen en su navegador.

Los cambios se guardan en `localStorage` con la clave `dentistapp-mvp-demo-v4`. La versión 0.4 empieza con datos ficticios nuevos y **no modifica ni borra** los datos de versiones anteriores (`-v1`, `-v3`); si existen, lo avisa una vez. Si los datos guardados no se pueden leer, se copia el original a una clave de respaldo antes de seguir. El botón **Restablecer demo** recupera los datos iniciales. No hay servidor de datos, cuentas ni sincronización entre personas, pestañas o dispositivos.

## Publicar una demo para clientes

GitHub Pages publica automáticamente la rama `main` (workflow `.github/workflows/pages.yml`, con pruebas antes de exportar). Los PR pasan por `.github/workflows/ci.yml` (pruebas unitarias, tipos, exportación y e2e). Publicar es una decisión humana: integrar en `main` equivale a publicar. Otras opciones de hosting estático en [PUBLISH_DEMO.md](PUBLISH_DEMO.md).

## Arquitectura

- **Next.js 15 App Router + React + TypeScript:** una sola aplicación de interfaz.
- **Tailwind CSS:** diseño responsive y componentes de presentación.
- **`src/lib/demo.ts`:** tipos, datos ficticios y funciones de fecha.
- **`src/lib/calendar.ts`:** reglas de agenda (horario, duraciones, cruces por profesional o sillón, carriles).
- **`src/lib/storage.ts`:** carga y normalización de datos guardados sin inventar ni borrar información.
- **`src/lib/clinical.ts`:** reglas de vínculo entre evolución y atención.
- **`src/components/WeeklyCalendar.tsx`** y **`ModalDialog.tsx`:** agenda semanal y diálogos nativos accesibles.
- **`src/components/DentistApp.tsx`:** navegación y flujo interactivo de la demo.
- **`src/lib/demoRoles.ts`:** permisos de interfaz por vista y filtrado de datos; no es autorización. Las pantallas usan la vista filtrada; los cruces de agenda se comprueban siempre contra todos los datos.
- **`src/components/DemoTeam.tsx`:** resumen del equipo y comparativa de vistas.
- **`src/components/MonthlyCalendar.tsx`:** calendario mensual y selección de día.
- **`src/components/Odontogram.tsx`:** representación de piezas y detalle interactivo.
- **`reference/schema.prisma`:** copia sin integrar del esquema Prisma incluido en el baseline. Es referencia de dominio, no se migra ni se conecta a una base de datos en este MVP.

No se necesitan claves, variables de entorno ni PostgreSQL para ejecutar la demo. El stack elegido sigue la dirección Next.js + TypeScript del baseline sin fingir que el esquema ya ofrece persistencia segura.

## Antes de usar datos reales o lanzar producción

1. Autenticación real, bootstrap del primer admin, sesiones revocables y permisos por rol, paciente y sede aplicados en el servidor. Resolver la estrategia de sesiones indicada en `auditoria_plan.md` antes de integrar Auth.js.
2. PostgreSQL y migraciones verificadas, incluida una restricción de base de datos que impida citas solapadas por profesional y por sillón bajo concurrencia. La comprobación local de esta demo no sirve como garantía.
3. Revisión legal y técnica de privacidad de datos de salud en Chile: minimización, control de acceso, cifrado, retención y procedimientos de derechos de titulares.
4. Consentimiento clínico informado, mecanismo de firma y registro verificable según el caso de uso.
5. Historial clínico auditable e inmutable o versionado; la lista de cambios dentales de esta demo puede alterarse o borrarse en `localStorage`.
6. Backups, recuperación probada, observabilidad, controles de archivos y pruebas de seguridad.

Véase [AUDIT_NOTE.md](AUDIT_NOTE.md) para el contraste con el baseline y el orden sugerido de trabajo.

## Recorrido sugerido para una presentación

1. **Recepción:** abre Agenda (vista Semana), pulsa un bloque libre y crea una cita de 30 minutos con sillón. Intenta otra cita que se cruce con el mismo profesional o sillón y muestra el rechazo.
2. **Recepción:** en Aranceles y presupuestos arma un presupuesto con dos prestaciones, cantidad y descuento.
3. **Dentista:** elige al profesional, abre un paciente, ve a Ficha clínica, marca una pieza y guarda una evolución vinculada a la atención de hoy.
4. **Admin:** ajusta un arancel (el presupuesto guardado conserva su precio), revisa la ficha en solo lectura y abre Equipo y vistas.
5. Usa **Restablecer demo** antes de una nueva presentación para recuperar citas relativas al día actual.

Historial de versiones en [CHANGELOG.md](CHANGELOG.md). Procedencia de la integración en [docs/integration/](docs/integration/INTEGRATION_PLAN.md).
