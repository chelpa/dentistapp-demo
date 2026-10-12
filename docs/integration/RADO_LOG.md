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

## R-09 · Estado y compuertas

- **STATE:** MAIN, PR1, PR2 y ROLES sin cambios. Sitio publicado = MAIN.
- **AUTHORITY:** el usuario aceptó AUDIT, PLAN, ORGANIZE y DIRECT; autorizó leer la carpeta del proyecto ChatGPT y borrar los 4 archivos de R-07.
- **Compuertas:** EXECUTE = PENDIENTE · MERGE = HOLD · RELEASE = HOLD · PUSH `main` = HOLD · PUSH de la rama de integración = PENDIENTE. Que un build pase no autoriza publicar.
