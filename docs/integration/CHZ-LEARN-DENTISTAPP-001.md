# CHZ-LEARN-DENTISTAPP-001 · Lecciones reutilizables para CHAZEWARE

Origen: auditoría e integración de DentistApp, 2026-10-12. Evidencia: `RADO_LOG.md` y `evidence/` en esta misma carpeta.
Cada lección dice qué pasó, por qué importa y el control concreto que CHAZEWARE puede automatizar.

---

## L1 · Un nombre no es una identidad

**Qué pasó.** Dos artefactos se llamaban «v0.3»: el ZIP local con roles (`package.json` 0.3.0) y el PR #1, titulado «v0.3 candidate» (`package.json` 0.2.1, sin roles funcionales). Un evaluador y un auditor razonaron sobre «la v0.3» refiriéndose a cosas distintas.

**Control.** Toda versión se referencia con una identidad: commit SHA o, si no hay git, el hash de un manifiesto (sha256 por archivo, ordenado, y luego sha256 del manifiesto). El rótulo humano («v0.3») es un alias que apunta a una identidad y no puede apuntar a dos.

## L2 · Divergencia desde el origen del repositorio

**Qué pasó.** El repo se creó a las 10:26 con el árbol de la 0.2.1 (idéntico al ZIP v0.2.1 y a la carpeta `dentistapp-mvp 4`), cuando el ZIP v0.3 existía desde las 10:13. Todo lo que se construyó después en GitHub (PR #1 y PR #2) partió de una base anterior. Las dos líneas corrigieron por separado el mismo error de agenda: un síntoma típico de trabajo duplicado.

**Control (BASELINE COMPARISON).** Antes de crear un repo, una rama o un PR, comparar el árbol base con el último artefacto conocido del proyecto (por fecha y por versión). Si existe un artefacto más nuevo sin registrar en el repo, bloquear y pedir decisión.

## L3 · Copias de carpetas sin control de versiones

**Qué pasó.** Había `dentistapp-mvp`, `dentistapp-mvp 2`, `3` y `4`, más 6 ZIP, ninguno con git. Para reconstruir el linaje hubo que comparar hashes de archivos y fechas.

**Control (SOURCE IDENTITY).** Todo entregable lleva su identidad: un ZIP incluye un `MANIFEST.sha256` y el commit del que salió. Una carpeta de trabajo sin `.git` genera una alerta.

## L4 · «Publicado» no es lo mismo que «última versión»

**Qué pasó.** La demo publicada mostraba la 0.2.1 y el auditor (yo) lo calificó de «versión equivocada». En realidad era la política vigente: `main` se mantenía congelado mientras se probaba v0.3.

**Control.** Antes de calificar un estado de despliegue como error, leer la política declarada (AUTHORITY): qué rama publica, qué está en HOLD y quién decide. El hallazgo correcto era «v0.3 no está en `main`, coherente con HOLD», no «error de despliegue».

## L5 · Incidente PostCSS: el override que no se aplicaba

**Qué pasó.** `npm audit --omit=dev` reportaba postcss anidado 8.4.31 bajo Next 15.5.x (GHSA-qx2v-qp2m-jg93, GHSA-6g55-p6wh-862q, GHSA-fxqj-rqcc-2cmp, GHSA-r28c-9q8g-f849).
- Subir Next a 15.5.27 no lo resolvía, porque Next fija esa versión de postcss.
- `npm audit fix --force` proponía saltos mayores (Next 16, Tailwind 4).
- Un `overrides` en `package.json` **no tuvo efecto** mientras el lock conservaba la entrada anidada: `npm ls` la marcaba «invalid» y seguía en 8.4.31.
- Funcionó al borrar solo esa entrada del lock: 0 vulnerabilidades en producción y CSS idéntico byte a byte.

**Controles.**
1. Verificar el árbol instalado (`npm ls <paquete>`), no solo lo declarado en `package.json`.
2. No aceptar `--force` sin revisar qué versiones mayores introduce.
3. Toda remediación de dependencias se acompaña de una prueba de no regresión del artefacto, como el hash del CSS o JS compilado o una prueba visual.
4. Separar el riesgo de producción del de herramientas de desarrollo; en un sitio estático, postcss solo se usa al compilar.

## L6 · Errores de agenda

**Qué pasó.**
1. La regla de cruces excluía las citas «Completada», lo que permitía una doble reserva. Se corrigió por separado en dos ramas.
2. La duración era fija (45 min), pero la clínica real usa duraciones variables (feedback del dentista).
3. La hora máxima de inicio era 19:00, sin validar el fin (19:45).
4. Todos los chequeos son locales, en el navegador, y no resisten concurrencia.

**Controles.**
- Probar intervalos completos (inicio y fin) contra todas las citas del profesional, sin excepciones por estado salvo regla explícita.
- Incluir los casos «mismo profesional y estado Completada» y «otro profesional, misma hora» en la suite.
- En producción, una restricción de exclusión en la base de datos; la validación de interfaz no sustituye a la de datos.

## L7 · Las pruebas automáticas de accesibilidad no ven el teclado

**Qué pasó.**
- axe detectó entre 48 y 52 elementos con contraste insuficiente en Inicio, según la versión. La mayoría venía de **dos tokens de color** (`teal`, `muted`); el resto, de grises escritos a mano. Se corrigen en pocos puntos, no elemento por elemento.
- axe y Lighthouse (accesibilidad 95) **no** detectaron que el diálogo «Nueva cita» no recibe el foco, no atrapa Tab y no se cierra con Escape. Eso salió solo con una prueba de teclado escrita a mano.

**Controles.**
- Medir contraste a nivel de tokens de diseño.
- Agregar a cada suite pruebas de teclado: el foco entra al abrir, Tab queda dentro, Escape cierra y el foco vuelve al disparador.
- Un puntaje alto de Lighthouse no equivale a «accesible».

## L8 · Un build exitoso no prueba el comportamiento

**Qué pasó.** Los PR #1 y #2 compilaban y pasaban el chequeo de tipos (el #2, además, 20/20 tests), pero su selector de roles era decorativo. Solo una sonda de comportamiento (cambiar el rol y comparar menú y títulos) lo mostró.

**Control (EVIDENCE ≠ CLAIM).** Cada candidato pasa por una sonda de comportamiento con aserciones sobre las funciones que declara. «Build PASS» cuenta como evidencia de compilación, no de funcionalidad, y no autoriza publicar.

## L9 · El auditor también contamina

**Qué pasó.** Al calcular manifiestos escribí 4 archivos auxiliares dentro de la carpeta de origen. Los borré con permiso y lo dejé registrado.

**Control.** Las carpetas de origen se montan o se tratan como solo lectura durante la auditoría, y los auxiliares van a un espacio temporal. Todo cambio en el origen se registra.

## L10 · Agentes en paralelo y nombres que chocan

**Qué pasó.** Mientras esta auditoría comparaba versiones, otro agente (Codex) empujó el PR #2 (agenda semanal), apilado sobre el PR #1. El `ls-remote` de las 19:51Z no lo mostraba; el fetch de las ~20:05Z sí. Además, cada agente usaba sus propias letras: el PR #2 llama «A» a la línea del repo y la auditoría paralela usa «B» para una versión con autenticación y «C» para la de roles; esta auditoría había usado A/B/C con otro sentido.

**Controles.**
- Registrar la identidad remota al empezar y **revalidarla justo antes de cada decisión** (paso I0 del plan).
- Un solo integrador designado por etapa; los demás agentes congelan sus ramas o publican bajo otro prefijo.
- Nombres de versión derivados del contenido (`ROLES@40f16f97`, `PR2@562514a`), nunca letras sueltas compartidas entre agentes.
- Un agente que encuentra trabajo nuevo de otro no lo descarta ni lo sobrescribe: lo identifica, reproduce su evidencia y lo incorpora a la comparación.

---

## Propuesta de control CHAZEWARE

`SOURCE IDENTITY → BASELINE COMPARISON → DIVERGENCE DETECTION → INTEGRATION GATE → VERIFIED PROMOTION`

| Etapa | Entrada | Verificación automatizable | Pasa si |
|---|---|---|---|
| SOURCE IDENTITY | Cada candidato (rama, ZIP, carpeta) | SHA del commit o hash del manifiesto; versión de `package.json`; hash del lock; versión efectiva de las dependencias críticas (`npm ls`) | Cada alias apunta a exactamente una identidad |
| BASELINE COMPARISON | Identidades + historial | Ancestro común (`git merge-base`) o diferencia de manifiestos; fechas de creación | El candidato contiene al último artefacto aceptado, o la diferencia está explicada |
| DIVERGENCE DETECTION | Pares de candidatos | Merge de prueba (`--no-commit`, abortar): archivos y bloques en conflicto; typecheck del merge (conflictos semánticos); sonda de comportamiento en cada candidato | Las divergencias quedan listadas en una matriz de funciones |
| INTEGRATION GATE | Plan + criterios de aceptación | Aprobación humana explícita (AUTHORITY) registrada | Hay aprobación; MERGE y RELEASE siguen en HOLD |
| VERIFIED PROMOTION | Rama integrada | Build + e2e por rol + axe = 0 + prueba de teclado + `npm audit` + hash del artefacto | Todos los criterios pasan y hay una autorización de publicación aparte |

**Caso de prueba de referencia:** este incidente. Con los insumos de 2026-10-12, el control debería:
- marcar que el alias «v0.3» apunta a dos identidades (`40f16f97…` y `aaa83077…`);
- detectar que el repo nació de `c7653b5e…` (0.2.1) cuando ya existía `d4b3b2c6…` (0.3.0);
- detectar un candidato nuevo (`562514a…`) que apareció entre la auditoría y la decisión;
- reportar, para ROLES + PR2, 1 archivo con 8 bloques en conflicto más un error de tipos semántico (TS2739);
- dejar abierta la versión «B con autenticación», que se menciona pero no tiene identidad localizada.
