/**
 * Mapping between our adjustment model and Adobe's Camera Raw (`crs`) XMP
 * schema, as implemented by Lightroom Classic.
 *
 * Property names and value types were taken from the `crs` tag table in
 * ExifTool (`lib/Image/ExifTool/XMP.pm`), which is the most complete public
 * record of the post-2012 properties — Adobe's own published schema at
 * developer.adobe.com stops at the Process 2003 parameters and does not list
 * `Exposure2012`, `Texture`, `Dehaze` or the `ColorGrade*` family at all.
 *
 * The one genuinely lossy area is white balance; `WHITE_BALANCE_NOTE` below and
 * docs/XMP.md explain exactly why and what we do about it.
 */
import type { Adjustments, HslChannel } from "../types";

export const CRS_NAMESPACE = "http://ns.adobe.com/camera-raw-settings/1.0/";
export const XMP_NAMESPACE = "http://ns.adobe.com/xap/1.0/";
export const PHOTOSHOP_NAMESPACE = "http://ns.adobe.com/photoshop/1.0/";
export const TIFF_NAMESPACE = "http://ns.adobe.com/tiff/1.0/";
export const EXIF_NAMESPACE = "http://ns.adobe.com/exif/1.0/";

/**
 * Camera Raw feature version. Anything from 13.x up understands every property
 * we write; we advertise 15.4 because that is the release whose parameter set
 * matches ours exactly.
 */
export const CRS_VERSION = "15.4";

/**
 * Process version. "11.0" is the widely-deployed modern process that Lightroom
 * Classic 9 and later write, and it is the earliest one that supports the whole
 * set we emit (2012 tone sliders, Texture, Dehaze and colour grading).
 */
export const PROCESS_VERSION = "11.0";

export const WHITE_BALANCE_NOTE = `
Temperature is the only parameter we cannot round-trip exactly.

For a RAW file, crs:Temperature is an ABSOLUTE Kelvin value (2000-50000) and is
only honoured when crs:WhiteBalance="Custom". Turning our relative slider into
an absolute Kelvin needs the camera's as-shot white balance multipliers *and*
its colour matrix. Sony does not publish a Kelvin value in standard EXIF, and we
do not ship colour matrices, so any absolute number we wrote would be a guess
that silently overrides what the camera measured.

Instead we keep crs:WhiteBalance="As Shot" and write crs:IncrementalTemperature
and crs:IncrementalTint, which Camera Raw applies as offsets on top of the
as-shot value. The result is exactly what we previewed, and the camera's own
white balance is preserved underneath.

For non-RAW files (JPEG/PNG/TIFF) Camera Raw's Temperature slider is already
relative and runs -100..+100, so there we write crs:Temperature/crs:Tint
directly with crs:WhiteBalance="Custom".
`.trim();

/** Camera Raw's HSL band names, in the order Adobe lists them. */
export const CRS_HSL_SUFFIX: Record<HslChannel, string> = {
  red: "Red",
  orange: "Orange",
  yellow: "Yellow",
  green: "Green",
  aqua: "Aqua",
  blue: "Blue",
  purple: "Purple",
  magenta: "Magenta",
};

export type CrsValue = string | number | boolean;

export interface CrsProperty {
  name: string;
  value: CrsValue;
  /** Reals are written with decimals; integers are rounded. */
  kind: "real" | "integer" | "boolean" | "text";
}

function real(name: string, value: number, decimals = 2): CrsProperty {
  return { name, value: Number(value.toFixed(decimals)), kind: "real" };
}

function integer(name: string, value: number): CrsProperty {
  return { name, value: Math.round(value), kind: "integer" };
}

function boolean(name: string, value: boolean): CrsProperty {
  return { name, value, kind: "boolean" };
}

function text(name: string, value: string): CrsProperty {
  return { name, value, kind: "text" };
}

export interface CrsOptions {
  /** RAW files take the incremental white-balance path. */
  isRaw: boolean;
  /** Written to crs:RawFileName so Lightroom can match the sidecar. */
  rawFileName?: string;
}

/**
 * Builds the flat list of `crs:` properties for one photo.
 *
 * We write the full parameter set rather than only what changed, which is what
 * Lightroom Classic itself does: a sidecar is a complete description of the
 * develop state, and omitting a slider leaves whatever the catalogue already
 * had for it.
 */
export function toCrsProperties(
  adjustments: Adjustments,
  options: CrsOptions,
): CrsProperty[] {
  const properties: CrsProperty[] = [
    text("Version", CRS_VERSION),
    text("ProcessVersion", PROCESS_VERSION),
    boolean("HasSettings", true),
    boolean("AlreadyApplied", false),
  ];

  if (options.rawFileName) {
    properties.push(text("RawFileName", options.rawFileName));
  }

  // --- White balance -------------------------------------------------------
  if (options.isRaw) {
    properties.push(text("WhiteBalance", "As Shot"));
    properties.push(integer("IncrementalTemperature", adjustments.temperature));
    properties.push(integer("IncrementalTint", adjustments.tint));
  } else {
    properties.push(text("WhiteBalance", "Custom"));
    properties.push(integer("Temperature", adjustments.temperature));
    properties.push(integer("Tint", adjustments.tint));
  }

  // --- Tone (Process 2012) -------------------------------------------------
  properties.push(
    real("Exposure2012", adjustments.exposure, 2),
    integer("Contrast2012", adjustments.contrast),
    integer("Highlights2012", adjustments.highlights),
    integer("Shadows2012", adjustments.shadows),
    integer("Whites2012", adjustments.whites),
    integer("Blacks2012", adjustments.blacks),
    integer("Clarity2012", adjustments.clarity),
    integer("Texture", adjustments.texture),
    real("Dehaze", adjustments.dehaze, 2),
    integer("Vibrance", adjustments.vibrance),
    integer("Saturation", adjustments.saturation),
  );

  // --- Detail --------------------------------------------------------------
  properties.push(
    integer("Sharpness", adjustments.sharpenAmount),
    real("SharpenRadius", adjustments.sharpenRadius, 1),
    integer("SharpenDetail", adjustments.sharpenDetail),
    integer("SharpenEdgeMasking", adjustments.sharpenMasking),
    integer("LuminanceSmoothing", adjustments.luminanceNR),
    integer("LuminanceNoiseReductionDetail", adjustments.luminanceNRDetail),
    integer("ColorNoiseReduction", adjustments.colorNR),
    integer("ColorNoiseReductionDetail", adjustments.colorNRDetail),
  );

  // --- Optics --------------------------------------------------------------
  // LensProfileEnable and AutoLateralCA are integers in the schema, not booleans.
  properties.push(
    integer("LensProfileEnable", adjustments.lensProfile ? 1 : 0),
    integer("AutoLateralCA", adjustments.autoLateralCA ? 1 : 0),
    integer("DefringePurpleAmount", adjustments.defringePurple),
    integer("DefringeGreenAmount", adjustments.defringeGreen),
  );
  if (adjustments.lensProfile) {
    // "LensDefaults" lets Lightroom pick the profile that matches the EXIF lens
    // instead of us naming a profile file we cannot verify exists.
    properties.push(text("LensProfileSetup", "LensDefaults"));
  }

  // --- Post-crop vignette --------------------------------------------------
  properties.push(
    integer("PostCropVignetteAmount", adjustments.vignetteAmount),
    integer("PostCropVignetteMidpoint", adjustments.vignetteMidpoint),
    integer("PostCropVignetteFeather", adjustments.vignetteFeather),
    integer("PostCropVignetteRoundness", adjustments.vignetteRoundness),
    // 1 = Highlight Priority, Lightroom's own default.
    integer("PostCropVignetteStyle", 1),
  );

  // --- HSL -----------------------------------------------------------------
  for (const [channel, suffix] of Object.entries(CRS_HSL_SUFFIX) as Array<
    [HslChannel, string]
  >) {
    properties.push(integer(`HueAdjustment${suffix}`, adjustments.hsl.hue[channel]));
    properties.push(
      integer(`SaturationAdjustment${suffix}`, adjustments.hsl.saturation[channel]),
    );
    properties.push(
      integer(`LuminanceAdjustment${suffix}`, adjustments.hsl.luminance[channel]),
    );
  }

  // --- Colour grading ------------------------------------------------------
  //
  // Adobe reuses the old SplitToning storage for the shadow/highlight wheels and
  // adds dedicated properties for the midtone and global wheels, so a complete
  // colour grade needs both families written.
  const grade = adjustments.colorGrade;
  properties.push(
    integer("SplitToningShadowHue", grade.shadowHue),
    integer("SplitToningShadowSaturation", grade.shadowSat),
    integer("SplitToningHighlightHue", grade.highlightHue),
    integer("SplitToningHighlightSaturation", grade.highlightSat),
    integer("SplitToningBalance", grade.balance),
    integer("ColorGradeMidtoneHue", grade.midtoneHue),
    integer("ColorGradeMidtoneSat", grade.midtoneSat),
    integer("ColorGradeShadowLum", grade.shadowLum),
    integer("ColorGradeMidtoneLum", grade.midtoneLum),
    integer("ColorGradeHighlightLum", grade.highlightLum),
    integer("ColorGradeGlobalHue", grade.globalHue),
    integer("ColorGradeGlobalSat", grade.globalSat),
    integer("ColorGradeGlobalLum", grade.globalLum),
    integer("ColorGradeBlending", grade.blending),
  );

  // --- Crop ----------------------------------------------------------------
  const crop = adjustments.crop;
  if (crop) {
    properties.push(
      boolean("HasCrop", true),
      real("CropTop", crop.top, 6),
      real("CropLeft", crop.left, 6),
      real("CropBottom", crop.bottom, 6),
      real("CropRight", crop.right, 6),
      real("CropAngle", crop.angle, 4),
      integer("CropConstrainToWarp", 1),
    );
  } else {
    properties.push(boolean("HasCrop", false));
    if (adjustments.straighten !== 0) {
      // Straightening without an explicit crop still has to travel as a crop,
      // because CropAngle is the only rotation Camera Raw understands.
      properties.push(real("CropAngle", adjustments.straighten, 4));
    }
  }

  properties.push(text("ToneCurveName2012", adjustments.toneCurve.length > 0 ? "Custom" : "Linear"));
  return properties;
}

/** Tone-curve points as the `"x, y"` strings Camera Raw stores in its Seq. */
export function toneCurveSequence(adjustments: Adjustments): string[] {
  if (adjustments.toneCurve.length === 0) return ["0, 0", "255, 255"];
  return adjustments.toneCurve.map((point) => `${Math.round(point.x)}, ${Math.round(point.y)}`);
}
