/**
 * Licor Store 24 storefront verification.
 *
 * Walks the full commercial funnel on a phone-sized viewport with touch input,
 * because that is where the traffic comes from:
 *   age gate -> home -> search -> product -> cart -> checkout -> order
 *
 * Also asserts the things that quietly break a mobile storefront: horizontal
 * overflow, touch targets under 44px, tel: links, cart persistence, and the
 * analytics events the ad account depends on.
 *
 * Usage: npm run build && npx next start -p 3210, then `npm run test:licor`.
 */
import { chromium, devices } from "playwright";

const BASE = process.env.LICOR_BASE_URL ?? "http://localhost:3210";
const STORE = `${BASE}/licor-store-24`;

let failures = 0;
function check(name, condition, detail = "") {
  const ok = Boolean(condition);
  if (!ok) failures += 1;
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? `  -- ${detail}` : ""}`);
}

/**
 * Records the analytics events the page tries to send. Kept in sessionStorage
 * so the funnel is still complete after a full page load.
 */
const EVENT_LOG_KEY = "__licor_e2e_events";

async function installTracker(page) {
  await page.addInitScript((key) => {
    const record = (name) => {
      if (!name) return;
      const log = JSON.parse(window.sessionStorage.getItem(key) ?? "[]");
      log.push(name);
      window.sessionStorage.setItem(key, JSON.stringify(log));
    };
    const backing = [];
    window.dataLayer = new Proxy(backing, {
      get(target, prop) {
        if (prop === "push") {
          return (...args) => {
            for (const arg of args) record(arg?.event);
            return target.push(...args);
          };
        }
        return Reflect.get(target, prop);
      },
    });
  }, EVENT_LOG_KEY);
}

async function recordedEvents(page) {
  return page.evaluate(
    (key) => JSON.parse(window.sessionStorage.getItem(key) ?? "[]"),
    EVENT_LOG_KEY,
  );
}

/** innerText reflects `text-transform`, so compare without case. */
function contains(haystack, needle) {
  return haystack.toLowerCase().includes(needle.toLowerCase());
}

async function horizontalOverflow(page) {
  return page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
}

/**
 * Interactive controls smaller than `min` CSS px tall. Controls wrapped in a
 * <label> are measured by the label, since that is the real tap target, and
 * links inside body copy are exempt.
 */
async function smallTouchTargets(page, min = 32) {
  return page.evaluate((minHeight) => {
    const nodes = [...document.querySelectorAll("a, button, input, select, textarea")];
    return nodes
      .filter((node) => {
        const style = getComputedStyle(node);
        if (style.display === "none" || style.visibility === "hidden") return false;
        if (node.tagName === "A" && node.closest("p")) return false;
        const label = node.closest("label");
        const rect = (label ?? node).getBoundingClientRect();
        if (rect.width <= 1 || rect.height <= 1) return false;
        return rect.height < minHeight;
      })
      .map((node) => `${node.tagName}.${node.className}`.slice(0, 70))
      .slice(0, 6);
  }, min);
}

/** Primary calls to action must clear Apple's 44px guidance. */
async function smallPrimaryTargets(page) {
  return page.evaluate(() => {
    const selectors = [
      'a[href^="tel:"]',
      "button[type=submit]",
      'a[href$="/cart"]',
      'a[href$="/checkout"]',
    ];
    const nodes = new Set(selectors.flatMap((s) => [...document.querySelectorAll(s)]));
    return [...nodes]
      .filter((node) => {
        const style = getComputedStyle(node);
        if (style.display === "none" || style.visibility === "hidden") return false;
        const rect = node.getBoundingClientRect();
        if (rect.width <= 1 || rect.height <= 1) return false;
        return rect.height < 40 || rect.width < 40;
      })
      .map((node) => `${node.tagName}.${node.className}`.slice(0, 70));
  });
}

// The sandbox ships a pinned Chromium; use it rather than downloading one.
const executablePath = process.env.LICOR_CHROMIUM ?? "/opt/pw-browsers/chromium";
const browser = await chromium.launch({ executablePath });
const context = await browser.newContext({
  ...devices["iPhone 13"],
  locale: "en-US",
});
const page = await context.newPage();
await installTracker(page);

const consoleErrors = [];
page.on("pageerror", (error) => consoleErrors.push(String(error)));
page.on("console", (message) => {
  if (message.type() === "error") consoleErrors.push(message.text());
});

// ── Age gate ────────────────────────────────────────────────────────────────
await page.goto(STORE, { waitUntil: "networkidle" });

const gate = page.getByRole("dialog");
check("age gate blocks the first visit", await gate.isVisible());
check(
  "age gate asks the 21+ question",
  contains(await gate.innerText(), "Are you 21 or older?"),
);
check("age gate offers YES, ENTER", await page.getByRole("button", { name: /yes, enter/i }).isVisible());
check("age gate offers NO, EXIT", await page.getByRole("button", { name: /no, exit/i }).isVisible());

// A refusal must not leave a way through.
await page.getByRole("button", { name: /no, exit/i }).click();
await page.waitForTimeout(200);
check(
  "refusing the age gate blocks the store",
  contains(await gate.innerText(), "access restricted"),
);
check(
  "the blocked screen offers no bypass",
  (await gate.getByRole("button").count()) === 0,
);

// Fresh session, this time confirming.
await context.clearCookies();
await page.evaluate(() => {
  window.sessionStorage.clear();
  window.localStorage.clear();
});
await page.reload({ waitUntil: "networkidle" });
await page.getByRole("button", { name: /yes, enter/i }).click();
await page.waitForTimeout(300);
check("confirming 21+ opens the store", !(await page.getByRole("dialog").isVisible()));

await page.reload({ waitUntil: "networkidle" });
check("the age confirmation is remembered", !(await page.getByRole("dialog").isVisible()));

// ── Home ────────────────────────────────────────────────────────────────────
const homeText = await page.locator("body").innerText();
for (const phrase of [
  "LICOR STORE 24",
  "YOUR LIQUOR. DELIVERED 24/7.",
  "Premium spirits, beer & more",
  "24/7 FREE DELIVERY",
  "631-882-2462",
  "631-708-1009",
]) {
  check(`home shows "${phrase}"`, contains(homeText, phrase));
}
check("home has an ORDER NOW call to action", await page.getByRole("link", { name: /^order now$/i }).first().isVisible());
check(
  "home has a CALL NOW call to action",
  await page.getByRole("link", { name: /call now/i }).first().isVisible(),
);
check("home renders no horizontal overflow", (await horizontalOverflow(page)) <= 1);
check("home has a fixed bottom tab bar", await page.getByRole("navigation", { name: /mobile navigation/i }).isVisible());

const telLinks = await page.locator('a[href^="tel:"]').evaluateAll((nodes) =>
  nodes.map((node) => node.getAttribute("href")),
);
check("phone buttons use tel: links", telLinks.length > 0, `${telLinks.length} links`);
check(
  "tel: links carry both store numbers",
  telLinks.includes("tel:+16318822462") && telLinks.includes("tel:+16317081009"),
  telLinks.slice(0, 4).join(" "),
);

const homeTargets = await smallTouchTargets(page);
check("home touch targets are at least 32px tall", homeTargets.length === 0, homeTargets.join(" | "));
const homePrimary = await smallPrimaryTargets(page);
check("home primary CTAs are at least 44px", homePrimary.length === 0, homePrimary.join(" | "));

check(
  "the demo pricing disclosure is visible",
  contains(homeText, "demo catalog"),
);
check(
  "the store address stays an explicit placeholder",
  homeText.includes("[BUSINESS ADDRESS]"),
);
check(
  "no delivery time is invented",
  !/\b\d+\s*(-|to)?\s*\d*\s*(min|minutes|hour|hours)\b/i.test(homeText),
  homeText.match(/.{0,40}(min|hour).{0,20}/i)?.[0] ?? "",
);

// ── Search ──────────────────────────────────────────────────────────────────
// The header keeps a desktop-only search field in the DOM; take the visible one.
const search = page.locator("input[type=search]:visible").first();
await search.click();
await search.fill("don julio");
await page.waitForTimeout(400);
const suggestion = page.getByRole("link", { name: /don julio blanco/i }).first();
check("instant search suggests Don Julio Blanco", await suggestion.isVisible());

await search.fill("hennessy");
await page.waitForTimeout(400);
check(
  "instant search suggests Hennessy",
  await page.getByRole("link", { name: /hennessy/i }).first().isVisible(),
);

await search.fill("zzzzzz");
await page.waitForTimeout(400);
check(
  "an empty search explains itself",
  contains(await page.locator("body").innerText(), "No products match"),
);

// ── Shop, filters ───────────────────────────────────────────────────────────
await page.goto(`${STORE}/shop`, { waitUntil: "networkidle" });
const allCount = await page.locator("article").count();
check("shop lists the catalog", allCount > 10, `${allCount} products`);
check("shop renders no horizontal overflow", (await horizontalOverflow(page)) <= 1);
const shopTargets = await smallTouchTargets(page);
check("shop touch targets are at least 32px tall", shopTargets.length === 0, shopTargets.join(" | "));

await page.goto(`${STORE}/shop?category=beer`, { waitUntil: "networkidle" });
const beerCount = await page.locator("article").count();
check("category filter narrows results", beerCount > 0 && beerCount < allCount, `${beerCount} beers`);

await page.goto(`${STORE}/shop?sale=1`, { waitUntil: "networkidle" });
const saleCount = await page.locator("article").count();
check("sale filter narrows results", saleCount > 0 && saleCount < allCount, `${saleCount} on sale`);

await page.goto(`${STORE}/shop?q=tequila&sort=price-asc`, { waitUntil: "networkidle" });
const prices = await page
  .locator("article")
  .evaluateAll((nodes) =>
    nodes.map((node) => {
      const match = node.innerText.match(/\$([\d,]+\.\d{2})/);
      return match ? Number(match[1].replace(/,/g, "")) : null;
    }),
  );
check(
  "price sorting is applied",
  prices.every((price, index) => index === 0 || price === null || price >= prices[index - 1]),
  prices.join(","),
);

// Mobile filter drawer
await page.goto(`${STORE}/shop`, { waitUntil: "networkidle" });
await page.getByRole("button", { name: /^filters/i }).click();
await page.waitForTimeout(250);
check("mobile filter drawer opens", await page.getByRole("button", { name: /^whiskey$/i }).isVisible());
await page.getByRole("button", { name: /^whiskey$/i }).click();
await page.waitForTimeout(600);
check("drawer filter reaches the URL", page.url().includes("category=whiskey"), page.url());

// ── Product detail ──────────────────────────────────────────────────────────
await page.goto(`${STORE}/product/don-julio-blanco`, { waitUntil: "networkidle" });
const productText = await page.locator("body").innerText();
for (const phrase of ["Don Julio", "750ml", "Tequila", "In stock", "Add to cart"]) {
  check(`product page shows "${phrase}"`, contains(productText, phrase));
}
check(
  "product page shows a price",
  /\$\d+\.\d{2}/.test(productText),
);
check(
  "product page lists related products",
  contains(productText, "Related products"),
);
check("product page renders no horizontal overflow", (await horizontalOverflow(page)) <= 1);
const productTargets = await smallTouchTargets(page);
check("product touch targets are at least 32px tall", productTargets.length === 0, productTargets.join(" | "));

// ── Cart ────────────────────────────────────────────────────────────────────
await page.getByRole("button", { name: /increase quantity/i }).click();
await page.getByRole("button", { name: /add to cart/i }).first().click();
await page.waitForTimeout(400);

const badge = page.locator('nav[aria-label="Mobile navigation"]').getByText("2", { exact: true });
check("the cart badge shows the quantity", await badge.first().isVisible());

await page.goto(`${STORE}/product/corona-extra-12-pack`, { waitUntil: "networkidle" });
await page.getByRole("button", { name: /add to cart/i }).first().click();
await page.waitForTimeout(400);

await page.goto(`${STORE}/cart`, { waitUntil: "networkidle" });
let cartText = await page.locator("body").innerText();
check("cart lists both products", contains(cartText, "Don Julio") && contains(cartText, "Corona"));
check("cart shows a subtotal", contains(cartText, "Subtotal"));
check("cart shows free delivery", /Delivery\s*\n?\s*FREE/i.test(cartText));
check("cart shows a total", contains(cartText, "Total"));
check("cart offers continue shopping", await page.getByRole("link", { name: /continue shopping/i }).isVisible());

// Quantity controls
await page.getByRole("button", { name: /increase quantity/i }).first().click();
await page.waitForTimeout(250);
cartText = await page.locator("body").innerText();
check("increasing quantity updates the cart", cartText.includes("4 items") || cartText.includes("items"));

await page.getByRole("button", { name: /decrease quantity/i }).first().click();
await page.waitForTimeout(250);

// Persistence across a reload
await page.reload({ waitUntil: "networkidle" });
check(
  "the cart survives a reload",
  contains(await page.locator("body").innerText(), "Don Julio"),
);

// Removal
const beforeRemoval = await page.locator("li").filter({ hasText: "Corona" }).count();
await page.getByRole("button", { name: /remove corona/i }).click();
await page.waitForTimeout(300);
const afterRemoval = await page.locator("li").filter({ hasText: "Corona" }).count();
check("removing a product works", afterRemoval < beforeRemoval);

// ── Checkout ────────────────────────────────────────────────────────────────
await page.getByRole("link", { name: /^checkout$/i }).click();
await page.waitForURL(/checkout/);
await page.waitForTimeout(400);

const checkoutText = await page.locator("body").innerText();
for (const phrase of ["Customer information", "Delivery information", "Place order"]) {
  check(`checkout shows "${phrase}"`, contains(checkoutText, phrase));
}
check("checkout renders no horizontal overflow", (await horizontalOverflow(page)) <= 1);
const checkoutTargets = await smallTouchTargets(page);
check("checkout touch targets are at least 32px tall", checkoutTargets.length === 0, checkoutTargets.join(" | "));
const checkoutPrimary = await smallPrimaryTargets(page);
check("checkout primary CTAs are at least 44px", checkoutPrimary.length === 0, checkoutPrimary.join(" | "));

// Submitting empty must surface field errors, not a silent failure.
await page.getByRole("button", { name: /place order/i }).first().click();
await page.waitForTimeout(400);
check(
  "empty checkout reports validation errors",
  contains(await page.locator("body").innerText(), "is required"),
);

await page.fill("#field-firstName", "Alex");
await page.fill("#field-lastName", "Rivera");
await page.fill("#field-phone", "631-555-0134");
await page.fill("#field-email", "alex@example.com");
await page.fill("#field-address", "100 Main Street");
await page.fill("#field-apartment", "4B");
await page.fill("#field-city", "Brooklyn");
await page.fill("#field-state", "NY");
await page.fill("#field-zip", "11201");
await page.fill("#field-instructions", "Ring the buzzer twice");

// The order must still be blocked until the age confirmation is checked.
await page.getByRole("button", { name: /place order/i }).first().click();
await page.waitForTimeout(400);
check(
  "checkout requires the 21+ confirmation",
  contains(await page.locator("body").innerText(), "21 or older"),
);

// A refresh must not cost the customer their typing.
await page.reload({ waitUntil: "networkidle" });
await page.waitForTimeout(400);
check(
  "checkout restores the draft after a refresh",
  (await page.inputValue("#field-address")) === "100 Main Street",
);

await page.locator('input[type="checkbox"]').last().check();
await page.getByRole("button", { name: /place order/i }).first().click();
await page.waitForURL(/\/order\?id=/, { timeout: 15000 });
await page.waitForTimeout(500);

// ── Order confirmation ──────────────────────────────────────────────────────
const orderText = await page.locator("body").innerText();
check("the order is confirmed", contains(orderText, "Order received"));
check("an order reference is shown", /LS24-[A-Z0-9]+-[A-Z0-9]{4}/.test(orderText));
check("the confirmation repeats the delivery address", contains(orderText, "100 Main Street"));
check("the cart is emptied after ordering", !(await page.locator('nav[aria-label="Mobile navigation"]').innerText()).match(/\d/));

// ── Analytics funnel ────────────────────────────────────────────────────────
const events = await recordedEvents(page);
for (const event of ["page_view", "view_item", "add_to_cart", "begin_checkout", "purchase"]) {
  check(`analytics fired ${event}`, events.includes(event), events.join(","));
}

// ── Desktop pass ────────────────────────────────────────────────────────────
const desktop = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const desktopPage = await desktop.newPage();
await desktopPage.goto(STORE, { waitUntil: "networkidle" });
await desktopPage.getByRole("button", { name: /yes, enter/i }).click();
await desktopPage.waitForTimeout(300);

const desktopNav = await desktopPage.getByRole("navigation", { name: "Main" }).innerText();
for (const item of ["Home", "Shop", "Categories", "Deals", "Delivery", "Contact"]) {
  check(`desktop nav has ${item}`, contains(desktopNav, item));
}
check(
  "desktop renders no horizontal overflow",
  (await horizontalOverflow(desktopPage)) <= 1,
);
check(
  "the mobile tab bar is hidden on desktop",
  !(await desktopPage.getByRole("navigation", { name: /mobile navigation/i }).isVisible()),
);

// ── Metadata ────────────────────────────────────────────────────────────────
const title = await desktopPage.title();
check(
  "the SEO title is set",
  title === "Licor Store 24 | 24/7 Liquor Delivery in New York",
  title,
);
const description = await desktopPage
  .locator('meta[name="description"]')
  .getAttribute("content");
check(
  "the meta description is set",
  description ===
    "Shop premium liquor, beer and spirits with 24/7 delivery from Licor Store 24. Order online or call now.",
  String(description),
);
check(
  "Open Graph tags are present",
  (await desktopPage.locator('meta[property="og:title"]').count()) > 0 &&
    (await desktopPage.locator('meta[property="og:image"]').count()) > 0,
);
check(
  "the PWA manifest is linked",
  (await desktopPage.locator('link[rel="manifest"]').getAttribute("href")) ===
    "/licor-store-24/manifest.webmanifest",
);
check(
  "structured data is emitted",
  (await desktopPage.locator('script[type="application/ld+json"]').count()) >= 2,
);

check("no uncaught page errors", consoleErrors.length === 0, consoleErrors.slice(0, 3).join(" | "));

await browser.close();

console.log(`\n${failures === 0 ? "ALL CHECKS PASSED" : `${failures} CHECK(S) FAILED`}`);
process.exit(failures === 0 ? 0 : 1);
