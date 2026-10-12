# DentistApp · Auditoría de versiones y plan de integración

Fecha: 2026-10-12 (America/Santiago) · Preparado por Claude (Opus 5.5) en una sesión de Claude en la nube · Rama local `integration/dentistapp-v0.4`

**Plan v2:** incorpora la revisión independiente de Codex del 2026-10-12 (§9). Sigue sin ejecutarse.

**Autorizaciones (actualizado tras la decisión del usuario, 17:3x):** EXECUTE = AUTORIZADO y ejecutado (I0–I8, §10) · PUSH rama de integración + PR borrador = AUTORIZADO · MERGE = HOLD · RELEASE = HOLD · PUSH `main` = HOLD.
Las secciones 1–9 son el plan aprobado (AUDIT, PLAN, ORGANIZE, DIRECT). La sección 10 registra la ejecución.

> **Cambio durante la auditoría.** A las 16:56–17:01 apareció en GitHub el PR #2 (`562514a`, agenda semanal, de Codex), apilado sobre el PR #1. Lo incorporé: lo identifiqué, reproduje sus pruebas y lo sondeé en navegador. Es la evidencia de que hay dos agentes trabajando a la vez en el mismo repo (ver D0).

---

## 1. AUDIT · Identidades

No uso letras A/B/C, porque el PR #2 ya llama «A» a la línea del repo y la auditoría paralela usa B y C con otro sentido. Cada versión se nombra por lo que es y por su hash.

| ID | Qué es | Identidad | `package.json` | Procedencia |
|---|---|---|---|---|
| **MAIN** | `main`, lo que publica GitHub Pages | `259ef732683745713f50deae7e786e888f8e484e` (10:26) | 0.2.1 | = `dentistapp-mvp-v0.2.1.zip` (sha256 `74dcca35…3f88e`) = carpeta `dentistapp-mvp 4` (manifiesto `c7653b5e6669cf64`), más `pages.yml`, `basePath` y `.gitignore` (añade `out`). *Corrección: antes decía que también versionaba `tsconfig.tsbuildinfo`; era un artefacto de mi compilación local, no está en `main`.* |
| **ROLES** | «v0.3 local» con vistas por rol | `dentistapp-mvp-v0.3.zip` sha256 `40f16f971f45ea1ddcf43671fd0c95d01892334a70e27da291985b9ea9208ba2` (= `dentistapp-mvp.zip`) · manifiesto `d4b3b2c636738d98` | 0.3.0 | `/Users/chelpa/.codex/.chatgpt-projects/g-p-6aa8215c87e88191acb0ff85381ddc9d/`. ZIP de las 10:13. Sin git |
| ROLES′ | Carpeta de trabajo de ROLES | `…/dentistapp-mvp/` · manifiesto `f2aae68e3727c383` | 0.3.0 | = ROLES + mis 6 cambios del script de despliegue. No es otra versión del producto |
| **PR1** | PR #1, «DentistApp v0.3 candidate · agenda diaria, aranceles y presupuestos» | `aaa83077c462b4de8b7a509ee76946ce69fdc89a`. Draft, base `main`, 5 commits | 0.2.1 | Parte de MAIN |
| **PR2** | PR #2, «DentistApp A · agenda semanal por profesional y sillón» | `562514aa46eaddb4987ee7b72447beedabe6da8b`. Draft, **base PR1**, 2 commits (16:56 y 17:01) | 0.2.1 | Parte de PR1. Implementación y revisión de Codex |

| AUTH-PORTAL | Portal con autenticación (la «B» de la otra nomenclatura) | `fe594d947869e0d99691662a04a0109bb4c2fcff`, rama `v2`, `/Users/chelpa/Proyectos/dental-portal`, sin remoto | `dental-portal` 2.0.0 (Next 16, Auth.js, Prisma) | **CLAIM de la revisión de Codex; no lo verifiqué.** Queda **fuera** de esta integración porque requiere servidor y base de datos; se inventaría por separado |

**Correspondencia con la otra nomenclatura:** «Versión A» = línea del repo (MAIN → PR1 → PR2); «B» = AUTH-PORTAL; «C» (vistas de roles) = ROLES.

**Causa raíz de la divergencia (EVIDENCE):** ROLES ya existía (10:13) cuando se creó el repo (10:26) con el árbol de la 0.2.1. PR1 y PR2 se construyeron sobre esa base anterior. ROLES y PR1 corrigieron por separado el mismo error de agenda. En las carpetas accesibles no hay ningún clon `.git`.

**Corrección a mi informe anterior:** el sitio publica MAIN por decisión deliberada (`main` congelado). No es un error de despliegue.

---

## 2. AUDIT · Funciones realmente implementadas

Todo se probó en navegador (Chromium 141, Playwright, es-CL, America/Santiago) sobre compilaciones locales de cada versión, salvo las celdas marcadas con †, que salen de leer el código o de la evidencia del propio PR #2. Evidencia en `evidence/probe_*.json`.

| Función | MAIN (publicada) | ROLES | PR1 | PR2 | Objetivo |
|---|---|---|---|---|---|
| Vistas por rol | ❌ Decorativo | ✅ Menú 3/4/5, títulos distintos, filtro por profesional | ❌ | ❌ | ROLES, extendido a todo lo nuevo |
| «Equipo y vistas» (Admin) | ❌ | ✅ | ❌ | ❌ | ROLES |
| Agenda Mes / Día (lista) | ✅ | ✅ | ✅ | ✅ | Mantener |
| Grilla diaria de 15 min | ❌ | ❌ | ✅ | ✅ | PR1/PR2 según rol |
| **Agenda semanal** | ❌ | ❌ | ❌ | ✅ Lun–Dom/Lun–Vie, eje 15/30, filtros por profesional y sillón, carriles, crear desde un bloque; es la vista por defecto | PR2 según rol |
| Sillón (recurso) | ❌ | ❌ | ❌ | ✅ Obligatorio en citas nuevas; las antiguas quedan «sin asignar»† | PR2 (D7) |
| Duración variable | 45 fija | 45 fija | ✅ 15–240 | ✅ 15–240 | PR1/PR2 |
| Cruces | ❌ Permite doble reserva sobre una cita Completada | ✅ Rechaza (profesional) | ✅ Rechaza (profesional) | ✅ Rechaza por profesional **o** sillón; permite citas contiguas; también con Completada | PR2 |
| Citas en el pasado† | Permite | Permite | Permite | ✅ Rechaza (helper `isPastAppointment` y tests de PR2) | PR2 |
| Estado «Cancelada» | ❌ | ❌ | ❌ | ✅ (libera el horario)† | PR2 |
| Ficha y odontograma | ✅ | ✅ Edición solo Dentista | ✅ | ✅ | ROLES |
| Evoluciones | Autor fijo | Autor = profesional | Autor fijo | Autor fijo | ROLES + vincular a la atención (P0 del tío) |
| Aranceles y presupuestos | ❌ | ❌ | ✅ $130.000 probado | ✅ $130.000 probado | PR1 según rol |
| Diálogo «Nueva cita» con teclado | ❌ | ❌ | ❌ | ✅ `<dialog>` nativo: foco dentro, Tab atrapado, Escape, foco devuelto | PR2, aplicado a todos los diálogos |
| Restablecer demo | `confirm()` | Diálogo propio (sin Escape) | `confirm()` | `confirm()` | Diálogo de ROLES montado sobre `ModalDialog` de PR2 |
| Foco visible | — | — | — | ✅ `:focus-visible` 3 px† | PR2 |
| Contraste (nodos con falla en Inicio) | 52 | 49 | 48 | 48 | 0 |
| Móvil 375 px | Sin scroll horizontal | Sin scroll horizontal | Sin scroll horizontal | Sin scroll horizontal (también Semana) | Igual |
| Tests unitarios | — | — | — | ✅ 20/20 (reproducido en -03 y UTC) | Mantener y ampliar |
| Clave de almacenamiento | v1 | v3 | v1 + migración | v1 + migración | v4 (D3) |
| Next / auditoría prod | 15.5.26 · 4 | 15.5.26 · 4 | 15.5.27 · 2 | 15.5.27 · 2 | 0 (§5, I3) |
| `basePath` | ✅ | ❌ ZIP (✅ ROLES′) | ✅ | ✅ | ✅ |

---

## 3. ORGANIZE · Ramas locales (nada empujado)

```
main 259ef73 ─┬─ import/v0.3-local-zip 134fd46  (ROLES literal sobre MAIN; procedencia en el mensaje)
              │   └─ integration/dentistapp-v0.4 45e4c7a → 01f32f2 → (plan v2)  (solo documentación; sin código)
              └─ PR1 aaa8307 ── PR2 562514a
```

- El import de ROLES es byte a byte el ZIP. Por eso `next.config.ts` pierde el `basePath` de MAIN; se repone en I2.
- La integración propuesta fusiona **PR2** con un merge, lo que también trae los 5 commits de PR1. La historia y la autoría de Codex se conservan.
- MAIN, PR1, PR2, el ZIP y la carpeta original no se tocan.
- Entrego un `git bundle` con las dos ramas locales.

---

## 4. DIRECT · Conflictos

**Merges de prueba** (abortados, sin commit; `evidence/trial_merge*.txt`):

| Merge sobre ROLES | Archivos en conflicto | Bloques | Líneas |
|---|---|---|---|
| PR1 | `DentistApp.tsx` | 6 | 104 |
| **PR2** (incluye PR1) | `DentistApp.tsx` | **8** | **156** |

El resto se combina solo: `demo.ts`, `globals.css`, `package*.json`, los componentes nuevos (`WeeklyCalendar`, `ModalDialog`), `lib/calendar.ts`, tests, scripts y docs.

**Conflictos semánticos que git no detecta:**

1. `dataForRole()` de ROLES no incluye `tariffs` ni `budgets`. Con los tipos de PR1 o PR2, **`tsc` falla**: `src/lib/demoRoles.ts(20,3): error TS2739`. Lo comprobé en los dos casos.
2. `schedule()` de ROLES usa `FormData`; PR2 usa el estado `form` (duración, sillón) y helpers propios (`validAppointmentTime`, `isPastAppointment`, `findConflict`). Hay que quedarse con la lógica de PR2 y conservar las protecciones por rol de ROLES.
3. `WeeklyCalendar`, `DailySlots` y `Finance` reciben `data` completo. Sin ajuste, un Dentista vería la agenda y los presupuestos de otros. Deben recibir `viewData`. **Ojo:** la detección de conflictos debe seguir usando `data` completo, como exige PR2.
4. El diálogo de restablecer de ROLES no usa `ModalDialog`.
5. La clave de almacenamiento y el workflow de despliegue difieren entre versiones (D3, D4).

---

## 5. PLAN · Integración (solo si apruebas)

Rama `integration/dentistapp-v0.4`. Un commit por paso, cada uno verificado.

| Paso | Contenido | Verificación |
|---|---|---|
| I0 | Partir del HEAD real de esta rama (el commit del plan v2, no `45e4c7a`). Revalidar con `git ls-remote` justo antes de integrar; si PR1 o PR2 cambiaron, repetir el merge de prueba. Conservar el import de ROLES y la historia de PR1/PR2 | Hashes registrados en RADO |
| I1 | Merge de PR2 resolviendo los 8 bloques y los conflictos semánticos 1–4. Las pantallas reciben `viewData` (filtrado por rol, §5b); **las comprobaciones de reserva usan siempre `data` completo** | `npm test` 20/20 + typecheck + build + sonda |
| I2 | Recuperar `basePath`. Un solo workflow de Pages más el CI de PR, con tests | Build en subruta, 0 respuestas 4xx |
| I3 | PostCSS **sobre la candidata integrada exacta**, con comandos estándar de npm (protocolo en §5c). No se edita el lock a mano | `npm ls` exit 0, `npm ci` limpio, audit prod, tests/build, CSS comparado contra la misma candidata sin override |
| I4 | Clave `…-v4`. **No** se borran ni sobrescriben `…-v1` ni `…-v3`; si existen, un aviso único explica que la demo empieza de nuevo. La normalización no inventa sillones (la falta de sillón sigue como «sin asignar») y no descarta registros en silencio: los inválidos se marcan y se informan | Recargar y restablecer con cada uno de los 3 roles |
| I5 | Evolución vinculada a una atención: el campo «Atención» solo ofrece citas **del mismo paciente y del profesional activo**, y el guardado valida las tres condiciones; el autor sale del profesional activo. Sigue siendo una nota demo, sin firma ni auditoría sanitaria | e2e positivo + 3 rechazos (otro paciente, otro profesional, cita inexistente) |
| I6 | Accesibilidad: tokens `teal → #0a7a71` (5,2:1) y `muted → #5f6f80` (5,16:1), grises manuales; restablecer y detalle de cita con `ModalDialog`; `aria-current`; pestañas con semántica y flechas; selector de rol legible en móvil | axe sin violaciones automáticas en las pantallas probadas + pruebas de teclado (§5d). Se guardan los hallazgos de antes y de después |
| I7 | Pruebas: suite de PR2 + e2e por rol + teclado + axe en CI, con versiones de herramientas fijadas (axe-core 4.10.3, Playwright 1.56.0, Chromium 141) | CI verde |
| I8 | Versión `0.4.0`, README, AUDIT_NOTE y CHANGELOG con procedencia | Revisión |

Después de I8 me detengo y, si autorizas el push, abro un PR en borrador `integration → main`. PR1 y PR2 no se fusionan por separado.

**Fuera de alcance:** Tailwind 4 (7 alertas de desarrollo), backend, autenticación real, sesiones, firma de evoluciones, concurrencia entre pestañas (riesgo A17 de PR2), datos reales y AUTH-PORTAL. Un audit de producción en cero cierra solo ese gate, no la seguridad global.

### 5b. Matriz de permisos de presentación (propuesta para D2)

Son permisos **de interfaz**, no autorización real: cualquier visitante puede cambiar de rol.

| Función | Recepción | Dentista (profesional activo) | Admin |
|---|---|---|---|
| Agenda Mes/Semana/Día y grilla | Ver todo; filtrar | Ver solo su agenda (filtro fijo) | Ver todo; filtrar |
| Crear cita, duración, sillón | ✅ | ❌ | ✅ |
| Cambiar estado de cita | ✅ | Solo las suyas | ✅ |
| Ficha, odontograma, evoluciones | ❌ | ✅ Sus pacientes | Solo lectura |
| Tratamientos | ❌ | ✅ Sus pacientes | Solo lectura |
| Aranceles | Ver | Ver | Ver y editar |
| Presupuestos | Crear y ver todos | Crear y ver los de **sus pacientes** (D2b) | Ver todos |
| Equipo y vistas | ❌ | ❌ | ✅ |

D2b: hoy `Budget` no tiene autor. «De sus pacientes» se filtra por paciente sin cambiar el modelo. «Solo los que creó él» exigiría un campo `createdBy`. Propongo filtrar por paciente y, además, registrar `createdBy` solo para mostrarlo.

### 5c. Protocolo PostCSS (I3)

Prueba previa sobre una copia de PR2 (`evidence/postcss_standard_path.txt`), con `overrides.next.postcss` fijado:

| Camino | postcss bajo Next | `npm ls` | Audit prod |
|---|---|---|---|
| `npm install` | 8.4.31 «invalid» (reproduce el ELSPROBLEMS histórico) | exit 1 | 2 |
| `npm install --package-lock-only` + `npm ci` | 8.4.31 | exit 1 | 2 |
| Override `"$postcss"` | 8.4.31 | exit 0 | 2 |
| `npm install` + **`npm dedupe`** | **8.5.28** | **exit 0** | **0** |
| `npm install` + `npm update postcss` | 8.5.28 (lock idéntico al de `dedupe`) | exit 0 | 0 |

Los caminos que funcionan también suben el postcss de raíz de 8.5.28 a 8.5.29 (parche) y cambian metadatos de paquetes de plataforma según la versión de npm.

Pasos sobre la candidata integrada:
1. Compilar **sin** override y guardar el hash del CSS (mismo código y mismo runtime).
2. Agregar el override a la versión corregida, luego `npm install` + `npm dedupe`.
3. Verificar `npm ls` (exit 0), `npm ci` limpio y audit prod; correr tests, typecheck y build.
4. Comparar el hash del CSS con el paso 1.
5. Registrar el diff del lock entrada por entrada y explicar cada cambio. Usar la misma versión de npm que el CI.

G3 se decide aparte, con esa evidencia.

### 5d. Pruebas de teclado (I6/I7)

- Selector de rol: se alcanza con Tab, foco visible y cambio con flechas.
- Menú: en escritorio, Tab recorre el menú y la sección activa tiene `aria-current`. En móvil: abrir, recorrer, cerrar con su botón y con Escape, con el foco devuelto.
- Pestañas del paciente: flechas izquierda/derecha y `aria-selected`.
- Todos los diálogos (nueva cita, restablecer, detalle de cita en la semana): el foco entra, Tab queda atrapado, Escape cierra y el foco vuelve al botón que lo abrió.
- Agenda semanal: bloque libre con Enter (escenario A07 de PR2).

---

## 6. DIRECT · Criterios de aceptación

| ID | Criterio | Verificación |
|---|---|---|
| AC1 | La historia contiene el import de ROLES (sha del ZIP) y los commits de PR1 y PR2 | `git merge-base --is-ancestor 562514a HEAD` |
| AC2 | `npm ci`, `npm test`, `typecheck` y `build:static` (con `/dentistapp-demo`) pasan; servido en subruta sin 4xx | Script |
| AC3 | Sobre la candidata exacta: `npm ls` exit 0, postcss efectivo ≥ 8.5.23, `npm audit --omit=dev` = 0, CSS igual al de la misma candidata sin override y diff del lock explicado. Cierra solo el gate de dependencias de producción | §5c |
| AC4 | Cada celda de la matriz §5b se cumple; aviso «simulación, no autenticación» visible en las 3 vistas; las reservas se validan contra todas las citas aunque la vista esté filtrada | e2e por rol |
| AC5 | Agenda Mes/Semana/Día; escenarios A01–A13 de PR2 siguen pasando | Tests + navegador |
| AC6 | Cruces: rechaza el mismo profesional o el mismo sillón, también sobre una Completada; permite contiguas y recursos distintos (pruebas 2 y 3 del tío; A08–A10) | e2e |
| AC7 | Presupuesto: 2 prestaciones, cantidad y descuento dan un total exacto; el presupuesto conserva su precio al cambiar el arancel (prueba 5 del tío) | e2e |
| AC8 | Evolución vinculada a una cita del mismo paciente y profesional, con autor = profesional activo; se rechazan otro paciente, otro profesional y una cita inexistente | e2e positivo y negativo |
| AC9 | Persistencia y restablecer, con diálogo accesible, en los 3 roles (prueba 6 del tío). Las claves `v1`/`v3` siguen intactas; no se inventan sillones ni se pierden registros sin aviso | e2e |
| AC10 | Sin violaciones automáticas de axe (wcag2a/aa, 2.1aa, 2.2aa) en las pantallas probadas, escritorio y móvil, y todas las pruebas de teclado de §5d. **No equivale a cumplimiento integral de accesibilidad** | axe + teclado, con hallazgos de antes y después |
| AC11 | 320/375/390/768/1440 px sin scroll horizontal; selector de rol legible | Sonda móvil |
| AC12 | 0 errores de consola o de página | Sonda |
| AC13 | Ningún push a `main`, merge ni despliegue sin tu autorización | RADO |

---

## 7. DIRECT · Riesgos

| ID | Riesgo | Mitigación |
|---|---|---|
| R0 | Divergencia accidental mientras otro agente trabaja en ramas vecinas. PR2 se creó en rama aparte y con coordinación registrada, así que no es un conflicto en sí | Un solo responsable de esta integración (D0); PR1/PR2 congelados como fuentes; revalidar refs en I0 |
| R1 | `DentistApp.tsx` pasa de unos 40 a 45 KB y 8 bloques en conflicto | Tests de PR2 + sonda antes y después; dividir el archivo en un PR aparte |
| R2 | Conflictos semánticos (§4) | Typecheck + e2e por rol |
| R3 | El override de postcss sale de la versión que fija Next | Solo se usa al compilar; CSS idéntico verificado; repetir en cada actualización de Next |
| R4 | 7 alertas de desarrollo (Tailwind 3) | Se compila en CI con entrada confiable; Tailwind 4 aparte |
| R5 | AUTH-PORTAL (`fe594d9`) solo está identificada por la revisión de Codex | Inventariarla aparte; no afecta a esta integración |
| R6 | Repo público: commits con tu Gmail; notas internas visibles | Usar el correo noreply en los commits nuevos |
| R7 | Roles filtrados solo en el navegador; localStorage sin atomicidad | Avisos visibles; documentado |
| R8 | La clave nueva reinicia los datos demo | Aceptable; avisar en el changelog |
| R9 | Reglas de la clínica (quién presupuesta, si se usa sillón) | D2 y D7 con tu tío |

---

## 8. Decisiones

| ID | Decisión | Recomendación |
|---|---|---|
| **D0** | ¿Quién integra? | La revisión de Codex recomienda Claude como único integrador y Codex como revisor independiente. **Pendiente de tu decisión** |
| D1 | Versión integrada | `0.4.0` |
| D2 | Permisos de lo nuevo | La matriz §5b |
| D2b | Presupuestos del Dentista | Filtrar por sus pacientes y registrar `createdBy` solo para mostrarlo |
| D3 | Almacenamiento | Clave `v4`, empezar limpio, sin tocar `v1`/`v3` |
| D4 | Despliegue | Un solo workflow de Pages, solo desde `main` (RELEASE en HOLD) |
| D5 | Push de la rama de integración y PR en borrador | Sí, al terminar I8 |
| D6 | Alertas de desarrollo de Tailwind 3 | Aceptar para la demo; Tailwind 4 aparte |
| D7 | Sillón como recurso obligatorio (PR2) | Mantenerlo y confirmarlo con tu tío |
| D8 | AUTH-PORTAL | ~~Pendiente~~ → resuelto: localizada por Codex y fuera de esta integración |

---

## 9. Ajustes de la revisión independiente (Codex) y dónde quedaron

| # | Ajuste pedido | Incorporado en |
|---|---|---|
| 1 | Usar el HEAD real y revalidar refs; conservar la historia | I0 |
| 2 | Matriz de roles concreta; `viewData` para pantallas, `data` para reservas; autor de presupuestos | §5b, I1, D2b, AC4 |
| 3 | Evoluciones: misma cita, paciente y profesional, con pruebas positivas y de rechazo | I5, AC8 |
| 4 | PostCSS sobre la candidata exacta, diff mínimo, comparación controlada y sin recetas manuales | I3, §5c, AC3. Probé además el camino estándar (`npm dedupe` / `npm update`) |
| 5 | axe cero ≠ cumplimiento; teclado de selector, menú, pestañas y diálogos; herramientas fijadas | I6, I7, §5d, AC10 |
| 6 | `v4` sin borrar `v1`/`v3`; sin sillones inventados ni pérdidas silenciosas; probar los 3 roles | I4, AC9 |
| 7 | Gates separados; audit cero no es seguridad global | Fuera de alcance, AC3 |

---

## 10. Ejecución (EXECUTE) · 2026-10-12

Decisiones del usuario: Claude como único integrador, Codex como revisor independiente; matriz §5b tal cual; presupuestos del Dentista filtrados por sus pacientes (D2b); sillón obligatorio (D7); push de la rama de integración y PR en borrador. MERGE y RELEASE siguen en HOLD.

| Paso | Commit | Verificación |
|---|---|---|
| I0 | — | `git ls-remote` 20:40Z: `main` 259ef73, PR1 aaa8307, PR2 562514a sin cambios |
| I1 | `5ef915a` merge de PR2 (incluye PR1) | 8 bloques resueltos; TS2739 corregido; conflicto semántico nuevo corregido: `Finance` guardaba con `onChange(viewData)` y habría borrado datos ocultos al Dentista. tsc OK, 20/20, build, prueba de roles |
| I2 | `5880af1` | `basePath` restaurado; `pages.yml` solo desde `main` con pruebas; `ci.yml`. Subruta sin 4xx; actionlint |
| I3 | `903de95` | Sobre la candidata exacta 5880af1: `postcss ^8.5.23` + `overrides {"postcss":"$postcss"}` + `npm install`. `npm ls` 0, audit prod 0, JS/CSS idénticos byte a byte en compilación controlada (`evidence/I3_postcss_candidate.txt`) |
| I4 | `09f73fd` | Clave v4, `normalizeState`/`loadState`; 8 pruebas unitarias |
| I5 | `946917e` | `validateNoteLink`; 3 pruebas unitarias (5 rechazos); navegador: vínculo guardado, manipulación rechazada |
| I6 | `ba0a6f5` | Línea base `evidence/e2e_before_I6.*` (contraste en 40/40 vistas, target-size, región desplazable, selector cortado, teclado) → corregido |
| I7 | `b8fd67c`, `8f0a4b1` | e2e 11/11 (`evidence/e2e_after_I7.*`): axe 0 violaciones automáticas en 40 vistas, sin desbordes 320–1440 px, sin errores; unitarias 34/34 |
| I8 | `78fb241` | Versión 0.4.0, README, PUBLISH_DEMO, AUDIT_NOTE, CHANGELOG, RADO; verificación final en clon limpio (`58e5de7`) |
| PR #3 | `db7d518` | Subido por el usuario; revisión de Codex: «requiere reparación» (RADO R-15) |
| R1 | `1840bfd` | P2: una evolución solo se vincula a una atención ya iniciada (fecha **y** hora, reloj inyectable). Unitarias 36/36; la prueba e2e falla sobre `db7d518` y pasa aquí |
| R2 | `5685207` | P2: los registros guardados que la interfaz no puede mostrar se apartan con sus dependientes, con respaldo y aviso; pantalla de recuperación como último recurso. Unitarias 40/40; las 2 pruebas e2e fallan sobre `db7d518` y pasan aquí |
| R3 | `10e8e84` | Prueba de teclado del selector válida en macOS: escritura anticipada en todas las plataformas y flechas solo fuera de macOS. Clon limpio: `npm ci`, audit prod 0, 40/40, tsc, build, e2e 14/14 (RADO R-17) |

Cambio de prueba de Codex a revisar: en `tests/calendar.test.ts`, la aserción «el seed no tiene sillones» pasó a «sillones conocidos y sin cruces», porque la 0.4 crea datos nuevos con sillón (D7). La regla de no inventar sillones en datos antiguos sigue cubierta por el fixture de esa prueba y por `tests/storage.test.ts`.

Revisión del PR #3 (RADO R-15 a R-17): el usuario pidió reparar en la misma rama y entregar un SHA nuevo. No se exige el estado «Completada» para vincular una evolución, porque la revisión no lo pide. Consecuencia: con los datos iniciales (citas desde hoy), antes de las 09:00 no hay atención vinculable. MERGE, RELEASE y PUSH `main` siguen en HOLD.
