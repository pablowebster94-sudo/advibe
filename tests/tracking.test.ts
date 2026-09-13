import { test } from "node:test";
import assert from "node:assert/strict";

type Pushed = Record<string, unknown>;

function installWindow(search = "") {
  const pushed: Pushed[] = [];
  const gtagCalls: Array<[string, Record<string, unknown> | undefined]> = [];

  (globalThis as { window?: unknown }).window = {
    location: { search, origin: "https://www.advibeagencia.com", href: `https://www.advibeagencia.com/${search}` },
    dataLayer: pushed,
    gtag: (_command: string, name: string, params?: Record<string, unknown>) => gtagCalls.push([name, params]),
  };

  return { pushed, gtagCalls };
}

function clearWindow() {
  delete (globalThis as { window?: unknown }).window;
}

test("trackViewOnce dispara una sola vez por carga y adjunta los UTMs", async () => {
  const { pushed, gtagCalls } = installWindow("?utm_source=instagram&utm_medium=bio&utm_campaign=diagnostic_funnel");
  const { trackViewOnce } = await import("../lib/tracking");

  assert.equal(trackViewOnce("diagnostic_form_view", { source: "digital_audit_form" }), true);
  assert.equal(trackViewOnce("diagnostic_form_view", { source: "digital_audit_form" }), false);

  assert.equal(pushed.length, 1);
  assert.deepEqual(pushed[0], {
    event: "diagnostic_form_view",
    source: "digital_audit_form",
    utm_source: "instagram",
    utm_medium: "bio",
    utm_campaign: "diagnostic_funnel",
  });
  assert.equal(gtagCalls.length, 1);
  assert.equal(gtagCalls[0][0], "diagnostic_form_view");

  clearWindow();
});

test("observeViewOnce solo registra cuando el elemento entra en el viewport", async () => {
  const { pushed } = installWindow();
  const { observeViewOnce } = await import("../lib/tracking");

  let captured: ((entries: Array<{ isIntersecting: boolean }>) => void) | undefined;
  let disconnected = false;
  const observed: unknown[] = [];

  (globalThis as { IntersectionObserver?: unknown }).IntersectionObserver = class {
    constructor(callback: (entries: Array<{ isIntersecting: boolean }>) => void) {
      captured = callback;
    }
    observe(element: unknown) {
      observed.push(element);
    }
    disconnect() {
      disconnected = true;
    }
  };

  const element = {} as Element;
  const cleanup = observeViewOnce(element, "hero_section_view");

  assert.deepEqual(observed, [element]);
  assert.equal(pushed.length, 0, "no se registra nada antes de ser visible");

  captured?.([{ isIntersecting: false }]);
  assert.equal(pushed.length, 0, "un entry no visible no dispara el evento");

  captured?.([{ isIntersecting: true }]);
  assert.equal(pushed.length, 1);
  assert.equal(pushed[0].event, "hero_section_view");
  assert.equal(disconnected, true, "deja de observar tras el primer registro");

  cleanup();
  delete (globalThis as { IntersectionObserver?: unknown }).IntersectionObserver;
  clearWindow();
});

test("observeViewOnce no hace nada sin elemento", async () => {
  const { pushed } = installWindow();
  const { observeViewOnce } = await import("../lib/tracking");

  observeViewOnce(null, "seccion_inexistente")();
  assert.equal(pushed.length, 0);

  clearWindow();
});
