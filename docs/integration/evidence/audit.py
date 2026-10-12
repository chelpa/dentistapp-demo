"""Functional, accessibility and mobile audit of the published DentistApp build.

Usage: python3 audit.py <base_url> <axe.min.js> <out_dir>
"""
import json
import sys
from playwright.sync_api import sync_playwright

BASE, AXE, OUT = sys.argv[1], sys.argv[2], sys.argv[3]
axe_src = open(AXE, encoding="utf-8").read()
report = {"axe": {}, "checks": {}, "overflow": {}, "errors": [], "http": []}


def axe(page, name):
    page.add_script_tag(content=axe_src)
    res = page.evaluate(
        """async () => { const r = await axe.run(document, {runOnly: ['wcag2a','wcag2aa','wcag21a','wcag21aa','wcag22aa','best-practice']});
        return r.violations.map(v => ({id: v.id, impact: v.impact, help: v.help, n: v.nodes.length,
          samples: v.nodes.slice(0, 3).map(x => (x.target.join(' ') + ' :: ' + (x.failureSummary||'').split('\\n').slice(1,2).join('')).slice(0, 220))})); }"""
    )
    report["axe"][name] = res


def overflow(page, name):
    report["overflow"][name] = page.evaluate(
        """() => { const w = document.documentElement.clientWidth; const sw = document.documentElement.scrollWidth;
        const offenders = [...document.querySelectorAll('body *')].filter(e => { const r = e.getBoundingClientRect(); return r.right > w + 1 && r.width > 0 && getComputedStyle(e).position !== 'fixed'; })
          .slice(0, 5).map(e => e.tagName + '.' + (e.className && e.className.baseVal === undefined ? String(e.className).slice(0, 60) : '') + ' right=' + Math.round(e.getBoundingClientRect().right));
        return {clientWidth: w, scrollWidth: sw, overflow: sw > w + 1, offenders}; }"""
    )


def nav(page, label):
    page.get_by_role("navigation", name="Navegación principal").get_by_role("button", name=label).click()
    page.wait_for_timeout(400)


def main_text(page):
    return page.locator("main").inner_text()


with sync_playwright() as p:
    b = p.chromium.launch(executable_path="/opt/pw-browsers/chromium")

    # ── Desktop ──────────────────────────────────────────────────────────
    ctx = b.new_context(viewport={"width": 1280, "height": 800}, locale="es-CL", timezone_id="America/Santiago")
    page = ctx.new_page()
    page.on("pageerror", lambda e: report["errors"].append("pageerror: " + str(e)))
    page.on("console", lambda m: report["errors"].append(f"console.{m.type}: {m.text}") if m.type in ("error", "warning") else None)
    page.on("response", lambda r: report["http"].append(f"{r.status} {r.url}") if r.status >= 400 else None)
    page.goto(BASE, wait_until="networkidle")
    axe(page, "inicio")

    # Role selector: does the content change?
    before = main_text(page)
    page.get_by_label("Rol de demostración").select_option("Dentista · demo")
    page.wait_for_timeout(400)
    after_d = main_text(page)
    page.get_by_label("Rol de demostración").select_option("Admin · demo")
    page.wait_for_timeout(400)
    after_a = main_text(page)
    report["checks"]["role_selector_changes_content"] = {"dentista": before != after_d, "admin": before != after_a}
    page.get_by_label("Rol de demostración").select_option("Recepción · demo")

    # Focus visibility of the role selector
    page.get_by_label("Rol de demostración").focus()
    report["checks"]["role_select_focus_style"] = page.evaluate(
        """() => { const s = getComputedStyle(document.activeElement); return {outline: s.outlineStyle + ' ' + s.outlineWidth, boxShadow: s.boxShadow}; }"""
    )

    nav(page, "Agenda")
    axe(page, "agenda_mes")
    page.get_by_role("button", name="Día", exact=True).click()
    page.wait_for_timeout(300)
    axe(page, "agenda_dia")

    nav(page, "Pacientes")
    axe(page, "pacientes")
    page.get_by_label("Buscar pacientes").fill("zzzz")
    report["checks"]["search_empty_state"] = "Sin resultados" in main_text(page)
    page.get_by_label("Buscar pacientes").fill("")
    page.locator("main").get_by_role("button", name="Sofía Martínez").first.click()
    page.wait_for_timeout(400)
    axe(page, "paciente_resumen")
    report["checks"]["profile_tabs_have_tab_role"] = page.get_by_role("tab").count()
    page.get_by_role("button", name="Ficha clínica", exact=True).click()
    page.wait_for_timeout(300)
    page.get_by_role("button", name="Pieza 16,").click()
    page.get_by_role("button", name="Observación", exact=True).click()
    page.wait_for_timeout(300)
    report["checks"]["tooth_16_after_change"] = page.get_by_role("button", name="Pieza 16,").get_attribute("aria-label")
    axe(page, "paciente_ficha")
    page.get_by_role("button", name="Tratamientos", exact=True).last.click()
    page.wait_for_timeout(300)
    axe(page, "paciente_tratamientos")

    nav(page, "Tratamientos")
    axe(page, "tratamientos")
    report["checks"]["nav_aria_current"] = page.evaluate(
        "() => [...document.querySelectorAll('nav[aria-label=\"Navegación principal\"] button')].map(b => b.getAttribute('aria-current'))"
    )

    # New-appointment dialog: focus handling, Escape, focus trap
    nav(page, "Inicio")
    page.locator("main").get_by_role("button", name="Nueva cita").first.click()
    page.wait_for_timeout(300)
    dlg = page.get_by_role("dialog", name="Nueva cita")
    report["checks"]["dialog_focus_on_open"] = page.evaluate("() => !!document.activeElement.closest('[role=dialog]')")
    axe(page, "modal_nueva_cita")
    for _ in range(12):
        page.keyboard.press("Tab")
    report["checks"]["dialog_focus_trapped_after_12_tabs"] = page.evaluate("() => !!document.activeElement.closest('[role=dialog]')")
    page.keyboard.press("Escape")
    page.wait_for_timeout(300)
    report["checks"]["dialog_closes_on_escape"] = dlg.count() == 0
    if dlg.count():
        dlg.get_by_role("button", name="Cancelar").click()

    # Overlap rule: 09:00 Sofía with Dra. Valentina Rojas today (45 min)
    def try_booking(time):
        page.locator("main").get_by_role("button", name="Nueva cita").first.click()
        d = page.get_by_role("dialog", name="Nueva cita")
        d.get_by_label("Paciente").select_option(label="Mateo González")
        d.get_by_label("Hora").fill(time)
        d.get_by_label("Profesional").select_option(label="Dra. Valentina Rojas")
        d.get_by_role("button", name="Crear cita demo").click()
        page.wait_for_timeout(400)
        alert = d.get_by_role("alert")
        msg = alert.inner_text() if d.count() and alert.count() else None
        if d.count():
            d.get_by_role("button", name="Cancelar").click()
        return {"rejected": msg is not None, "message": msg}

    report["checks"]["overlap_confirmed_appt"] = try_booking("09:15")
    # Mark Sofía's 09:00 appointment as Completada in Agenda (day view), then retry
    nav(page, "Agenda")
    if page.get_by_role("button", name="Día", exact=True).get_attribute("aria-pressed") != "true":
        page.get_by_role("button", name="Día", exact=True).click()
    page.get_by_label("Estado de cita de Sofía Martínez").first.select_option("Completada")
    nav(page, "Inicio")
    report["checks"]["overlap_completed_appt"] = try_booking("09:15")

    # Booking after closing time: 19:00 + 45 min
    nav(page, "Inicio")
    page.locator("main").get_by_role("button", name="Nueva cita").first.click()
    d = page.get_by_role("dialog", name="Nueva cita")
    report["checks"]["time_input_attrs"] = d.get_by_label("Hora").evaluate("e => ({min: e.min, max: e.max, step: e.step})")
    d.get_by_role("button", name="Cancelar").click()

    # Persistence + reset
    page.reload(wait_until="networkidle")
    report["checks"]["persists_after_reload"] = "Mateo González" in page.locator("main").inner_text()
    page.once("dialog", lambda dialog: (report["checks"].__setitem__("reset_uses_native_confirm", dialog.type), dialog.accept()))
    page.get_by_role("button", name="Restablecer demo").click()
    page.wait_for_timeout(400)
    report["checks"]["localstorage_keys"] = page.evaluate("() => Object.keys(localStorage)")
    ctx.close()

    # ── Mobile ───────────────────────────────────────────────────────────
    m = b.new_context(viewport={"width": 375, "height": 812}, device_scale_factor=2, is_mobile=True, has_touch=True,
                      locale="es-CL", timezone_id="America/Santiago")
    mp = m.new_page()
    mp.on("pageerror", lambda e: report["errors"].append("mobile pageerror: " + str(e)))
    mp.goto(BASE, wait_until="networkidle")
    overflow(mp, "m_inicio")
    mp.screenshot(path=f"{OUT}/m_inicio.png")
    report["checks"]["m_role_select_text_clipped"] = mp.get_by_label("Rol de demostración").evaluate(
        "e => ({scrollWidth: e.scrollWidth, clientWidth: e.clientWidth})")
    mp.get_by_role("button", name="Abrir menú").click()
    mp.wait_for_timeout(300)
    mp.screenshot(path=f"{OUT}/m_menu.png")
    mp.get_by_role("navigation", name="Navegación principal").get_by_role("button", name="Agenda").click()
    mp.wait_for_timeout(400)
    overflow(mp, "m_agenda")
    mp.screenshot(path=f"{OUT}/m_agenda.png", full_page=True)
    mp.get_by_role("button", name="Abrir menú").click()
    mp.get_by_role("navigation", name="Navegación principal").get_by_role("button", name="Pacientes").click()
    mp.wait_for_timeout(300)
    mp.locator("main").get_by_role("button", name="Sofía Martínez").first.click()
    mp.get_by_role("button", name="Ficha clínica", exact=True).click()
    mp.wait_for_timeout(400)
    overflow(mp, "m_ficha")
    report["checks"]["m_tooth_target_size"] = mp.get_by_role("button", name="Pieza 16,").evaluate(
        "e => { const r = e.getBoundingClientRect(); return {w: Math.round(r.width), h: Math.round(r.height)}; }")
    mp.screenshot(path=f"{OUT}/m_ficha.png", full_page=True)
    mp.get_by_role("button", name="Abrir menú").click()
    mp.get_by_role("navigation", name="Navegación principal").get_by_role("button", name="Tratamientos").click()
    mp.wait_for_timeout(300)
    overflow(mp, "m_tratamientos")
    mp.get_by_role("button", name="Abrir menú").click()
    mp.get_by_role("navigation", name="Navegación principal").get_by_role("button", name="Inicio").click()
    mp.locator("main").get_by_role("button", name="Nueva cita").first.click()
    mp.wait_for_timeout(300)
    overflow(mp, "m_modal")
    report["checks"]["m_modal_fits_viewport"] = mp.get_by_role("dialog").evaluate(
        "e => { const r = e.getBoundingClientRect(); return {top: Math.round(r.top), bottom: Math.round(r.bottom), vh: innerHeight}; }")
    mp.screenshot(path=f"{OUT}/m_modal.png")
    m.close()
    b.close()

json.dump(report, open(f"{OUT}/audit.json", "w"), ensure_ascii=False, indent=1)
print(json.dumps(report, ensure_ascii=False, indent=1))
