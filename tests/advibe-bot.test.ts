/* eslint-disable @typescript-eslint/no-explicit-any -- el bot es JavaScript de Apps Script sin tipos; se prueba dentro de un vm. */
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { randomUUID } from "node:crypto";
import vm from "node:vm";

// El bot corre en Apps Script con la zona del proyecto (America/Guayaquil).
process.env.TZ = "America/Guayaquil";

const SOURCE = readFileSync(new URL("../apps-script/advibe-bot/Bot.gs", import.meta.url), "utf8");
const HEADERS = {
  CLIENTES: ["ID", "Cliente", "Nombre comercial", "Teléfono", "WhatsApp", "Email", "Ciudad", "Servicio", "Mensualidad", "Día de pago", "Estado"],
  COBROS: ["ID", "Cliente", "Periodo", "Concepto", "Monto", "Fecha vencimiento", "Total pagado", "Saldo", "Estado", "Calendar Event ID", "Notas"],
  PAGOS: ["ID", "Cobro ID", "Cliente", "Fecha", "Monto", "Método", "Referencia", "Nota"],
  TAREAS: ["ID", "Cliente", "Título", "Descripción", "Fecha", "Hora", "Prioridad", "Estado", "Responsable", "Origen", "Calendar Event ID", "Notas"],
  LOG: ["Fecha", "Hora", "Usuario", "Acción", "Cliente", "Dato anterior", "Dato nuevo", "Resultado"],
};
const client = (id: string, name: string, monthly: number, day: number | string, state = "ACTIVO") =>
  [id, name, "", "", "", "", "", "", monthly, day, state];

function formatDate(d: Date, tz: string, pattern: string) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23" })
      .formatToParts(d).map((p) => [p.type, p.value]),
  );
  return pattern.replace("yyyy", parts.year).replace("MM", parts.month).replace("dd", parts.day)
    .replace("HH", parts.hour).replace("mm", parts.minute).replace("ss", parts.second);
}

function fakeSheet(data: unknown[][]) {
  const range = (row: number, col: number, nr = 1, nc = 1) => ({
    setValue(v: unknown) { while (data.length < row) data.push([]); data[row - 1][col - 1] = v; return this; },
    setValues(vs: unknown[][]) { vs.forEach((r, i) => r.forEach((v, j) => { data[row - 1 + i][col - 1 + j] = v; })); return this; },
    setNumberFormat() { return this; },
    getValues() { return data.slice(row - 1, row - 1 + nr).map((r) => Array.from({ length: nc }, (_, j) => r[col - 1 + j] ?? "")); },
  });
  return {
    data,
    getDataRange: () => ({ getValues: () => data.map((r) => [...r]) }),
    appendRow: (r: unknown[]) => { data.push([...r]); },
    getLastRow: () => data.length,
    getRange: range,
  };
}

function loadBot(opts: { now: Date; clients?: unknown[][]; cobros?: unknown[][]; tareas?: unknown[][]; claude?: object[]; props?: Record<string, string> }) {
  const sheets: Record<string, ReturnType<typeof fakeSheet>> = {
    CLIENTES: fakeSheet([HEADERS.CLIENTES, ...(opts.clients ?? [])]),
    COBROS: fakeSheet([HEADERS.COBROS, ...(opts.cobros ?? [])]),
    PAGOS: fakeSheet([HEADERS.PAGOS]),
    TAREAS: fakeSheet([HEADERS.TAREAS, ...(opts.tareas ?? [])]),
    LOG: fakeSheet([HEADERS.LOG]),
  };
  const props: Record<string, string> = { TELEGRAM_TOKEN: "t", ANTHROPIC_API_KEY: "a", WEBHOOK_KEY: "secret", OWNER_CHAT_ID: "42", ...(opts.props ?? {}) };
  const cache = new Map<string, string>();
  const claude = [...(opts.claude ?? [])];
  const claudeRequests: any[] = [];
  const telegram: { method: string; payload: any }[] = [];
  const RealDate = Date;
  const FixedDate = class extends RealDate {
    constructor(...args: any[]) { if (args.length) super(...(args as [])); else super(opts.now.getTime()); }
    static now() { return opts.now.getTime(); }
  };
  const json = (code: number, body: unknown) => ({ getResponseCode: () => code, getContentText: () => JSON.stringify(body) });
  const ctx: any = {
    Date: FixedDate, console: { log() {}, error() {}, warn() {} },
    PropertiesService: { getScriptProperties: () => ({ getProperty: (k: string) => props[k] ?? null, setProperty: (k: string, v: string) => { props[k] = v; } }) },
    SpreadsheetApp: { openById: () => ({ getSheetByName: (n: string) => sheets[n] ?? null }) },
    Utilities: { formatDate, getUuid: () => randomUUID(), base64Encode: (b: number[]) => Buffer.from(b).toString("base64") },
    LockService: { getScriptLock: () => ({ waitLock() {}, releaseLock() {} }) },
    CacheService: { getScriptCache: () => ({ get: (k: string) => cache.get(k) ?? null, put: (k: string, v: string) => cache.set(k, v), remove: (k: string) => cache.delete(k) }) },
    ContentService: { createTextOutput: (t: string) => t },
    UrlFetchApp: {
      fetch(url: string, o: any) {
        if (url.startsWith("https://api.anthropic.com/")) {
          claudeRequests.push({ headers: o.headers, body: JSON.parse(o.payload) });
          const next = claude.shift();
          if (!next) throw new Error("Claude sin respuesta preparada");
          return json(200, next);
        }
        const method = url.split("/").pop()!;
        telegram.push({ method, payload: JSON.parse(o.payload) });
        return json(200, { ok: true, result: {} });
      },
    },
  };
  vm.createContext(ctx);
  vm.runInContext(SOURCE, ctx);
  const post = (update: object) => ctx.doPost({ parameter: { k: "secret" }, postData: { contents: JSON.stringify(update) } });
  return { ctx, sheets, props, telegram, claudeRequests, post };
}

const CLIENTS = [
  client("CLI-001", "KAMAUTO", 200, 2),
  client("CLI-002", "MUEBLES IDEAL", 200, 2),
  client("CLI-003", "PAOLA MIGUITAMA", 150, 5),
  client("CLI-004", "CLUB SANTA BÁRBARA CUENCA", 100, 9),
  client("CLI-006", "AM MOTORSPORT", 150, 14),
  client("CLI-007", "CETAD SAN LUCAS", 200, "PENDIENTE_DEFINICION", ""),
];
// Lunes 5 de octubre de 2026, 10:00 en Guayaquil.
const NOW = new Date("2026-10-05T10:00:00-05:00");

test("dueKey no se pasa del último día del mes", () => {
  const { ctx } = loadBot({ now: NOW });
  assert.equal(ctx.dueKey("2026-02", 31), "2026-02-28");
  assert.equal(ctx.dueKey("2026-10", 2), "2026-10-02");
  assert.equal(ctx.dueKey("2026-10", 0), "");
  assert.deepEqual([...ctx.periodsFrom("2026-11", "2027-02")], ["2026-11", "2026-12", "2027-01", "2027-02"]);
});

test("cobros pendientes: vencidos, hoy y próximos; ignora inactivos, pagados y lo anterior a COBROS_DESDE", () => {
  const { ctx } = loadBot({ now: NOW });
  const cobros = [
    HEADERS.COBROS,
    ["COB-1", "Muebles Ideal", "2026-10", "Mensualidad", 200, "", 200, 0, "PAGADO"],
    ["COB-2", "KAMAUTO", "2026-09", "Mensualidad", 200, "", 0, 200, "VENCIDO"],
  ];
  const list = ctx.pendingPayments([HEADERS.CLIENTES, ...CLIENTS], cobros, NOW, "2026-10", 7);
  assert.deepEqual(JSON.parse(JSON.stringify(list.map((p: any) => [p.client, p.balance, p.days]))), [
    ["KAMAUTO", 200, -3],
    ["PAOLA MIGUITAMA", 150, 0],
    ["CLUB SANTA BÁRBARA CUENCA", 100, 4],
  ]);
});

test("un abono deja el saldo pendiente", () => {
  const { ctx } = loadBot({ now: NOW });
  const cobros = [HEADERS.COBROS, ["COB-1", "MUEBLES IDEAL", new Date(2026, 9, 1), "Mensualidad", 200, "", 100, 100, "ABONO"]];
  const p = ctx.pendingPayments([HEADERS.CLIENTES, ...CLIENTS], cobros, NOW, "2026-10", 0).find((x: any) => x.client === "MUEBLES IDEAL");
  assert.equal(p.balance, 100);
});

test("el resumen lista vencidos, próximos y tareas con su hora", () => {
  const tareas = [
    ["TSK-A", "KAMAUTO", "Llamar a Kamauto", "", new Date(2026, 9, 5), "15:00", "", "PENDIENTE"],
    ["TSK-B", "", "Tarea vieja de la app", "", new Date(2026, 9, 4, 9, 30), new Date(1899, 11, 30, 9, 30), "", "PENDIENTE"],
    ["TSK-C", "", "Ya hecha", "", new Date(2026, 9, 5), "09:00", "", "COMPLETADA"],
  ];
  const { ctx } = loadBot({ now: NOW, clients: CLIENTS, tareas });
  const text = ctx.currentSummary();
  assert.match(text, /🔴 Cobros vencidos:\n• KAMAUTO — \$200 \(2026-10, venció hace 3 días\)/);
  assert.match(text, /• PAOLA MIGUITAMA — \$150 \(hoy\)/);
  assert.match(text, /• Llamar a Kamauto \(KAMAUTO\) — hoy 15:00 \[TSK-A\]/);
  assert.match(text, /• Tarea vieja de la app — venció hace 1 día 09:30 \[TSK-B\]/);
  assert.doesNotMatch(text, /Ya hecha/);
  assert.doesNotMatch(text, /AM MOTORSPORT/); // vence en 9 días
});

test("pago: no escribe hasta el botón; al confirmar crea COBROS, PAGOS y LOG", () => {
  const bot = loadBot({
    now: NOW, clients: CLIENTS,
    claude: [
      { stop_reason: "tool_use", content: [{ type: "tool_use", id: "tu1", name: "registrar_pago", input: { cliente_id: "CLI-001" } }] },
      { stop_reason: "end_turn", content: [{ type: "text", text: "Kamauto, $200 de octubre." }] },
    ],
  });
  bot.post({ update_id: 10, message: { chat: { id: 42 }, text: "ya me pagó kamauto" } });

  assert.equal(bot.sheets.COBROS.data.length, 1, "no escribe antes de confirmar");
  const ask = bot.telegram.find((t) => t.method === "sendMessage")!.payload;
  assert.match(ask.text, /¿Registro KAMAUTO \$200 \(2026-10\)\?/);
  const yes = ask.reply_markup.inline_keyboard[0][0].callback_data;

  const req = bot.claudeRequests[0];
  assert.equal(req.body.model, "claude-opus-5-5");
  assert.equal(req.body.fallbacks, "default");
  assert.equal(req.headers["anthropic-beta"], "server-side-fallback-2026-07-01");
  assert.deepEqual(bot.claudeRequests[1].body.messages[1].content, [{ type: "tool_use", id: "tu1", name: "registrar_pago", input: { cliente_id: "CLI-001" } }]);

  bot.post({ update_id: 11, callback_query: { id: "q", data: yes, message: { chat: { id: 42 }, message_id: 7 } } });
  const cobro = bot.sheets.COBROS.data[1];
  assert.deepEqual([cobro[1], cobro[2], cobro[4], cobro[6], cobro[7], cobro[8]], ["KAMAUTO", "2026-10", 200, 200, 0, "PAGADO"]);
  assert.equal(formatDate(cobro[5] as Date, "America/Guayaquil", "yyyy-MM-dd"), "2026-10-02");
  assert.deepEqual([bot.sheets.PAGOS.data[1][1], bot.sheets.PAGOS.data[1][4]], [cobro[0], 200]);
  assert.equal(bot.sheets.LOG.data.length, 2);
  assert.match(bot.telegram.at(-1)!.payload.text, /KAMAUTO pagó \$200 \(2026-10\)\. Mes al día\./);

  // Telegram reintenta el mismo update (302 de Apps Script): no se registra dos veces.
  bot.post({ update_id: 11, callback_query: { id: "q", data: yes, message: { chat: { id: 42 }, message_id: 7 } } });
  assert.equal(bot.sheets.PAGOS.data.length, 2);
});

test("abono sobre un cobro existente", () => {
  const bot = loadBot({ now: NOW, clients: CLIENTS, cobros: [["COB-9", "MUEBLES IDEAL", "2026-10", "Mensualidad", 200, "", 0, 200, "VENCIDO"]] });
  const plan = bot.ctx.planPayment({ cliente_id: "CLI-002", monto: 100 });
  assert.equal(plan.period, "2026-10");
  assert.match(bot.ctx.applyPayment(plan), /Queda saldo \$100/);
  assert.deepEqual(bot.sheets.COBROS.data[1].slice(6, 9), [100, 100, "ABONO"]);
});

test("ignora chats ajenos y peticiones sin la clave del webhook", () => {
  const bot = loadBot({ now: NOW, clients: CLIENTS });
  bot.post({ update_id: 1, message: { chat: { id: 99 }, text: "hola" } });
  assert.equal(bot.ctx.doPost({ parameter: { k: "otra" }, postData: { contents: "{}" } }), "no");
  assert.equal(bot.telegram.length, 0);
});

test("/start vincula el primer chat solo dentro de la ventana de conectarTelegram", () => {
  const late = loadBot({ now: NOW, clients: CLIENTS, props: { OWNER_CHAT_ID: "", BIND_UNTIL: String(NOW.getTime() - 1) } });
  late.post({ update_id: 1, message: { chat: { id: 5 }, text: "/start" } });
  assert.equal(late.props.OWNER_CHAT_ID, "");

  const ok = loadBot({ now: NOW, clients: CLIENTS, props: { OWNER_CHAT_ID: "", BIND_UNTIL: String(NOW.getTime() + 60000) } });
  ok.post({ update_id: 1, message: { chat: { id: 5 }, text: "/start" } });
  assert.equal(ok.props.OWNER_CHAT_ID, "5");
});

test("recordatorio: se crea con hora en texto y avisa una sola vez cuando llega la hora", () => {
  const bot = loadBot({ now: NOW, clients: CLIENTS });
  assert.match(bot.ctx.createReminder({ titulo: "Llamar a Gualaceo", fecha: "2026-10-05", hora: "9:45" }), /lunes 5\/10 a las 09:45/);
  const row = bot.sheets.TAREAS.data[1];
  assert.equal(row[5], "09:45");

  bot.ctx.revisarRecordatorios();
  bot.ctx.revisarRecordatorios();
  const sent = bot.telegram.filter((t) => t.method === "sendMessage");
  assert.equal(sent.length, 1);
  assert.match(sent[0].payload.text, /⏰ Llamar a Gualaceo 09:45/);
  assert.equal(sent[0].payload.reply_markup.inline_keyboard[0][0].callback_data, `task:${row[0]}`);
});

test("no avisa recordatorios futuros", () => {
  const bot = loadBot({ now: NOW, clients: CLIENTS, tareas: [["TSK-F", "", "Grabar", "", new Date(2026, 9, 5), "18:00", "", "PENDIENTE"]] });
  bot.ctx.revisarRecordatorios();
  assert.equal(bot.telegram.length, 0);
});
