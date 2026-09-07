"use client";

/**
 * The creative layer's controls.
 *
 * Deliberately the *only* place taste is expressed. The correction derived from
 * the footage lands on the same underlying knobs, but it is applied underneath
 * these values rather than by moving them, so the sliders always read as the
 * look and never as the look plus whatever this particular clip needed.
 */
import { LOOK_PRESETS } from "@/lib/color/presets";
import type { LookOptions, ToningWheel } from "@/lib/color/look";
import { ColorSlider, Field, Select, ToningControl } from "./controls";

export interface Grade {
  look: LookOptions;
  /** Contrast as a percentage offset from the neutral rendering's slope. */
  contrast: number;
  warmth: number;
  tint: number;
  exposureEv: number;
}

export function LookControls({
  presetId,
  grade,
  disabled,
  onSelectPreset,
  onChange,
}: {
  presetId: string;
  grade: Grade;
  disabled: boolean;
  onSelectPreset: (id: string) => void;
  onChange: (next: Grade) => void;
}) {
  const preset = LOOK_PRESETS.find((option) => option.id === presetId)!;
  const patchLook = (patch: Partial<LookOptions>) =>
    onChange({ ...grade, look: { ...grade.look, ...patch } });

  return (
    <div className="space-y-3">
      <Field label="Punto de partida">
        <Select value={presetId} onChange={onSelectPreset}>
          {LOOK_PRESETS.map((option) => (
            <option key={option.id} value={option.id}>
              {option.label}
            </option>
          ))}
        </Select>
      </Field>
      <p className="text-[11px] leading-relaxed text-neutral-500">{preset.description}</p>

      <fieldset disabled={disabled} className={disabled ? "opacity-40" : ""}>
        <ColorSlider
          label="Exposición del look"
          value={grade.exposureEv}
          min={-3}
          max={3}
          step={0.05}
          decimals={2}
          suffix=" EV"
          hint="Aparte de la corrección medida, que ya se aplica debajo."
          onChange={(value) => onChange({ ...grade, exposureEv: value })}
        />
        <ColorSlider
          label="Contraste"
          value={grade.contrast}
          min={-40}
          max={40}
          hint="Pendiente de la curva alrededor del gris medio."
          onChange={(value) => onChange({ ...grade, contrast: value })}
        />
        <ColorSlider
          label="Elevación de negros"
          value={grade.look.shadowLift}
          min={-40}
          max={60}
          onChange={(value) => patchLook({ shadowLift: value })}
        />
        <ColorSlider
          label="Calidez"
          value={grade.warmth}
          min={-60}
          max={60}
          hint="Reencuadra el eje neutro entre 8500 K y 4300 K. No corrige el balance de cámara: eso ya está grabado."
          onChange={(value) => onChange({ ...grade, warmth: value })}
        />
        <ColorSlider
          label="Matiz verde / magenta"
          value={grade.tint}
          min={-40}
          max={40}
          onChange={(value) => onChange({ ...grade, tint: value })}
        />
        <ColorSlider
          label="Saturación"
          value={grade.look.saturation}
          min={-60}
          max={60}
          onChange={(value) => patchLook({ saturation: value })}
        />
        <ColorSlider
          label="Intensidad de color"
          value={grade.look.vibrance}
          min={-60}
          max={60}
          hint="Sube sólo los colores todavía apagados."
          onChange={(value) => patchLook({ vibrance: value })}
        />
        <ColorSlider
          label="Protección de piel"
          value={Math.round(grade.look.skinProtection * 100)}
          min={0}
          max={100}
          neutral={70}
          suffix="%"
          hint="Cuánta saturación y viraje se le retiran a los tonos de piel."
          onChange={(value) => patchLook({ skinProtection: value / 100 })}
        />
        <ColorSlider
          label="Techo de saturación"
          value={Math.round(grade.look.saturationCeiling * 100)}
          min={50}
          max={100}
          neutral={92}
          suffix="%"
          hint="Límite superior de saturación, más estrecho en rojos, verdes y piel."
          onChange={(value) => patchLook({ saturationCeiling: value / 100 })}
        />

        <div className="mt-3 space-y-2">
          <ToningControl
            label="Sombras"
            hue={grade.look.shadowToning.hue}
            strength={grade.look.shadowToning.strength}
            onChange={(wheel: ToningWheel) => patchLook({ shadowToning: wheel })}
          />
          <ToningControl
            label="Medios"
            hue={grade.look.midtoneToning.hue}
            strength={grade.look.midtoneToning.strength}
            onChange={(wheel: ToningWheel) => patchLook({ midtoneToning: wheel })}
          />
          <ToningControl
            label="Altas luces"
            hue={grade.look.highlightToning.hue}
            strength={grade.look.highlightToning.strength}
            onChange={(wheel: ToningWheel) => patchLook({ highlightToning: wheel })}
          />
        </div>
      </fieldset>
    </div>
  );
}
