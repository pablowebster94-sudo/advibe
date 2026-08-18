/**
 * XMP sidecar serialisation.
 *
 * Produces a file byte-for-byte compatible with what Lightroom Classic writes
 * next to a RAW: an `xpacket` wrapper, one `rdf:Description` carrying the `crs`
 * properties as attributes, and element form only where the schema requires a
 * container (the tone curves).
 *
 * The original RAW is never touched. `DSC08487.ARW` keeps its bytes and gains a
 * neighbouring `DSC08487.xmp`.
 */
import type { Adjustments, ExifData } from "../types";
import { CRS_NAMESPACE, PHOTOSHOP_NAMESPACE, XMP_NAMESPACE } from "./crs";
import { type CrsOptions, type CrsProperty, toCrsProperties, toneCurveSequence } from "./crs";

const TOOL_NAME = "AdVibe AI Photo Editor";

export function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function formatValue(property: CrsProperty): string {
  switch (property.kind) {
    case "boolean":
      return property.value ? "True" : "False";
    case "integer":
      return String(Math.round(Number(property.value)));
    case "real": {
      const number = Number(property.value);
      // Camera Raw writes Exposure2012 with an explicit sign; matching that
      // keeps diffs against Lightroom's own sidecars readable.
      const text = number.toFixed(countDecimals(property.value));
      return number > 0 ? `+${text}` : text;
    }
    default:
      return escapeXml(String(property.value));
  }
}

function countDecimals(value: CrsProperty["value"]): number {
  const text = String(value);
  const dot = text.indexOf(".");
  return dot === -1 ? 2 : Math.max(2, text.length - dot - 1);
}

export interface WriteXmpOptions extends CrsOptions {
  /** Original file name, e.g. `DSC08487.ARW`. */
  fileName?: string;
  exif?: ExifData;
  /** Overridable so tests produce stable output. */
  modifyDate?: Date;
  /** 1-5 star rating, written to xmp:Rating when set. */
  rating?: number;
  /** Colour label written to xmp:Label. */
  label?: string;
}

/** `2026-08-18T14:03:11+02:00` — the form Adobe writes into xmp:ModifyDate. */
export function formatXmpDate(date: Date): string {
  const pad = (value: number, size = 2) => String(Math.abs(value)).padStart(size, "0");
  const offsetMinutes = -date.getTimezoneOffset();
  const sign = offsetMinutes >= 0 ? "+" : "-";
  const offset =
    offsetMinutes === 0
      ? "Z"
      : `${sign}${pad(Math.floor(Math.abs(offsetMinutes) / 60))}:${pad(Math.abs(offsetMinutes) % 60)}`;
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    `T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}${offset}`
  );
}

export function buildXmp(adjustments: Adjustments, options: WriteXmpOptions): string {
  const properties = toCrsProperties(adjustments, {
    isRaw: options.isRaw,
    rawFileName: options.rawFileName ?? options.fileName,
  });

  const attributes = properties
    .map((property) => `   crs:${property.name}="${formatValue(property)}"`)
    .join("\n");

  const modifyDate = formatXmpDate(options.modifyDate ?? new Date());
  const extra: string[] = [
    `   xmp:CreatorTool="${escapeXml(TOOL_NAME)}"`,
    `   xmp:ModifyDate="${modifyDate}"`,
    `   xmp:MetadataDate="${modifyDate}"`,
  ];
  if (typeof options.rating === "number") {
    extra.push(`   xmp:Rating="${Math.round(options.rating)}"`);
  }
  if (options.label) {
    extra.push(`   xmp:Label="${escapeXml(options.label)}"`);
  }
  if (options.fileName) {
    extra.push(`   photoshop:SidecarForExtension="${escapeXml(extensionOf(options.fileName))}"`);
  }

  const curve = toneCurveSequence(adjustments);
  const curveElement = [
    "   <crs:ToneCurvePV2012>",
    "    <rdf:Seq>",
    ...curve.map((point) => `     <rdf:li>${point}</rdf:li>`),
    "    </rdf:Seq>",
    "   </crs:ToneCurvePV2012>",
  ].join("\n");

  return `<?xpacket begin="﻿" id="W5M0MpCehiHzreSzNTczkc9d"?>
<x:xmpmeta xmlns:x="adobe:ns:meta/" x:xmptk="${escapeXml(TOOL_NAME)}">
 <rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">
  <rdf:Description rdf:about=""
    xmlns:xmp="${XMP_NAMESPACE}"
    xmlns:photoshop="${PHOTOSHOP_NAMESPACE}"
    xmlns:crs="${CRS_NAMESPACE}"
${extra.join("\n")}
${attributes}>
${curveElement}
  </rdf:Description>
 </rdf:RDF>
</x:xmpmeta>
<?xpacket end="w"?>
`;
}

function extensionOf(fileName: string): string {
  const dot = fileName.lastIndexOf(".");
  return dot === -1 ? "" : fileName.slice(dot + 1).toUpperCase();
}

/** `DSC08487.ARW` -> `DSC08487.xmp`, the name Lightroom Classic looks for. */
export function sidecarName(fileName: string): string {
  const dot = fileName.lastIndexOf(".");
  const base = dot <= 0 ? fileName : fileName.slice(0, dot);
  return `${base}.xmp`;
}
