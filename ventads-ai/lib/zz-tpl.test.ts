import { test } from "vitest";
import { readFileSync, writeFileSync } from "node:fs";
import { renderTemplate } from "@/lib/templates/render";
import type { AdContent } from "@/lib/templates/types";

const content: AdContent = {
  kicker: "Juego de sala",
  title: "Imperial",
  subtitle: "Elegancia, comodidad y estilo para transformar tu sala.",
  price: "$1.299",
  includes: ["Sofá triple", "Sofá doble", "2 poltronas", "Mesa de centro"],
  benefits: ["Estructura de madera de alta calidad", "Tapizado antifluido fácil de limpiar", "Durabilidad y confort", "Diseño moderno y elegante"],
  promotions: [
    { value: "15%", label: "de descuento", detail: "En TODA la tienda", note: "(Para pagos en efectivo)" },
    { value: "5%", label: "de descuento", detail: "Si difieres a 6 meses sin intereses", note: "Con cualquier tarjeta" },
    { value: "12", label: "meses sin intereses", detail: "Con cualquier tarjeta", note: "(Del precio marcado)" },
  ],
  cta: "Escríbenos",
  whatsapp: "099 336 1284",
  footerNote: "Envío a todo el país",
};
test("tpl", async () => {
  const scene = readFileSync("/tmp/claude-0/-home-user-advibe/fe9e5df8-0d60-5a02-99c3-b1283550b7c0/scratchpad/../images/2.jpg");
  const logo = readFileSync("/tmp/claude-0/-home-user-advibe/fe9e5df8-0d60-5a02-99c3-b1283550b7c0/scratchpad/logo-mi.png");
  for (const concept of ["VENTA_DIRECTA", "CARACTERISTICA", "ASPIRACIONAL"])
    for (const formatId of ["SQUARE_1_1", "PORTRAIT_4_5", "STORY_9_16"]) {
      const t = Date.now();
      const r = await renderTemplate({ formatId, conceptType: concept, content, brand: { name: "Muebles Ideal", logo, primary: "#0b5d2e", accent: "#c9a227" }, scene, sceneSource: "original" });
      writeFileSync("/tmp/claude-0/-home-user-advibe/fe9e5df8-0d60-5a02-99c3-b1283550b7c0/scratchpad/t-" + concept + "-" + formatId + ".jpg", r.buffer);
      process.stderr.write(concept + " " + formatId + " " + (Date.now() - t) + "ms " + JSON.stringify(r.meta) + "\n");
    }
}, 300000);
