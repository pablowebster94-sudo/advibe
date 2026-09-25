/** EXIF extraction on top of the TIFF reader. */
import type { ExifData } from "../types";
import {
  type TiffFile,
  TIFF_TAGS,
  findEntry,
  readNumber,
  readNumbers,
  readString,
} from "./tiff";

/**
 * Sony MakerNote tags we can read.
 *
 * Sony encrypts or leaves undocumented most of this block, so only the handful
 * that are plainly readable are used. `ColorTemperature` is the valuable one:
 * it is the temperature the camera actually recorded, which standard EXIF does
 * not carry, and it turns the white-balance readout from an estimate into a
 * measurement whenever the shot was not on auto.
 */
const SONY_WHITE_BALANCE = 0x0115;
const SONY_COLOR_TEMPERATURE = 0xb021;
const SONY_LENS_TYPE = 0xb027;

const SONY_WB_LABELS: Record<number, string> = {
  0x00: "Automático",
  0x01: "Temperatura de color",
  0x10: "Luz de día",
  0x20: "Nublado",
  0x30: "Sombra",
  0x40: "Tungsteno",
  0x50: "Flash",
  0x60: "Fluorescente",
  0x70: "Personalizado",
};

/** `2026:08:18 14:03:11` -> epoch ms in the viewer's local timezone. */
export function parseExifDate(value: string | undefined): number | undefined {
  if (!value) return undefined;
  const match = /^(\d{4}):(\d{2}):(\d{2})[ T](\d{2}):(\d{2}):(\d{2})/.exec(value.trim());
  if (!match) {
    const fallback = Date.parse(value);
    return Number.isNaN(fallback) ? undefined : fallback;
  }
  const [, y, mo, d, h, mi, s] = match;
  const time = new Date(
    Number(y),
    Number(mo) - 1,
    Number(d),
    Number(h),
    Number(mi),
    Number(s),
  ).getTime();
  return Number.isNaN(time) ? undefined : time;
}

export async function extractExif(file: TiffFile): Promise<ExifData> {
  const exif: ExifData = {};

  exif.make = await readString(file, findEntry(file, TIFF_TAGS.Make, ["ifd0"]));
  exif.model = await readString(file, findEntry(file, TIFF_TAGS.Model, ["ifd0"]));
  exif.lensModel = await readString(file, findEntry(file, TIFF_TAGS.LensModel, ["exif"]));

  exif.exposureTime = await readNumber(file, findEntry(file, TIFF_TAGS.ExposureTime, ["exif"]));
  exif.fNumber = await readNumber(file, findEntry(file, TIFF_TAGS.FNumber, ["exif"]));
  exif.iso = await readNumber(file, findEntry(file, TIFF_TAGS.ISOSpeedRatings, ["exif"]));
  exif.focalLength = await readNumber(file, findEntry(file, TIFF_TAGS.FocalLength, ["exif"]));
  exif.focalLength35mm = await readNumber(
    file,
    findEntry(file, TIFF_TAGS.FocalLengthIn35mmFilm, ["exif"]),
  );
  exif.flash = await readNumber(file, findEntry(file, TIFF_TAGS.Flash, ["exif"]));
  exif.exposureProgram = await readNumber(
    file,
    findEntry(file, TIFF_TAGS.ExposureProgram, ["exif"]),
  );
  exif.meteringMode = await readNumber(file, findEntry(file, TIFF_TAGS.MeteringMode, ["exif"]));
  exif.lightSource = await readNumber(file, findEntry(file, TIFF_TAGS.LightSource, ["exif"]));
  exif.whiteBalanceMode = await readNumber(file, findEntry(file, TIFF_TAGS.WhiteBalance, ["exif"]));
  exif.orientation = await readNumber(file, findEntry(file, TIFF_TAGS.Orientation, ["ifd0"]));

  // --- vendor MakerNotes ---------------------------------------------------
  const makerNoteIfd = file.ifds.find((ifd) => ifd.kind === "makernote");
  if (makerNoteIfd) {
    exif.makerNotes = true;
    const temperature = await readNumber(file, makerNoteIfd.entries.get(SONY_COLOR_TEMPERATURE));
    // Sony writes 0 when the camera was on auto white balance; that is "not
    // recorded", not "0 K", so it is left undefined rather than shown as a value.
    if (temperature && temperature >= 1000 && temperature <= 50000) {
      exif.colorTemperature = temperature;
    }
    const setting = await readNumber(file, makerNoteIfd.entries.get(SONY_WHITE_BALANCE));
    if (setting !== undefined && SONY_WB_LABELS[setting]) {
      exif.whiteBalanceSetting = SONY_WB_LABELS[setting];
    }
    const lensType = await readNumber(file, makerNoteIfd.entries.get(SONY_LENS_TYPE));
    if (lensType !== undefined && lensType > 0) exif.lensTypeId = lensType;
  }

  const dateTime = await readString(file, findEntry(file, TIFF_TAGS.DateTimeOriginal, ["exif"]));
  if (dateTime) {
    exif.dateTimeOriginal = dateTime;
    exif.capturedAt = parseExifDate(dateTime);
  }

  const pixelX = await readNumber(file, findEntry(file, TIFF_TAGS.PixelXDimension, ["exif"]));
  const pixelY = await readNumber(file, findEntry(file, TIFF_TAGS.PixelYDimension, ["exif"]));
  if (pixelX && pixelY) {
    exif.width = pixelX;
    exif.height = pixelY;
  } else {
    // Fall back to the largest image dimensions advertised by any IFD, which in
    // an ARW is the full sensor image held in a SubIFD.
    let best = 0;
    for (const ifd of file.ifds) {
      const [width] = await readNumbers(file, ifd.entries.get(TIFF_TAGS.ImageWidth));
      const [height] = await readNumbers(file, ifd.entries.get(TIFF_TAGS.ImageHeight));
      if (width && height && width * height > best) {
        best = width * height;
        exif.width = width;
        exif.height = height;
      }
    }
  }

  // Drop keys that resolved to undefined so records stay compact in IndexedDB.
  for (const key of Object.keys(exif) as Array<keyof ExifData>) {
    if (exif[key] === undefined) delete exif[key];
  }
  return exif;
}

/**
 * Coarse as-shot colour temperature estimate.
 *
 * Sony does not publish a Kelvin value in standard EXIF, and deriving one from
 * the MakerNote RGGB levels needs the camera's colour matrix, which we do not
 * ship. We therefore map the EXIF LightSource enumeration to its nominal
 * Kelvin and label the result as an estimate everywhere it is shown. It is only
 * ever used for display, never for XMP output.
 */
export function estimateAsShotKelvin(exif: ExifData): { kelvin: number; estimated: boolean } {
  // A MakerNote reading is the real thing; prefer it over any estimate.
  if (exif.colorTemperature) {
    return { kelvin: exif.colorTemperature, estimated: false };
  }
  const nominal: Record<number, number> = {
    1: 5500, // Daylight
    2: 4000, // Fluorescent
    3: 2850, // Tungsten
    4: 5500, // Flash
    9: 5500, // Fine weather
    10: 6500, // Cloudy
    11: 7500, // Shade
    12: 6400, // Daylight fluorescent
    13: 5000, // Day white fluorescent
    14: 4150, // Cool white fluorescent
    15: 2940, // White fluorescent
    17: 2856, // Standard light A
    18: 4874, // Standard light B
    19: 6774, // Standard light C
    20: 5503, // D55
    21: 6504, // D65
    22: 7504, // D75
    23: 5003, // D50
  };
  const light = exif.lightSource;
  if (light !== undefined && nominal[light]) {
    return { kelvin: nominal[light], estimated: true };
  }
  if (exif.flash !== undefined && (exif.flash & 0x1) === 1) {
    return { kelvin: 5500, estimated: true };
  }
  return { kelvin: 5500, estimated: true };
}
