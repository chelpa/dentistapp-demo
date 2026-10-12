# Evidencia · índice y advertencias

| Archivo | Qué contiene |
|---|---|
| `toolchain.txt` | Versiones de Node, npm, Chromium, Playwright, axe y Lighthouse |
| `manifest_*.sha256` | sha256 por archivo. `ROLES_zip` = ZIP v0.3; `ROLES_prime_folder` = carpeta `dentistapp-mvp/` actual; `v021_zip` y `folder_dentistapp-mvp-4` = base de MAIN |
| `probe.py` | Sonda genérica de comportamiento: roles, agenda, cita, cruces, aranceles, nota y odontograma, diálogo, restablecer, axe, móvil |
| `probe_pr2_extra.py` | Sonda específica de PR2: cruces con sillón en fecha futura, teclado del `<dialog>` nativo, semana y móvil |
| `probe_<ID>.json` | Resultados por versión |
| `audit.py`, `audit_live_build_259ef73.json`, `contrast.py` | Auditoría de la versión publicada (MAIN) |
| `lighthouse_summary_259ef73_local.json` | Lighthouse móvil simulado sobre MAIN, servido localmente sin compresión |
| `npm_audit_prod_<ID>.json` | `npm audit --omit=dev --json` por versión; `PR1_with_postcss_override` = prueba de viabilidad |
| `npm_ls_postcss_override.txt` | Árbol efectivo de postcss con el override |
| `pr2_npm_test.log` | Salida de `npm test` de PR2 (20/20) |
| `trial_merge.txt`, `trial_merge_pr2.txt` | Merges de prueba de PR1 y PR2 sobre ROLES (abortados) |

## Advertencias

- En `probe_PR2_562514a.json`, los campos `overlap_rule` y `modal_keyboard.focus_moves_into_dialog` **no son válidos para PR2**:
  - la prueba de cruces no completa el sillón y usa una hora ya pasada;
  - la de foco busca `[role=dialog]`, y el `<dialog>` nativo no tiene ese atributo.
  - Los valores correctos están en `probe_PR2_562514a_extra.json`.
- En `probe_ROLES_v03_zip.json`, `reset_flow` se completó con una ejecución aparte (lo explica el campo `note`).
- Lighthouse y las sondas usan servidores locales: los tiempos no representan GitHub Pages.
- Los hashes vinculan contenido; no certifican autoría ni autorización.
