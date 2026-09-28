/**
 * Enfoque Visual con Supabase caído: el catálogo debe quedar vacío (nunca datos demo)
 * y los formularios deben mostrar el error real, nunca un éxito falso.
 * Uso: con la app en EV_BASE y Supabase detenido → node tests/e2e/enfoque-outage.mjs
 */
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE ?? "playwright");
const BASE = process.env.EV_BASE ?? "http://localhost:3300";
let failures = 0;
const check = (name, ok, detail = "") => { if (!ok) failures++; console.log(`${ok ? "✓" : "✗"} ${name}${detail ? " — " + detail : ""}`); };
const browser = await chromium.launch();
try {
  const page = await browser.newPage();
  for (const path of ["/enfoque-visual/propiedades", "/enfoque-visual/vehiculos", "/enfoque-visual/alquiler"]) {
    const r = await page.goto(BASE + path);
    check(`${path}: responde 200 con catálogo vacío`, r.status() === 200 && await page.getByText("Pronto tendremos publicaciones aquí.").isVisible());
    check(`${path}: sin datos demo`, !(await page.getByText(/Gualaceo|MINI Cooper|Fortuner/).count()));
  }
  const home = await page.goto(BASE + "/enfoque-visual");
  check("Home responde sin publicaciones demo", home.status() === 200 && !(await page.getByText("Casa contemporánea en Gualaceo").count()));
  const demo = await page.goto(BASE + "/enfoque-visual/propiedades/casa-gualaceo-divina-misericordia");
  check("Ficha demo → 404", demo.status() === 404);
  await page.goto(BASE + "/enfoque-visual/contacto");
  await page.getByLabel("Nombre").fill("Prueba caída");
  await page.getByLabel("WhatsApp").first().fill("0991234567");
  await page.getByRole("button", { name: /Enviar solicitud/ }).click();
  const err = page.getByText(/No pudimos registrar/);
  check("Formulario muestra el error real (no éxito falso)", await err.waitFor({ timeout: 10000 }).then(() => true, () => false) && !(await page.getByText("Solicitud recibida").count()));
  const api = await page.request.post(BASE + "/api/enfoque/leads", { data: { name: "Prueba", phone: "0991234567" } });
  check("API de leads responde 5xx", api.status() >= 500, String(api.status()));
  await page.goto(BASE + "/enfoque-visual/admin/login");
  await page.fill("input[type=email]", "admin@enfoque.test"); await page.fill("input[type=password]", "x");
  await page.click('button:has-text("Entrar")');
  check("Login muestra error sin Supabase", await page.getByText(/No se pudo conectar/i).waitFor({ timeout: 10000 }).then(() => true, () => false));
} catch (e) { check("Sin excepciones", false, String(e).slice(0, 300)); }
await browser.close();
process.exit(failures ? 1 : 0);
