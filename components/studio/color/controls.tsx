"use client";

/**
 * Form controls for the colour lab.
 *
 * A separate set from `components/studio/Slider.tsx`, which is bound to the
 * photo editor's own parameter table. Same look, same touch targets, but these
 * carry their own range and label so a grading control does not have to be
 * registered as a Lightroom slider to exist.
 */
import { useId, type ReactNode } from "react";

export function ColorSlider({
  label,
  value,
  min,
  max,
  step = 1,
  neutral = 0,
  decimals = 0,
  suffix = "",
  hint,
  disabled = false,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  neutral?: number;
  decimals?: number;
  suffix?: string;
  hint?: string;
  disabled?: boolean;
  onChange: (value: number) => void;
}) {
  const id = useId();
  const percent = ((value - min) / (max - min)) * 100;
  const neutralPercent = ((neutral - min) / (max - min)) * 100;
  const text = value.toFixed(decimals);

  return (
    <div className="py-1.5">
      <div className="flex items-baseline justify-between gap-2">
        <label htmlFor={id} className="text-xs text-neutral-400" title={hint}>
          {label}
        </label>
        <button
          type="button"
          onClick={() => onChange(neutral)}
          disabled={disabled || value === neutral}
          title="Volver al valor neutro"
          className="-my-3 min-w-16 rounded px-2 py-3 text-right text-xs tabular-nums text-neutral-200 transition-colors hover:text-[#a4ef84] disabled:cursor-default disabled:hover:text-neutral-200"
        >
          {value > neutral && neutral === 0 ? `+${text}` : text}
          {suffix}
        </button>
      </div>
      <div className="relative mt-1">
        <span
          aria-hidden
          className="pointer-events-none absolute top-1/2 h-3 w-px -translate-y-1/2 bg-neutral-600"
          style={{ left: `${neutralPercent}%` }}
        />
        <input
          id={id}
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          disabled={disabled}
          onChange={(event) => onChange(Number(event.target.value))}
          className="advibe-slider w-full"
          style={{ ["--fill" as string]: `${percent}%` }}
        />
      </div>
    </div>
  );
}

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs text-neutral-400">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-[11px] text-neutral-500">{hint}</span>}
    </label>
  );
}

const CONTROL =
  "min-h-11 w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3 text-sm text-neutral-100 " +
  "placeholder:text-neutral-600 focus:border-[#78d94f] focus:outline-none";

export function TextInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <input
      type="text"
      value={value}
      placeholder={placeholder}
      onChange={(event) => onChange(event.target.value)}
      className={CONTROL}
    />
  );
}

export function Select<T extends string>({
  value,
  onChange,
  children,
}: {
  value: T;
  onChange: (value: T) => void;
  children: ReactNode;
}) {
  return (
    <select
      value={value}
      onChange={(event) => onChange(event.target.value as T)}
      className={`${CONTROL} py-2`}
    >
      {children}
    </select>
  );
}

export function Toggle({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string;
  hint?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex min-h-11 cursor-pointer items-start gap-3 py-1">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="mt-1 h-4 w-4 shrink-0 accent-[#78d94f]"
      />
      <span>
        <span className="block text-sm text-neutral-200">{label}</span>
        {hint && <span className="block text-[11px] leading-relaxed text-neutral-500">{hint}</span>}
      </span>
    </label>
  );
}

/** A colour wheel reduced to what a toning control actually needs: hue and how much. */
export function ToningControl({
  label,
  hue,
  strength,
  onChange,
}: {
  label: string;
  hue: number;
  strength: number;
  onChange: (value: { hue: number; strength: number }) => void;
}) {
  return (
    <div className="rounded-lg border border-neutral-800 bg-neutral-900/60 p-3">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium text-neutral-300">{label}</span>
        <span
          aria-hidden
          className="h-5 w-5 rounded-full border border-neutral-700"
          style={{
            backgroundColor: `hsl(${hue} 70% 55%)`,
            opacity: 0.25 + (strength / 100) * 0.75,
          }}
        />
      </div>
      <ColorSlider
        label="Tono"
        value={hue}
        min={0}
        max={360}
        step={1}
        neutral={0}
        suffix="°"
        onChange={(value) => onChange({ hue: value, strength })}
      />
      <ColorSlider
        label="Fuerza"
        value={strength}
        min={0}
        max={60}
        step={1}
        neutral={0}
        onChange={(value) => onChange({ hue, strength: value })}
      />
    </div>
  );
}
