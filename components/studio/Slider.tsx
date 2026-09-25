"use client";

/**
 * One adjustment slider.
 *
 * Shows the value the way Lightroom does (signed, at the parameter's own
 * precision) and marks the ones the photographer has overridden, so it is always
 * obvious what came from the engine and what came from them.
 */
import { useId } from "react";
import { RANGES, formatAdjustment, type NumericAdjustmentKey } from "@/lib/photo/editing/adjustments";

export function Slider({
  parameter,
  value,
  onChange,
  overridden = false,
  disabled = false,
}: {
  parameter: NumericAdjustmentKey;
  value: number;
  onChange: (value: number) => void;
  overridden?: boolean;
  disabled?: boolean;
}) {
  const range = RANGES[parameter];
  const id = useId();
  const percent = ((value - range.min) / (range.max - range.min)) * 100;
  const neutralPercent = ((range.neutral - range.min) / (range.max - range.min)) * 100;

  return (
    <div className="py-1.5">
      <div className="flex items-baseline justify-between gap-2">
        <label
          htmlFor={id}
          className={`text-xs ${overridden ? "font-semibold text-[#a4ef84]" : "text-neutral-400"}`}
        >
          {range.label}
          {overridden && <span className="ml-1 text-[10px] font-normal">· manual</span>}
        </label>
        <button
          type="button"
          onClick={() => onChange(range.neutral)}
          disabled={disabled || value === range.neutral}
          title="Volver al valor neutro"
          // `py-3 -my-3` grows the tap target to ~44px without growing the row:
          // stacking 25 full-height rows would add a screen of scrolling on a
          // phone for what is only a convenience action.
          className="-my-3 min-w-14 rounded px-2 py-3 text-right text-xs tabular-nums text-neutral-200 transition-colors hover:text-[#a4ef84] disabled:cursor-default disabled:hover:text-neutral-200"
        >
          {formatAdjustment(parameter, value)}
        </button>
      </div>
      <div className="relative mt-1">
        {/* Tick marking the neutral position, so "no change" is visible at a glance. */}
        <span
          aria-hidden
          className="pointer-events-none absolute top-1/2 h-3 w-px -translate-y-1/2 bg-neutral-600"
          style={{ left: `${neutralPercent}%` }}
        />
        <input
          id={id}
          type="range"
          min={range.min}
          max={range.max}
          step={range.step}
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
