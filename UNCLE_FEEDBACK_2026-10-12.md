# DentistApp · Feedback de dentista · 2026-10-12

## Fuente
Mensajes proporcionados por el usuario (su tío, dentista), más capturas de la agenda Dentidesk. No se usaron fichas clínicas ni datos de pacientes reales de las capturas.

## Requisitos
- P0: Agenda diaria dividida por intervalos horarios; duración por paciente configurable.
- P0: Evoluciones clínicas por atención y paciente (la demo actual tiene notas no firmadas).
- P0: Presupuestos por prestaciones, cantidades, precios y totales.
- P0: Aranceles configurables.

## Cambios en esta rama (propuesta, no producción)
- Agenda diaria visual con intervalos de 15 min de 08:00 a 20:00, filtro por profesional y bloques escalados por duración.
- Formulario de nueva cita permite 15–240 min en intervalos de 15, con validación del rango y detección local de cruces.
- Aranceles base y presupuestos de ejemplo con precios CLP, subtotales, descuentos y totales, ligados al paciente ficticio.
- Migración local de datos demo previos sin listas `tariffs` y `budgets`.

## Límites
- Evoluciones siguen siendo notas demo, sin firma, vinculación obligatoria a la cita ni auditoría inmutable.
- Sin backend, sincronización, usuarios auténticos, permisos, bloqueo por concurrencia, ni respaldo.
- Los valores de aranceles son inventados; no representan valores de la clínica ni precios de mercado.
- Los datos persisten en `localStorage`; nunca ingresar RUT, nombres, diagnósticos ni datos de pacientes reales.
- No hay verificación funcional en navegador ni CI acreditada para esta rama hasta recibir un resultado de build/test.
- La rama no se debe fusionar hasta un review de build, accesibilidad, funcionalidad y confirmación humana.

## Pruebas de aceptación sugeridas
1. Crear una cita de 30 min 09:00–09:30 y verificar ocupación en grilla.
2. Intentar crear cita superpuesta 09:15 con mismo dentista: debe rechazarse.
3. Crear cita 09:15 con otro dentista: debe permitirse.
4. Crear 60 y 120 minutos, verificar largo del bloque.
5. Cambiar arancel ficticio y crear presupuesto con dos ítems, cantidad y descuento.
6. Recargar, verificar persistencia local; restablecer y verificar limpieza.
7. Verificar vista móvil y teclado, límites de tiempo, fechas y montos.
