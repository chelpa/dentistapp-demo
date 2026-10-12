# Prompt ejecutable · Claude Code · DENTISTAPP-CALENDAR-001

Claude Code está instalado pero no autenticado en la sesión observada. Este archivo es un encargo preparado; no acredita ejecución de Claude. La candidata inicial fue implementada por Codex con revisión separada.

En Terminal, autenticar Claude por su flujo normal (`claude auth login`), entrar en la copia/rama candidata y abrir `claude`. Pegar el texto siguiente. No se requiere saltar permisos. Registrar versión/session ID/resultados antes de atribuir ejecución.

---

Actúa como implementador Claude Code de DentistApp Versión A bajo APODE+RADO. Lee primero docs/calendar-001/AUDIT-PLAN.md, los resultados/evidencia disponibles y el diff contra aaa83077c462b4de8b7a509ee76946ce69fdc89a. Trabaja exclusivamente en feature/weekly-calendar-chz-001-20261012 o una rama nueva basada en esa candidata. No cambiar main, desplegar, mergear, sustituir código con B/C, publicar mensajes ni ejecutar npm audit fix --force. Respeta instrucciones aplicables del repo y no uses datos reales.

AUDIT: comprueba rama/base/estado limpio y lista features implementadas vs faltantes antes de editar. La candidata es Codex: no te atribuyas su autoría. PLAN: compara los escenarios A01–A18 con tests y observaciones, indicando los no acreditados. ORGANIZE: cambios mínimos sin migración de frameworks ni dependencias de calendario. DIRECT: humano autoriza solo candidato; revisor independiente debe ser una sesión distinta, no una autoaprobación del implementador.

Si faltan funciones, implementa Semana Lun–Dom/Lun–Vie, columnas por día y eje 15/30m, filtros dentista/sillón, altura proporcional a duración, carriles para simultáneos, anterior/siguiente/Hoy, slot por click/Enter con fecha/hora/recursos precargados, conflicto por mismo dentista O mismo sillón contra todas las citas, estados legibles/cambiables, móvil usable y modal teclado/Escape/retorno. Conserva Mes/Día, paciente/evoluciones/presupuestos/aranceles. Legacy sin chair permanece Sin asignar; citas nuevas requieren sillón. Valida fechas y tiempos finitos, duración 15–240m múltiplo de 15, horario 08–20 y último slot 19:45 para 15m. Si ya está implementado, audita y repara solo hallazgos demostrados, no reescribas la app.

EXECUTE: npm ci, npm test, npm run typecheck, DENTISTAPP_BASE_PATH=/dentistapp-demo npm run build:static, npm ls next postcss sharp source-map-js, npm audit --omit=dev, git diff --check. Captura los exit codes, runtime y logs; audit puede quedar HOLD y no debe presentarse como PASS por compilación. Verifica navegador escritorio/móvil y teclado; no marques escenarios probados si solo leíste el código. Documenta localStorage como ausencia de garantía concurrente, sin fingir resolverla con un listener.

RECORD: reporta session ID, autor, baseline, SHA/hashes de fuentes, cambios, tests con resultado, screenshots si realmente capturadas y hallazgos pendientes. Solicita review independiente mediante nueva sesión de solo lectura sobre esos mismos hashes. No autorices publicación. Produce una conclusión limitada: aprobado para revisión de demo, reparación requerida o HOLD, con enlaces existentes.

---

## Prompt de revisor independiente

En una sesión Claude nueva, sin historial del implementador: audita sin editar la candidata y docs/calendar-001/AUDIT-PLAN.md contra baseline aaa8307. Verifica escenarios A01–A18, invariantes, migración, regresión Mes/Día y accesibilidad. Lee logs/hash manifest; no aceptes un PASS del implementador como tu evidencia. Reporta hallazgos con severidad, archivo/línea, reproducción y SHA/hash del sujeto. Distingue tests repetidos, observación de UI y análisis estático. No commit/push/merge/deploy. Seguridad pendiente y comparación B/C no pueden cerrarse por este review. Devuelve REVIEW_PASS_LIMITED, HOLD o REPAIR_REQUIRED y registra tu session ID real.
