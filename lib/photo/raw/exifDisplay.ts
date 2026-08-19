/**
 * Formatting for the metadata panel.
 *
 * One rule throughout: a value that the file did not record is shown as "—".
 * Nothing here substitutes a plausible default, because a wrong ISO or a
 * guessed aperture is worse than an honest blank when you are deciding how to
 * treat a photograph.
 */
import type { ExifData } from "../types";

export const MISSING = "—";

export function formatCamera(exif: ExifData): string {
  const parts = [exif.make, exif.model].filter(Boolean);
  if (parts.length === 0) return MISSING;
  // Sony writes "SONY" in Make and "ZV-E10" in Model; avoid "SONY SONY ZV-E10".
  if (parts.length === 2 && parts[1]!.toUpperCase().startsWith(parts[0]!.toUpperCase())) {
    return parts[1]!;
  }
  return parts.join(" ");
}

export function formatLens(exif: ExifData): string {
  if (exif.lensModel) return exif.lensModel;
  if (exif.lensTypeId !== undefined) return `Objetivo Sony id ${exif.lensTypeId}`;
  return MISSING;
}

export function formatIso(exif: ExifData): string {
  return exif.iso && exif.iso > 0 ? `ISO ${Math.round(exif.iso)}` : MISSING;
}

export function formatAperture(exif: ExifData): string {
  if (!exif.fNumber || exif.fNumber <= 0) return MISSING;
  // f/1.8 keeps its decimal; f/8 does not need one.
  const value = exif.fNumber < 10 ? exif.fNumber.toFixed(1).replace(/\.0$/, "") : String(Math.round(exif.fNumber));
  return `f/${value}`;
}

export function formatShutter(exif: ExifData): string {
  const seconds = exif.exposureTime;
  if (!seconds || seconds <= 0) return MISSING;
  if (seconds >= 1) return `${seconds.toFixed(seconds >= 10 ? 0 : 1).replace(/\.0$/, "")} s`;
  return `1/${Math.round(1 / seconds)} s`;
}

export function formatFocalLength(exif: ExifData): string {
  if (!exif.focalLength || exif.focalLength <= 0) return MISSING;
  const base = `${Math.round(exif.focalLength)} mm`;
  if (exif.focalLength35mm && Math.round(exif.focalLength35mm) !== Math.round(exif.focalLength)) {
    return `${base} (${Math.round(exif.focalLength35mm)} mm equiv.)`;
  }
  return base;
}

/** EXIF LightSource enumeration, for the cases the standard actually names. */
const LIGHT_SOURCES: Record<number, string> = {
  1: "Luz de día",
  2: "Fluorescente",
  3: "Tungsteno",
  4: "Flash",
  9: "Buen tiempo",
  10: "Nublado",
  11: "Sombra",
  12: "Fluorescente luz día",
  13: "Fluorescente blanco día",
  14: "Fluorescente blanco frío",
  15: "Fluorescente blanco",
  17: "Estándar A",
  18: "Estándar B",
  19: "Estándar C",
  20: "D55",
  21: "D65",
  22: "D75",
  23: "D50",
};

/**
 * White balance as the camera recorded it, with the source of each part made
 * explicit: a MakerNote Kelvin reading is a measurement, a LightSource code is
 * only a mode.
 */
export function formatWhiteBalance(exif: ExifData): string {
  const parts: string[] = [];

  if (exif.whiteBalanceSetting) parts.push(exif.whiteBalanceSetting);
  else if (exif.whiteBalanceMode === 1) parts.push("Manual");
  else if (exif.whiteBalanceMode === 0) parts.push("Automático");

  if (exif.colorTemperature) parts.push(`${exif.colorTemperature} K`);
  else if (exif.lightSource !== undefined && LIGHT_SOURCES[exif.lightSource]) {
    parts.push(LIGHT_SOURCES[exif.lightSource]);
  }

  return parts.length > 0 ? parts.join(" · ") : MISSING;
}

export function formatFlash(exif: ExifData): string {
  if (exif.flash === undefined) return MISSING;
  const fired = (exif.flash & 0x1) === 1;
  if (!fired) return "No disparó";
  const bounced = (exif.flash & 0x40) !== 0;
  return bounced ? "Disparó (sin retorno)" : "Disparó";
}

export function formatCaptureDate(exif: ExifData): string {
  if (!exif.capturedAt) return exif.dateTimeOriginal ?? MISSING;
  return new Date(exif.capturedAt).toLocaleString("es-EC", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatDimensions(exif: ExifData): string {
  if (!exif.width || !exif.height) return MISSING;
  const megapixels = (exif.width * exif.height) / 1_000_000;
  return `${exif.width} × ${exif.height} (${megapixels.toFixed(1)} MP)`;
}

export function formatMakerNotes(exif: ExifData): string {
  if (!exif.makerNotes) return MISSING;
  const known: string[] = [];
  if (exif.colorTemperature) known.push("temperatura de color");
  if (exif.whiteBalanceSetting) known.push("balance de blancos");
  if (exif.lensTypeId !== undefined) known.push("tipo de objetivo");
  return known.length > 0
    ? `Leídos: ${known.join(", ")}`
    : "Presentes, sin campos legibles (Sony cifra la mayoría)";
}

export interface MetadataRow {
  label: string;
  value: string;
  /** True when the file simply did not record it. */
  missing: boolean;
}

/** The metadata panel, in the order a photographer reads it. */
export function metadataRows(exif: ExifData): MetadataRow[] {
  const rows: Array<[string, string]> = [
    ["Cámara", formatCamera(exif)],
    ["Objetivo", formatLens(exif)],
    ["ISO", formatIso(exif)],
    ["Apertura", formatAperture(exif)],
    ["Velocidad", formatShutter(exif)],
    ["Distancia focal", formatFocalLength(exif)],
    ["Balance de blancos", formatWhiteBalance(exif)],
    ["Flash", formatFlash(exif)],
    ["Fecha", formatCaptureDate(exif)],
    ["Resolución", formatDimensions(exif)],
    ["MakerNotes", formatMakerNotes(exif)],
  ];
  return rows.map(([label, value]) => ({ label, value, missing: value === MISSING }));
}
