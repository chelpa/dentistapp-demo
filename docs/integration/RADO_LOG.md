# RADO · DentistApp · Auditoría e integración

Sesión de Claude (Opus 5.5) · 2026-10-12 · Horas en -03 (Santiago) salvo que diga Z.

Convención: **CLAIM** = lo que alguien afirma, con quién lo afirma · **EVIDENCE** = lo que verifiqué, con comando o archivo · **STATE** = estado actual de los artefactos · **AUTHORITY** = quién autorizó qué, y compuertas.

Entorno de verificación: ver `evidence/toolchain.txt` (Node v22.22.0, npm 10.9.4, Chromium 141.0.7390.37, Playwright-py 1.56.0, axe-core 4.10.3, Lighthouse 12.8.2). Las compilaciones locales usan el `package-lock.json` de cada versión con `npm ci`.

---

## R-01 · Script de despliegue (10:16–10:30)

- **CLAIM** (mensaje de Codex pegado por el usuario): «DentistApp v0.3 … Todavía no está publicado online».
- **EVIDENCE:** `dentistapp-mvp/` no era un repo git. Agregué `scripts/deploy-github.sh`, `.github/workflows/deploy-pages.yml`, `basePath` en `next.config.ts`, el script `deploy:github` en `package.json` y secciones en `README.md` y `PUBLISH_DEMO.md`. Lo probé con un `gh` simulado y un remoto local, `shellcheck`, `actionlint` y una compilación servida en subruta.
- **STATE:** esos 6 cambios existen solo en la carpeta (B′). **No se usaron** para crear el repo: el repo tiene `pages.yml`, no `deploy-pages.yml`.
- **AUTHORITY:** el usuario pidió el script. Ni yo ni el script empujamos nada.

## R-02 · Auditoría del sitio publicado (16:33–16:45)

- **EVIDENCE (sitio en vivo, navegador del usuario):** título «Buenos días, equipo 👋»; clave `dentistapp-mvp-demo-v1`; `last-modified` 13:27:34Z; el chunk `page-4d492059…` contiene las marcas de A y ninguna de B; con el selector en «Dentista · demo» el contenido no cambia. `robots.txt` raíz da 404; meta `noindex, nofollow` presente; `cache-control: max-age=600`.
- **EVIDENCE (compilación local del mismo commit 259ef73):** chunk de página de 47 429 bytes frente a 47 424 en vivo, con las mismas marcas. Pruebas: `evidence/audit_live_build_259ef73.json` (axe, teclado, cruces, móvil) y `evidence/lighthouse_summary_259ef73_local.json`.
- **ERROR PROPIO:** lo describí como «se publicó la versión equivocada». **CORRECCIÓN:** GitHub Pages publica `main`, y mantener `main` sin v0.3 fue una decisión deliberada (CLAIM del usuario y del evaluador). No es un error de despliegue.

## R-03 · Identificación de versiones (19:51Z–20:00Z)

- **Comandos:** `git fetch --all`; `git ls-remote origin`; `sha256sum` de los ZIP; manifiestos por archivo (`find … | sort | xargs sha256sum`) de la carpeta, los ZIP y `dentistapp-mvp 4`.
- **EVIDENCE:**
  - `refs/heads/main` = `259ef732683745713f50deae7e786e888f8e484e`.
  - `refs/heads/feature/uncle-feedback-v02-20261012` = `refs/pull/1/head` = `aaa83077c462b4de8b7a509ee76946ce69fdc89a`; `refs/pull/1/merge` = `81b97798…`.
  - PR #1: Draft, abierto, 5 commits, base `main` (página web del PR).
  - `dentistapp-mvp-v0.3.zip` = `dentistapp-mvp.zip` = sha256 `40f16f97…f9b64`; `dentistapp-mvp-v0.2.1.zip` = `74dcca35…3f88e`.
  - Manifiestos: ZIP v0.3 `d4b3b2c636738d98`; carpeta actual `f2aae68e3727c383`; ZIP v0.2.1 = carpeta `dentistapp-mvp 4` = `c7653b5e6669cf64`.
  - La carpeta difiere del ZIP v0.3 exactamente en los 6 archivos de R-01. `package-lock.json` tiene fecha 16:22, pero su contenido es idéntico (sha `20cb944b…`).
  - `main` = ZIP v0.2.1 + `.github/workflows/pages.yml` + `basePath` + `.gitignore` + `tsconfig.tsbuildinfo`.
  - Ninguna carpeta accesible contiene `.git`.
- **CLAIM (evaluación pegada por el usuario):** «GitHub Actions del PR ✅ SUCCESS». **EVIDENCE:** la página de Actions lista 2 ejecuciones de «DentistApp demo candidate checks» en el PR, pero no muestra el resultado sin sesión. Sin la API no lo pude confirmar. Localmente, `typecheck` y `build:static` de `aaa8307` **pasan**.

## R-04 · Seguridad de dependencias

- **CLAIM** (comentarios RADO en el PR #1): 4 vulnerabilidades en `a2dc24d`; tras Next 15.5.27 quedan 2 en prod (postcss anidado ≤ 8.5.22); 9 en total; se propone `overrides.next.postcss`.
- **EVIDENCE** (`npm audit --omit=dev --json`, en `evidence/npm_audit_prod_*.json`):
  - A y B: 4 (next moderada; postcss, sharp y source-map-js altas).
  - C: 2 (next moderada vía postcss; postcss alta: GHSA-qx2v-qp2m-jg93, GHSA-6g55-p6wh-862q, GHSA-fxqj-rqcc-2cmp, GHSA-r28c-9q8g-f849).
  - Auditoría completa de C: 9 (3 moderadas, 6 altas). **Reproduce el CLAIM.**
- **EVIDENCE (prueba de viabilidad, copia temporal, no aplicada a ninguna rama):**
  - Intento 1, `overrides: { next: { postcss: "8.5.28" } }` + `npm install` con el lock existente: el postcss anidado **sigue en 8.4.31** (`npm ls` lo marca «invalid»). El override no tiene efecto mientras el lock conserve la entrada anidada.
  - Intento 2, borrando solo `node_modules/next/node_modules/postcss` del lock (−88 líneas): `npm ls` muestra 8.5.28 deduplicado. `npm audit --omit=dev` = **0**. `typecheck` OK, `build:static` OK, `npm ci` OK. **CSS idéntico byte a byte** (sha `35c0e077971d18b0…` antes y después).
  - Quedan 7 alertas de desarrollo (cadena de Tailwind 3); su corrección es Tailwind 4, una versión mayor.
- **STATE:** nada aplicado. Viabilidad demostrada.

## R-05 · Funciones realmente implementadas

- **Comando:** `python3 evidence/probe.py <ID> <url> axe.min.js <salida>` sobre compilaciones locales de A (`/dentistapp-demo/`), B (ZIP) y C (`aaa8307`). Zona horaria America/Santiago, locale es-CL.
- **EVIDENCE:** `evidence/probe_A_main_259ef73.json`, `probe_B_v03_zip.json` y `probe_C_pr_aaa8307.json`. Resumen en la §2 de `INTEGRATION_PLAN.md`.
- **Errores de la sonda y cómo se resolvieron:**
  1. En C, `get_by_label("Prestación")` coincidía con 3 elementos. Corregido con `exact=True` y vuelto a ejecutar.
  2. En B, el diálogo de restablecer usa «Conservar cambios» y la sonda buscaba «Cancelar». Se verificó aparte (diálogo propio, foco dentro, Escape no cierra) y se registró en el JSON con una nota.
- **EVIDENCE adicional:** C migra datos `v1` sin aranceles ni presupuestos (5 filas de arancel tras recargar, sin errores).

## R-06 · Organización y merge de prueba

- **Comandos:** `git clone`; `git checkout -b import/v0.3-local-zip 259ef73`; copiar el árbol del ZIP v0.3; `git commit` (134fd46, autor `chelpa <chelpa@users.noreply.github.com>`, procedencia en el mensaje). Merge de prueba: `git checkout -b trial/… && git merge --no-commit --no-ff origin/feature/uncle-feedback-v02-20261012`, luego `git merge --abort` y borrar la rama de prueba.
- **EVIDENCE:** `evidence/trial_merge.txt`. Un conflicto, `src/components/DentistApp.tsx`, con 6 bloques y 104 líneas; el resto se combina solo.
- **EVIDENCE (conflicto semántico):** con los roles de B y el `demo.ts` de C, `tsc` da `src/lib/demoRoles.ts(20,3): error TS2739` (faltan `tariffs` y `budgets`).
- **STATE:** la rama `import/v0.3-local-zip` y estos documentos existen **solo localmente** (entregados como `git bundle`). Nada empujado.

## R-07 · Incidente propio en la carpeta original

- **ERROR:** al calcular los manifiestos copié 4 archivos auxiliares (`m_zip03`, `m_dir03`, `m_zip021`, `m_dir4`) **dentro** de `dentistapp-mvp/`, que es una fuente original.
- **Acción:** pedí permiso de borrado para esa carpeta, el usuario lo concedió y borré solo esos 4 archivos (`rm -v`, salida registrada). Ningún otro archivo se tocó. Los manifiestos quedaron en `evidence/`.
- **Lección:** durante una auditoría no se escribe en carpetas de origen; los auxiliares van al espacio temporal.

## R-08 · Estado y compuertas al cierre de esta fase

- **STATE:** A, B y C sin cambios. PR #1 sin cambios. Sitio publicado = A.
- **AUTHORITY:** el usuario aceptó AUDIT, PLAN, ORGANIZE y DIRECT, y autorizó leer la carpeta del proyecto ChatGPT y borrar los 4 archivos de R-07.
- **Compuertas:** EXECUTE = PENDIENTE · MERGE = HOLD · RELEASE = HOLD · PUSH `main` = HOLD · PUSH de la rama de integración = PENDIENTE (D5). Que un build pase no autoriza publicar.
