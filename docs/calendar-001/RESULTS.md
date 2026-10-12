# DENTISTAPP-CALENDAR-001 · Resultados de candidata

2026-10-12 · America/Santiago. Implementador y revisor: sesiones separadas de Codex. Claude no ejecutado por falta de autenticación.

## Resultado y gates

Vista Semana añadida sin sustituir A por B/C. Configuración Lun–Dom/Lun–Vie, 15/30m, filtros dentista/sillón, carriles, duración proporcional, navegación, creación desde slot, cancelación/reactivación, validación de reservas y teclado/móvil. Mes/Día conservados. Sillón obligatorio para nuevas citas; datos previos se muestran sin asignación.

| Gate | Estado | Alcance acreditado |
| --- | --- | --- |
| G1 identidad | PASS | Baseline aaa8307 verificado local y en GitHub; PR #1 abierto/draft |
| G2 técnica | PASS | Instalación limpia, árbol consistente, 20 tests, tipos, exportación estática y diff |
| G3 dependencias | HOLD | Audit actual: 2 alertas, 1 moderada (Next) y 1 alta (PostCSS transitivo); exit 1 |
| G4 interfaz | PASS_LIMITED | 16 escenarios/observaciones de navegador; 320/390/768/1440px, sin pageerror. Aceptación clínica humana y auditoría integral de accesibilidad pendientes |
| G5 B/C | HOLD | Auditoría comparativa separada en curso; no se eligió una sustitución |
| G6 publicar | HOLD | Solo rama y PR draft; no merge ni despliegue |

## Evidencia ejecutada

- [Manifest automático](evidence/manifest.json): comandos, timestamps, exit codes, runtime, SHA-256 por fuente y digest agregado. El checkoutHead era el baseline antes del commit; los hashes identifican los bytes de la candidata, no una aprobación automática.
- [Instalación limpia](evidence/npm-ci.log) y [árbol](evidence/npm-ls.log): exit 0. Se instaló en una carpeta aislada con el mismo package-lock y dependencias. El script `test` añadido no cambia el lockfile. No se aprobó el script opcional fsevents ni se forzó una migración.
- [Tests UTC](evidence/tests-utc.log) y [Santiago](evidence/tests-santiago.log): 20/20, Node 24.14.0 (implementador inicial: 19/19 con bundle Node 24.19.0). Registro final [tests](evidence/tests.log), [tipos](evidence/typecheck.log) y [build](evidence/static-build.log) con Node 24.14.0/npm 11.19.1. CI mantiene Node 22; su ejecución remota se registra después de abrir el PR.
- [Review independiente](INDEPENDENT-REVIEW.md): `REVIEW_PASS_LIMITED`, tests personalmente repetidos y 3.000 combinaciones adversariales, 93.780 pares solapados comprobados. Se verificó que sus cinco hashes coinciden con la candidata final.
- [Navegador](evidence/browser-results.json): Chromium headless, exportación real con base path `/dentistapp-demo`, zona America/Santiago y fixture de seis citas ficticias. Verificados legacy, semana completa/laboral, carriles, alturas 30/60, cita corta con eje 30, navegación, filtros, Enter/Tab/Escape/retorno de foco, conflictos globales, adyacencia, 19:45–20, cancelación/reactivación, recarga, Mes/Día, cuatro tamaños, Hoy y ausencia de errores runtime.
- [Script de navegador](evidence/browser-check.cjs): ejecución opcional desde raíz del repo, requiere Playwright disponible externamente (`PLAYWRIGHT_MODULE` si no está instalado), exportación servida localmente y `CALENDAR_PREVIEW_URL` opcional. No añade Playwright ni cambia dependencias de la app. Solo modifica datos ficticios en su contexto de navegador efímero.
- Capturas escritorio/móvil inspeccionadas visualmente y entregadas en el paquete descargable; [digests](evidence/screenshots-manifest.json) identifican esos PNG externos. No son capturas de producción. En grilla densa los textos se truncan, con detalle accesible al abrir y lista legible del día.

## Fallos y reparación preservados

El revisor encontró la creación de una cita pasada durante el día actual; se reparó antes de cerrar el review, con reloj inyectable y tests. El primer registro automático de build usó Node 18.14.0 del entorno y falló por versión incompatible; [sobre histórico](evidence/initial-node18/manifest.json) y [log](evidence/initial-node18/static-build.log) conservados. Se repitió con Node 24 explícito y pasó. No fue una vulnerabilidad nueva ni un fallo de compilación de la candidata bajo el runtime compatible.

El historial de override PostCSS es un incidente reportado por el usuario, no reproducido aquí. Su retirada y la consistencia actual no cierran la vulnerabilidad restante.

## Pendientes concretos

No se ejecutó un backend concurrente ni prueba de garantía de reserva entre usuarios/pestañas (A17). localStorage sigue sin atomicidad. La migración legacy sin sillón impide conocer ocupación histórica por recurso; debe revisarse antes de considerar recursos disponibles en un sistema real.

La matriz A01–A18 es un contrato: A01–A13 tienen cobertura de helpers, lectura y los flujos de navegador indicados; no se verificó visualmente cada duración hasta 240m. A14 incluye teclado de nueva cita; no acredita todos los lectores de pantalla/navegadores. A15 acredita los cuatro anchos medidos. A16 incluye recarga y Mes/Día; el flujo completo de presupuesto/aranceles no se repitió en navegador. Estos límites no se convierten en PASS clínico ni de producción.

Siguiente paso: revisión del borrador con el tío dentista, contraste final con B/C, y opcional segunda auditoría Claude mediante [prompt](CLAUDE-PROMPT.md) tras iniciar sesión. Promoción requiere autorización distinta.

## Repetir RADO

Desde la raíz del repo con Node compatible y npm instalados: `node scripts/record-calendar-evidence.mjs`. Guarda logs y manifiesto de esa nueva ejecución. Archivar un sobre anterior antes de repetir si es necesario conservar la historia. El script no instala, repara, hace commit, merge ni despliega. SHA-256 vincula contenido; no certifica verdad ni autoridad.

## Integridad de la transferencia de logs

Después del primer PR, se detectó que la lectura de texto para subir un log convirtió CR a LF. El log local preservaba los bytes originales y su hash, pero la primera copia remota de static-build.log no coincidía. Se reparó el transporte para leer bytes UTF-8 sin normalización y se añadió una vigésima prueba de integridad de los logs/manifiesto. La UI no cambió; sus cinco hashes de revisión siguen idénticos. La corrección se registra en un commit posterior; no se borra el commit histórico.
