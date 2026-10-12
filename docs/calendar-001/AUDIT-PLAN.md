# DENTISTAPP-CALENDAR-001 · APODE + RADO

Fecha de decisión: 2026-10-12, America/Santiago. Estado: candidata de demo.

## AUDIT · Identidad y evidencia de partida

- Versión A: `chelpa/dentistapp-demo`. Baseline de incremento: `aaa83077c462b4de8b7a509ee76946ce69fdc89a`, Next.js 15.5.27. El cambio de dependencias sí estaba pusheado al iniciar esta auditoría.
- [PR #1](https://github.com/chelpa/dentistapp-demo/pull/1): abierto, draft, base `main` en `259ef732683745713f50deae7e786e888f8e484e`. Comprobado con GitHub connector, no inferido del chat.
- [CI del baseline](https://github.com/chelpa/dentistapp-demo/actions/runs/38299044837): success; valida instalación/tipos/exportación, no acredita comportamiento visual.
- Código observado: `Agenda` ofrece Mes/Día; `DailySlots` escala duración por dentista; `schedule` detecta cruces del mismo dentista; no existe sillón en `Appointment`; persistencia local sin servidor ni control de concurrencia.
- `package.json` no contiene el override fallido. El incidente histórico `postcss@8.4.31 invalid: 8.5.28` / `ELSPROBLEMS` proviene del registro aportado por el usuario, no de una reproducción realizada ahora.
- Claude Code 2.1.296 instalado; `claude auth status` devuelve `loggedIn=false`. No se ha ejecutado una implementación ni revisión de Claude. Implementación alternativa: Codex; revisión separada: agente Codex.
- Auditoría paralela: chat «Auditar versiones de DentistApp», `01a1318d-5554-7f21-a30f-425c09b88f1d`. Reportó B con autenticación/usuarios y C con vistas de roles. Se envió coordinación autorizada: este incremento conserva A y no importa B/C. Comparación final pendiente.

## PLAN · Slice y decisiones

Construir una vista semanal que permita recorrer horas, profesionales y sillones con datos ficticios. Mantener las vistas Mes/Día y sus flujos de pacientes/presupuestos. No añadir dependencias de calendario ni cambiar Next.js, Tailwind o el lockfile para este incremento.

Referencias de producto revisadas, sin copiar recursos ni introducir datos reales:

- [Dentalink, agenda](https://www.softwaredentalink.com/es/experiencia-de-pacientes/agenda): presenta ocupación diaria/semanal de sillones y estados de atención.
- [Dentalink, primera cita](https://ayuda.softwaredentalink.com/es/articles/9488188-agenda-la-primera-cita): describe creación desde agenda y elección de profesional/recurso.
- [DENTIDESK, funcionalidades](https://www.dentidesk.com/dentidesk/feature): referencia general de organización de citas. No se afirma equivalencia funcional ni superioridad sobre estos productos.

Decisiones: semana comienza lunes; configuración laboral Lun–Vie o completa Lun–Dom; horario demo 08:00–20:00; intervalo visual 15/30 minutos; cálculo de posición en minutos, independiente del intervalo. Citas de 15 minutos siguen visibles al seleccionar 30. Fecha civil local, sin conversiones UTC que cambien el día. Citas simultáneas se colocan en carriles visibles. La última hora válida depende de la duración: 19:45 con 15 minutos sí cabe.

Las citas anteriores sin sillón conservan esa ausencia y se etiquetan como sin asignación; no se inventa un recurso ocupado. Citas nuevas requieren sillón. Conflicto local cuando se superpone el mismo dentista **o** el mismo sillón asignado, con intervalos semiabiertos `[inicio, fin)`; fin e inicio adyacentes son válidos. Filtros visuales no limitan el universo de comprobación.

## ORGANIZE · Alcance de las ramas

- DentistApp: nueva rama `feature/weekly-calendar-chz-001-20261012` desde el head del PR #1; PR draft apilado sobre `feature/uncle-feedback-v02-20261012` para mostrar solo este incremento.
- CHAZEWARE: documento en rama `docs/chz-learn-calendar-001-20261012` desde `main` remoto `f377ac0db1ec95b44c539dc83cf353ee0d2d7f3a`. La carpeta local estaba en `chz-010/presentation`; no se incorpora esa rama por accidente.
- Copias aisladas dentro del espacio de trabajo. Repos originales, main y demo publicada preservados.

## DIRECT · Autoridad y roles

El usuario autorizó audit, plan, documentación y ejecución en rama nueva/PR draft; prohibió merges y publicación. Implementador Codex y revisor independiente Codex, con sus resultados registrados por separado. Claude pendiente de autenticación y de ejecución humana del prompt preparado. Review PASS no autoriza merge ni convierte el prototipo en sistema clínico.

## EXECUTE · Aceptación previa al gate

| ID | Escenario | Resultado exigido |
| --- | --- | --- |
| A01 | Fecha domingo / cambio mes-año / año bisiesto | Lunes correcto y 5/7 fechas consecutivas sin salto de zona horaria |
| A02 | Anterior / siguiente / Hoy | Mover ±7 días y volver a la semana actual |
| A03 | Cambiar Lun–Vie a Lun–Dom | Fin de semana visible; sus citas no se eliminan |
| A04 | Cambiar 15/30 | Líneas y slots cambian; duración/posición real no se redondean |
| A05 | Citas 15, 30, 45, 60, 120 y 240 min | Altura proporcional; no desaparecen las cortas |
| A06 | Filtrar dentista y sillón | Mostrar intersección; comprobar conflictos contra todas las citas |
| A07 | Clic / Enter en slot futuro | Abrir cita con fecha/hora y recursos filtrados precargados |
| A08 | Mismo dentista, distinto sillón, cruce | Rechazar |
| A09 | Distinto dentista, mismo sillón, cruce | Rechazar |
| A10 | Distintos recursos o citas adyacentes | Permitir |
| A11 | Simultáneas de recursos distintos | Carriles separados; todas accesibles |
| A12 | Datos anteriores sin sillón | Mantener IDs/duración y indicar sin asignación |
| A13 | Fecha/hora inválida, pasada o fuera del horario | Rechazar; 19:45–20:00 sí válido |
| A14 | Modal con teclado | Foco inicial, Tab contenido, Escape cierra y devuelve foco |
| A15 | Móvil 390px / teclado / estados | Controles utilizables, alternativa diaria/lista legible, estado textual |
| A16 | Recarga / Mes / Día / presupuesto | Persistencia y regresiones sin pérdidas |
| A17 | Dos pestañas reservan desde snapshots distintos | Documentar el riesgo; no afirmar atomicidad por un test local |
| A18 | Tipos / tests / exportación / diff | Logs vinculados a hash de fuentes, no solo al nombre de rama |

Las pruebas automáticas de invariantes y navegador deben acreditar resultados separados. Una matriz escrita no equivale a tests ejecutados. Las filas no verificadas permanecen pendientes.

## RECORD · Contrato de evidencia

RADO se aplica aquí como captura de comandos, códigos de salida, fecha UTC, commit/base, hashes SHA-256 de archivos relevantes y logs; el registro puede revisarse y repetirse. Es un mecanismo acotado de este caso, no una implementación completa del control plane CHAZEWARE ni un registro clínico inmutable.

El manifiesto y resultados se completan tras ejecutar la candidata. `CLAIM ≠ EVIDENCE ≠ FINDING ≠ DECISION ≠ AUTHORITY ≠ EXECUTION`. No marcar G3 seguridad PASS mientras existan alertas o falle el endpoint de audit. No marcar G4 interfaz PASS con solo tsc/build. No marcar G5 comparación PASS por antigüedad o cantidad de documentación.

Gates: G1 identidad; G2 instalación/tipos/tests/exportación; G3 dependencias; G4 UI/accesibilidad; G5 baseline B/C; G6 publicación. G5/G6 permanecen HOLD. Aceptación clínica del tío pendiente aunque los tests pasen.
