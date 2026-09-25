/**
 * Exposure assessment.
 *
 * Deliberately conservative. A photo that is already well exposed gets an
 * `evOffset` of exactly 0 — the deadband below exists so the engine never
 * "corrects" a frame the photographer already nailed.
 */
import type { ExifData, ExposureAssessment, ExposureVerdict, ToneStats } from "../types";
import { clamp, round } from "./image";

/**
 * Acceptable midtone band in sRGB display space.
 *
 * This is a band, not a target, and that distinction is the whole point. A
 * fixed target would drag every frame to the same brightness — the "preset
 * pretending to be AI" failure mode. Anything whose reference tone already
 * falls inside the band is declared correct and left alone; anything outside is
 * moved only as far as the nearest edge, never to the centre.
 *
 * The lower bound sits near a deep-but-printable midtone and the upper bound
 * near a bright high-key one, which together cover how a church interior and a
 * beach portrait are each *supposed* to look.
 */
export const MIDTONE_MIN = 0.32;
export const MIDTONE_MAX = 0.55;

/** Below this the change is not worth making, and making it only adds noise. */
const EV_DEADBAND = 0.08;

/**
 * How far above pure white we tolerate pushing the highlight reference, and how
 * much of that the Highlights slider is expected to buy back. Exposure and
 * Highlights are applied together by the engine, so the exposure guard would be
 * far too timid if it ignored the recovery that follows it.
 */
const HIGHLIGHT_CEILING = 1.06;
const HIGHLIGHT_SLIDER_CREDIT = 0.4;

/** Exposure change in EV that would move `value` onto `target`. */
function stopsBetween(value: number, target: number): number {
  return Math.log2(target / Math.max(0.01, value));
}

export function assessExposure(
  tone: ToneStats,
  exif: ExifData,
  isRaw: boolean,
): ExposureAssessment {
  const verdicts: ExposureVerdict[] = [];
  const notes: string[] = [];

  // Weighted towards the median so a large black suit or a blown window does not
  // drag the estimate the way a plain mean would.
  const reference = 0.6 * tone.median + 0.4 * tone.mean;

  let ev = 0;
  if (reference < MIDTONE_MIN) ev = stopsBetween(reference, MIDTONE_MIN);
  else if (reference > MIDTONE_MAX) ev = stopsBetween(reference, MIDTONE_MAX);

  // Never push exposure so far that highlights which are still intact are lost.
  // Pixels that are *already* clipped are a sunk cost and do not constrain us.
  if (ev > 0) {
    const allowed =
      stopsBetween(tone.highlightReference, HIGHLIGHT_CEILING) + HIGHLIGHT_SLIDER_CREDIT;
    ev = Math.min(ev, Math.max(0, allowed));
  }
  ev = clamp(ev, -2.5, 2.5);
  if (Math.abs(ev) < EV_DEADBAND) ev = 0;

  if (reference < MIDTONE_MIN) {
    verdicts.push("underexposed");
    notes.push(
      `Subexposición: el tono de referencia está en ${(reference * 100).toFixed(0)}% y la banda ` +
        `correcta empieza en ${(MIDTONE_MIN * 100).toFixed(0)}%.`,
    );
    if (ev === 0) {
      notes.push("No se levanta exposición porque destruiría altas luces todavía recuperables.");
    }
  }
  if (reference > MIDTONE_MAX) {
    verdicts.push("overexposed");
    notes.push(
      `Sobreexposición: el tono de referencia está en ${(reference * 100).toFixed(0)}% y la banda ` +
        `correcta termina en ${(MIDTONE_MAX * 100).toFixed(0)}%.`,
    );
  }
  if (tone.highlightClipping > 0.02) {
    verdicts.push("clipped-highlights");
  }
  if (tone.shadowClipping > 0.06 && tone.p05 < 0.03) {
    verdicts.push("crushed-shadows");
    notes.push("Sombras muy cerradas: hay zonas sin información por debajo del 3%.");
  }
  if (tone.stdDev > 0.27) {
    verdicts.push("high-contrast");
  }
  if (tone.stdDev < 0.1) {
    verdicts.push("flat");
    notes.push("Imagen plana: poco rango tonal, probablemente escena con niebla o velo.");
  }
  if (verdicts.length === 0) verdicts.push("correct");

  // How much of the blown area is worth trying to pull back.
  //
  // A pixel with only one or two channels clipped usually still holds data in
  // the RAW (Lightroom reconstructs it from the surviving channels). A pixel
  // where all three channels are at the top is gone, in the preview and in the
  // RAW alike, and no slider brings it back.
  const clipped = tone.highlightClipping;
  const dead = tone.unrecoverableHighlights;
  const recoverable = clipped <= 0 ? 1 : clamp((clipped - dead) / clipped, 0, 1);

  if (clipped > 0.02) {
    if (dead > 0.01) {
      notes.push(
        `Altas luces quemadas sin recuperación en ${(dead * 100).toFixed(1)}% de la imagen: ` +
          "esa zona no tiene información y no se va a intentar reconstruir.",
      );
    }
    if (recoverable > 0.35) {
      notes.push(
        isRaw
          ? `Aproximadamente ${(recoverable * 100).toFixed(0)}% de las altas luces recortadas ` +
            "es recuperable desde el RAW."
          : "Archivo no RAW: el margen de recuperación en altas luces es mínimo.",
      );
    }
  }

  if (!isRaw && Math.abs(ev) > 1.2) {
    notes.push(
      "Corrección de exposición grande sobre un archivo no RAW: puede aparecer posterización.",
    );
  }
  if ((exif.iso ?? 0) >= 6400 && ev > 0.5) {
    notes.push("ISO alto y subexposición: al levantar exposición aumentará el ruido.");
  }

  return {
    verdicts,
    evOffset: round(ev, 2),
    recoverableHighlightRatio: round(recoverable, 3),
    notes,
  };
}
