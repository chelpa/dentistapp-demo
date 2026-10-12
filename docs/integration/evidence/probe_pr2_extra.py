"""PR #2 specific checks: chair-aware conflicts on a future date, weekly view, native dialog keyboard."""
import json, re, sys
from playwright.sync_api import sync_playwright
BASE, OUT = sys.argv[1], sys.argv[2]
R = {}
with sync_playwright() as p:
    b = p.chromium.launch(executable_path="/opt/pw-browsers/chromium")
    pg = b.new_page(viewport={"width": 1280, "height": 900}, locale="es-CL", timezone_id="America/Santiago")
    errs = []; pg.on("pageerror", lambda e: errs.append(str(e)[:150]))
    pg.goto(BASE, wait_until="networkidle")
    tomorrow = pg.evaluate("() => { const d = new Date(); d.setDate(d.getDate() + 7); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; }")
    def book(patient, time, dentist, chair):
        pg.locator("main").get_by_role("button", name=re.compile("Nueva cita")).first.click(); pg.wait_for_timeout(250)
        d = pg.get_by_role("dialog", name="Nueva cita")
        d.get_by_label("Paciente").select_option(label=patient)
        d.get_by_label("Fecha").fill(tomorrow); d.get_by_label("Hora").fill(time)
        d.get_by_label("Profesional").select_option(label=dentist); d.get_by_label("Sillón").select_option(label=chair)
        d.get_by_role("button", name=re.compile("Crear cita")).click(); pg.wait_for_timeout(350)
        msg = d.get_by_role("alert").inner_text() if d.count() and d.get_by_role("alert").count() else None
        if d.count(): d.get_by_role("button", name="Cancelar").click(); pg.wait_for_timeout(200)
        return {"accepted": msg is None, "message": msg}
    nav = pg.get_by_role("navigation", name="Navegación principal")
    nav.get_by_role("button", name=re.compile("^Inicio")).click(); pg.wait_for_timeout(300)
    R["date_used"] = tomorrow
    R["base_X_10:00_Rojas_S1"] = book("Sofía Martínez", "10:00", "Dra. Valentina Rojas", "Sillón 1")
    nav.get_by_role("button", name=re.compile("^Inicio")).click()
    R["same_dentist_other_chair_10:15"] = book("Mateo González", "10:15", "Dra. Valentina Rojas", "Sillón 2")
    nav.get_by_role("button", name=re.compile("^Inicio")).click()
    R["other_dentist_same_chair_10:15"] = book("Mateo González", "10:15", "Dr. Tomás Fuentes", "Sillón 1")
    nav.get_by_role("button", name=re.compile("^Inicio")).click()
    R["other_dentist_other_chair_10:15"] = book("Isidora Pérez", "10:15", "Dr. Tomás Fuentes", "Sillón 3")
    nav.get_by_role("button", name=re.compile("^Inicio")).click()
    R["adjacent_10:45_same_dentist"] = book("Benjamín Silva", "10:45", "Dra. Valentina Rojas", "Sillón 1")
    # mark X Completada via stored data, then retry same-dentist overlap
    pg.evaluate("""(date) => { const k = Object.keys(localStorage).find(k => k.startsWith('dentistapp')); const d = JSON.parse(localStorage.getItem(k));
        d.appointments.forEach(a => { if (a.date === date && a.time === '10:00' && a.dentist === 'Dra. Valentina Rojas') a.status = 'Completada'; }); localStorage.setItem(k, JSON.stringify(d)); }""", tomorrow)
    pg.reload(wait_until="networkidle")
    pg.get_by_role("navigation", name="Navegación principal").get_by_role("button", name=re.compile("^Inicio")).click()
    R["overlap_with_completed_same_dentist"] = book("Catalina Torres", "10:15", "Dra. Valentina Rojas", "Sillón 2")
    R["past_time_today_09:15"] = None
    pg.locator("main").get_by_role("button", name=re.compile("Nueva cita")).first.click(); pg.wait_for_timeout(250)
    d = pg.get_by_role("dialog", name="Nueva cita")
    R["dialog_focus_inside"] = pg.evaluate("() => !!document.activeElement.closest('dialog,[role=dialog]')")
    for _ in range(15): pg.keyboard.press("Tab")
    R["dialog_tab_stays_inside_after_15"] = pg.evaluate("() => !!document.activeElement.closest('dialog,[role=dialog]')")
    pg.keyboard.press("Escape"); pg.wait_for_timeout(250)
    R["dialog_escape_closes"] = pg.get_by_role("dialog", name="Nueva cita").count() == 0
    R["focus_returned_to"] = pg.evaluate("() => document.activeElement && (document.activeElement.innerText || document.activeElement.getAttribute('aria-label') || document.activeElement.tagName).trim().slice(0,40)")
    pg.get_by_role("navigation", name="Navegación principal").get_by_role("button", name=re.compile("^Agenda")).click(); pg.wait_for_timeout(400)
    R["agenda_views"] = pg.get_by_role("group", name="Vista de agenda").get_by_role("button").all_inner_texts()
    R["weekly_default_visible"] = pg.get_by_label("Agenda semanal").count() > 0
    R["role_select_changes_ui"] = None
    sel = pg.get_by_label("Rol de demostración"); before = pg.locator("main").inner_text()
    sel.select_option(index=1); pg.wait_for_timeout(300); R["role_select_changes_ui"] = before != pg.locator("main").inner_text()
    R["page_errors"] = errs
    m = b.new_page(viewport={"width": 375, "height": 812}, is_mobile=True, has_touch=True, locale="es-CL", timezone_id="America/Santiago")
    m.goto(BASE, wait_until="networkidle"); m.get_by_role("button", name="Abrir menú").click(); m.wait_for_timeout(200)
    m.get_by_role("navigation", name="Navegación principal").get_by_role("button", name=re.compile("^Agenda")).click(); m.wait_for_timeout(400)
    R["mobile_375_week_overflow_px"] = m.evaluate("() => document.documentElement.scrollWidth - document.documentElement.clientWidth")
    b.close()
json.dump(R, open(OUT, "w"), ensure_ascii=False, indent=1); print(json.dumps(R, ensure_ascii=False, indent=1))
