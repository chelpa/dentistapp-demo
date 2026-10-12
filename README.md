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
- **Rol demo:** selector visual de recepción, dentista y admin. **No autentica ni aplica permisos.**

Los cambios se guardan en `localStorage` de este navegador. El botón **Restablecer demo** recupera los datos ficticios iniciales. No hay servidor de datos, cuenta de usuario ni sincronización entre personas o dispositivos.

## Publicar una demo para clientes

Se incluye una guía [PUBLISH_DEMO.md](PUBLISH_DEMO.md) y un ZIP estático separado, `dentistapp-demo-static.zip`, listo para subir a un hosting de archivos estáticos. El proyecto editable permanece en `dentistapp-mvp/`.

## Arquitectura

- **Next.js 15 App Router + React + TypeScript:** una sola aplicación de interfaz.
- **Tailwind CSS:** diseño responsive y componentes de presentación.
- **`src/lib/demo.ts`:** tipos, datos ficticios y funciones de fecha.
- **`src/components/DentistApp.tsx`:** navegación y flujo interactivo de la demo.
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
