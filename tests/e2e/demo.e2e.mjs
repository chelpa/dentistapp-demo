// End-to-end checks for the static export (plan v2: AC4–AC12).
// Run after `npm run build:static` with DENTISTAPP_BASE_PATH=/dentistapp-demo:
//   npm run test:e2e            (E2E_REPORT=path.json writes the axe/overflow findings)
// Browser: Playwright's Chromium (CI: `npx playwright install --with-deps chromium`).
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import { readFile, stat, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { extname, join, normalize } from "node:path";
import { chromium } from "playwright";

const require = createRequire(import.meta.url);
const BASE = (process.env.E2E_BASE_PATH ?? "/dentistapp-demo").replace(/\/+$/, "");
const OUT = process.env.E2E_OUT ?? "out";
const AXE = await readFile(require.resolve("axe-core/axe.min.js"), "utf8");
const AXE_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];
const TYPES = { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".css": "text/css", ".svg": "image/svg+xml", ".txt": "text/plain", ".json": "application/json" };
const report = { axe: {}, overflow: {}, errors: [] };
let server, browser, ROOT;

function serve() {
  return new Promise(resolve => {
    const s = http.createServer(async (req, res) => {
      const path = decodeURIComponent(new URL(req.url, "http://local").pathname);
      if (!path.startsWith(BASE) || path.includes("..")) { res.writeHead(404); return res.end(); }
      let file = normalize(join(OUT, path.slice(BASE.length) || "/"));
      try { if ((await stat(file)).isDirectory()) file = join(file, "index.html"); } catch { if (!extname(file)) file += ".html"; }
      try { const body = await readFile(file); res.writeHead(200, { "content-type": TYPES[extname(file)] ?? "application/octet-stream" }); res.end(body); }
      catch { res.writeHead(404, { "content-type": "text/html" }); res.end(await readFile(join(OUT, "404.html")).catch(() => "not found")); }
    });
    s.listen(0, "127.0.0.1", () => resolve(s));
  });
}

before(async () => { server = await serve(); ROOT = `http://127.0.0.1:${server.address().port}${BASE}/`; browser = await chromium.launch(); });
after(async () => {
  await browser?.close(); server?.close();
  if (process.env.E2E_REPORT) await writeFile(process.env.E2E_REPORT, JSON.stringify(report, null, 1));
});

// ── helpers ──────────────────────────────────────────────────────────────
// Fixed, deterministic clock (a Monday at 12:00 in Santiago); time keeps flowing from there.
const CLOCK = new Date("2026-10-12T12:00:00-03:00");
async function open({ width = 1280, height = 900, init, clock = CLOCK } = {}) {
  const context = await browser.newContext({ viewport: { width, height }, locale: "es-CL", timezoneId: "America/Santiago", ...(width < 768 ? { isMobile: true, hasTouch: true } : {}) });
  await context.clock.install({ time: clock });
  if (init) await context.addInitScript(init);
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", e => errors.push(`pageerror: ${e}`));
  page.on("console", m => { if (m.type() === "error") errors.push(`console: ${m.text()}`); });
  await page.goto(ROOT, { waitUntil: "networkidle" });
  return { context, page, errors, close: async () => { report.errors.push(...errors); await context.close(); } };
}
const navOf = page => page.getByRole("navigation", { name: "Navegación principal" });
async function openMenuIfNeeded(page) {
  const opener = page.getByRole("button", { name: "Abrir menú" });
  if (await opener.isVisible()) { await opener.click(); await page.waitForTimeout(250); }
}
async function go(page, label) {
  await openMenuIfNeeded(page);
  await navOf(page).getByRole("button", { name: new RegExp(`^${label}`) }).click();
  await page.waitForTimeout(300);
}
async function setRole(page, value) { await page.getByLabel("Rol de demostración").selectOption(value); await page.waitForTimeout(250); }
const navLabels = async page => (await navOf(page).getByRole("button").allInnerTexts()).map(t => t.split("\n")[0].trim());
const futureDate = async (page, days = 7) => page.evaluate(n => { const d = new Date(); d.setDate(d.getDate() + n); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; }, days);
async function openPatient(page, name, tab) {
  await go(page, "Pacientes");
  await page.locator("main").getByRole("button", { name: new RegExp(name) }).first().click();
  if (tab) {
    // Tabs are role="tab" since I6; fall back to plain buttons so the pre-I6 baseline can be measured.
    const asTab = page.getByRole("tab", { name: tab, exact: true });
    await ((await asTab.count()) ? asTab : page.locator("main").getByRole("button", { name: tab, exact: true })).click();
  }
  await page.waitForTimeout(200);
}
async function book(page, { patient = "Mateo González", date, time, dentist, chair, duration = 45 }) {
  await page.locator("main").getByRole("button", { name: /^(Nueva cita|Agendar cita)$/ }).first().click();
  const dialog = page.getByRole("dialog", { name: "Nueva cita" });
  await dialog.getByLabel("Paciente").selectOption({ label: patient });
  await dialog.getByLabel("Fecha").fill(date);
  await dialog.getByLabel("Hora").fill(time);
  await dialog.getByLabel("Profesional").selectOption({ label: dentist });
  await dialog.getByLabel("Sillón").selectOption({ label: chair });
  await dialog.getByLabel("Duración de la atención").selectOption(String(duration));
  await dialog.getByRole("button", { name: /Crear cita/ }).click();
  await page.waitForTimeout(300);
  if (await dialog.count()) {
    const message = await dialog.locator("[role=alert]").innerText().catch(() => "");
    await dialog.getByRole("button", { name: "Cancelar" }).click();
    return { ok: false, message };
  }
  return { ok: true };
}
async function axe(page, name) {
  await page.addScriptTag({ content: AXE });
  const violations = await page.evaluate(async tags => (await window.axe.run(document, { runOnly: tags })).violations
    .map(v => ({ id: v.id, impact: v.impact, nodes: v.nodes.length, sample: v.nodes.slice(0, 3).map(n => n.target.join(" ")) })), AXE_TAGS);
  report.axe[name] = violations;
  return violations;
}
const overflow = page => page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);

// ── AC4 · presentation permissions (plan §5b) ───────────────────────────────
test("roles: each view matches the approved permission matrix", async () => {
  const { page, errors, close } = await open();
  const banner = () => page.locator("main").getByText(/No es autenticación/);
  // Reception
  assert.deepEqual(await navLabels(page), ["Inicio", "Agenda", "Pacientes", "Aranceles y presupuestos"]);
  assert.equal(await banner().count(), 1);
  await go(page, "Aranceles");
  assert.equal(await page.getByLabel(/^Precio de/).count(), 0, "reception cannot edit tariffs");
  assert.equal(await page.getByRole("button", { name: "Guardar presupuesto ficticio" }).count(), 1, "reception creates budgets");
  await openPatient(page, "Sofía Martínez");
  assert.deepEqual(await page.getByRole("tab").allInnerTexts(), ["Resumen"], "reception has no clinical tabs");
  // Dentist
  await setRole(page, "dentist");
  assert.deepEqual(await navLabels(page), ["Inicio", "Agenda", "Pacientes", "Tratamientos", "Aranceles y presupuestos"]);
  assert.equal(await banner().count(), 1);
  await go(page, "Agenda");
  assert.equal(await page.locator("[data-calendar-slot]").count(), 0, "dentist cannot book from the week");
  assert.equal(await page.locator("main").getByRole("button", { name: "Nueva cita" }).count(), 0);
  const labels = await page.locator(".calendar-booking").evaluateAll(els => els.map(e => e.getAttribute("aria-label")));
  assert.ok(labels.length > 0 && labels.every(l => l.includes("Dra. Valentina Rojas")), "dentist sees only own agenda");
  await go(page, "Pacientes");
  assert.deepEqual((await page.locator("main .divide-y > button strong").allInnerTexts()), ["Sofía Martínez", "Isidora Pérez"]);
  await go(page, "Aranceles");
  assert.deepEqual(await page.getByLabel("Paciente ficticio").locator("option").allInnerTexts(), ["Sofía Martínez", "Isidora Pérez"]);
  assert.equal(await page.getByLabel(/^Precio de/).count(), 0);
  await openPatient(page, "Isidora Pérez", "Ficha clínica");
  assert.equal(await page.getByRole("button", { name: "Guardar nota demo" }).count(), 1);
  // Admin
  await setRole(page, "admin");
  assert.deepEqual(await navLabels(page), ["Inicio", "Agenda", "Pacientes", "Tratamientos", "Aranceles y presupuestos", "Equipo y vistas"]);
  assert.equal(await banner().count(), 1);
  await go(page, "Aranceles");
  assert.equal(await page.getByLabel(/^Precio de/).count(), 5, "admin edits tariffs");
  assert.equal(await page.getByRole("button", { name: "Guardar presupuesto ficticio" }).count(), 0, "admin does not create budgets");
  await openPatient(page, "Isidora Pérez", "Ficha clínica");
  assert.equal(await page.getByRole("button", { name: "Guardar nota demo" }).count(), 0, "admin reads clinical data only");
  await page.getByRole("button", { name: /^Pieza 16,/ }).click();
  assert.equal(await page.getByRole("button", { name: "Tratado", exact: true }).count(), 0, "no tooth editing for admin");
  await go(page, "Tratamientos");
  assert.equal(await page.locator("main select").count(), 0, "admin treatments are read-only");
  assert.deepEqual(errors, []);
  await close();
});

// ── AC5–AC6 · agenda and booking rules (uncle tests 1–4, PR #2 A08–A10) ─────
test("booking: chair and professional conflicts, adjacency, durations", async () => {
  const { page, errors, close } = await open();
  const date = await futureDate(page);
  const rojas = "Dra. Valentina Rojas", fuentes = "Dr. Tomás Fuentes";
  assert.deepEqual(await book(page, { date, time: "09:00", dentist: rojas, chair: "Sillón 1", duration: 30 }), { ok: true });
  let r = await book(page, { date, time: "09:15", dentist: rojas, chair: "Sillón 2" });
  assert.match(r.message, /el profesional ya tiene/);
  r = await book(page, { date, time: "09:15", dentist: fuentes, chair: "Sillón 1" });
  assert.match(r.message, /el sillón ya tiene/);
  assert.deepEqual(await book(page, { date, time: "09:15", dentist: fuentes, chair: "Sillón 2", duration: 60 }), { ok: true }, "other professional and chair");
  assert.deepEqual(await book(page, { date, time: "09:30", dentist: rojas, chair: "Sillón 1", duration: 120 }), { ok: true }, "adjacent after 09:00–09:30");
  r = await book(page, { date, time: "19:45", dentist: rojas, chair: "Sillón 3", duration: 30 });
  assert.match(r.message, /08:00–20:00/);
  // Completed appointments keep their slot
  await page.getByRole("button", { name: "Día", exact: true }).click();
  await page.getByLabel("Fecha de agenda").fill(date);
  await page.getByLabel("Estado de cita de Mateo González").first().selectOption("Completada");
  r = await book(page, { date, time: "09:00", dentist: rojas, chair: "Sillón 3" });
  assert.match(r.message, /el profesional ya tiene/);
  // Block height is proportional to duration (Day grid, 15-minute rows)
  await page.getByRole("button", { name: "Día", exact: true }).click();
  await page.getByLabel("Fecha de agenda").fill(date);
  const heights = await page.locator("button[title*='minutos']").evaluateAll(els => Object.fromEntries(els.map(e => [e.title.split(" · ")[1], e.getBoundingClientRect().height + 2])));
  assert.equal(heights["120 minutos"] / heights["30 minutos"], 4);
  // Week view lists the four bookings of that day for the clinic
  await page.getByRole("button", { name: "Semana", exact: true }).click();
  assert.ok(await page.locator(".calendar-booking").count() >= 3);
  assert.deepEqual(errors, []);
  await close();
});

// ── AC7 · tariffs and budgets (uncle test 5) ────────────────────────────────
test("budgets: exact totals, history kept when a tariff changes, no data loss across roles", async () => {
  const { page, errors, close } = await open();
  await go(page, "Aranceles");
  await page.getByLabel("Prestación", { exact: true }).selectOption({ index: 0 });
  await page.locator("main").getByRole("button", { name: "Agregar", exact: true }).click();
  await page.getByLabel("Prestación", { exact: true }).selectOption({ index: 2 });
  await page.locator("main").getByRole("button", { name: "Agregar", exact: true }).click();
  await page.getByLabel("Cantidad prestación 2").fill("2");
  await page.locator("#discount").fill("5000");
  assert.match(await page.locator("main").innerText(), /Total: \$130\.000/);
  await page.getByRole("button", { name: "Guardar presupuesto ficticio" }).click();
  await setRole(page, "dentist");
  await go(page, "Aranceles");
  await page.getByLabel("Prestación", { exact: true }).selectOption({ index: 1 });
  await page.locator("main").getByRole("button", { name: "Agregar", exact: true }).click();
  await page.getByRole("button", { name: "Guardar presupuesto ficticio" }).click();
  await setRole(page, "admin");
  await go(page, "Aranceles");
  await page.getByLabel("Precio de Restauración simple").fill("60000");
  const saved = await page.getByText(/Creado por/).allInnerTexts();
  assert.equal(saved.length, 2, "admin sees both budgets (none lost by the dentist view)");
  assert.match(await page.locator("main").innerText(), /\$130\.000/, "saved budget keeps its historical price");
  assert.deepEqual(errors, []);
  await close();
});

// ── AC8 · evolutions linked to an attended appointment ─────────────────────
test("evolutions: linked to own attended appointment; tampered links rejected", async () => {
  const { page, errors, close } = await open();
  await setRole(page, "dentist");
  await openPatient(page, "Sofía Martínez", "Ficha clínica");
  assert.deepEqual(await page.getByLabel("Atención").locator("option").allInnerTexts(), ["Sin atención vinculada", await page.getByLabel("Atención").locator("option").nth(1).innerText()]);
  await page.getByLabel("Observación ficticia").fill("Evolución vinculada de prueba");
  await page.getByRole("button", { name: "Guardar nota demo" }).click();
  assert.match(await page.locator("main").innerText(), /Dra\. Valentina Rojas · Atención .* 09:00 · Control/);
  const attempt = async (value, expected) => {
    await page.evaluate(v => { const s = document.getElementById("note-appointment"); const o = document.createElement("option"); o.value = v; s.appendChild(o); s.value = v; s.dispatchEvent(new Event("change", { bubbles: true })); }, value);
    await page.getByLabel("Observación ficticia").fill(`Intento ${value}`);
    await page.getByRole("button", { name: "Guardar nota demo" }).click();
    assert.match(await page.locator("main [role=alert]").innerText(), expected);
    assert.equal(await page.locator("main .border-l-2").filter({ hasText: `Intento ${value}` }).count(), 0);
  };
  await attempt("a2", /otro paciente/);          // Mateo, Dr. Fuentes
  await attempt("no-existe", /no existe/);
  // Same patient, other professional: create one as reception, then try to link it
  await setRole(page, "reception");
  const date = await page.evaluate(() => new Date().toISOString().slice(0, 10));
  await page.evaluate(d => { const k = "dentistapp-mvp-demo-v4"; const s = JSON.parse(localStorage.getItem(k)); s.appointments.push({ id: "x-other", patientId: "p1", date: d, time: "08:00", duration: 15, dentist: "Dr. Tomás Fuentes", chair: "Sillón 3", type: "Control", status: "Completada" }); localStorage.setItem(k, JSON.stringify(s)); }, date);
  await page.reload({ waitUntil: "networkidle" });
  await setRole(page, "dentist");
  await openPatient(page, "Sofía Martínez", "Ficha clínica");
  await attempt("x-other", /otro profesional/);
  assert.deepEqual(errors, []);
  await close();
});

test("REVIEW P2: an appointment later the same day cannot be linked before it starts", async () => {
  // Codex reproduction: clock at 09:00, own confirmed appointment at 19:45 (15 min).
  const { page, errors, close } = await open({ clock: new Date("2026-10-12T09:00:00-03:00") });
  await page.evaluate(() => { const k = "dentistapp-mvp-demo-v4"; const s = JSON.parse(localStorage.getItem(k)); Object.assign(s.appointments.find(a => a.id === "a1"), { time: "19:45", duration: 15, status: "Confirmada" }); localStorage.setItem(k, JSON.stringify(s)); });
  await page.reload({ waitUntil: "networkidle" });
  await setRole(page, "dentist");
  await openPatient(page, "Sofía Martínez", "Ficha clínica");
  assert.deepEqual(await page.getByLabel("Atención").locator("option").allInnerTexts(), ["Sin atención vinculada"], "not offered at 09:00");
  await page.evaluate(() => { const s = document.getElementById("note-appointment"); const o = document.createElement("option"); o.value = "a1"; s.appendChild(o); s.value = "a1"; s.dispatchEvent(new Event("change", { bubbles: true })); });
  await page.getByLabel("Observación ficticia").fill("Nota sobre cita futura");
  await page.getByRole("button", { name: "Guardar nota demo" }).click();
  assert.match(await page.locator("main [role=alert]").innerText(), /todavía no ocurre/);
  assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem("dentistapp-mvp-demo-v4")).notes.some(n => n.appointmentId === "a1")), false, "not stored");
  // From its start instant it can be linked.
  await page.clock.setSystemTime(new Date("2026-10-12T19:45:00-03:00"));
  await go(page, "Inicio");
  await openPatient(page, "Sofía Martínez", "Ficha clínica");
  assert.match((await page.getByLabel("Atención").locator("option").allInnerTexts()).join(" | "), /19:45 · Control/);
  assert.deepEqual(errors, []);
  await close();
});

// ── AC9 · persistence, reset and earlier data ──────────────────────────────
test("storage: v4 notice, earlier keys untouched, reload and reset in the three roles", async () => {
  const legacy = JSON.stringify({ patients: [{ id: "old" }] });
  const { page, errors, close } = await open({ init: `if (!sessionStorage.getItem("e2e")) { localStorage.setItem("dentistapp-mvp-demo-v1", ${JSON.stringify(legacy)}); sessionStorage.setItem("e2e", "1"); }` });
  assert.match(await page.locator("[role=status]").innerText(), /versiones anteriores siguen guardados/);
  for (const [role, change, check] of [
    ["reception", async () => { await go(page, "Aranceles"); await page.getByLabel("Prestación", { exact: true }).selectOption({ index: 0 }); await page.locator("main").getByRole("button", { name: "Agregar", exact: true }).click(); await page.getByRole("button", { name: "Guardar presupuesto ficticio" }).click(); },
      async () => { await go(page, "Aranceles"); return page.getByText(/Creado por Recepción/).count(); }],
    ["dentist", async () => { await openPatient(page, "Isidora Pérez", "Ficha clínica"); await page.getByLabel("Observación ficticia").fill("Persistencia dentista"); await page.getByRole("button", { name: "Guardar nota demo" }).click(); },
      async () => { await openPatient(page, "Isidora Pérez", "Ficha clínica"); return page.getByText("Persistencia dentista").count(); }],
    ["admin", async () => { await go(page, "Aranceles"); await page.getByLabel("Precio de Profilaxis").fill("33000"); },
      async () => { await go(page, "Aranceles"); return (await page.getByLabel("Precio de Profilaxis").inputValue()) === "33000" ? 1 : 0; }],
  ]) {
    await setRole(page, role);
    await change();
    await page.reload({ waitUntil: "networkidle" });
    await setRole(page, role);
    assert.equal(await check(), 1, `${role}: change persisted after reload`);
    // Reset: Escape keeps the data, the explicit button restores the seed
    await openMenuIfNeeded(page);
    await page.getByRole("button", { name: "Restablecer demo" }).click();
    await page.keyboard.press("Escape");
    assert.equal(await page.getByRole("dialog").count(), 0);
    assert.equal(await check(), 1, `${role}: Escape keeps the data`);
    await openMenuIfNeeded(page);
    await page.getByRole("button", { name: "Restablecer demo" }).click();
    await page.getByRole("dialog").getByRole("button", { name: "Restablecer datos ficticios" }).click();
    await setRole(page, role);
    assert.equal(await check(), 0, `${role}: reset restores the seed`);
  }
  assert.equal(await page.evaluate(() => localStorage.getItem("dentistapp-mvp-demo-v1")), legacy, "earlier key never modified");
  assert.deepEqual(errors, []);
  await close();
});

// ── Review P2: incomplete saved data never breaks the demo ─────────────────
test("REVIEW P2: an incomplete saved patient is set aside, backed up and the demo stays usable", async () => {
  const { page, errors, close } = await open();
  const original = await page.evaluate(() => { const k = "dentistapp-mvp-demo-v4"; const s = JSON.parse(localStorage.getItem(k)); s.patients[0] = { id: "p1" }; const raw = JSON.stringify(s); localStorage.setItem(k, raw); return raw; });
  await page.reload({ waitUntil: "networkidle" });
  const notice = await page.locator("[role=status]").innerText();
  assert.match(notice, /1 pacientes guardados están incompletos/);
  const backupKey = notice.match(/«([^»]+)»/)[1];
  assert.equal(await page.evaluate(k => localStorage.getItem(k), backupKey), original, "original bytes kept");
  await go(page, "Pacientes");
  const names = await page.locator("main .divide-y > button strong").allInnerTexts();
  assert.equal(names.length, 5);
  assert.ok(!names.includes("Sofía Martínez"));
  await go(page, "Agenda");
  await page.getByRole("button", { name: "Mes", exact: true }).click();
  assert.deepEqual(errors, [], "no runtime error");
  await close();
});

test("REVIEW P2: if rendering still fails, the error screen keeps a copy and restores the demo", async () => {
  // Defence in depth: make every date formatting call fail during one page load (React retries
  // a failed render once, so a single throw would be absorbed); the next load is normal.
  const { page, errors, context } = await open({ init: `if (sessionStorage.getItem("fail") === "1") { sessionStorage.setItem("fail", "0"); Intl.DateTimeFormat = function () { throw new RangeError("forced render failure"); }; }` });
  await page.waitForFunction(() => localStorage.getItem("dentistapp-mvp-demo-v4") !== null);
  const original = await page.evaluate(() => { sessionStorage.setItem("fail", "1"); return localStorage.getItem("dentistapp-mvp-demo-v4"); });
  await page.reload({ waitUntil: "networkidle" });
  await page.getByRole("alert").filter({ hasText: "no pudo mostrar" }).waitFor();
  await page.getByRole("button", { name: "Guardar copia y restablecer demo" }).click();
  await page.getByLabel("Rol de demostración").waitFor();
  const backups = await page.evaluate(() => Object.keys(localStorage).filter(k => k.startsWith("dentistapp-mvp-demo-v4-respaldo-")).map(k => localStorage.getItem(k)));
  assert.deepEqual(backups, [original], "one byte-for-byte copy of the saved data");
  assert.equal(await page.locator("main h1").first().innerText(), "Todo listo para recibir pacientes");
  // Errors here are the intentional ones; they are not added to the global report.
  assert.ok(errors.length > 0 && errors.every(e => /forced render failure|Minified React error|The above error/.test(e)), errors.join("\n"));
  await context.close();
});

// ── AC10 · keyboard (plan §5d) ──────────────────────────────────────────────
test("keyboard: role selector, menu, tabs and every dialog", async () => {
  const { page, errors, close } = await open();
  // Role selector: reachable with Tab, visible focus, operable from the keyboard.
  const focusSelector = async () => { for (let i = 0; i < 30 && !(await page.evaluate(() => document.activeElement?.getAttribute("aria-label") === "Rol de demostración")); i++) await page.keyboard.press("Tab"); };
  await focusSelector();
  const ring = await page.evaluate(() => { const s = getComputedStyle(document.activeElement); return { outline: s.outlineStyle !== "none" && !s.outlineColor.endsWith(", 0)") && s.outlineColor !== "transparent" && parseFloat(s.outlineWidth) > 0, shadow: s.boxShadow !== "none" }; });
  assert.ok(ring.outline || ring.shadow, "role selector shows focus");
  const value = () => page.getByLabel("Rol de demostración").inputValue();
  // Type-ahead (first letter of the option) changes a closed <select> on every platform.
  await page.keyboard.press("d");
  assert.equal(await value(), "dentist", "type-ahead D -> Dentista");
  // Chromium joins letters typed within 1 s into one search ("da" matches nothing).
  await page.waitForTimeout(1100);
  await focusSelector();
  await page.keyboard.press("a");
  assert.equal(await value(), "admin", "type-ahead A -> Admin");
  // Arrow keys change the value in place on Linux/Windows; on macOS Chromium they open the
  // native menu instead (platform behaviour of <select>, seen in the Codex review run).
  if (process.platform !== "darwin") {
    await focusSelector();
    await page.keyboard.press("ArrowUp");
    assert.equal(await value(), "dentist", "ArrowUp -> Dentista");
  }
  await setRole(page, "reception");
  // Desktop navigation marks the current section
  await go(page, "Agenda");
  assert.deepEqual(await navOf(page).locator("[aria-current=page]").allInnerTexts().then(t => t.map(x => x.split("\n")[0])), ["Agenda"]);
  // Tabs of the patient profile (dentist has three)
  await setRole(page, "dentist");
  await openPatient(page, "Sofía Martínez");
  await page.getByRole("tab", { name: "Resumen" }).focus();
  await page.keyboard.press("ArrowRight");
  assert.equal(await page.getByRole("tab", { name: "Ficha clínica" }).getAttribute("aria-selected"), "true");
  assert.equal(await page.evaluate(() => document.activeElement?.textContent), "Ficha clínica");
  await page.keyboard.press("End");
  assert.equal(await page.getByRole("tab", { name: "Tratamientos" }).getAttribute("aria-selected"), "true");
  await page.keyboard.press("Home");
  assert.equal(await page.getByRole("tab", { name: "Resumen" }).getAttribute("aria-selected"), "true");
  assert.equal(await page.getByRole("tabpanel").count(), 1);
  // Dialogs: focus enters, Tab stays inside, Escape closes, focus returns
  const dialogCycle = async (opener, name) => {
    await opener.focus();
    await page.keyboard.press("Enter");
    await page.waitForTimeout(200);
    assert.ok(await page.evaluate(n => document.activeElement?.closest("dialog,[role=dialog]")?.getAttribute("aria-label") === n, name), `${name}: focus inside`);
    for (let i = 0; i < 25; i++) await page.keyboard.press("Tab");
    assert.ok(await page.evaluate(() => !!document.activeElement?.closest("dialog,[role=dialog]")), `${name}: Tab trapped`);
    await page.keyboard.press("Escape");
    await page.waitForTimeout(200);
    assert.equal(await page.getByRole("dialog", { name }).count(), 0, `${name}: Escape closes`);
    assert.ok(await opener.evaluate(el => el === document.activeElement), `${name}: focus returns`);
  };
  await setRole(page, "reception");
  await dialogCycle(page.locator("main").getByRole("button", { name: "Nueva cita" }).first(), "Nueva cita");
  await dialogCycle(page.getByRole("button", { name: "Restablecer demo" }), "Restablecer datos ficticios");
  await go(page, "Agenda");
  await dialogCycle(page.locator(".calendar-booking").first(), "Detalle de cita");
  // Week slot with Enter opens a prefilled booking (PR #2 A07)
  const slot = page.locator("[data-calendar-slot]").filter({ hasNot: page.locator("xx") }).nth(40);
  const target = await slot.getAttribute("data-calendar-slot");
  await slot.focus(); await page.keyboard.press("Enter");
  const dialog = page.getByRole("dialog", { name: "Nueva cita" });
  const [d, m] = target.split("/");
  assert.equal(await dialog.getByLabel("Fecha").inputValue(), d);
  assert.equal(await dialog.getByLabel("Hora").inputValue(), `${String(Math.floor(+m / 60)).padStart(2, "0")}:${String(+m % 60).padStart(2, "0")}`);
  await page.keyboard.press("Escape");
  assert.deepEqual(errors, []);
  await close();
});

test("keyboard: mobile menu opens, traps nothing hidden, closes with Escape and returns focus", async () => {
  const { page, errors, close } = await open({ width: 375, height: 812 });
  assert.equal(await page.locator("aside").evaluate(el => el.inert), true, "closed off-canvas menu is not focusable");
  const opener = page.getByRole("button", { name: "Abrir menú" });
  await opener.focus(); await page.keyboard.press("Enter"); await page.waitForTimeout(250);
  assert.ok(await page.evaluate(() => !!document.activeElement?.closest("aside")), "focus moves into the menu");
  await page.keyboard.press("Escape"); await page.waitForTimeout(250);
  assert.equal(await page.locator("aside").evaluate(el => el.inert), true);
  assert.ok(await opener.evaluate(el => el === document.activeElement), "focus returns to the menu button");
  assert.deepEqual(errors, []);
  await close();
});

// ── AC10 · automated accessibility (axe) on every view, desktop and mobile ──
const VIEWS = [
  ["reception", "inicio", async () => {}],
  ["reception", "agenda-semana", p => go(p, "Agenda")],
  ["reception", "agenda-mes", async p => { await go(p, "Agenda"); await p.getByRole("button", { name: "Mes", exact: true }).click(); }],
  ["reception", "agenda-dia", async p => { await go(p, "Agenda"); await p.getByRole("button", { name: "Día", exact: true }).click(); }],
  ["reception", "pacientes", p => go(p, "Pacientes")],
  ["reception", "perfil", p => openPatient(p, "Sofía Martínez")],
  ["reception", "aranceles", p => go(p, "Aranceles")],
  ["reception", "dialogo-cita", p => p.locator("main").getByRole("button", { name: "Nueva cita" }).first().click()],
  ["reception", "dialogo-restablecer", async p => { await openMenuIfNeeded(p); await p.getByRole("button", { name: "Restablecer demo" }).click(); }],
  ["reception", "dialogo-detalle", async p => { await go(p, "Agenda"); await p.getByRole("button", { name: /^Mateo González|Sofía Martínez|Isidora/ }).first().click(); }],
  ["dentist", "inicio", async () => {}],
  ["dentist", "agenda-semana", p => go(p, "Agenda")],
  ["dentist", "ficha", async p => { await openPatient(p, "Isidora Pérez", "Ficha clínica"); await p.getByRole("button", { name: /^Pieza 16,/ }).click(); }],
  ["dentist", "perfil-tratamientos", p => openPatient(p, "Isidora Pérez", "Tratamientos")],
  ["dentist", "tratamientos", p => go(p, "Tratamientos")],
  ["dentist", "aranceles", p => go(p, "Aranceles")],
  ["admin", "inicio", async () => {}],
  ["admin", "aranceles", p => go(p, "Aranceles")],
  ["admin", "ficha-lectura", p => openPatient(p, "Isidora Pérez", "Ficha clínica")],
  ["admin", "equipo", p => go(p, "Equipo")],
];
for (const width of [1280, 375]) {
  test(`axe: no automated WCAG violations on any view at ${width}px`, async () => {
    const failures = [];
    for (const [role, name, show] of VIEWS) {
      const { page, close } = await open({ width, height: width < 768 ? 812 : 900 });
      await setRole(page, role);
      await show(page);
      await page.waitForTimeout(250);
      const v = await axe(page, `${width}/${role}/${name}`);
      if (v.length) failures.push(`${role}/${name}: ${v.map(x => `${x.id}×${x.nodes}`).join(", ")}`);
      await close();
    }
    assert.deepEqual(failures, []);
  });
}

// ── AC11 · responsive ───────────────────────────────────────────────────────
test("responsive: no horizontal scroll at 320–1440 px and a legible role selector", async () => {
  const failures = [];
  for (const width of [320, 375, 390, 768, 1440]) {
    for (const [role, name, show] of [["reception", "inicio", async () => {}], ["reception", "semana", p => go(p, "Agenda")], ["reception", "mes", async p => { await go(p, "Agenda"); await p.getByRole("button", { name: "Mes", exact: true }).click(); }], ["reception", "dia", async p => { await go(p, "Agenda"); await p.getByRole("button", { name: "Día", exact: true }).click(); }], ["reception", "aranceles", p => go(p, "Aranceles")], ["dentist", "ficha", p => openPatient(p, "Isidora Pérez", "Ficha clínica")], ["dentist", "tratamientos", p => go(p, "Tratamientos")], ["admin", "equipo", p => go(p, "Equipo")]]) {
      const { page, close } = await open({ width, height: 800 });
      await setRole(page, role);
      await show(page);
      const extra = await overflow(page);
      report.overflow[`${width}/${role}/${name}`] = extra;
      if (extra > 0) failures.push(`${width}px ${role}/${name}: +${extra}px`);
      const fits = await page.getByLabel("Rol de demostración").evaluate(el => { const c = document.createElement("canvas").getContext("2d"); const s = getComputedStyle(el); c.font = `${s.fontWeight} ${s.fontSize} ${s.fontFamily}`; return c.measureText(el.selectedOptions[0].text).width <= el.clientWidth - parseFloat(s.paddingLeft) - parseFloat(s.paddingRight) + 1; });
      if (!fits) failures.push(`${width}px ${role}/${name}: role selector text clipped`);
      await close();
    }
  }
  assert.deepEqual(failures, []);
});

test("no console or page errors were recorded", () => { assert.deepEqual(report.errors, []); });
