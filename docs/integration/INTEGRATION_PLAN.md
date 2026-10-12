# DentistApp · Auditoría de versiones y plan de integración

Fecha: 2026-10-12 (America/Santiago) · Preparado por Claude (Opus 5.5) · Rama local `import/v0.3-local-zip`

**Estado de autorizaciones:** EXECUTE = PENDIENTE · MERGE = HOLD · RELEASE = HOLD · PUSH `main` = HOLD · PUSH rama de integración = PENDIENTE.
Este documento cubre AUDIT, PLAN, ORGANIZE y DIRECT. No se implementó ninguna función ni se escribió en GitHub.

---

## 1. AUDIT · Identidad de cada versión

El nombre «v0.3» lo usan dos artefactos distintos. Desde aquí cada versión se nombra por su identidad y no por su etiqueta.

| ID | Qué es | Identidad verificable | `package.json` | Procedencia |
|---|---|---|---|---|
| **A** | `main` del repo, lo que hoy publica GitHub Pages | commit `259ef732683745713f50deae7e786e888f8e484e` (2026-10-12 10:26 -03) | `0.2.1` | Código = `dentistapp-mvp-v0.2.1.zip` (sha256 `74dcca35…3f88e`) = carpeta `dentistapp-mvp 4` (árbol idéntico, hash de manifiesto `c7653b5e6669cf64`). Se agregaron `pages.yml`, `basePath` en `next.config.ts`, un `.gitignore` distinto y `tsconfig.tsbuildinfo` versionado. |
| **B** | «v0.3 local» con roles | `dentistapp-mvp-v0.3.zip` sha256 `40f16f971f45ea1ddcf43671fd0c95d01892334a70e27da291985b9ea9208ba2` (bytes idénticos a `dentistapp-mvp.zip`) · hash de manifiesto `d4b3b2c636738d98` | `0.3.0` | `/Users/chelpa/.codex/.chatgpt-projects/g-p-6aa8215c87e88191acb0ff85381ddc9d/`. ZIP escrito 10:13 -03; fuentes 10:03–10:13 -03. Sin git. |
| **B′** | Carpeta de trabajo de B | `…/dentistapp-mvp/` · hash de manifiesto `f2aae68e3727c383` | `0.3.0` | = B + 6 archivos que modifiqué después para el script de despliegue (`next.config.ts`, `package.json`, `README.md`, `PUBLISH_DEMO.md`, `scripts/deploy-github.sh`, `.github/workflows/deploy-pages.yml`). No es una versión distinta del producto. |
| **C** | PR #1 `feature/uncle-feedback-v02-20261012`, titulado «DentistApp v0.3 candidate · agenda diaria, aranceles y presupuestos» | HEAD `aaa83077c462b4de8b7a509ee76946ce69fdc89a` (verificado con `git ls-remote` a las 19:51Z). Draft, abierto, base `main`, 5 commits | `0.2.1` | Parte de A. Commits `f8aa3e3`, `4da1c34`, `cdf09f3`, `a2dc24d`, `aaa8307` (Next 15.5.27). |

**Causa de la divergencia (EVIDENCE):** B ya existía (ZIP a las 10:13) cuando se creó el repo a las 10:26 con el árbol de la 0.2.1. Todo el trabajo del PR #1 partió de esa base anterior, y las dos líneas corrigieron por separado el mismo error de agenda. En las carpetas accesibles no hay ningún clon git (`.git`); no se pudo ubicar el clon desde el que se empujaron los commits.

**Corrección a mi informe anterior:** dije que «se publicó la versión equivocada». Lo correcto es que GitHub Pages publica `main` (A), y mantener `main` sin v0.3 fue una decisión deliberada. El sitio es coherente con esa política; no es un error de despliegue.

Manifiestos por archivo (sha256) en `evidence/manifest_*.sha256`.

---

## 2. AUDIT · Matriz de funciones realmente implementadas

Cada fila se probó en navegador (Chromium 141, Playwright) sobre una compilación de cada versión, además de leer el código. Resultados en `evidence/probe_*.json`.

| Función | A · main (publicada) | B · v0.3 ZIP | C · PR #1 | Objetivo de integración |
|---|---|---|---|---|
| Vistas por rol | ❌ Selector decorativo: los 3 roles muestran el mismo menú y título | ✅ Menú de 3/4/5 secciones, títulos distintos y filtro por profesional | ❌ Decorativo, igual que A | B, extendido a lo nuevo |
| «Equipo y vistas» (Admin) | ❌ | ✅ | ❌ | B |
| Agenda mensual | ✅ | ✅ | ✅ | Mantener |
| Agenda diaria (lista) | ✅ | ✅ | ✅ | Mantener |
| Agenda diaria en grilla de 15 min (08:00–20:00) | ❌ | ❌ | ✅ Con selector de profesional | C, respetando roles |
| **Agenda semanal** | ❌ | ❌ | ❌ | **Nueva** |
| Duración de cita | Fija, 45 min | Fija, 45 min | ✅ 15–240 min (10 opciones), validada en 08:00–20:00 | C |
| Cruce con una cita «Completada» | ❌ Permite doble reserva | ✅ La rechaza | ✅ La rechaza | Rechazar |
| Ficha y odontograma | ✅ | ✅ Edición solo para Dentista | ✅ | B |
| Evoluciones (notas) | Autor fijo «Profesional demo» | Autor = profesional seleccionado | Autor fijo «Profesional demo» | B + **vincular a la atención** (P0 del tío) |
| Tratamientos (estado) | ✅ | ✅ Según rol | ✅ | B |
| Aranceles editables (CLP) | ❌ | ❌ | ✅ 5 aranceles | C, según rol |
| Presupuestos | ❌ | ❌ | ✅ Líneas, cantidad, pieza, descuento, total. Probado: $130.000 | C, según rol |
| Restablecer demo | `confirm()` nativo | Diálogo propio (el foco entra; Escape no cierra) | `confirm()` nativo | Diálogo propio y accesible |
| Diálogo «Nueva cita» con teclado | ❌ El foco no entra y Escape no cierra | ❌ Igual | ❌ Igual | Foco dentro, Tab atrapado, Escape, devolver foco |
| Contraste WCAG (nodos con falla en Inicio) | 52 | 49 | 48 | 0 |
| Móvil 375 px, vistas probadas | Sin scroll horizontal | Sin scroll horizontal | Sin scroll horizontal (también Aranceles) | Sin scroll en todas, incluida la semanal |
| Error de guardado en localStorage | Sin manejo | ✅ `try/catch` y aviso | Sin manejo | B |
| Clave de almacenamiento | `…-v1` | `…-v3` (empieza limpio) | `…-v1` + migración de aranceles y presupuestos (probada) | Nueva `…-v4` (decisión D3) |
| Next.js / auditoría prod | 15.5.26 · 4 vulnerabilidades (1 moderada, 3 altas) | 15.5.26 · 4 (igual) | 15.5.27 · 2 (postcss anidado 8.4.31) | 0 (prueba de viabilidad en §5) |
| Subruta de GitHub Pages (`basePath`) | ✅ | ❌ En el ZIP (✅ en B′ por mis cambios) | ✅ | ✅ |
| CI del PR (typecheck + build) | — | — | ✅ `uncle-feedback-ci.yml` | Mantener |

---

## 3. ORGANIZE · Ramas preparadas (solo locales; nada se empujó)

```
main 259ef73 (A)
 └─ import/v0.3-local-zip 134fd46   «import: v0.3 local (roles) snapshot, verbatim from ZIP»  (B sobre A, con procedencia en el mensaje)
     └─ (propuesta) integration/dentistapp-v0.4  ← merge de origin/feature/uncle-feedback-v02-20261012 (C, aaa8307)
```

- El import de B es literal: no se cambió ningún byte respecto del ZIP. Por eso `next.config.ts` pierde el `basePath` de `main`. Queda registrado y se resuelve en I2.
- El PR #1 se fusionaría con merge (no cherry-pick), así sus 5 commits, autoría y hashes quedan en la historia. `git merge-base --is-ancestor aaa8307 HEAD` debe dar verdadero.
- A, B y C quedan intactos: `main` y el PR no se tocan, el ZIP y la carpeta original no se modifican.
- Entrego un `git bundle` con la rama de import y estos documentos, por si quieres revisarla en tu clon sin que yo empuje nada.

---

## 4. DIRECT · Conflictos de integración

**Merge de prueba** (C sobre B; se abortó y no quedó ningún commit), en `evidence/trial_merge.txt`:

- Se combinan sin conflicto: `src/lib/demo.ts` (tipos y semillas de aranceles y presupuestos), `package.json` (Next 15.5.27 junto a la versión 0.3.0), `package-lock.json`, `UNCLE_FEEDBACK_2026-10-12.md` y `uncle-feedback-ci.yml`.
- **Un archivo en conflicto:** `src/components/DentistApp.tsx`, con 6 bloques y 104 líneas.

| # | Bloque | Lado B | Lado C | Resolución propuesta |
|---|---|---|---|---|
| 1 | `type Page` | `"team"` | `"finance"` | Ambos |
| 2 | Menú | Equipo y vistas | Aranceles y presupuestos | Ambos, filtrados por rol |
| 3 | `openPatient` / `openModal` / `schedule` | Protección por rol y `FormData` | Duración y validación 08:00–20:00 | Lógica de B + `name="duration"` en el formulario + validación de C |
| 4 | Render de páginas | `viewData` filtrado por rol | Página Finance con `data` completo | Finance recibe `viewData` y rol |
| 5 | Diálogo de cita | Cambios de B | Campo de duración | Ambos |
| 6 | Agenda «Día» y Tratamientos | Tratamientos con rol | Grilla `DailySlots` con `data` | Grilla con `viewData`; Dentista fijo en su profesional |

**Conflictos semánticos que git no detecta.** El 1 lo comprobé compilando; los demás, leyendo el código:

1. `dataForRole()` (B) devuelve un `DemoState` sin `tariffs` ni `budgets`. Con el tipo de C, que los exige, **el typecheck falla**: `src/lib/demoRoles.ts(20,3): error TS2739` (probado con los roles de B y el `demo.ts` de C).
2. `schedule()` de B lee el formulario con `FormData`; el estado `form.duration` de C no llegaría si el campo no tiene `name`.
3. `DailySlots` y `Finance` de C leen `data` completo. Sin ajuste, un Dentista vería la agenda y los presupuestos de otros profesionales.
4. Clave de almacenamiento: B usa `v3` y C migra sobre `v1`. Hay que elegir una sola (D3).
5. Despliegue: `main` y C usan `pages.yml`; B′ tiene `deploy-pages.yml`. Hay que dejar uno (D4).

---

## 5. PLAN · Propuesta de integración (se ejecuta solo si apruebas)

Rama `integration/dentistapp-v0.4`, creada desde `import/v0.3-local-zip`. Un commit por paso, cada uno con su verificación.

| Paso | Contenido | Verificación del paso |
|---|---|---|
| I1 | Merge de C (aaa8307). Resolver los 6 bloques y los conflictos semánticos 1–3. Aranceles, presupuestos, grilla y duración, conscientes del rol | typecheck + build + sonda de la §2 |
| I2 | Recuperar `basePath` de `main`. Un solo workflow de Pages (acciones actuales, con typecheck) más el CI del PR | Build con `/dentistapp-demo` servido en subruta, 0 respuestas 4xx |
| I3 | Seguridad: Next 15.5.27 (de C) + `overrides: { next: { postcss: "8.5.28" } }`, regenerando solo esa entrada del lock | Viabilidad ya probada sobre C: `npm audit --omit=dev` = 0, CSS idéntico byte a byte (sha `35c0e077…`), `npm ci` OK |
| I4 | Clave `dentistapp-mvp-demo-v4` y normalización defensiva de datos guardados | Recargar y restablecer |
| I5 | **Agenda semanal** (lunes a domingo, por profesional, bloques según duración) | Prueba e2e y móvil |
| I6 | **Evolución vinculada a una atención:** campo opcional «Atención» con las citas del paciente; autor = profesional | Prueba e2e |
| I7 | Accesibilidad: tokens `teal #0e8f86 → #0a7a71` (5,2:1) y `muted #718193 → #5f6f80` (5,16:1), números de piezas; foco y Escape en los dos diálogos con devolución del foco; `aria-current` en el menú; pestañas con semántica; foco visible y texto completo en el selector de rol en móvil | axe = 0 en todas las vistas + prueba de teclado |
| I8 | Suite e2e (la sonda convertida en prueba) y axe en el CI del PR | CI verde |
| I9 | Versión `0.4.0`, README, AUDIT_NOTE y CHANGELOG con procedencia A/B/C | Revisión |

Después de I9 me detengo: abro un PR en borrador `integration → main` (si autorizas el push) y espero tu revisión. **El PR #1 no se fusiona por separado**; queda como fuente y se cierra cuando lo decidas, marcado como incorporado.

**Fuera de alcance:** migrar a Tailwind 4 (requerido para cerrar 7 alertas de herramientas de desarrollo), backend, autenticación real, firma de evoluciones y concurrencia.

---

## 6. DIRECT · Criterios de aceptación

| ID | Criterio | Cómo se verifica |
|---|---|---|
| AC1 | Procedencia: la historia contiene el import de B (sha del ZIP en el mensaje) y los 5 commits de C | `git log`; `git merge-base --is-ancestor aaa8307 HEAD` |
| AC2 | `npm ci`, `typecheck` y `build:static` pasan con `DENTISTAPP_BASE_PATH=/dentistapp-demo`; servido en subruta sin respuestas 4xx | Script + servidor local |
| AC3 | `npm audit --omit=dev` = 0; postcss efectivo ≥ 8.5.23; CSS igual al build sin override | `npm audit`, `npm ls postcss`, sha del CSS |
| AC4 | Roles: Recepción sin ficha clínica; Dentista ve solo sus pacientes, grilla y presupuestos; Admin ve Equipo y Aranceles; aviso «simulación, no es autenticación» visible en las 3 vistas | e2e por rol |
| AC5 | Agenda Mes/Semana/Día; grilla de 15 min 08:00–20:00; el alto del bloque es proporcional a la duración (30/60/120) | e2e (pruebas 1 y 4 del tío) |
| AC6 | Duración 15–240 en pasos de 15; rechaza citas que terminan después de 20:00 | e2e |
| AC7 | Rechaza cruces con el mismo profesional, también con una cita Completada; permite el mismo horario con otro profesional | e2e (pruebas 2 y 3 del tío) |
| AC8 | Presupuesto con 2 prestaciones, cantidad y descuento da un total exacto; al cambiar el arancel, el presupuesto guardado conserva su precio | e2e (prueba 5 del tío) |
| AC9 | Evolución vinculada a una cita del paciente, con autor = profesional, visible en la ficha | e2e |
| AC10 | Los datos persisten al recargar; restablecer, con diálogo propio, recupera los datos iniciales | e2e (prueba 6 del tío) |
| AC11 | axe (wcag2a/aa, 2.1aa, 2.2aa) = 0 en todas las vistas, escritorio y móvil; diálogos: el foco entra, Tab queda atrapado, Escape cierra y el foco vuelve | axe + prueba de teclado |
| AC12 | 375 px: sin scroll horizontal en ninguna vista (incluidas Semana y Aranceles); selector de rol legible; objetivos táctiles ≥ 24 px | Sonda móvil (prueba 7 del tío) |
| AC13 | 0 errores de consola o de página en todos los recorridos | Sonda |
| AC14 | Ningún push a `main`, merge ni despliegue sin tu autorización explícita | Registro RADO |

---

## 7. DIRECT · Riesgos

| ID | Riesgo | Mitigación |
|---|---|---|
| R1 | `DentistApp.tsx` es un archivo de unos 45 KB con líneas muy largas; resolver los conflictos a mano es propenso a errores | Sonda antes y después de cada paso; dividir el archivo después, en un PR aparte |
| R2 | Conflictos semánticos invisibles para git (§4) | Typecheck + e2e por rol en I1 |
| R3 | El override de postcss sale de la versión que fija Next (8.4.31) | Solo se usa al compilar; CSS idéntico verificado; repetir la prueba en cada actualización de Next |
| R4 | Siguen 7 alertas en dependencias de desarrollo (cadena de Tailwind 3) | Se compila en CI con entrada confiable; Tailwind 4 como trabajo aparte |
| R5 | Si alguien agrega commits al PR #1 durante la integración, las ramas vuelven a divergir | Congelar el PR #1 o reintegrar su HEAD nuevo antes del cierre |
| R6 | El repo es público: una rama empujada expone el código y la nota del feedback; los commits muestran tu Gmail | Commits nuevos con `chelpa@users.noreply.github.com` (ya usado en la rama local) |
| R7 | La vista semanal es código nuevo, sin versión previa | Criterios AC5 y AC12 específicos |
| R8 | Los roles se filtran solo en el navegador: no son seguridad | Aviso visible; documentado en README |
| R9 | Cambiar la clave de almacenamiento reinicia los datos demo de quienes ya entraron | Aceptable para una demo; se avisa en el changelog |
| R10 | Las reglas de quién crea presupuestos dependen de la clínica | Decisión D2 (idealmente, preguntarle a tu tío) |

---

## 8. Decisiones que necesito antes de ejecutar

| ID | Decisión | Mi recomendación |
|---|---|---|
| D1 | Nombre de la versión integrada | `0.4.0`, para no reutilizar «v0.3» |
| D2 | Permisos por rol para lo nuevo | Aranceles: los edita Admin, los ve Recepción. Presupuestos: los crean Recepción y Dentista (este solo para sus pacientes); Admin ve todos. Duración: quien agenda (Recepción y Admin). Grilla y semana: todos; Dentista fijo en su profesional. Evoluciones: solo Dentista |
| D3 | Datos guardados | Clave nueva `v4` y empezar limpio |
| D4 | Workflow de despliegue | Un solo workflow de Pages actualizado; solo despliega desde `main` (RELEASE sigue en HOLD) |
| D5 | Push de la rama de integración (no `main`) y PR en borrador `integration → main` | Sí, al terminar I9 |
| D6 | Alertas de desarrollo de Tailwind 3 | Aceptarlas para la demo y planificar Tailwind 4 aparte |
