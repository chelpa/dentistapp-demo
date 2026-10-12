# DentistApp · Auditoría de versiones y plan de integración

Fecha: 2026-10-12 (America/Santiago) · Preparado por Claude (Opus 5.5) en una sesión de Claude en la nube · Rama local `integration/dentistapp-v0.4`

**Autorizaciones:** EXECUTE = PENDIENTE · MERGE = HOLD · RELEASE = HOLD · PUSH `main` = HOLD · PUSH rama de integración = PENDIENTE.
Este documento cubre AUDIT, PLAN, ORGANIZE y DIRECT. No se implementó ninguna función ni se escribió nada en GitHub.

> **Cambio durante la auditoría.** A las 16:56–17:01 apareció en GitHub el PR #2 (`562514a`, agenda semanal, de Codex), apilado sobre el PR #1. Lo incorporé: lo identifiqué, reproduje sus pruebas y lo sondeé en navegador. Es la evidencia de que hay dos agentes trabajando a la vez en el mismo repo (ver D0).

---

## 1. AUDIT · Identidades

No uso letras A/B/C, porque el PR #2 ya llama «A» a la línea del repo y la auditoría paralela usa B y C con otro sentido. Cada versión se nombra por lo que es y por su hash.

| ID | Qué es | Identidad | `package.json` | Procedencia |
|---|---|---|---|---|
| **MAIN** | `main`, lo que publica GitHub Pages | `259ef732683745713f50deae7e786e888f8e484e` (10:26) | 0.2.1 | = `dentistapp-mvp-v0.2.1.zip` (sha256 `74dcca35…3f88e`) = carpeta `dentistapp-mvp 4` (manifiesto `c7653b5e6669cf64`), más `pages.yml`, `basePath`, `.gitignore` y `tsconfig.tsbuildinfo` |
| **ROLES** | «v0.3 local» con vistas por rol | `dentistapp-mvp-v0.3.zip` sha256 `40f16f971f45ea1ddcf43671fd0c95d01892334a70e27da291985b9ea9208ba2` (= `dentistapp-mvp.zip`) · manifiesto `d4b3b2c636738d98` | 0.3.0 | `/Users/chelpa/.codex/.chatgpt-projects/g-p-6aa8215c87e88191acb0ff85381ddc9d/`. ZIP de las 10:13. Sin git |
| ROLES′ | Carpeta de trabajo de ROLES | `…/dentistapp-mvp/` · manifiesto `f2aae68e3727c383` | 0.3.0 | = ROLES + mis 6 cambios del script de despliegue. No es otra versión del producto |
| **PR1** | PR #1, «DentistApp v0.3 candidate · agenda diaria, aranceles y presupuestos» | `aaa83077c462b4de8b7a509ee76946ce69fdc89a`. Draft, base `main`, 5 commits | 0.2.1 | Parte de MAIN |
| **PR2** | PR #2, «DentistApp A · agenda semanal por profesional y sillón» | `562514aa46eaddb4987ee7b72447beedabe6da8b`. Draft, **base PR1**, 2 commits (16:56 y 17:01) | 0.2.1 | Parte de PR1. Implementación y revisión de Codex |

**Correspondencia con la otra nomenclatura (CLAIM tomado de `docs/calendar-001/AUDIT-PLAN.md` del PR #2):**
- «Versión A» = la línea del repo (MAIN → PR1 → PR2).
- La auditoría paralela «reportó B con autenticación/usuarios y C con vistas de roles». **C probablemente es ROLES** (no verificado).
- **B «con autenticación/usuarios» no lo encontré** en las carpetas accesibles: hay que identificarlo antes de cerrar la comparación (pendiente G5 en el PR #2).

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
              │   └─ integration/dentistapp-v0.4 45e4c7a+  (solo documentación; sin código)
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
| I0 | Revalidar identidades: `git ls-remote`. Si PR1 o PR2 cambiaron, repetir el merge de prueba sobre los HEAD nuevos | Hashes registrados |
| I1 | Merge de PR2 resolviendo los 8 bloques y los conflictos semánticos 1–4. Lo nuevo (semana, grilla, sillón, aranceles, presupuestos) queda consciente del rol; los conflictos se siguen calculando sobre todas las citas | `npm test` 20/20 + typecheck + build + sonda |
| I2 | Recuperar `basePath`. Un solo workflow de Pages más el CI de PR, con tests | Build en subruta, 0 respuestas 4xx |
| I3 | Override de postcss para Next (`8.5.28`), regenerando solo esa entrada del lock | Viabilidad ya probada sobre PR1: audit prod = 0, CSS idéntico byte a byte |
| I4 | Clave `…-v4`, con normalización defensiva | Recargar y restablecer |
| I5 | Evolución vinculada a una atención (campo «Atención»), autor = profesional | e2e |
| I6 | Accesibilidad: tokens `teal → #0a7a71` (5,2:1) y `muted → #5f6f80` (5,16:1), grises manuales; restablecer con `ModalDialog`; `aria-current`; pestañas; selector de rol legible en móvil | axe = 0 en todas las vistas, prueba de teclado |
| I7 | Pruebas: suite de PR2 + e2e por rol (la sonda) + axe en CI | CI verde |
| I8 | Versión `0.4.0`, README, AUDIT_NOTE y CHANGELOG con procedencia | Revisión |

Después de I8 me detengo y, si autorizas el push, abro un PR en borrador `integration → main`. PR1 y PR2 no se fusionan por separado.

**Fuera de alcance:** Tailwind 4 (7 alertas de desarrollo), backend, autenticación real, firma de evoluciones, concurrencia entre pestañas (riesgo A17 de PR2) y la versión «B con autenticación» hasta identificarla.

---

## 6. DIRECT · Criterios de aceptación

| ID | Criterio | Verificación |
|---|---|---|
| AC1 | La historia contiene el import de ROLES (sha del ZIP) y los commits de PR1 y PR2 | `git merge-base --is-ancestor 562514a HEAD` |
| AC2 | `npm ci`, `npm test`, `typecheck` y `build:static` (con `/dentistapp-demo`) pasan; servido en subruta sin 4xx | Script |
| AC3 | `npm audit --omit=dev` = 0; postcss efectivo ≥ 8.5.23; CSS igual al build sin override | `npm audit`, `npm ls`, sha |
| AC4 | Roles: Recepción sin ficha clínica; Dentista ve solo lo suyo (semana, grilla, presupuestos); Admin ve Equipo y Aranceles; aviso «simulación, no autenticación» visible | e2e por rol |
| AC5 | Agenda Mes/Semana/Día; escenarios A01–A13 de PR2 siguen pasando | Tests + navegador |
| AC6 | Cruces: rechaza el mismo profesional o el mismo sillón, también sobre una Completada; permite contiguas y recursos distintos (pruebas 2 y 3 del tío; A08–A10) | e2e |
| AC7 | Presupuesto: 2 prestaciones, cantidad y descuento dan un total exacto; el presupuesto conserva su precio al cambiar el arancel (prueba 5 del tío) | e2e |
| AC8 | Evolución vinculada a una cita, con autor = profesional | e2e |
| AC9 | Persistencia y restablecer con diálogo accesible (prueba 6 del tío) | e2e |
| AC10 | axe (wcag2a/aa, 2.1aa, 2.2aa) = 0 en todas las vistas, escritorio y móvil; todos los diálogos con foco dentro, Tab atrapado, Escape y foco devuelto | axe + teclado |
| AC11 | 320/375/390/768/1440 px sin scroll horizontal; selector de rol legible | Sonda móvil |
| AC12 | 0 errores de consola o de página | Sonda |
| AC13 | Ningún push a `main`, merge ni despliegue sin tu autorización | RADO |

---

## 7. DIRECT · Riesgos

| ID | Riesgo | Mitigación |
|---|---|---|
| **R0** | **Dos agentes (Codex y Claude) trabajan a la vez en el mismo repo.** PR2 apareció durante esta auditoría | Un solo integrador (D0); congelar PR1/PR2 o repetir I0 justo antes de integrar |
| R1 | `DentistApp.tsx` pasa de unos 40 a 45 KB y 8 bloques en conflicto | Tests de PR2 + sonda antes y después; dividir el archivo en un PR aparte |
| R2 | Conflictos semánticos (§4) | Typecheck + e2e por rol |
| R3 | El override de postcss sale de la versión que fija Next | Solo se usa al compilar; CSS idéntico verificado; repetir en cada actualización de Next |
| R4 | 7 alertas de desarrollo (Tailwind 3) | Se compila en CI con entrada confiable; Tailwind 4 aparte |
| R5 | La versión «B con autenticación» no está identificada | Ubicarla (D8) antes de dar la comparación por cerrada |
| R6 | Repo público: commits con tu Gmail; notas internas visibles | Usar el correo noreply en los commits nuevos |
| R7 | Roles filtrados solo en el navegador; localStorage sin atomicidad | Avisos visibles; documentado |
| R8 | La clave nueva reinicia los datos demo | Aceptable; avisar en el changelog |
| R9 | Reglas de la clínica (quién presupuesta, si se usa sillón) | D2 y D7 con tu tío |

---

## 8. Decisiones

| ID | Decisión | Recomendación |
|---|---|---|
| **D0** | ¿Quién integra? | Uno solo. Si soy yo, Codex no empuja a PR1/PR2 mientras dure la integración; si es Codex, le paso este plan |
| D1 | Versión integrada | `0.4.0` |
| D2 | Permisos de lo nuevo | Aranceles: los edita Admin, los ve Recepción. Presupuestos: los crean Recepción y Dentista (este, de sus pacientes); Admin ve todos. Semana y grilla: todos, con Dentista fijo en su profesional. Agendar y sillón: Recepción y Admin. Evoluciones: Dentista |
| D3 | Almacenamiento | Clave `v4`, empezar limpio |
| D4 | Despliegue | Un solo workflow de Pages, solo desde `main` (RELEASE en HOLD) |
| D5 | Push de la rama de integración y PR en borrador | Sí, al terminar I8 |
| D6 | Alertas de desarrollo de Tailwind 3 | Aceptar para la demo; Tailwind 4 aparte |
| D7 | Sillón como recurso obligatorio (PR2) | Mantenerlo y confirmarlo con tu tío |
| D8 | Versión «B con autenticación/usuarios» | Dime dónde está, o confirma que no entra en esta integración |
