/**
 * Scene-linear to display-referred Rec.709.
 *
 * This is the part of a "log to 709" LUT that people get wrong. A camera curve
 * carries eight to eleven stops above middle grey; Rec.709 has about two and a
 * half. Something has to give, and the two usual answers are both bad: a
 * straight gamma re-encode clips every specular highlight into a flat white
 * blob, and a 1D "contrast curve" bolted on afterwards crushes the toe to fix
 * the milky result.
 *
 * What is used here instead is an asymptotic filmic sigmoid applied in log2
 * space. Two properties matter, and both are asserted in the tests:
 *
 *   - it never reaches 0 or 1 for any finite input, so highlights roll off
 *     instead of clipping and shadows compress instead of crushing;
 *   - it is C1-continuous through the pivot, so there is no visible kink where
 *     midtones meet the toe — the place skin lives.
 */
import { type Matrix3, adaptationMatrix, applyMatrix, D65 } from "./gamut";

export interface ToneCurveOptions {
  /** Display code value assigned to 18% grey. */
  greyTarget: number;
  /** Slope through the pivot, in display units per photographic stop. */
  slopePerStop: number;
  /** Toe hardness. Higher compresses shadows faster below the pivot. */
  toePower: number;
  /** Shoulder hardness. Higher holds the slope longer before rolling off. */
  shoulderPower: number;
}

/**
 * The slope that lands a given scene value on a given display value.
 *
 * The two numbers a colourist actually cares about are where middle grey sits
 * and where a white card sits; the slope is an implementation detail of getting
 * both right. Solving for it rather than hand-tuning it is what stops the
 * curve from quietly rendering diffuse white a stop dark, which is the classic
 * failure of a filmic curve pushed too far — the image reads as "flat and
 * cinematic" on a laptop and as underexposed on a phone.
 */
export function slopeForAnchor(
  greyTarget: number,
  linear: number,
  displayTarget: number,
  shoulderPower: number,
): number {
  const stops = Math.log2(linear / 0.18);
  const headroom = 1 - greyTarget;
  const compressed = displayTarget - greyTarget;
  const ratio = compressed / headroom;
  if (!(stops > 0) || ratio <= 0 || ratio >= 1) {
    throw new Error("Ancla de tono inválida: el blanco debe caer entre el gris y 1.0.");
  }
  const reach = compressed / (1 - ratio ** shoulderPower) ** (1 / shoulderPower);
  return reach / stops;
}

const NEUTRAL_GREY_TARGET = 0.41;
const NEUTRAL_SHOULDER = 3;

/**
 * A neutral, broadcast-safe rendering.
 *
 * Two anchors define it. 18% grey goes to 0.41, which is where BT.709's own
 * OETF puts it (0.409), so a correctly exposed log frame lands exactly where a
 * colourist expects to find it on a waveform. A 100% white card goes to 0.90 —
 * high enough that whites read as white rather than as light grey, low enough
 * that the four or five stops of specular highlight a log curve carries above
 * it still have somewhere to go. Everything above that rolls off along the
 * asymptote instead of piling up at 1.0.
 */
export const NEUTRAL_TONE_CURVE: ToneCurveOptions = {
  greyTarget: NEUTRAL_GREY_TARGET,
  slopePerStop: slopeForAnchor(NEUTRAL_GREY_TARGET, 1, 0.9, NEUTRAL_SHOULDER),
  toePower: 1.6,
  shoulderPower: NEUTRAL_SHOULDER,
};

/** A tone curve at a contrast offset from neutral, in percent. */
export function withContrast(
  percent: number,
  overrides: Partial<ToneCurveOptions> = {},
): ToneCurveOptions {
  return {
    ...NEUTRAL_TONE_CURVE,
    slopePerStop: NEUTRAL_TONE_CURVE.slopePerStop * (1 + percent / 100),
    ...overrides,
  };
}

/**
 * Scene-linear reflectance -> display code value.
 *
 * The curve is `pivot ± (slope·ds) / (1 + (slope·ds/headroom)^p)^(1/p)` where
 * `ds` is the distance from grey in stops. That denominator is what makes it
 * asymptotic: as `ds` grows the numerator and denominator grow together and the
 * result approaches `headroom` without ever crossing it.
 */
export function toneCurve(linear: number, options: ToneCurveOptions): number {
  const { greyTarget, slopePerStop, toePower, shoulderPower } = options;
  if (!(linear > 0)) return 0;

  const stops = Math.log2(linear / 0.18);
  if (stops === 0) return greyTarget;

  const above = stops > 0;
  const headroom = above ? 1 - greyTarget : greyTarget;
  const power = above ? shoulderPower : toePower;
  const reach = slopePerStop * Math.abs(stops);
  const compressed = reach / (1 + (reach / headroom) ** power) ** (1 / power);
  return above ? greyTarget + compressed : greyTarget - compressed;
}

/** Inverse of `toneCurve`, used by the tests to prove the curve is monotonic. */
export function toneCurveInverse(display: number, options: ToneCurveOptions): number {
  const { greyTarget, slopePerStop, toePower, shoulderPower } = options;
  const above = display > greyTarget;
  const headroom = above ? 1 - greyTarget : greyTarget;
  const power = above ? shoulderPower : toePower;
  const compressed = Math.abs(display - greyTarget);
  if (compressed >= headroom) return above ? Infinity : 0;
  // Solve reach / (1 + (reach/h)^p)^(1/p) = compressed for reach.
  const ratio = compressed / headroom;
  const reach = compressed / (1 - ratio ** power) ** (1 / power);
  const stops = reach / slopePerStop;
  return 0.18 * 2 ** (above ? stops : -stops);
}

/**
 * Scene-linear Rec.709 -> display-referred Rec.709, all three channels at once.
 *
 * Running `toneCurve` independently per channel is the traditional film
 * emulation and it gets one thing right and one thing badly wrong. Right: a
 * blown highlight desaturates towards white, the way an overexposed window
 * does, instead of turning into a flat coloured slab. Wrong: it desaturates
 * *everything* near the top of the curve, so a bright red — a brake light, a
 * logo, a dress — comes out pink or white long before it is actually clipping.
 *
 * So both are computed. The ratio-preserving path tone maps the brightest
 * channel and scales the other two by the same factor, which keeps hue and
 * saturation exactly; the per-channel path gives the highlight bloom. They are
 * crossfaded by how far into the shoulder the pixel sits, so midtones and skin
 * keep their colour and only genuine highlights wash out.
 */
function smoothstep(value: number): number {
  const t = Math.min(Math.max(value, 0), 1);
  return t * t * (3 - 2 * t);
}

export function renderToDisplay(
  r: number,
  g: number,
  b: number,
  options: ToneCurveOptions,
  gamutCompression: number,
): [number, number, number] {
  const perChannel: [number, number, number] = [
    toneCurve(r, options),
    toneCurve(g, options),
    toneCurve(b, options),
  ];

  const norm = Math.max(r, g, b);
  if (!(norm > 0)) return perChannel;

  const mapped = toneCurve(norm, options);
  const scale = mapped / norm;
  // Gamut compression happens here, on the ratio-preserved *display* values,
  // and not back in scene-linear. The distance from the achromatic axis is the
  // same ratio either way, but the absolute size of the correction is not: a
  // channel nudged to 2% of the peak is a rounding error at a display value of
  // 0.9 and five stops above middle grey at a scene value of 89.
  const compressed = compressGamut(r * scale, g * scale, b * scale, gamutCompression);
  const preserved: [number, number, number] = [
    Math.max(compressed[0], 0),
    Math.max(compressed[1], 0),
    Math.max(compressed[2], 0),
  ];

  // The crossfade, smoothstepped away from the grey pivot in both directions.
  // Ratio preservation owns the midtones, where skin lives and where a colour
  // shift is most visible; the per-channel path takes over at both ends, which
  // is where film also loses chroma — highlights bloom towards white, shadows
  // fall away towards neutral instead of staying vividly coloured. Without the
  // toe half, deep skin tones come out of a log conversion more saturated than
  // they went into the camera.
  const shoulder = smoothstep((mapped - options.greyTarget) / (1 - options.greyTarget));
  const toe = smoothstep((options.greyTarget - mapped) / options.greyTarget);
  const perChannelWeight = Math.min(shoulder + toe, 1);

  return [
    preserved[0] + (perChannel[0] - preserved[0]) * perChannelWeight,
    preserved[1] + (perChannel[1] - preserved[1]) * perChannelWeight,
    preserved[2] + (perChannel[2] - preserved[2]) * perChannelWeight,
  ];
}

// ---------------------------------------------------------------------------
// Gamut compression
// ---------------------------------------------------------------------------

/**
 * Softly pull out-of-gamut values back inside Rec.709.
 *
 * Converting S-Gamut3.Cine or Cinema Gamut to Rec.709 produces negative channel
 * values for saturated blues and greens — those colours simply do not exist in
 * Rec.709. Clipping them to zero is what turns a stage's blue wash into a flat
 * purple slab and a neon sign into a hard-edged blob, because everything past
 * the boundary maps to the same value.
 *
 * Distance from the achromatic axis is compressed instead, with a soft knee, so
 * out-of-gamut colours stay distinguishable from each other and in-gamut
 * colours below the threshold are left bit-for-bit alone.
 */
export function compressGamut(
  r: number,
  g: number,
  b: number,
  amount: number,
): [number, number, number] {
  if (amount <= 0) return [r, g, b];

  const achromatic = Math.max(r, g, b);
  if (achromatic <= 0) return [r, g, b];

  // Distance of each channel below the brightest one, normalised: 0 is neutral,
  // 1 is a fully saturated primary and anything above 1 is outside Rec.709.
  const threshold = 1 - 0.2 * Math.min(amount, 1);
  const power = 1.2;
  const span = 1 - threshold;

  const channels: [number, number, number] = [r, g, b];
  for (let channel = 0; channel < 3; channel += 1) {
    const distance = (achromatic - channels[channel]) / achromatic;
    if (distance <= threshold) continue;
    // Same asymptotic power-hyperbola as the tone curve: slope 1 at the
    // threshold, so in-gamut colours are untouched and the transition is
    // invisible, and an asymptote at 1, so the channel approaches zero from
    // above and never goes negative however far outside the gamut it started.
    const u = (distance - threshold) / span;
    const compressed = threshold + (span * u) / (1 + u ** power) ** (1 / power);
    channels[channel] = achromatic * (1 - compressed);
  }
  return channels;
}

// ---------------------------------------------------------------------------
// White balance
// ---------------------------------------------------------------------------

/**
 * Chromaticity of a correlated colour temperature, on the CIE daylight locus
 * above 4000 K and on Kim et al.'s cubic approximation of the Planckian locus
 * below it. Valid from roughly 1667 K to 25000 K.
 */
export function cctToChromaticity(cct: number): { x: number; y: number } {
  const t = Math.min(Math.max(cct, 1667), 25000);
  let x: number;
  if (t < 4000) {
    x =
      -0.2661239e9 / t ** 3 - 0.2343589e6 / t ** 2 + 0.8776956e3 / t + 0.179910;
  } else {
    x = -3.0258469e9 / t ** 3 + 2.1070379e6 / t ** 2 + 0.2226347e3 / t + 0.24039;
  }

  let y: number;
  if (t < 2222) {
    y = -1.1063814 * x ** 3 - 1.34811020 * x ** 2 + 2.18555832 * x - 0.20219683;
  } else if (t < 4000) {
    y = -0.9549476 * x ** 3 - 1.37418593 * x ** 2 + 2.09137015 * x - 0.16748867;
  } else {
    y = 3.0817580 * x ** 3 - 5.87338670 * x ** 2 + 3.75112997 * x - 0.37001483;
  }
  return { x, y };
}

/**
 * A creative warm/cool shift, as a linear-light matrix.
 *
 * This is explicitly *not* a white balance correction: the camera's white
 * balance is already baked into the recording and no LUT can undo it. What this
 * does is re-render the neutral axis at a different chromaticity, which is the
 * grading move a "warmer" or "cooler" note actually asks for.
 *
 * `warmth` and `tint` both run -100..100. Warmth walks the daylight locus
 * between roughly 8500 K and 4300 K; tint offsets perpendicular to it, green
 * negative and magenta positive, the same sign convention as the photo studio's
 * `tint` slider.
 */
export function creativeWhiteBalance(warmth: number, tint: number): Matrix3 | null {
  if (Math.abs(warmth) < 1e-6 && Math.abs(tint) < 1e-6) return null;

  const reference = 6504;
  const target = warmth >= 0 ? reference - (warmth / 100) * 2200 : reference - (warmth / 100) * 2000;
  const chromaticity = cctToChromaticity(target);
  // Magenta lifts y's complement: moving off the locus downward in y adds
  // magenta, upward adds green.
  const shifted = { x: chromaticity.x, y: chromaticity.y - (tint / 100) * 0.022 };
  return adaptationMatrix(D65, shifted);
}

export function applyOptionalMatrix(
  matrix: Matrix3 | null,
  r: number,
  g: number,
  b: number,
): [number, number, number] {
  if (!matrix) return [r, g, b];
  return applyMatrix(matrix, r, g, b);
}
