import { WHATSAPP_NUMBER } from "./site";

export function waLink(text?: string) {
  const base = `https://wa.me/${WHATSAPP_NUMBER}`;
  return text ? `${base}?text=${encodeURIComponent(text)}` : base;
}

export const WA_DEFAULT = "Hola ALVITEC, quiero solicitar una cotización.";

export function waService(service: string) {
  return waLink(`Hola ALVITEC, quiero solicitar una cotización de: ${service}.`);
}

/** Arma un mensaje con líneas "Etiqueta: valor", omitiendo las vacías. */
export function buildMessage(intro: string, rows: Array<[label: string, value: string | undefined | null]>) {
  const lines = rows
    .map(([label, value]) => [label, (value ?? "").trim()] as const)
    .filter(([, value]) => value.length > 0)
    .map(([label, value]) => `*${label}:* ${value}`);
  return [intro, "", ...lines].join("\n");
}
