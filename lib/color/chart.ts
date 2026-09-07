/**
 * A reference chart, drawn in the camera's own log encoding.
 *
 * The preview needs something to show before any footage is loaded, and a
 * random stock frame would be worse than useless: what a colourist has to see
 * is what the LUT does to the handful of colours that decide whether a grade
 * works. So the chart is built backwards — the patches are specified as the
 * Rec.709 values they *should* come out as, then pushed back through the
 * transform into the code values the camera would have recorded.
 *
 * The consequence is worth stating plainly: under the neutral technical LUT
 * this chart renders back to exactly the colours it was specified with. Any
 * difference the user sees is the creative look, not an artefact of the chart.
 */
import { applyMatrix, gamutMatrix } from "./gamut";
import { TRANSFERS } from "./transfer";
import { NEUTRAL_TONE_CURVE, toneCurveInverse } from "./tonemap";
import type { CameraProfile } from "./presets";

export interface ChartPatch {
  label: string;
  /** The Rec.709 display value this patch is meant to render as. */
  target: [number, number, number];
}

/** Skin across the range of depths a camera actually meets. */
export const SKIN_PATCHES: ChartPatch[] = [
  { label: "Piel I", target: [0.87, 0.73, 0.66] },
  { label: "Piel II", target: [0.76, 0.61, 0.53] },
  { label: "Piel III", target: [0.63, 0.47, 0.38] },
  { label: "Piel IV", target: [0.47, 0.33, 0.25] },
  { label: "Piel V", target: [0.31, 0.21, 0.16] },
  { label: "Piel VI", target: [0.18, 0.12, 0.09] },
];

export const COLOUR_PATCHES: ChartPatch[] = [
  { label: "Cielo", target: [0.36, 0.52, 0.76] },
  { label: "Follaje", target: [0.28, 0.44, 0.22] },
  { label: "Rojo", target: [0.72, 0.14, 0.14] },
  { label: "Ámbar", target: [0.86, 0.58, 0.18] },
  { label: "Magenta", target: [0.62, 0.2, 0.5] },
  { label: "Cian", target: [0.18, 0.6, 0.66] },
];

/** Six steps of neutral, from near-black to near-white. */
export const GREY_PATCHES: ChartPatch[] = [0.06, 0.2, 0.41, 0.6, 0.78, 0.94].map((value) => ({
  label: `${Math.round(value * 100)}%`,
  target: [value, value, value] as [number, number, number],
}));

/**
 * Rec.709 display value -> the code value the given camera would record.
 *
 * The inverse of the neutral rendering, so it is only exact for the neutral
 * LUT; that is the point, since the neutral LUT is the reference the others are
 * judged against.
 */
export function displayToCameraCode(
  target: [number, number, number],
  profile: CameraProfile,
): [number, number, number] {
  const curve = TRANSFERS[profile.transfer];
  const scene =
    curve.kind === "scene"
      ? target.map((value) => toneCurveInverse(value, NEUTRAL_TONE_CURVE))
      : target.map((value) => curve.decode(value));
  const camera = applyMatrix(
    gamutMatrix("rec709", profile.gamut),
    scene[0],
    scene[1],
    scene[2],
  );
  return camera.map((value) => Math.min(Math.max(curve.encode(value), 0), 1)) as [
    number,
    number,
    number,
  ];
}

export interface ChartLayout {
  width: number;
  height: number;
  /** RGBA pixels holding the camera code values, ready to run through the LUT. */
  data: Uint8ClampedArray;
  /** Where each patch landed, for labelling. */
  cells: Array<{ patch: ChartPatch; x: number; y: number; w: number; h: number }>;
}

/**
 * Draws the chart: three rows of patches over a continuous exposure ramp.
 *
 * The ramp is what makes banding and a crushed toe visible; the patches are
 * what make a hue shift visible. Neither shows the other.
 */
export function buildChart(profile: CameraProfile, width = 720, height = 405): ChartLayout {
  const data = new Uint8ClampedArray(width * height * 4);
  const cells: ChartLayout["cells"] = [];
  const rows = [SKIN_PATCHES, COLOUR_PATCHES, GREY_PATCHES];
  const patchAreaHeight = Math.round(height * 0.72);
  const rowHeight = Math.floor(patchAreaHeight / rows.length);

  const write = (x: number, y: number, colour: [number, number, number]) => {
    const at = (y * width + x) * 4;
    data[at] = colour[0] * 255;
    data[at + 1] = colour[1] * 255;
    data[at + 2] = colour[2] * 255;
    data[at + 3] = 255;
  };

  rows.forEach((row, rowIndex) => {
    const columnWidth = Math.floor(width / row.length);
    row.forEach((patch, column) => {
      const code = displayToCameraCode(patch.target, profile);
      const x0 = column * columnWidth;
      const x1 = column === row.length - 1 ? width : x0 + columnWidth;
      const y0 = rowIndex * rowHeight;
      const y1 = y0 + rowHeight;
      for (let y = y0; y < y1; y += 1) {
        for (let x = x0; x < x1; x += 1) write(x, y, code);
      }
      cells.push({ patch, x: x0, y: y0, w: x1 - x0, h: rowHeight });
    });
  });

  // The ramp runs from six stops under middle grey to four stops over it, so
  // it covers the toe, the midtones and the shoulder in one strip.
  const curve = TRANSFERS[profile.transfer];
  const toCamera = gamutMatrix("rec709", profile.gamut);
  for (let x = 0; x < width; x += 1) {
    const stops = -6 + (x / (width - 1)) * 10;
    const linear = 0.18 * 2 ** stops;
    const code =
      curve.kind === "scene"
        ? applyMatrix(toCamera, linear, linear, linear).map((value) =>
            Math.min(Math.max(curve.encode(value), 0), 1),
          )
        : [x / (width - 1), x / (width - 1), x / (width - 1)];
    for (let y = rows.length * rowHeight; y < height; y += 1) {
      write(x, y, code as [number, number, number]);
    }
  }

  return { width, height, data, cells };
}
