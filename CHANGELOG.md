# Changelog

## 0.4.0 · 2026-10-12 · integración (rama `integration/dentistapp-v0.4`)

Integra tres líneas de trabajo con su historia:
- `main` 259ef73 (0.2.1, publicado en GitHub Pages);
- v0.3 local con vistas por rol (ZIP sha256 `40f16f971f45…a2ba2`, import `134fd46`);
- PR #2 `562514a` (agenda semanal, sillones, diálogo nativo, 20 tests; Codex), que incluye PR #1 `aaa8307` (agenda diaria, duración variable, aranceles, presupuestos, Next 15.5.27).

**Añadido**
- Vistas Recepción, Dentista y Admin aplicadas a agenda semanal/diaria, aranceles y presupuestos (permisos de interfaz, plan §5b).
- Evoluciones vinculadas a una atención del mismo paciente y profesional, validadas al guardar.
- `Budget.createdBy` para mostrar quién creó cada presupuesto.
- Pruebas: unitarias de roles, almacenamiento y evoluciones; suite e2e con Playwright y axe-core; e2e en el CI de PR.

**Cambiado**
- Almacenamiento `dentistapp-mvp-demo-v4` con normalización no destructiva y respaldo de datos ilegibles; `-v1` y `-v3` no se tocan.
- Datos iniciales con sillón asignado.
- Contraste: tokens `teal #0a7a71`, `muted #5f6f80`, `tealDark #075c56` y 22 colores de texto oscurecidos.
- Restablecer demo usa un diálogo nativo accesible; el menú móvil queda inerte al cerrarse; pestañas del paciente con semántica y flechas; `aria-current` en la navegación.
- `pages.yml` despliega solo desde `main` y corre pruebas; `uncle-feedback-ci.yml` pasa a `ci.yml`.

**Seguridad**
- PostCSS anidado de Next: `devDependencies.postcss ^8.5.23` y `overrides { "postcss": "$postcss" }` → `npm audit --omit=dev` = 0.

**Corregido**
- Semana: sin botones de bloque ocultos bajo una cita (WCAG 2.5.8); las flechas saltan bloques ocupados.
- Integración: `dataForRole` incluye aranceles y presupuestos (antes TS2739); los presupuestos se guardan sobre todos los datos, no sobre la vista filtrada.

## 0.3.0 · v0.3 local
Vistas simuladas por rol, cruces que respetan citas completadas, diálogo de restablecimiento propio.

## 0.2.1 · `main`
Demo publicada: agenda mensual y diaria, odontograma, notas y tratamientos ficticios.
