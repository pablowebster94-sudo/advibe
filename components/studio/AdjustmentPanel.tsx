"use client";

/**
 * The develop panel: every generated value, editable, plus the engine's own
 * explanation of why it chose what it chose.
 */
import { useState } from "react";
import type { Adjustments, EditResult, HslChannel } from "@/lib/photo/types";
import { HSL_CHANNELS } from "@/lib/photo/types";
import {
  BASIC_KEYS,
  COLOR_KEYS,
  DETAIL_KEYS,
  PRESENCE_KEYS,
  type NumericAdjustmentKey,
  hslChannelLabel,
} from "@/lib/photo/editing/adjustments";
import { Slider } from "./Slider";
import { Badge, Button } from "./ui";

const SECTIONS: Array<{ id: string; title: string; keys: NumericAdjustmentKey[] }> = [
  { id: "basic", title: "Tono", keys: BASIC_KEYS },
  { id: "color", title: "Color", keys: COLOR_KEYS },
  { id: "presence", title: "Presencia", keys: PRESENCE_KEYS },
  { id: "detail", title: "Detalle", keys: DETAIL_KEYS },
  {
    id: "effects",
    title: "Efectos",
    keys: ["vignetteAmount", "vignetteMidpoint", "vignetteFeather", "straighten"],
  },
];

export function AdjustmentPanel({
  adjustments,
  manual,
  edit,
  onChange,
  onReset,
  onReapply,
  onCopy,
  onSync,
  syncCount,
}: {
  adjustments: Adjustments;
  manual: Partial<Adjustments> | undefined;
  edit: EditResult | undefined;
  onChange: (patch: Partial<Adjustments>) => void;
  onReset: () => void;
  onReapply: () => void;
  onCopy: () => void;
  onSync: () => void;
  syncCount: number;
}) {
  const [open, setOpen] = useState<Record<string, boolean>>({
    basic: true,
    color: true,
    presence: false,
    detail: false,
    effects: false,
    hsl: false,
    why: true,
  });

  const toggle = (id: string) => setOpen((current) => ({ ...current, [id]: !current[id] }));
  const isOverridden = (key: NumericAdjustmentKey) => manual?.[key] !== undefined;
  const manualCount = manual ? Object.keys(manual).length : 0;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <Button variant="secondary" onClick={onReapply} title="Vuelve a generar los ajustes con la IA">
          Reaplicar IA
        </Button>
        <Button
          variant="ghost"
          onClick={onReset}
          disabled={manualCount === 0}
          title="Descarta tus cambios manuales y deja los de la IA"
        >
          Restaurar original
        </Button>
        <Button variant="ghost" onClick={onCopy}>
          Copiar ajustes
        </Button>
        <Button variant="ghost" onClick={onSync} disabled={syncCount === 0}>
          Sincronizar ({syncCount})
        </Button>
      </div>

      {manualCount > 0 && (
        <p className="text-xs text-[#a4ef84]">
          {manualCount} ajuste(s) modificados a mano sobre la propuesta de la IA.
        </p>
      )}

      {SECTIONS.map((section) => (
        <Section
          key={section.id}
          id={section.id}
          title={section.title}
          open={open[section.id]}
          onToggle={toggle}
        >
          {section.keys.map((key) => (
            <Slider
              key={key}
              parameter={key}
              value={adjustments[key]}
              overridden={isOverridden(key)}
              onChange={(value) => onChange({ [key]: value } as Partial<Adjustments>)}
            />
          ))}
        </Section>
      ))}

      <Section id="hsl" title="Mezclador de color (HSL)" open={open.hsl} onToggle={toggle}>
        <HslEditor
          adjustments={adjustments}
          onChange={(band, channel, value) =>
            onChange({
              hsl: {
                ...adjustments.hsl,
                [band]: { ...adjustments.hsl[band], [channel]: value },
              },
            })
          }
        />
      </Section>

      <Section id="why" title="Por qué la IA decidió esto" open={open.why} onToggle={toggle}>
        {edit ? (
          <ul className="space-y-2">
            {edit.rationale.map((entry, index) => (
              <li key={`${entry.key}-${index}`} className="text-xs leading-relaxed text-neutral-400">
                <span className="mr-1.5 font-mono text-[10px] text-neutral-500">{entry.key}</span>
                {entry.reason}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-xs text-neutral-500">Todavía no hay ajustes generados.</p>
        )}
      </Section>
    </div>
  );
}

function Section({
  id,
  title,
  open,
  onToggle,
  children,
}: {
  id: string;
  title: string;
  open: boolean;
  onToggle: (id: string) => void;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-neutral-800 bg-neutral-900/60">
      <button
        type="button"
        onClick={() => onToggle(id)}
        aria-expanded={open}
        className="flex min-h-11 w-full items-center justify-between px-3 text-left text-xs font-semibold uppercase tracking-wider text-neutral-300"
      >
        {title}
        <span aria-hidden className="text-neutral-500">
          {open ? "−" : "+"}
        </span>
      </button>
      {open && <div className="border-t border-neutral-800 px-3 py-2">{children}</div>}
    </div>
  );
}

function HslEditor({
  adjustments,
  onChange,
}: {
  adjustments: Adjustments;
  onChange: (band: "hue" | "saturation" | "luminance", channel: HslChannel, value: number) => void;
}) {
  const [band, setBand] = useState<"hue" | "saturation" | "luminance">("saturation");
  const labels = { hue: "Tono", saturation: "Saturación", luminance: "Luminancia" } as const;

  return (
    <div className="space-y-2">
      <div className="flex gap-1">
        {(["hue", "saturation", "luminance"] as const).map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => setBand(option)}
            className={`min-h-11 flex-1 rounded-md px-2 text-[11px] font-medium transition-colors ${
              band === option
                ? "bg-neutral-700 text-neutral-100"
                : "bg-neutral-900 text-neutral-500 hover:text-neutral-300"
            }`}
          >
            {labels[option]}
          </button>
        ))}
      </div>
      {HSL_CHANNELS.map((channel) => {
        const value = adjustments.hsl[band][channel];
        return (
          <div key={channel} className="py-1">
            <div className="flex items-baseline justify-between">
              <span className="text-xs text-neutral-400">{hslChannelLabel(channel)}</span>
              <span className="text-xs tabular-nums text-neutral-200">
                {value > 0 ? `+${value}` : value}
              </span>
            </div>
            <input
              type="range"
              min={-100}
              max={100}
              step={1}
              value={value}
              onChange={(event) => onChange(band, channel, Number(event.target.value))}
              className="advibe-slider w-full"
              style={{ ["--fill" as string]: `${((value + 100) / 200) * 100}%` }}
              aria-label={`${labels[band]} ${hslChannelLabel(channel)}`}
            />
          </div>
        );
      })}
      {adjustments.hsl.saturation.orange < 0 && (
        <Badge tone="accent">Naranja reducido por el guardián de piel</Badge>
      )}
    </div>
  );
}
