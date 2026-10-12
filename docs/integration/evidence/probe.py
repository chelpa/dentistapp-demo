"""Behavioural probe: what does each DentistApp build actually do?

Usage: python3 probe.py <name> <base_url> <axe.min.js> <out.json>
Each check is independent; a failure is recorded, not fatal.
"""
import json
import re
import sys
from playwright.sync_api import sync_playwright

NAME, BASE, AXE, OUT = sys.argv[1:5]
axe_src = open(AXE, encoding="utf-8").read()
R = {"version": NAME, "url": BASE, "checks": {}, "page_errors": []}


def check(name):
    def deco(fn):
        try:
            R["checks"][name] = fn()
        except Exception as e:  # record, keep going
            R["checks"][name] = {"error": str(e).splitlines()[0][:200]}
        return fn
    return deco


def nav_labels(page):
    return [t.split("\n")[0].strip() for t in page.get_by_role("navigation", name="Navegación principal").get_by_role("button").all_inner_texts()]


def nav(page, prefix):
    page.get_by_role("navigation", name="Navegación principal").get_by_role("button", name=re.compile("^" + prefix)).first.click()
    page.wait_for_timeout(350)


def open_new_appt(page):
    page.locator("main").get_by_role("button", name=re.compile("Nueva cita|Agendar cita")).first.click()
    page.wait_for_timeout(300)
    return page.get_by_role("dialog", name="Nueva cita")


with sync_playwright() as p:
    b = p.chromium.launch(executable_path="/opt/pw-browsers/chromium")
    ctx = b.new_context(viewport={"width": 1280, "height": 900}, locale="es-CL", timezone_id="America/Santiago")
    page = ctx.new_page()
    page.on("pageerror", lambda e: R["page_errors"].append(str(e)[:200]))
    native_dialogs = []
    page.on("dialog", lambda d: (native_dialogs.append(d.type), d.dismiss()))
    page.goto(BASE, wait_until="networkidle")
    role_select = page.get_by_label("Rol de demostración")

    @check("roles")
    def _():
        out = []
        n = role_select.locator("option").count()
        for i in range(n):
            role_select.select_option(index=i)
            page.wait_for_timeout(350)
            out.append({"option": role_select.locator("option").nth(i).inner_text(), "nav": nav_labels(page),
                        "h1": page.locator("main h1").first.inner_text()})
        role_select.select_option(index=0)
        page.wait_for_timeout(300)
        distinct = len({json.dumps([o["nav"], o["h1"]]) for o in out})
        return {"per_role": out, "roles_change_ui": distinct > 1}

    @check("agenda_views")
    def _():
        nav(page, "Agenda")
        views = page.get_by_role("group", name="Vista de agenda").get_by_role("button").all_inner_texts()
        page.get_by_role("button", name="Día", exact=True).click()
        page.wait_for_timeout(300)
        return {"views": views, "week_view": any("Semana" in v for v in views),
                "day_time_grid_15min": page.get_by_text("intervalos de 15 minutos").count() > 0}

    @check("new_appointment_fields")
    def _():
        nav(page, "Inicio")
        d = open_new_appt(page)
        labels = d.locator("label").all_inner_texts()
        dur = d.locator("#duration")
        durations = dur.locator("option").all_inner_texts() if dur.count() else []
        d.get_by_role("button", name="Cancelar").click()
        return {"labels": labels, "variable_duration": bool(durations), "duration_options": durations}

    @check("overlap_rule")
    def _():
        def book(time):
            nav(page, "Inicio")
            d = open_new_appt(page)
            d.get_by_label("Paciente").select_option(label="Mateo González")
            d.get_by_label("Hora").fill(time)
            d.get_by_label("Profesional").select_option(label="Dra. Valentina Rojas")
            d.get_by_role("button", name=re.compile("Crear cita")).click()
            page.wait_for_timeout(400)
            rejected = d.count() > 0 and d.get_by_role("alert").count() > 0
            if d.count():
                d.get_by_role("button", name="Cancelar").click()
            return rejected
        r1 = book("09:15")
        nav(page, "Agenda")
        page.get_by_role("button", name="Día", exact=True).click()
        page.get_by_label("Estado de cita de Sofía Martínez").first.select_option("Completada")
        r2 = book("09:15")
        return {"rejects_overlap_with_confirmed": r1, "rejects_overlap_with_completed": r2}

    @check("finance_tariffs_budgets")
    def _():
        labels = nav_labels(page)
        target = next((l for l in labels if "Arancel" in l or "Presupuesto" in l), None)
        if not target:
            return {"present": False, "nav": labels}
        nav(page, target)
        page.get_by_label("Prestación", exact=True).select_option(index=0)
        page.locator("main").get_by_role("button", name="Agregar", exact=True).click()
        page.get_by_label("Prestación", exact=True).select_option(index=2)
        page.locator("main").get_by_role("button", name="Agregar", exact=True).click()
        page.get_by_label("Cantidad prestación 2").fill("2")
        page.locator("#discount").fill("5000")
        page.get_by_role("button", name="Guardar presupuesto ficticio").click()
        page.wait_for_timeout(400)
        saved = page.get_by_text("Presupuestos guardados en este navegador").locator("xpath=..").inner_text()
        return {"present": True, "saved_section": saved[:300]}

    @check("clinical_note_and_tooth")
    def _():
        # pick the dentist role if roles exist
        opts = role_select.locator("option").all_inner_texts()
        di = next((i for i, o in enumerate(opts) if o.startswith("Dentista")), 0)
        role_select.select_option(index=di)
        page.wait_for_timeout(300)
        nav(page, "Pacientes")
        page.locator("main").get_by_role("button", name=re.compile("Sofía Martínez|Isidora Pérez")).first.click()
        page.get_by_role("button", name="Ficha clínica", exact=True).click()
        page.wait_for_timeout(300)
        page.get_by_label(re.compile("Observación ficticia")).fill("Nota de prueba automatizada")
        page.get_by_role("button", name="Guardar nota demo").click()
        page.wait_for_timeout(300)
        note_line = page.get_by_text("Nota de prueba automatizada").locator("xpath=..").inner_text()
        page.get_by_role("button", name=re.compile("^Pieza 16,")).click()
        page.get_by_role("button", name="Tratado", exact=True).click()
        page.wait_for_timeout(300)
        tooth = page.get_by_role("button", name=re.compile("^Pieza 16,")).get_attribute("aria-label")
        role_select.select_option(index=0)
        page.wait_for_timeout(300)
        return {"note_block": note_line[:160], "tooth_16": tooth}

    @check("modal_keyboard")
    def _():
        nav(page, "Inicio")
        d = open_new_appt(page)
        focus_in = page.evaluate("() => !!document.activeElement.closest('[role=dialog]')")
        page.keyboard.press("Escape")
        page.wait_for_timeout(300)
        closes = d.count() == 0
        if d.count():
            d.get_by_role("button", name="Cancelar").click()
        return {"focus_moves_into_dialog": focus_in, "escape_closes": closes}

    @check("reset_flow")
    def _():
        native_dialogs.clear()
        open_dialogs = page.get_by_role("dialog").count()
        page.get_by_role("button", name="Restablecer demo").click(timeout=5000)
        page.wait_for_timeout(300)
        in_app = page.get_by_role("dialog").count() > 0 or page.get_by_role("alertdialog").count() > 0
        if in_app:
            page.keyboard.press("Escape")
            dl = page.get_by_role("dialog")
            if dl.count():
                dl.get_by_role("button", name=re.compile("Cancelar|Volver|No")).first.click()
        return {"native_confirm": bool(native_dialogs), "in_app_dialog": in_app}

    @check("storage")
    def _():
        return {"keys": page.evaluate("() => Object.keys(localStorage)")}

    @check("axe_dashboard")
    def _():
        page.reload(wait_until="networkidle")
        page.add_script_tag(content=axe_src)
        v = page.evaluate("""async () => (await axe.run(document, {runOnly: ['wcag2a','wcag2aa','wcag21aa','wcag22aa']})).violations.map(v => [v.id, v.nodes.length])""")
        return dict(v)

    ctx.close()
    m = b.new_context(viewport={"width": 375, "height": 812}, is_mobile=True, has_touch=True, locale="es-CL")
    mp = m.new_page()
    mp.goto(BASE, wait_until="networkidle")

    @check("mobile_overflow_375")
    def _():
        res = {}
        for label in ["Inicio", "Agenda", "Pacientes", "Arancel", "Equipo"]:
            mp.get_by_role("button", name="Abrir menú").click()
            mp.wait_for_timeout(200)
            btn = mp.get_by_role("navigation", name="Navegación principal").get_by_role("button", name=re.compile("^" + label))
            if not btn.count():
                mp.get_by_role("button", name="Cerrar menú").first.click()
                continue
            btn.first.click()
            mp.wait_for_timeout(350)
            res[label] = mp.evaluate("() => document.documentElement.scrollWidth - document.documentElement.clientWidth")
        return res

    b.close()

json.dump(R, open(OUT, "w"), ensure_ascii=False, indent=1)
print(json.dumps(R, ensure_ascii=False, indent=1))
