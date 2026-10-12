# Nota de auditoría · Baseline 00 → MVP demo

## Evidencia revisada

- `dentistapp-platform-baseline00.zip`, SHA-256: `b55dc08ffffd063993f5a63327ebb8d1318983059ad4bb17e71b44b2120b4c8c`.
- Documentos de requisitos, arquitectura, modelo conceptual y Prisma; paquete interno `dental-portal-fase4.zip`.
- Siete imágenes de inspiración visual y el archivo adicional `auditoria_plan.md` entregado después.
- Los documentos se trataron como referencia del proyecto. Sus recomendaciones no ampliaron el alcance de esta demo.

## Qué existía

El ZIP original contiene planificación y un `schema.prisma` con pacientes, profesionales, sedes, agenda, ficha, piezas dentales, tratamientos, pagos y auditoría. El paquete interno solo declara Prisma; no trae rutas de Next.js, pantallas, autenticación, migraciones aplicadas ni tests de aplicación. Las imágenes son referencias de diseño, no una interfaz implementada.

## Decisiones de esta copia de trabajo

| Elemento | Decisión |
| --- | --- |
| Modelo de dominio de paciente, cita, ficha y tratamiento | Conservado como vocabulario y relación de flujo en tipos simplificados de demo. |
| Esquema Prisma del baseline | Copiado sin cambios a `reference/schema.prisma`; no se usa en runtime. |
| Interfaz | Nueva, responsive y en español con Next.js, TypeScript y Tailwind. |
| Persistencia | `localStorage` solo para probar interacciones con datos ficticios. |
| Integraciones de pago, mensajería, archivos, multi-sede | Diferidas; no forman parte de este vertical slice. |

## Riesgos y bloqueos de producción

- **Auth/roles:** el selector actual cambia las vistas de interfaz, pero no autentica ni protege los datos. Falta autenticación, sesiones y autorización en cada lectura/mutación, con alcance por sede y paciente. El plan adicional advierte una incompatibilidad entre Credentials de Auth.js y la estrategia de sesión de base de datos propuesta; esa decisión necesita cerrarse al implementar auth.
- **Agenda:** el chequeo local de citas duplicadas puede fallar con usuarios concurrentes. Se necesita una restricción de PostgreSQL para solapamientos, además de pruebas de concurrencia, zona horaria y reglas de cancelación.
- **Datos de salud:** falta revisión de privacidad y cumplimiento chileno, controles de acceso, cifrado, política de retención y manejo de solicitudes del paciente.
- **Consentimiento:** no hay captura, firma, versión ni vínculo verificable con el tratamiento.
- **Historia clínica:** notas y estados dentales no son eventos firmados ni un historial auditable. No sirven como registro sanitario.
- **Operación:** faltan backups, restauración probada, registro de actividad, alertas y despliegue endurecido.

## Siguiente incremento sugerido

Crear repositorio versionado; cerrar las decisiones de auth y primer admin; validar el esquema Prisma; construir persistencia y permisos de un solo flujo (paciente → cita → nota) con pruebas; añadir el invariante de agenda a nivel de base de datos. Mantener la demo separada de cualquier entorno con datos reales.

## Iteración de agenda y odontograma

La primera demo mostraba solo un día de agenda y representaba las piezas como números en una cuadrícula. La revisión de uso detectó que era difícil ver la carga mensual y ubicar una pieza por cuadrante. Esta iteración añade mes navegable con recuento de citas, selección de fecha y detalle diario; también dibuja las 32 piezas por cuadrante y muestra estado, tratamientos vinculados y cambios hechos durante la demo. Los datos guardados por la versión anterior se migran en el navegador para añadir la lista de eventos vacía.

Estos cambios siguen siendo **interfaz de prototipo**. La lista local de cambios no es un historial clínico auditable, el dibujo no modela superficies dentales y la agenda mensual no resuelve la concurrencia ni las reglas de disponibilidad de profesionales.

## Preparación de demo online

Se generó una exportación estática separada para mostrar únicamente los flujos con datos ficticios. Se añadió `noindex`/`robots.txt` como señal para buscadores, sin tratarlo como protección de acceso. Publicar el ZIP exige elegir una cuenta y dirección de hosting; ningún dato clínico real debe ingresarse en esta demo.

## Iteración 0.3 · recorridos por rol

Se conservó el stack y la agenda/odontograma. Se reemplazó el selector decorativo por tres vistas simuladas: Recepción coordina citas y contactos; Dentista filtra por profesional y edita la ficha y tratamientos; Admin consulta operación, tratamientos y equipo. Al cambiar de rol/profesional se descarta cualquier borrador de nota y se cierra la ficha abierta. La demo estrena una clave de almacenamiento local para mantener los datos de la versión anterior intactos.

La revisión también corrigió la comprobación local de agenda: una cita marcada como Completada sigue reservando su intervalo. Esa corrección no aporta garantías frente a concurrencia, porque continúa siendo un cálculo en el navegador.

Los controles de interfaz y filtros sirven para explicar el producto, no para proteger datos. Continúan pendientes autenticación, autorización de servidor, base de datos y restricciones de solapamiento, privacidad, consentimiento, historial auditable y backups. No se publicó un sitio externo en esta iteración.

### Verificación de la iteración 0.3

Probada en navegador con la exportación estática: Recepción sin ficha clínica, creación de cita con la hora elegida, rechazo de solapamiento incluso con una cita completada, Dentista filtrado por profesional, cambio de pieza 16, guardado de nota con autor elegido, actualización de tratamiento, Admin en consulta sin controles de edición clínica, equipo y restablecimiento de demo. Se comprobó la navegación móvil y ausencia de desbordamiento horizontal del documento a 390 px. Los cambios ficticios de prueba se restablecieron.

## Iteración 0.4 · integración de líneas paralelas

El 2026-10-12 coexistían tres versiones de la demo: `main` publicado (0.2.1), la v0.3 local con vistas por rol (ZIP sha256 `40f16f97…`) y los PR #1/#2 con agenda diaria y semanal, sillones, duración variable, aranceles y presupuestos. La 0.4 las integra en la rama `integration/dentistapp-v0.4`, conservando la historia de las tres. Procedencia, decisiones y evidencia en [docs/integration/](docs/integration/INTEGRATION_PLAN.md).

Cambios de producto: permisos de interfaz por vista para todo lo nuevo (las pantallas usan datos filtrados; los cruces se calculan sobre todos los datos), evoluciones vinculadas a una atención con validación, almacenamiento `v4` que no toca datos anteriores, y correcciones de accesibilidad (contraste por tokens, diálogos nativos, menú, pestañas, foco visible, objetivos táctiles en la semana).

Seguridad de dependencias: `npm audit --omit=dev` en cero mediante `overrides` de npm para el PostCSS anidado de Next, verificado con una compilación controlada (JS y CSS idénticos byte a byte). Persisten 7 alertas en herramientas de desarrollo (Tailwind 3).

### Verificación de la iteración 0.4

`npm test` 34/34 (incluidas las 20 de agenda del PR #2); typecheck; exportación estática en `/dentistapp-demo`; `npm run test:e2e` 11/11: matriz de permisos, reglas de reserva, presupuestos, evoluciones con rechazos, persistencia y restablecimiento en los tres roles, teclado, axe sin violaciones automáticas en 40 vistas (1280 y 375 px) y sin desbordes de 320 a 1440 px. Un axe en cero no equivale a cumplimiento integral de accesibilidad.

Siguen pendientes, como antes: autenticación y autorización en servidor, base de datos con restricciones de agenda bajo concurrencia, privacidad de datos de salud, consentimiento, historial clínico auditable y backups.
