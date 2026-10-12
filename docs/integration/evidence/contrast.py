import sys, collections
from playwright.sync_api import sync_playwright
BASE, AXE = sys.argv[1], open(sys.argv[2]).read()
combos = collections.defaultdict(lambda: {"n": 0, "ex": set()})
with sync_playwright() as p:
    b = p.chromium.launch(executable_path="/opt/pw-browsers/chromium")
    pg = b.new_page(viewport={"width": 1280, "height": 800})
    pg.goto(BASE, wait_until="networkidle")
    def run():
        pg.add_script_tag(content=AXE)
        v = pg.evaluate("""async () => (await axe.run(document, {runOnly: ['color-contrast']})).violations.flatMap(v => v.nodes.map(n => ({d: n.any[0].data, t: document.querySelector(n.target[0])?.innerText?.trim().slice(0, 40)})))""")
        for x in v:
            d = x["d"]; k = (d["fgColor"], d["bgColor"], d["contrastRatio"])
            combos[k]["n"] += 1; combos[k]["ex"].add(x["t"] or "")
    run()
    pg.get_by_role("navigation", name="Navegación principal").get_by_role("button", name="Agenda").click(); pg.wait_for_timeout(300); run()
    pg.get_by_role("navigation", name="Navegación principal").get_by_role("button", name="Pacientes").click(); pg.locator("main").get_by_role("button", name="Sofía Martínez").first.click()
    pg.get_by_role("button", name="Ficha clínica", exact=True).click(); pg.wait_for_timeout(300); run()
    b.close()
for (fg, bg, r), v in sorted(combos.items(), key=lambda kv: kv[0][2]):
    print(f"{r:>5} {fg} on {bg}  x{v['n']:<3} e.g. {sorted(v['ex'])[:4]}")
