/**
 * E2E de Enfoque Visual contra una app real y un Supabase real (local o de staging).
 *
 * Recorre el flujo completo: login, CRUD de propiedad y vehículo con fotos reales,
 * orden/portada/borrado de imágenes, video, publicación, catálogo y filtros, fichas,
 * formulario de lead, clic en WhatsApp con referencia, registro del lead de WhatsApp,
 * SEO, móvil y errores de consola. Verifica en la base de datos lo que la UI dice.
 *
 * Uso (ver docs/enfoque-visual-produccion.md):
 *   EV_BASE=http://localhost:3300 SUPABASE_URL=… SUPABASE_SERVICE_ROLE_KEY=… \
 *   EV_ADMIN_EMAIL=… EV_ADMIN_PASSWORD=… [EV_NOSTAFF_EMAIL=…] node tests/e2e/enfoque.mjs
 *
 * ¡Crea y borra datos! Úsalo solo contra un Supabase local o de pruebas.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

const { chromium } = await import(process.env.PLAYWRIGHT_MODULE ?? "playwright");
const BASE = process.env.EV_BASE ?? "http://localhost:3300";
const SB = process.env.SUPABASE_URL;
const SR = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ADMIN = { email: process.env.EV_ADMIN_EMAIL, password: process.env.EV_ADMIN_PASSWORD };
const OUT = process.env.EV_SHOTS ?? join(tmpdir(), "enfoque-e2e");
if (!SB || !SR || !ADMIN.email || !ADMIN.password) { console.error("Faltan SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, EV_ADMIN_EMAIL o EV_ADMIN_PASSWORD"); process.exit(2); }
mkdirSync(OUT, { recursive: true });

const results = [];
let failures = 0;
function check(name, ok, detail = "") {
  results.push({ name, ok, detail });
  if (!ok) failures++;
  console.log(`${ok ? "✓" : "✗"} ${name}${detail ? " — " + detail : ""}`);
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const sbHeaders = { apikey: SR, ...(SR.startsWith("eyJ") ? { Authorization: `Bearer ${SR}` } : {}) };
async function db(path, init = {}) {
  const r = await fetch(`${SB}/rest/v1/${path}`, { ...init, headers: { ...sbHeaders, "Content-Type": "application/json", Prefer: "return=representation", ...(init.headers || {}) } });
  const t = await r.text();
  if (!r.ok) throw new Error(`DB ${r.status} ${t}`);
  return t ? JSON.parse(t) : null;
}
async function storageList(prefix) {
  const r = await fetch(`${SB}/storage/v1/object/list/listing-media`, { method: "POST", headers: { ...sbHeaders, "Content-Type": "application/json" }, body: JSON.stringify({ prefix, limit: 100 }) });
  return r.ok ? r.json() : [];
}
async function until(fn, ms = 8000) {
  const end = Date.now() + ms;
  for (;;) { const v = await fn().catch(() => null); if (v) return v; if (Date.now() > end) return null; await sleep(300); }
}

const RUN = Date.now().toString(36);
const PROP = { title: `Casa E2E ${RUN} en Gualaceo`, city: "Gualaceo", sector: "Centro", price: "123456", built: "180", land: "300", rooms: "3", baths: "2.5", parking: "2",
  features: "Patio\nCocina abierta\nTerraza", video: "https://youtu.be/dQw4w9WgXcQ",
  description: "Casa luminosa creada por la prueba E2E de Enfoque Visual. Tiene espacios amplios, buena distribución y acabados de calidad en una zona tranquila." };
const VEH = { brand: "Toyota", model: `Hilux E2E${RUN}`, year: "2021", price: "38900", km: "45000", engine: "2.4 Turbo diésel", fuel: "diesel", video: "https://youtube.com/shorts/dQw4w9WgXcQ" };

const browser = await chromium.launch();
const consoleErrors = [];
function watch(page, label) {
  page.on("pageerror", (e) => consoleErrors.push(`${label}: ${e.message}`));
  page.on("console", (m) => {
    if (m.type() !== "error") return;
    const t = m.text();
    // Recursos externos bloqueados en el sandbox (Pixel, YouTube) y 4xx esperados de validación.
    if (/ERR_TUNNEL|ERR_NAME|ERR_BLOCKED|youtube|facebook|googletagmanager|status of 40[0-9]|status of 50[03]/i.test(t)) return;
    consoleErrors.push(`${label}: ${t}`);
  });
}
async function newPage(opts = {}) {
  const ctx = await browser.newContext({ viewport: { width: 1366, height: 900 }, ...opts });
  // El Pixel real no carga en el sandbox: se sirve vacío para inspeccionar la cola de fbq.
  await ctx.route("https://connect.facebook.net/**", (r) => r.fulfill({ body: "", contentType: "text/javascript" }));
  await ctx.route("https://wa.me/**", (r) => r.fulfill({ body: "<title>WhatsApp</title>", contentType: "text/html" }));
  const page = await ctx.newPage();
  watch(page, opts.isMobile ? "móvil" : "desktop");
  return { ctx, page };
}

// Imágenes reales (PNG) generadas con el navegador.
async function makeImages(n) {
  const { ctx, page } = await newPage();
  const files = [];
  for (let i = 0; i < n; i++) {
    const hue = (i * 97) % 360;
    await page.setContent(`<body style="margin:0"><div style="width:1200px;height:800px;background:linear-gradient(135deg,hsl(${hue} 70% 55%),hsl(${(hue + 60) % 360} 70% 35%));display:flex;align-items:center;justify-content:center;font:900 160px Arial;color:#fff">FOTO ${i + 1}</div></body>`);
    const path = join(OUT, `foto-${i + 1}.png`);
    writeFileSync(path, await page.locator("div").screenshot());
    files.push(path);
  }
  await ctx.close();
  return files;
}

async function login(page, email, password) {
  await page.goto(`${BASE}/enfoque-visual/admin/login`);
  await page.fill('input[type=email]', email);
  await page.fill('input[type=password]', password);
  await page.click('button:has-text("Entrar")');
}

try {
  const imgs = await makeImages(4);

  // ── 1. Acceso ────────────────────────────────────────────────────────────
  const { ctx: adminCtx, page: admin } = await newPage();
  await admin.goto(`${BASE}/enfoque-visual/admin`);
  check("Admin sin sesión redirige al login", admin.url().includes("/admin/login"));
  const noAuthApi = await admin.request.post(`${BASE}/api/enfoque/admin/properties`, { data: { title: "x" } });
  check("API admin sin sesión responde 401", noAuthApi.status() === 401);
  await login(admin, ADMIN.email, "incorrecta");
  check("Login con contraseña incorrecta muestra error", await admin.getByText(/incorrect/i).waitFor({ timeout: 8000 }).then(() => true, () => false));
  if (process.env.EV_NOSTAFF_EMAIL) {
    await login(admin, process.env.EV_NOSTAFF_EMAIL, process.env.EV_NOSTAFF_PASSWORD || ADMIN.password);
    check("Usuario sin perfil de staff no entra", await admin.getByText(/no tiene acceso/i).waitFor({ timeout: 8000 }).then(() => true, () => false));
  }
  await login(admin, ADMIN.email, ADMIN.password);
  await admin.waitForURL(/\/enfoque-visual\/admin$/, { timeout: 10000 });
  check("Login correcto abre el panel", await admin.getByRole("heading", { name: "Panel" }).isVisible());
  const robotsMeta = await admin.locator('meta[name="robots"]').getAttribute("content");
  check("Panel con meta robots noindex", /noindex/.test(robotsMeta || ""), robotsMeta || "");
  const adminHead = await admin.request.get(`${BASE}/enfoque-visual/admin/login`);
  check("Panel con cabecera X-Robots-Tag noindex", /noindex/.test(adminHead.headers()["x-robots-tag"] || ""));

  // ── 2. Crear propiedad con fotos + video y publicar ──────────────────────
  await admin.goto(`${BASE}/enfoque-visual/admin/propiedades/nueva`);
  await admin.getByLabel("Título").fill(PROP.title);
  check("Slug se genera desde el título", (await admin.getByLabel("Slug (URL)").inputValue()).startsWith("casa-e2e-"));
  await admin.getByLabel("Precio (USD)").fill(PROP.price);
  await admin.getByLabel("Ciudad").fill(PROP.city);
  await admin.getByLabel("Sector").fill(PROP.sector);
  await admin.getByLabel("Construcción (m²)").fill(PROP.built);
  await admin.getByLabel("Terreno (m²)").fill(PROP.land);
  await admin.getByLabel("Dormitorios").fill(PROP.rooms);
  await admin.getByLabel("Baños").fill(PROP.baths);
  await admin.getByLabel("Parqueaderos").fill(PROP.parking);
  await admin.getByLabel("Descripción").fill(PROP.description);
  await admin.getByLabel("Características").fill(PROP.features);
  await admin.getByLabel(/Video/).fill("https://ejemplo.com/video");
  check("Video con enlace no válido muestra aviso", await admin.getByText(/Enlace no reconocido/).isVisible());
  await admin.getByLabel(/Video/).fill(PROP.video);
  check("Vista previa del video en el formulario", (await admin.locator('iframe[title="Vista previa del video"]').getAttribute("src"))?.includes("youtube-nocookie.com/embed/dQw4w9WgXcQ"));
  await admin.locator('input[type=file]').setInputFiles(imgs.slice(0, 3));
  check("3 fotos en cola antes de crear", (await admin.getByText(/Hacer portada|Portada/).count()) === 3);
  await admin.getByRole("checkbox", { name: /Destacar/ }).check();
  await admin.getByRole("button", { name: "Crear y publicar" }).click();
  await admin.waitForURL(/\/admin\/propiedades\/[0-9a-f-]{36}\?creada=1/, { timeout: 30000 });
  const propId = admin.url().match(/propiedades\/([0-9a-f-]{36})/)[1];
  check("Propiedad creada y redirigida a edición", Boolean(propId));
  const [propRow] = await db(`properties?id=eq.${propId}&select=*`);
  check("BD: propiedad publicada con datos completos",
    propRow.publication_status === "publicado" && propRow.is_featured && Number(propRow.bedrooms) === 3 && Number(propRow.bathrooms) === 2.5 &&
    Number(propRow.parking_spots) === 2 && propRow.features.length === 3 && propRow.video_url === PROP.video && Number(propRow.price) === 123456,
    `${propRow.publication_status}, ${propRow.bedrooms} dorm, ${propRow.bathrooms} baños, ${propRow.features.length} caract.`);
  let imgsDb = await db(`listing_images?property_id=eq.${propId}&select=id,storage_path,sort_order,is_cover&order=sort_order`);
  check("BD: 3 fotos subidas, la primera es portada", imgsDb.length === 3 && imgsDb[0].is_cover && imgsDb.filter((i) => i.is_cover).length === 1);
  check("Storage: 3 archivos en properties/<id>", (await storageList(`properties/${propId}`)).length === 3);
  check("BD: cover_path sincronizado por trigger", propRow.cover_path === imgsDb[0].storage_path);

  // ── 3. Ordenar, portada, borrar, subir más ───────────────────────────────
  await admin.getByRole("button", { name: "Mover después" }).first().click(); // foto 1 → posición 2
  await admin.getByRole("button", { name: "Guardar orden" }).click();
  await admin.getByText("Orden guardado.").waitFor();
  imgsDb = await db(`listing_images?property_id=eq.${propId}&select=id,storage_path,sort_order,is_cover&order=sort_order`);
  const original = imgsDb.find((i) => i.is_cover);
  check("Orden guardado en BD (foto 1 pasó a la posición 2)", imgsDb[1].id === original.id, imgsDb.map((i) => i.sort_order).join(","));
  await admin.getByRole("button", { name: "Hacer portada" }).last().click();
  await sleep(800);
  imgsDb = await db(`listing_images?property_id=eq.${propId}&select=id,storage_path,sort_order,is_cover&order=sort_order`);
  check("Cambio de portada: una sola portada, la última", imgsDb.filter((i) => i.is_cover).length === 1 && imgsDb[2].is_cover);
  const [propAfterCover] = await db(`properties?id=eq.${propId}&select=cover_path`);
  check("cover_path sigue a la nueva portada", propAfterCover.cover_path === imgsDb[2].storage_path);
  admin.once("dialog", (d) => d.accept());
  await admin.getByRole("button", { name: "Eliminar foto" }).first().click();
  await sleep(1000);
  imgsDb = await db(`listing_images?property_id=eq.${propId}&select=id,storage_path,is_cover&order=sort_order`);
  check("Foto eliminada de BD y de Storage", imgsDb.length === 2 && (await storageList(`properties/${propId}`)).length === 2);
  await admin.locator('section:has(h2:text("Fotografías")) input[type=file]').setInputFiles([imgs[3]]);
  await admin.getByText("Foto subida.").waitFor({ timeout: 15000 });
  check("Subida adicional desde la edición", (await db(`listing_images?property_id=eq.${propId}&select=id`)).length === 3);
  const bad = join(OUT, "no-imagen.txt"); writeFileSync(bad, "hola");
  await admin.locator('section:has(h2:text("Fotografías")) input[type=file]').setInputFiles([bad]);
  check("Archivo no permitido se rechaza", await admin.getByText(/formato no permitido/).isVisible());

  // Edición: cambiar precio y comprobar que no se pierden características.
  await admin.getByLabel("Precio (USD)").fill("125000");
  await admin.getByRole("button", { name: "Guardar cambios" }).click();
  await admin.getByText("Guardado correctamente.").waitFor();
  const [propEdited] = await db(`properties?id=eq.${propId}&select=price,features,video_url`);
  check("Editar conserva características y video", Number(propEdited.price) === 125000 && propEdited.features.length === 3 && propEdited.video_url === PROP.video);

  // Slug duplicado → error claro
  const dup = await admin.request.post(`${BASE}/api/enfoque/admin/properties`, { data: { title: "Otra casa de prueba", slug: propRow.slug, price: 1, city: "Cuenca" } });
  check("Slug duplicado devuelve error legible", dup.status() >= 400 && /slug/.test((await dup.json()).error));

  // ── 4. Vehículo: borrador sin fotos, fotos en edición, publicar desde el listado ──
  await admin.goto(`${BASE}/enfoque-visual/admin/vehiculos/nuevo`);
  await admin.getByLabel("Marca").fill(VEH.brand);
  await admin.getByLabel("Modelo").fill(VEH.model);
  await admin.getByLabel("Año").fill(VEH.year);
  await admin.getByLabel("Precio (USD)").fill(VEH.price);
  await admin.getByLabel("Kilometraje").fill(VEH.km);
  await admin.getByLabel("Motor").fill(VEH.engine);
  await admin.getByLabel("Combustible").selectOption(VEH.fuel);
  await admin.getByLabel("Transmisión").selectOption("manual");
  await admin.getByLabel("Equipamiento").fill("4x4\nCámara de retro\nPantalla multimedia");
  await admin.getByLabel(/Video/).fill(VEH.video);
  await admin.getByRole("button", { name: "Crear", exact: true }).click();
  await admin.waitForURL(/\/admin\/vehiculos\/[0-9a-f-]{36}/, { timeout: 20000 });
  const vehId = admin.url().match(/vehiculos\/([0-9a-f-]{36})/)[1];
  const [vehRow] = await db(`vehicles?id=eq.${vehId}&select=*`);
  check("BD: vehículo en borrador con ficha técnica", vehRow.publication_status === "borrador" && vehRow.fuel === "diesel" && vehRow.transmission === "manual" && vehRow.slug === `toyota-hilux-e2e${RUN}-2021`, vehRow.slug);
  await admin.locator('section:has(h2:text("Fotografías")) input[type=file]').setInputFiles(imgs.slice(1, 3));
  await admin.getByText("2 fotos subidas.").waitFor({ timeout: 20000 });
  check("Subida múltiple en edición de vehículo", (await db(`listing_images?vehicle_id=eq.${vehId}&select=id`)).length === 2);
  const pub = await fetch(`${BASE}/enfoque-visual/vehiculos/${vehRow.slug}`);
  check("Vehículo en borrador NO es público (404)", pub.status === 404);
  await admin.goto(`${BASE}/enfoque-visual/admin/vehiculos?estado=borrador`);
  const vehRowUi = admin.locator("div.grid", { hasText: VEH.model }).first();
  await vehRowUi.getByRole("button", { name: "Publicar" }).click();
  await until(async () => (await db(`vehicles?id=eq.${vehId}&select=publication_status`))[0].publication_status === "publicado");
  check("Publicar desde el listado", (await db(`vehicles?id=eq.${vehId}&select=publication_status,published_at`))[0].published_at !== null);

  // ── 5. Catálogo público, filtros y fichas ────────────────────────────────
  const { ctx: pubCtx, page } = await newPage();
  await page.goto(`${BASE}/enfoque-visual/propiedades?utm_source=facebook&utm_medium=paid&utm_campaign=e2e-${RUN}&fbclid=IwAR_E2E_${RUN}`);
  check("Catálogo muestra la propiedad publicada", await page.getByText(PROP.title).isVisible());
  const attr = (await pubCtx.cookies()).find((c) => c.name === "ev_attr");
  check("UTM y fbclid guardados en cookie de atribución", Boolean(attr) && decodeURIComponent(attr.value).includes(`e2e-${RUN}`));
  await page.goto(`${BASE}/enfoque-visual/propiedades?ciudad=gualaceo&habitaciones=3&operacion=venta&q=luminosa`);
  check("Filtros combinados (ciudad, habitaciones, operación, texto) la encuentran", await page.getByText(PROP.title).isVisible());
  await page.goto(`${BASE}/enfoque-visual/propiedades?habitaciones=4`);
  check("Filtro de habitaciones 4+ la excluye", !(await page.getByText(PROP.title).isVisible()));
  await page.goto(`${BASE}/enfoque-visual/propiedades?max=100000`);
  check("Filtro de precio máximo la excluye", !(await page.getByText(PROP.title).isVisible()));
  await page.goto(`${BASE}/enfoque-visual/propiedades`);
  await page.getByLabel("Ciudad").selectOption({ label: "Gualaceo" });
  await page.getByRole("button", { name: "Filtrar" }).click();
  await page.waitForURL(/ciudad=Gualaceo/);
  check("El formulario de filtros escribe en la URL (enlace compartible)", page.url().includes("ciudad=Gualaceo"));
  await page.goto(`${BASE}/enfoque-visual/vehiculos?marca=toyota&combustible=diesel&transmision=manual&desde=2020`);
  check("Filtros de vehículos (marca, combustible, transmisión, año)", await page.getByText(`Toyota ${VEH.model}`).isVisible());
  await page.goto(`${BASE}/enfoque-visual/vehiculos?combustible=gasolina`);
  check("Filtro de combustible lo excluye", !(await page.getByText(`Toyota ${VEH.model}`).isVisible()));
  await page.goto(`${BASE}/enfoque-visual`);
  check("Home muestra la propiedad destacada", await page.getByText(PROP.title).isVisible());

  await page.goto(`${BASE}/enfoque-visual/propiedades/${propRow.slug}`);
  check("Ficha: título y precio editado", await page.getByRole("heading", { name: PROP.title }).isVisible() && await page.getByText("$125,000").first().isVisible());
  check("Ficha: video de YouTube embebido", (await page.locator('iframe[title^="Video de"]').getAttribute("src"))?.includes("youtube-nocookie.com/embed/dQw4w9WgXcQ"));
  check("Ficha: características y datos", await page.getByText("✓ Terraza").isVisible() && await page.getByText("dormitorios").isVisible());
  const canonical = await page.locator('link[rel="canonical"]').getAttribute("href");
  check("Ficha: canonical propio de Enfoque", canonical?.endsWith(`/propiedades/${propRow.slug}`) && !canonical.includes("advibeagencia.com/propiedades") ? true : canonical?.includes("enfoque"), canonical);
  const og = await page.locator('meta[property="og:image"]').first().getAttribute("content");
  check("Ficha: og:image es la portada", og?.includes("listing-media/properties/"), og);
  const ld = await page.locator('script[type="application/ld+json"]').allTextContents();
  check("Ficha: JSON-LD RealEstateListing + Breadcrumb, sin schema de AdVibe", ld.join().includes("RealEstateListing") && ld.join().includes("BreadcrumbList") && !ld.join().includes("FAQPage"));
  await sleep(2000);
  const fbq = await page.evaluate(() => (window.fbq?.queue || []).map((a) => Array.from(a)));
  const vc = fbq.find((a) => a[0] === "track" && a[1] === "ViewContent");
  check("Pixel: ViewContent con content_ids y eventID", Boolean(vc) && vc[2].content_ids?.[0] === propId && Boolean(vc[3]?.eventID));
  // Galería a pantalla completa
  await page.getByRole("button", { name: /Ver foto 1 de/ }).click();
  check("Galería: visor a pantalla completa", await page.getByRole("dialog").isVisible());
  await page.keyboard.press("ArrowRight");
  check("Galería: navegación con teclado", await page.getByRole("dialog").getByText(/^2 \//).isVisible());
  await page.keyboard.press("Escape");

  // Lead desde la ficha
  const box = page.locator("#solicitar");
  await box.getByLabel("Nombre").fill("Cliente E2E");
  await box.getByLabel("WhatsApp").fill("099123456");
  await box.getByRole("button", { name: "Solicitar información" }).click();
  check("Lead: teléfono ecuatoriano incompleto se rechaza con mensaje", await box.getByText(/Revisa el número/).waitFor({ timeout: 8000 }).then(() => true, () => false));
  await box.getByLabel("WhatsApp").fill("099 876 5432");
  await box.getByLabel("Correo").fill("cliente.e2e@example.com");
  await box.getByRole("button", { name: "Solicitar información" }).click();
  check("Lead: confirmación tras guardar", await box.getByText("¡Solicitud recibida!").waitFor({ timeout: 10000 }).then(() => true, () => false));
  const lead = await until(async () => (await db(`leads?email=eq.cliente.e2e@example.com&property_id=eq.${propId}&select=*`))[0]);
  check("BD: lead vinculado a la propiedad, teléfono E.164, UTM", lead?.phone === "+593998765432" && lead.utm_campaign === `e2e-${RUN}` && lead.fbclid === `IwAR_E2E_${RUN}` && lead.interest_type === "comprar_propiedad",
    lead ? `${lead.phone} · ${lead.utm_campaign}` : "no encontrado");
  check("BD: fbc construido desde fbclid", lead?.fbc?.startsWith("fb.1.") && lead.fbc.endsWith(`IwAR_E2E_${RUN}`), lead?.fbc);
  const leadEvent = await until(async () => { const [e] = await db(`conversion_events?lead_id=eq.${lead.id}&select=*`); return e?.capi_status && e.capi_status !== "pendiente" ? e : null; }, 15000);
  check("BD: evento Lead registrado con el mismo event_id del Pixel", Boolean(leadEvent) && Number(leadEvent.value) === 125000,
    leadEvent ? `capi_status=${leadEvent.capi_status}${leadEvent.capi_last_error ? " (" + leadEvent.capi_last_error.slice(0, 80) + ")" : ""}` : "");
  const fbqLead = (await page.evaluate(() => (window.fbq?.queue || []).map((a) => Array.from(a)))).find((a) => a[1] === "Lead");
  check("Pixel: Lead con el mismo eventID que el servidor", fbqLead?.[3]?.eventID === leadEvent?.event_id);

  // WhatsApp con referencia
  const [popup] = await Promise.all([page.waitForEvent("popup"), box.getByRole("button", { name: /WhatsApp/ }).click()]);
  const waUrl = decodeURIComponent(popup.url());
  const ref = waUrl.match(/Ref: (EV-[A-Z0-9]+)/)?.[1];
  await popup.close().catch(() => {});
  check("WhatsApp: abre wa.me con el número y código de referencia", waUrl.includes("wa.me/") && Boolean(ref), ref);
  const contact = await until(async () => (await db(`conversion_events?ref_code=eq.${ref}&select=*`))[0]);
  check("BD: Contact con referencia y publicación correctas", contact?.property_id === propId && contact.event_name === "Contact" && contact.utm_campaign === `e2e-${RUN}`);

  // Registrar el lead de WhatsApp en el panel
  await admin.goto(`${BASE}/enfoque-visual/admin/leads`);
  check("Panel: el lead del formulario aparece con su propiedad", await admin.getByRole("link", { name: PROP.title }).first().isVisible());
  await admin.getByLabel("Referencia").fill(ref);
  await admin.getByLabel("Nombre").fill(`Cliente WhatsApp ${RUN}`);
  await admin.getByLabel("WhatsApp", { exact: true }).fill("0991112233");
  await admin.getByRole("button", { name: "Registrar lead" }).click();
  await admin.getByText("Lead registrado.").waitFor({ timeout: 8000 });
  const waLead = (await db(`leads?ref_code=eq.${ref}&select=*`))[0];
  check("BD: lead de WhatsApp con propiedad y campaña del clic", waLead?.channel === "whatsapp" && waLead.property_id === propId && waLead.utm_campaign === `e2e-${RUN}`);
  const statusSel = admin.locator("tr", { hasText: `Cliente WhatsApp ${RUN}` }).getByLabel("Estado del lead");
  await statusSel.selectOption("contactado");
  await until(async () => (await db(`leads?id=eq.${waLead.id}&select=status`))[0].status === "contactado");
  const hist = await db(`lead_status_history?lead_id=eq.${waLead.id}&select=to_status`);
  check("Cambio de estado del lead guardado con historial", hist.some((h) => h.to_status === "contactado"));

  // Ficha de vehículo + lead
  await page.goto(`${BASE}/enfoque-visual/vehiculos/${vehRow.slug}`);
  check("Ficha de vehículo con Short de YouTube embebido", (await page.locator('iframe[title^="Video de"]').getAttribute("src"))?.includes("/embed/dQw4w9WgXcQ"));
  check("Ficha de vehículo: JSON-LD Car", (await page.locator('script[type="application/ld+json"]').allTextContents()).join().includes('"@type":"Car"'));
  await page.locator("#solicitar").getByLabel("Nombre").fill("Comprador Auto");
  await page.locator("#solicitar").getByLabel("WhatsApp").fill("0987001122");
  await page.locator("#solicitar").getByRole("button", { name: "Solicitar información" }).click();
  await page.locator("#solicitar").getByText("¡Solicitud recibida!").waitFor({ timeout: 8000 });
  const vLead = await until(async () => (await db(`leads?vehicle_id=eq.${vehId}&select=*`))[0]);
  check("BD: lead de vehículo vinculado", vLead?.vehicle_id === vehId && vLead.interest_type === "comprar_vehiculo");

  // Contacto general
  await page.goto(`${BASE}/enfoque-visual/contacto?tipo=propiedad`);
  check("Contacto: ?tipo=propiedad preselecciona el interés", (await page.getByLabel("Me interesa").inputValue()) === "publicar_propiedad");
  await page.getByLabel("Nombre").fill("Propietario E2E");
  await page.getByLabel("WhatsApp").first().fill("072345678");
  await page.getByRole("button", { name: /Enviar solicitud/ }).click();
  check("Contacto: formulario guarda (teléfono fijo de Cuenca)", await page.getByText("Solicitud recibida").waitFor({ timeout: 10000 }).then(() => true, () => false));
  check("BD: lead de contacto general", Boolean((await db(`leads?phone=eq.%2B59372345678&interest_type=eq.publicar_propiedad&created_at=gte.${new Date(Date.now() - 120000).toISOString()}&select=id`))[0]));
  // Honeypot
  const spam = await page.request.post(`${BASE}/api/enfoque/leads`, { data: { name: "Bot", phone: "0991234567", website: "http://spam" } });
  check("Honeypot: el bot recibe ok pero no se guarda", spam.ok() && !(await db(`leads?name=eq.Bot&select=id`)).length);

  // ── 6. SEO ───────────────────────────────────────────────────────────────
  await page.goto(`${BASE}/enfoque-visual`);
  const homeCanon = await page.locator('link[rel="canonical"]').getAttribute("href");
  check("Home: canonical de Enfoque (no advibeagencia.com)", Boolean(homeCanon) && !homeCanon.includes("advibeagencia.com/\"") && !homeCanon.startsWith("https://www.advibeagencia.com"), homeCanon);
  check("Home: og:site_name Enfoque Visual", (await page.locator('meta[property="og:site_name"]').getAttribute("content")) === "Enfoque Visual");
  check("Home: sin JSON-LD de AdVibe", !(await page.locator('script[type="application/ld+json"]').allTextContents()).join().includes("FAQPage"));
  await page.goto(`${BASE}/enfoque-visual/contacto`);
  const contactOg = await page.locator('meta[property="og:image"]').first().getAttribute("content");
  check("Páginas sin foto usan la imagen OG de Enfoque", Boolean(contactOg?.includes("/enfoque-visual/opengraph-image")) && (await fetch(contactOg.replace(/^https:\/\/[^/]+/, BASE))).ok, contactOg);
  const sitemap = await (await fetch(`${BASE}/enfoque-visual/sitemap.xml`)).text();
  check("Sitemap incluye propiedad y vehículo publicados", sitemap.includes(`/propiedades/${propRow.slug}`) && sitemap.includes(`/vehiculos/${vehRow.slug}`));
  const robots = await (await fetch(`${BASE}/enfoque-visual/robots.txt`)).text();
  check("robots.txt bloquea admin y API y enlaza el sitemap", /Disallow: \/admin/.test(robots) && /Disallow: \/api\//.test(robots) && /Sitemap:/.test(robots));
  const demoUrl = await fetch(`${BASE}/enfoque-visual/propiedades/casa-gualaceo-divina-misericordia`);
  check("URL demo no existe en producción (404)", demoUrl.status === 404);
  const adv = await (await fetch(`${BASE}/`)).text();
  check("AdVibe home conserva su JSON-LD (Organization + FAQ)", adv.includes("ProfessionalService") && adv.includes("FAQPage"));

  // ── 7. Móvil ─────────────────────────────────────────────────────────────
  const { ctx: mCtx, page: m } = await newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
  for (const path of ["/enfoque-visual", "/enfoque-visual/propiedades", `/enfoque-visual/propiedades/${propRow.slug}`, "/enfoque-visual/vehiculos", `/enfoque-visual/vehiculos/${vehRow.slug}`, "/enfoque-visual/contacto", "/enfoque-visual/admin/leads"]) {
    const p = path.includes("/admin") ? await mCtx.newPage() : m;
    if (path.includes("/admin")) { await mCtx.addCookies((await adminCtx.cookies()).filter((c) => c.name.startsWith("ev_"))); }
    await p.goto(BASE + path, { waitUntil: "networkidle" });
    const overflow = await p.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    check(`Móvil sin scroll horizontal: ${path.replace(propRow.slug, "<propiedad>").replace(vehRow.slug, "<vehículo>")}`, overflow <= 1, `${overflow}px`);
    await p.screenshot({ path: join(OUT, "movil" + path.replace(/[/]/g, "_").replace(/[^a-z0-9_-]/gi, "").slice(0, 60) + ".png"), fullPage: true });
  }
  await m.goto(`${BASE}/enfoque-visual/propiedades/${propRow.slug}`);
  await m.getByRole("link", { name: "Solicitar información" }).click();
  check("Móvil: CTA fija lleva al formulario", await m.locator("#solicitar").isVisible());
  await m.getByRole("button", { name: /Ver foto 1 de/ }).tap();
  check("Móvil: galería abre con toque", await m.getByRole("dialog").isVisible());

  // ── 8. Sesión: renovación automática del token ───────────────────────────
  await adminCtx.addCookies([{ name: "ev_session", value: "x.eyJleHAiOjF9.y", url: BASE }]);
  await admin.goto(`${BASE}/enfoque-visual/admin`);
  check("Token caducado se renueva con el refresh token (sigue en el panel)", admin.url().endsWith("/enfoque-visual/admin"));

  // ── 9. Despublicar y eliminar ────────────────────────────────────────────
  await admin.goto(`${BASE}/enfoque-visual/admin/propiedades`);
  await admin.locator("div.grid", { hasText: PROP.title }).first().getByRole("button", { name: "Despublicar" }).click();
  await until(async () => (await db(`properties?id=eq.${propId}&select=publication_status`))[0].publication_status === "borrador");
  check("Despublicar: la ficha deja de ser pública", (await fetch(`${BASE}/enfoque-visual/propiedades/${propRow.slug}`)).status === 404);
  await page.goto(`${BASE}/enfoque-visual/propiedades`);
  check("Despublicar: sale del catálogo", !(await page.getByText(PROP.title).isVisible()));
  await admin.goto(`${BASE}/enfoque-visual/admin/vehiculos/${vehId}`);
  admin.once("dialog", (d) => d.accept());
  await admin.getByRole("button", { name: "Eliminar", exact: true }).click();
  await admin.waitForURL(/\/admin\/vehiculos$/);
  check("Eliminar vehículo: fila y fotos de Storage borradas", !(await db(`vehicles?id=eq.${vehId}&select=id`)).length && (await storageList(`vehicles/${vehId}`)).length === 0);
  check("El lead del vehículo eliminado se conserva", Boolean((await db(`leads?id=eq.${vLead.id}&select=id,vehicle_id`))[0]));

  // Limpieza de la propiedad de prueba
  await admin.goto(`${BASE}/enfoque-visual/admin/propiedades/${propId}`);
  admin.once("dialog", (d) => d.accept());
  await admin.getByRole("button", { name: "Eliminar", exact: true }).click();
  await admin.waitForURL(/\/admin\/propiedades$/);
  check("Eliminar propiedad: fotos de Storage borradas", (await storageList(`properties/${propId}`)).length === 0);

  check("Sin errores de consola", consoleErrors.length === 0, consoleErrors.slice(0, 5).join(" | "));
  await adminCtx.close(); await pubCtx.close(); await mCtx.close();
} catch (error) {
  check("La prueba terminó sin excepciones", false, String(error?.stack || error).slice(0, 800));
} finally {
  await browser.close();
  writeFileSync(join(OUT, "resultados.json"), JSON.stringify(results, null, 2));
  console.log(`\n${results.length - failures}/${results.length} comprobaciones OK · capturas en ${OUT}`);
  process.exit(failures ? 1 : 0);
}
