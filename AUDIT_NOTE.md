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

- **Auth/roles:** el selector actual es decorativo. Falta autenticación, sesiones y autorización en cada lectura/mutación, con alcance por sede y paciente. El plan adicional advierte una incompatibilidad entre Credentials de Auth.js y la estrategia de sesión de base de datos propuesta; esa decisión necesita cerrarse al implementar auth.
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
