"use client";

/**
 * What the material measured, and what the tool decided to do about it.
 *
 * Kept as two clearly separate halves. The measurements are facts about the
 * footage; the corrections are decisions, each printed next to the number that
 * produced it. A colourist who disagrees with a decision can see which
 * measurement drove it and override the knob by hand, which is the whole
 * argument for not hiding this behind an "auto" button.
 */
import { Badge, Notice, Stat } from "@/components/studio/ui";
import type { ClipAnalysis } from "@/lib/color/analyze";
import {
  CORRECTION_LABELS,
  formatCorrection,
  type CorrectionOptions,
  type DerivedCorrection,
} from "@/lib/color/correction";
import { SKIN_HUE_MAX, SKIN_HUE_MIN } from "@/lib/photo/editing/skinGuard";

/** Contrast, saturation and clipping read better as a verdict than as a number. */
function verdict(value: number, low: number, high: number) {
  if (value < low) return { tone: "warn" as const, word: "bajo" };
  if (value > high) return { tone: "warn" as const, word: "alto" };
  return { tone: "good" as const, word: "correcto" };
}

export function AnalysisReport({
  clip,
  derived,
}: {
  clip: ClipAnalysis;
  derived: DerivedCorrection;
}) {
  const contrast = verdict(clip.contrast, 0.16, 0.27);
  const saturation = verdict(clip.saturation, 0.1, 0.32);
  const skinHealthy =
    clip.skinHue === null || (clip.skinHue >= SKIN_HUE_MIN && clip.skinHue <= SKIN_HUE_MAX);

  const applied = (Object.keys(derived.options) as Array<keyof CorrectionOptions>).filter(
    (field) => Math.abs(derived.options[field]) > 1e-6,
  );

  return (
    <div className="space-y-5">
      <div>
        <h3 className="mb-2 text-xs uppercase tracking-wider text-neutral-500">
          Medido sobre {clip.frames.length}{" "}
          {clip.frames.length === 1 ? "fotograma" : "fotogramas, por mediana"}
        </h3>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Stat
            label="Exposición"
            value={`${clip.exposureEv > 0 ? "+" : ""}${clip.exposureEv.toFixed(2)} EV`}
            hint={clip.exposureEv === 0 ? "en su sitio" : "corrección medida"}
          />
          <Stat
            label="Contraste"
            value={(clip.contrast * 100).toFixed(0)}
            hint={`${contrast.word} · banda 16-27`}
          />
          <Stat
            label="Saturación"
            value={`${(clip.saturation * 100).toFixed(0)}%`}
            hint={`${saturation.word} · ${(clip.oversaturated * 100).toFixed(1)}% pasada`}
          />
          <Stat
            label="Balance"
            value={
              clip.neutralConfidence > 0.15
                ? `${clip.temperatureBias > 0 ? "frío" : "cálido"} ${Math.abs(clip.temperatureBias).toFixed(0)}`
                : "sin referencia"
            }
            hint={`fiabilidad ${(clip.neutralConfidence * 100).toFixed(0)}%`}
          />
          <Stat
            label="Altas luces"
            value={`${(clip.whiteLevel * 100).toFixed(1)}%`}
            hint={`${(clip.unrecoverableHighlights * 100).toFixed(2)}% sin detalle`}
          />
          <Stat
            label="Sombras"
            value={`${(clip.blackLevel * 100).toFixed(1)}%`}
            hint={`${(clip.shadowClipping * 100).toFixed(2)}% al negro`}
          />
          <Stat
            label="Piel en cuadro"
            value={`${(clip.skinCoverage * 100).toFixed(0)}%`}
            hint={
              clip.skinHue === null
                ? "sin piel medible"
                : `tono ${clip.skinHue.toFixed(0)}° · lum ${((clip.skinLuma ?? 0) * 100).toFixed(0)}% · sat ${((clip.skinSaturation ?? 0) * 100).toFixed(0)}%`
            }
          />
          <Stat
            label="Protección de piel"
            value={`${Math.round(clip.suggestedSkinProtection * 100)}%`}
            hint="sugerida por cobertura"
          />
        </div>

        {clip.skinHue !== null && !skinHealthy && (
          <div className="mt-3">
            <Notice tone="warn">
              La piel mide {clip.skinHue.toFixed(0)}° tras la conversión, fuera de la ventana
              sana ({SKIN_HUE_MIN}–{SKIN_HUE_MAX}°). Suele venir de un balance de blancos
              equivocado en cámara; la corrección de abajo intenta devolverla, pero compruébalo
              en la previsualización antes de fiarte.
            </Notice>
          </div>
        )}
      </div>

      <div>
        <h3 className="mb-2 flex items-center gap-2 text-xs uppercase tracking-wider text-neutral-500">
          Corrección derivada
          <Badge tone={applied.length === 0 ? "good" : "accent"}>
            {applied.length === 0 ? "nada que corregir" : `${applied.length} ajustes`}
          </Badge>
        </h3>
        {derived.notes.length === 0 ? (
          <Notice tone="info">
            El material mide correctamente en exposición, balance, contraste y saturación. No hay
            corrección que aplicar, que es un resultado y no un fallo: el LUT saldrá con la
            transformación técnica y el look que elijas, nada más.
          </Notice>
        ) : (
          <ul className="space-y-2">
            {derived.notes.map((note) => {
              const value = derived.options[note.field];
              const inert = Math.abs(value) < 1e-6;
              return (
                <li
                  key={`${note.field}-${note.reason}`}
                  className="rounded-lg border border-neutral-800 bg-neutral-900/60 p-3"
                >
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <span className="text-sm font-medium text-neutral-200">
                      {CORRECTION_LABELS[note.field]}
                    </span>
                    <span
                      className={`text-sm tabular-nums ${inert ? "text-neutral-500" : "text-[#a4ef84]"}`}
                    >
                      {inert ? "sin cambio" : formatCorrection(note.field, value)}
                    </span>
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-neutral-400">{note.reason}</p>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {(clip.warnings.length > 0 || clip.notes.length > 0) && (
        <div className="space-y-2">
          {clip.warnings.map((warning) => (
            <Notice key={warning} tone="warn">
              {warning}
            </Notice>
          ))}
          {clip.notes.length > 0 && (
            <ul className="space-y-1.5 text-sm leading-relaxed text-neutral-400">
              {clip.notes.map((note) => (
                <li key={note} className="flex gap-2">
                  <span
                    aria-hidden
                    className="mt-2 h-1 w-1 shrink-0 rounded-full bg-neutral-600"
                  />
                  <span>{note}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
