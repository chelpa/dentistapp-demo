# RADO · DentistApp · Auditoría e integración

Sesión de Claude (Opus 5.5) en la nube, 2026-10-12. Horas en -03 (Santiago) salvo que diga Z.
IDs según `INTEGRATION_PLAN.md` §1: MAIN, ROLES, ROLES′, PR1 y PR2.

Convención: **CLAIM** = lo que alguien afirma, con quién lo afirma · **EVIDENCE** = lo que verifiqué, con comando o archivo · **STATE** = estado actual · **AUTHORITY** = quién autorizó qué, y compuertas.

Herramientas: `evidence/toolchain.txt` (Node v22.22.0, npm 10.9.4, Chromium 141.0.7390.37, Playwright-py 1.56.0, axe-core 4.10.3, Lighthouse 12.8.2). Cada versión se instala con `npm ci` y su propio lockfile.

---

## R-01 · Script de despliegue (10:16–10:30)

- **CLAIM** (mensaje de Codex pegado por el usuario): «DentistApp v0.3 … Todavía no está publicado online».
- **EVIDENCE:** `dentistapp-mvp/` no tenía git. Agregué `scripts/deploy-github.sh`, `.github/workflows/deploy-pages.yml`, `basePath`, el script npm y secciones de documentación. Lo probé con un `gh` simulado y un remoto local, más shellcheck, actionlint y una compilación en subruta.
- **STATE:** esos 6 cambios existen solo en ROLES′. No se usaron para crear el repo, que usa `pages.yml`.
- **AUTHORITY:** el usuario pidió el script. No empujé nada.

## R-02 · Auditoría del sitio publicado (16:33–16:45)

- **EVIDENCE (sitio en vivo):** título «Buenos días, equipo 👋»; clave `dentistapp-mvp-demo-v1`; `last-modified` 13:27:34Z; el chunk `page-4d492059…` contiene las marcas de MAIN; el selector de rol no cambia nada; `/robots.txt` da 404; `noindex` presente; `max-age=600`.
- **EVIDENCE (compilación local de 259ef73):** chunk de 47 429 bytes frente a 47 424 en vivo, con las mismas marcas. `evidence/audit_live_build_259ef73.json` y `evidence/lighthouse_summary_259ef73_local.json`.
- **ERROR PROPIO, corregido:** lo llamé «versión equivocada». MAIN se publica por decisión deliberada (`main` congelado).

## R-03 · Identidades (19:51Z–20:00Z)

- **Comandos:** `git fetch --all`, `git ls-remote origin`, `sha256sum` de los ZIP, manifiestos por archivo (`find | sort | xargs sha256sum`).
- **EVIDENCE:**
  - MAIN `259ef73…`.
  - PR1 `aaa83077…` (`refs/pull/1/head`; merge `81b97798…`).
  - ZIP v0.3 = `dentistapp-mvp.zip` = `40f16f97…`; ZIP v0.2.1 = `74dcca35…`.
  - Manifiestos: ROLES `d4b3b2c636738d98`; ROLES′ `f2aae68e3727c383`; ZIP v0.2.1 = `dentistapp-mvp 4` = `c7653b5e6669cf64`.
  - ROLES′ difiere de ROLES exactamente en los 6 archivos de R-01. El lockfile tiene fecha 16:22, pero su contenido es idéntico.
  - Ninguna carpeta accesible tiene `.git`.
- **CLAIM** (evaluación pegada por el usuario): «GitHub Actions del PR ✅ SUCCESS».
  - **EVIDENCE:** sin sesión, la página de Actions no muestra el resultado.
  - **CLAIM** (`docs/calendar-001/AUDIT-PLAN.md`): la ejecución 38299044837 terminó en success. No lo verifiqué.
  - Localmente, `typecheck` y `build:static` de PR1 pasan.

## R-04 · Seguridad de dependencias

- **CLAIM** (comentarios RADO del PR #1): 4 vulnerabilidades en `a2dc24d`; 2 en prod tras Next 15.5.27; 9 en total; se propone un override.
- **EVIDENCE** (`npm audit --omit=dev --json`, `evidence/npm_audit_prod_*.json`):
  - MAIN y ROLES: 4.
  - PR1: 2 (postcss anidado 8.4.31: GHSA-qx2v-qp2m-jg93, -6g55-p6wh-862q, -fxqj-rqcc-2cmp, -r28c-9q8g-f849).
  - Auditoría completa de PR1: 9. **Reproduce el CLAIM.**
  - PR2: 2 en prod.
- **EVIDENCE (viabilidad del override, en copia temporal):**
  - Intento 1: `overrides.next.postcss = 8.5.28` con el lock intacto. El paquete sigue en 8.4.31 («invalid» en `npm ls`).
  - Intento 2: además se borra solo `node_modules/next/node_modules/postcss` del lock (−88 líneas). Resultado: 8.5.28 deduplicado, audit prod = **0**, typecheck/build/`npm ci` OK y **CSS idéntico byte a byte** (`35c0e077971d18b0…`).
  - Quedan 7 alertas de desarrollo (Tailwind 3).
- **STATE:** nada aplicado.

## R-05 · Sondas de comportamiento

- **Comando:** `python3 evidence/probe.py <ID> <url> axe.min.js <salida>` sobre MAIN, ROLES y PR1. Para PR2, además `evidence/probe_pr2_extra.py` (citas en fecha futura y sillón).
- **EVIDENCE:** `evidence/probe_*.json`. Matriz en `INTEGRATION_PLAN.md` §2.
- **Defectos de la sonda, corregidos o anotados:**
  1. En PR1, el selector «Prestación» era ambiguo; se corrigió con `exact=True`.
  2. En ROLES, el botón de cancelar del diálogo se llama «Conservar cambios»; se verificó aparte y se anotó.
  3. **Falso negativo:** la sonda genérica busca `[role=dialog]`, pero el `<dialog>` nativo de PR2 no tiene ese atributo y dio «el foco no entra». La sonda específica (`dialog,[role=dialog]`) muestra que el foco sí entra, Tab queda atrapado, Escape cierra y el foco vuelve a «Nueva cita». Para MAIN, ROLES y PR1 el resultado es válido (usan `div[role=dialog]`).
  4. La prueba genérica de cruces no sirve en PR2: exige sillón y rechaza horas pasadas. Se reemplazó por la sonda específica.
- **EVIDENCE adicional:** PR1 migra datos `v1` sin aranceles (5 filas tras recargar, sin errores).

## R-06 · Organización y merges de prueba

- **Comandos:** `git checkout -b import/v0.3-local-zip 259ef73`, copiar el árbol del ZIP y hacer commit (134fd46, autor `chelpa@users.noreply.github.com`). Para cada candidato: `git merge --no-commit --no-ff <ref>`, luego `--abort` y borrar la rama de prueba.
- **EVIDENCE:**
  - PR1 sobre ROLES: 1 archivo, 6 bloques, 104 líneas (`evidence/trial_merge.txt`).
  - PR2 sobre ROLES: 1 archivo, 8 bloques, 156 líneas (`evidence/trial_merge_pr2.txt`).
  - Con los tipos de PR1 o de PR2, `tsc` falla: `demoRoles.ts(20,3) TS2739`.
- **STATE:** ramas solo locales, entregadas en un `git bundle`.

## R-07 · Incidente propio

- **ERROR:** copié 4 manifiestos auxiliares dentro de `dentistapp-mvp/` (fuente original).
- **Acción:** pedí permiso de borrado, el usuario lo concedió y borré solo esos 4 archivos (`rm -v`). Ningún otro archivo se tocó.

## R-08 · Aparición del PR #2 durante la auditoría

- **EVIDENCE:**
  - `git ls-remote` a las 19:51Z: sin PR #2.
  - Fetch a las ~20:05Z: rama `feature/weekly-calendar-chz-001-20261012` = `refs/pull/2/head` = `562514aa…`. Commits 860a511 (16:56) y 562514a (17:01). Draft, base PR1.
- **CLAIM** (PR #2): 20 tests, 16 verificaciones de navegador, revisión independiente de Codex (`REVIEW_PASS_LIMITED`); G3 dependencias HOLD, G5 comparación B/C HOLD, G6 publicación HOLD; «Claude Code no ejecutado».
- **EVIDENCE (reproducido):**
  - `npm ci` exit 0; `npm test` 20/20 con TZ -03 y con UTC; `typecheck` 0; `build:static` (`/dentistapp-demo`) OK; audit prod 2.
  - `git diff --check` limpio en código; solo marca espacios en logs de evidencia, que guardan bytes crudos a propósito.
  - Navegador:
    - Mismo profesional en otro sillón: rechaza. Otro profesional en el mismo sillón: rechaza. Recursos distintos: acepta. Contigua 10:45: acepta. Mismo profesional sobre una Completada: rechaza.
    - Diálogo accesible con teclado; vista Semana por defecto; 375 px sin scroll horizontal.
    - Selector de rol decorativo; contraste: 48 nodos con falla.
- **Nota de nomenclatura:** el PR #2 llama «A» a la línea del repo y la auditoría paralela habla de «B con autenticación/usuarios» y «C con vistas de roles». Para no chocar, en estos documentos no uso letras.
- **Riesgo materializado:** dos agentes trabajan a la vez sobre el mismo repo (R0 / D0).

## R-09 · Revisión independiente de Codex (recibida 17:26)

- **CLAIM** (Codex, «REVISION-PLAN-INTEGRACION-DENTISTAPP.md»):
  - Bundle sha256 `2a39cb5f…da8c11ae`, verificación PASS, historial completo. *(Corregido en R-16: antes decía `2a39cb5f…c26ac0`, un error mío al abreviar. Es el valor que reporta Codex; no lo recalculé.)*
  - 24/24 archivos del import `134fd46` coinciden byte a byte con el ZIP `40f16f97…`.
  - HEAD de preparación `01f32f2`; los adjuntos coinciden con el bundle.
  - PR1 y PR2 sin cambios y congelados por Codex.
  - «B» localizada: `/Users/chelpa/Proyectos/dental-portal`, rama `v2`, `fe594d947869e0d99691662a04a0109bb4c2fcff`, Auth.js + Prisma + Next 16, sin remoto.
  - Dictamen: «plan viable con ajustes; no concede autoridad humana».
- **EVIDENCE propia:** no revisé AUTH-PORTAL (sin acceso a esa carpeta); queda como CLAIM. Revalidé las refs remotas: sin cambios (PR1 `aaa8307`, PR2 `562514a`).
- **Acción:** los 7 ajustes quedaron en el plan v2 (`INTEGRATION_PLAN.md` §9) y las lecciones se ajustaron en CHZ-LEARN-001.

## R-10 · Camino estándar para el override de PostCSS

- **Motivo:** la revisión pidió no convertir la edición manual del lock en receta.
- **EVIDENCE** (`evidence/postcss_standard_path.txt`, copia temporal de PR2):
  - `npm install` solo: 8.4.31 «invalid», `npm ls` exit 1. **Reproduce el ELSPROBLEMS histórico**; el registro anterior sigue siendo válido.
  - `--package-lock-only`: no corrige.
  - Override `"$postcss"`: no corrige.
  - `npm install` + `npm dedupe`, o `npm install` + `npm update postcss` (mismo lock): 8.5.28, `npm ls` exit 0, audit prod 0. Además sube el postcss de raíz a 8.5.29 y cambia metadatos de plataforma según la versión de npm.
- **STATE:** técnica candidata. G3 de la candidata integrada no está cerrado: se repite sobre ella (plan §5c).

## R-11 · Decisión del usuario (17:3x)

- **AUTHORITY** (respuesta del usuario en la conversación): Claude es el único integrador; se ejecuta el plan v2 en `integration/dentistapp-v0.4`; se sube solo esa rama con un PR en borrador; matriz §5b aprobada tal cual; presupuestos del Dentista = los de sus pacientes; sillón obligatorio. MERGE y RELEASE siguen en HOLD.

## R-12 · Ejecución I0–I8

- **I0** 20:40:24Z `git ls-remote`: refs sin cambios.
- **I1** `5ef915a`: `git merge --no-ff --no-commit 562514a`; `DentistApp.tsx` reescrito a partir de PR2 con la lógica de roles de ROLES.
  - Conflictos semánticos resueltos: TS2739; pantallas con `viewData` y cruces con `data`; semana/día fijos al profesional del Dentista; sin bloques de reserva para quien no agenda.
  - **Hallazgo nuevo:** `Finance` de PR1 guardaba con `onChange({...viewData,...})`. En la vista Dentista eso habría reemplazado todos los datos por la vista filtrada. Ahora usa callbacks del padre (`addBudget`, `updateTariff`) sobre todos los datos.
  - **EVIDENCE:** tsc 0; `npm test` 20/20; build; prueba de roles en navegador conforme a §5b.
- **I2** `5880af1`: subruta servida sin 4xx; actionlint OK.
  - **ERROR PROPIO corregido:** había escrito que `main` versionaba `tsconfig.tsbuildinfo`. `git ls-tree -r 259ef73` muestra que no: era un archivo de mi compilación local. Corregido en el plan; el mensaje del commit `134fd46` conserva la frase errónea (historia sin reescribir).
- **I3** `903de95`: evidencia completa en `evidence/I3_postcss_candidate.txt`.
  - Entre la prueba de las 17:2x y esta, el registro npm publicó postcss 8.5.30: el resultado depende de la fecha y queda registrado.
  - La comparación de JS exige compilar en la misma ruta, porque los hash de chunks dependen de la ruta absoluta.
- **I4** `09f73fd`, **I5** `946917e`: pruebas unitarias 28 → 31; verificación en navegador del aviso v4 (v1 intacta) y del vínculo de evoluciones.
- **I6** `ba0a6f5`: línea base guardada antes de corregir (`evidence/e2e_before_I6.*`).
- **I7** `b8fd67c`, `8f0a4b1`: e2e 11/11, unitarias 34/34; Playwright 1.56.0 y axe-core 4.10.3 fijados.
  - Defecto propio en la suite, corregido: la prueba de almacenamiento recargaba antes de leer el aviso v4.
- **I8:** versión 0.4.0 y documentación; verificación final en clon limpio (R-13).

## R-13 · Estado y compuertas

- **STATE:** MAIN, PR1, PR2 y ROLES sin cambios. Sitio publicado = MAIN. `integration/dentistapp-v0.4` contiene la 0.4.0 integrada (I1–I8).
- **AUTHORITY:**
  - El usuario aceptó AUDIT, PLAN, ORGANIZE y DIRECT; autorizó leer la carpeta del proyecto ChatGPT y borrar los 4 archivos de R-07.
  - Integrador: el usuario **decidió** que Claude sea el único integrador y autorizó ejecutar el plan v2, subir la rama de integración y abrir un PR en borrador (R-11). Esa decisión cubre lo ejecutado aquí; no hace falta otra autorización.
  - *Corrección (R-16): este punto decía «Codex recomienda a Claude como integrador… falta la decisión del usuario». Era texto de antes de R-11 que quedó sin actualizar y contradecía R-11.*
- **Compuertas:** EXECUTE = HECHO · PUSH de la rama de integración + PR borrador = AUTORIZADO · MERGE = HOLD · RELEASE = HOLD · PUSH `main` = HOLD. Que un build pase no autoriza publicar.

## R-14 · Push no realizado (21:3xZ)

- **AUTHORITY:** el usuario autorizó subir `integration/dentistapp-v0.4` y abrir un PR en borrador.
- **EVIDENCE:** `git push origin integration/dentistapp-v0.4` → `403`: «Claude doesn't have GitHub access to chelpa/dentistapp-demo for your organization». Ninguna ref remota cambió: `main` 259ef73, PR1 aaa8307, PR2 562514a; no existe rama `integration/*` en el remoto.
- **Acción:** entrego un bundle verificado, el texto del PR y un script para que el usuario (o Codex) suba la rama y abra el PR en borrador. Alternativa: instalar la GitHub App de Claude para el repo y pedirme el push.
- **Compuertas:** MERGE = HOLD · RELEASE = HOLD · PUSH `main` = HOLD (sin cambios).

## R-15 · PR #3 y revisión de Codex (recibida 19:39)

- **CLAIM** (usuario, en la conversación): subió la candidata exacta de Claude y abrió el PR #3 en borrador, conservando su historial.
- **EVIDENCE:** `git ls-remote origin` (23:0xZ): `integration/dentistapp-v0.4` = `refs/pull/3/head` = `db7d518`. Sin cambios: `main` 259ef73, PR1 aaa8307, PR2 562514a.
- **CLAIM** (Codex, informe para Opus y comentarios en el PR #3): «requiere reparación».
  - P2: un paciente guardado con campos incompletos puede dejar la aplicación en error.
  - P2: una evolución puede vincularse a una cita futura del mismo día.
  - Pasan 34 tests, tipos, compilación, CI y auditoría de producción. La suite e2e local en macOS da 10/11: falla el selector de rol con teclado.
  - RADO: R-13 contradice a R-11 sobre la autorización; la abreviatura del bundle en R-09 está mal.
  - No se pide exigir el estado «Completada» para vincular.
- **EVIDENCE (reproducción propia antes de reparar):** compilé `db7d518` y le pasé las pruebas nuevas.
  - Paciente `{ id: "p1" }` guardado: la página muestra «Application error: a client-side exception…», con `RangeError: Invalid time value` (llega a `formatDate` sin `lastVisit`).
  - Reloj a las 09:00 y cita a1 a las 19:45: el selector ofrece «12 oct 2026 · 19:45 · Control».
  - Las 3 pruebas e2e nuevas (P2 mismo día, P2 paciente incompleto, pantalla de recuperación) **fallan** sobre `db7d518`.
- **Diagnóstico del teclado:** en Chromium para macOS, las flechas sobre un `<select>` cerrado abren el menú nativo en vez de cambiar el valor; en Linux y Windows cambian el valor. No tengo macOS: **queda como diagnóstico**, sin verificar en ese sistema.

## R-16 · Reparación (`1840bfd`, `5685207`, `10e8e84`)

- **`1840bfd` fix(clinical):** `hasStarted(cita, ahora)` compara fecha **y hora de inicio** en hora local; las fechas u horas ilegibles nunca cuentan como iniciadas. La misma regla sirve para las opciones y para la validación al guardar, con un reloj inyectable. `DentistApp` pasa el instante actual al momento de usarla, no el día fijado al cargar. Estados: igual que antes (no cancelada); no se exige «Completada».
- **`5685207` fix(storage):**
  - `normalizeState` valida, por colección, cada campo que leen las pantallas: ids, fechas, horas, números, estados y líneas de presupuesto.
  - Un registro inválido se aparta junto con lo que depende de un paciente apartado. Se cuenta, se informa al visitante y `loadState` guarda antes una copia byte a byte.
  - Las citas legibles pero fuera de las reglas de agenda se conservan y se informan, como antes.
  - Último recurso, `src/app/error.tsx`: pantalla de recuperación con «Guardar copia y restablecer demo» (copia la clave v4 a una clave de respaldo y borra solo la v4) y «Reintentar». Las claves `-v1` y `-v3` no se tocan.
- **`10e8e84` test(e2e):** la prueba sigue usando el teclado real sobre el control: Tab, foco visible y luego escritura anticipada «d» → Dentista y «a» → Admin, que cambia un `<select>` cerrado en todas las plataformas. ArrowUp se comprueba solo fuera de macOS. Entre letras se espera 1,1 s, porque Chromium junta en una sola búsqueda las letras escritas en menos de 1 s.
- **Consecuencia visible:** los datos iniciales solo tienen citas desde hoy, así que antes de las 09:00 no hay atención vinculable. La de las 09:00 de Sofía Martínez aparece a partir de esa hora. README actualizado.
- **EVIDENCE** (Linux, Node v22.22.0, Chromium de Playwright 1.56.0, TZ America/Santiago en el navegador):
  - Unitarias: 34 → 40, 40/40 pass. Commits intermedios: `1840bfd` 36/36 y `5685207` 40/40, con tsc 0 en ambos.
  - e2e: 11 → 14, **14/14** sobre `10e8e84`. axe sigue en 0 en 40 vistas, sin desbordes de 320 a 1440 px y sin errores de consola fuera de la prueba de error forzado, que filtra los suyos.
  - Las 3 pruebas nuevas fallan sobre `db7d518` y pasan sobre la reparación.
  - La e2e usa ahora un reloj fijo (lunes 2026-10-12 12:00 -03), así que ya no depende de la hora en que se corre.
  - Verificación en clon limpio: ver R-17.
- **STATE:** reparación en `integration/dentistapp-v0.4` local. El remoto sigue en `db7d518` hasta que se suba. Teclado en macOS: pendiente de confirmación por Codex.
- **AUTHORITY:** el usuario (19:39) pidió: «Opus repara esos casos y entrega un SHA nuevo para revisar». Queda dentro de lo autorizado en R-11 (rama de integración + PR en borrador); no pido otra autorización.
- **Compuertas:** MERGE = HOLD · RELEASE = HOLD · PUSH `main` = HOLD (sin cambios).

## R-17 · Verificación en clon limpio de `10e8e84` (23:05Z)

- **Comandos:** `git clone` del repo local, `git checkout 10e8e84`, `npm ci`, `npm ls`, `npm audit --omit=dev`, `npm test`, `npm run typecheck`, `npm run build:static` con `DENTISTAPP_BASE_PATH=/dentistapp-demo` y `npm run test:e2e`.
- **EVIDENCE** (`evidence/final_verify_10e8e84.txt`, `evidence/e2e_after_review_fix.{json,log}`):
  - Node v22.22.0, npm 10.9.4, Playwright 1.56.0.
  - `npm ci` OK. `npm ls` sale con 0 y postcss queda en 8.5.30 «overridden», deduplicado. Audit de producción: 0.
  - Unitarias 40/40, typecheck 0, exportación estática OK.
  - e2e 14/14: axe con 0 violaciones en 40 vistas, sin desbordes y sin errores.
- **Límite:** todo corrió en Linux. El caso de macOS (selector con teclado) queda para la revisión de Codex.
- **STATE:** el commit de documentación que sigue a `10e8e84` solo toca `docs/`, `README.md`, `CHANGELOG.md` y `AUDIT_NOTE.md`. El SHA final a revisar se informa en la conversación, porque un commit no puede contener su propio SHA.
