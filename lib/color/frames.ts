/**
 * Pulling representative frames out of a video file, in the browser.
 *
 * Two things make this less trivial than it looks.
 *
 * **One frame is not a clip.** A single grab can land on a pan across a window,
 * on the half-second the auto-exposure spent hunting, or on somebody walking
 * through shot. The correction derived from it would then belong to that
 * accident rather than to the take. So several frames are sampled across the
 * duration and the analysis takes the median.
 *
 * **The browser decodes a narrow set of codecs.** Camera-original log footage is
 * very often H.265, ProRes or a raw-ish codec that no browser will touch, and
 * the failure mode is a silent `error` event with no useful message. That is
 * worth catching and explaining, because exporting one still from the editor
 * loses nothing here — the analysis only ever sees pixels.
 */
import type { RgbaImage } from "../photo/analysis/image";
import type { ClipFrame } from "./analyze";

export interface ExtractedClip {
  frames: ClipFrame[];
  /** What to show the user: file name, and how the frames were taken. */
  label: string;
  /** Seconds, or null for a still. */
  duration: number | null;
  width: number;
  height: number;
  /**
   * Always null for video: see `extractVideoFrames`. Kept in the shape so the
   * caller does not have to special-case a field that may one day be knowable.
   */
  frameRate: number | null;
}

/**
 * Where to sample, as fractions of the duration.
 *
 * Not evenly spaced from 0 to 1: the first and last moments of a take are the
 * operator's hand on the camera and the run-out, and neither says anything
 * about how the shot was lit.
 */
function samplePoints(count: number): number[] {
  if (count <= 1) return [0.5];
  const first = 0.1;
  const last = 0.9;
  return Array.from({ length: count }, (_, index) => first + ((last - first) * index) / (count - 1));
}

function readCanvas(canvas: HTMLCanvasElement): RgbaImage {
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) throw new Error("Este navegador no expone un contexto 2D de canvas.");
  const image = context.getImageData(0, 0, canvas.width, canvas.height);
  return { data: image.data, width: image.width, height: image.height };
}

const DECODE_HELP =
  "El navegador no puede decodificar este vídeo. Los códecs de cámara (H.265/HEVC, ProRes, " +
  "MXF) no se abren en un navegador. Exporta un fragmento a H.264/MP4 o WebM, o exporta un " +
  "fotograma como PNG o TIFF: el análisis ve píxeles, así que el resultado es el mismo.";

/** Waits for a seek to land, with a timeout so a stalled decode does not hang. */
function seekTo(video: HTMLVideoElement, time: number): Promise<void> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      cleanup();
      reject(new Error(`El vídeo no respondió al buscar el segundo ${time.toFixed(1)}.`));
    }, 15000);
    const onSeeked = () => {
      cleanup();
      resolve();
    };
    const onError = () => {
      cleanup();
      reject(new Error(DECODE_HELP));
    };
    const cleanup = () => {
      clearTimeout(timer);
      video.removeEventListener("seeked", onSeeked);
      video.removeEventListener("error", onError);
    };
    video.addEventListener("seeked", onSeeked);
    video.addEventListener("error", onError);
    video.currentTime = time;
  });
}

export async function extractVideoFrames(
  file: File,
  count: number,
  onProgress?: (done: number, total: number) => void,
): Promise<ExtractedClip> {
  const url = URL.createObjectURL(file);
  const video = document.createElement("video");
  video.preload = "auto";
  video.muted = true;
  video.playsInline = true;
  video.src = url;

  try {
    await new Promise<void>((resolve, reject) => {
      const timer = setTimeout(
        () => reject(new Error("El vídeo tardó demasiado en abrirse.")),
        20000,
      );
      video.onloadeddata = () => {
        clearTimeout(timer);
        resolve();
      };
      video.onerror = () => {
        clearTimeout(timer);
        reject(new Error(DECODE_HELP));
      };
    });

    if (!video.videoWidth || !video.videoHeight) throw new Error(DECODE_HELP);

    const duration = Number.isFinite(video.duration) && video.duration > 0 ? video.duration : 0;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext("2d", { willReadFrequently: true });
    if (!context) throw new Error("Este navegador no expone un contexto 2D de canvas.");

    const wanted = duration > 0 ? samplePoints(count) : [0];
    const frames: ClipFrame[] = [];
    for (const [index, fraction] of wanted.entries()) {
      const time = duration > 0 ? duration * fraction : 0;
      if (duration > 0) await seekTo(video, time);
      context.drawImage(video, 0, 0);
      frames.push({ timeSeconds: video.currentTime, image: readCanvas(canvas) });
      onProgress?.(index + 1, wanted.length);
    }

    // No frame rate. A browser does not expose the *source* frame rate of a
    // video: `getVideoPlaybackQuality` counts frames it has rendered, which
    // after seeking around a file has nothing to do with how it was shot, and
    // reporting that number would put a confidently wrong 69 fps in the file
    // header. The field is left for the operator to fill in, because a blank
    // is honest and a guess is not.
    return {
      frames,
      label:
        duration > 0
          ? `${file.name} · ${frames.length} fotogramas entre ${frames[0].timeSeconds.toFixed(1)} s y ${frames[frames.length - 1].timeSeconds.toFixed(1)} s`
          : `${file.name} · 1 fotograma`,
      duration: duration > 0 ? duration : null,
      width: video.videoWidth,
      height: video.videoHeight,
      frameRate: null,
    };
  } finally {
    video.removeAttribute("src");
    video.load();
    URL.revokeObjectURL(url);
  }
}

export async function extractImageFrame(file: File): Promise<ExtractedClip> {
  const url = URL.createObjectURL(file);
  try {
    const element = await new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error("No se pudo abrir la imagen."));
      image.src = url;
    });

    const canvas = document.createElement("canvas");
    canvas.width = element.naturalWidth;
    canvas.height = element.naturalHeight;
    const context = canvas.getContext("2d", { willReadFrequently: true });
    if (!context) throw new Error("Este navegador no expone un contexto 2D de canvas.");
    context.drawImage(element, 0, 0);

    return {
      frames: [{ timeSeconds: 0, image: readCanvas(canvas) }],
      label: `${file.name} · fotograma único`,
      duration: null,
      width: canvas.width,
      height: canvas.height,
      frameRate: null,
    };
  } finally {
    URL.revokeObjectURL(url);
  }
}

export function isVideoFile(file: File): boolean {
  return file.type.startsWith("video/") || /\.(mp4|mov|m4v|webm|mkv|avi)$/i.test(file.name);
}

export async function extractClip(
  file: File,
  count: number,
  onProgress?: (done: number, total: number) => void,
): Promise<ExtractedClip> {
  return isVideoFile(file)
    ? extractVideoFrames(file, count, onProgress)
    : extractImageFrame(file);
}

/** Box-filtered downscale, for the preview. Kept off the analysis path. */
export function downscale(source: RgbaImage, longEdge: number): RgbaImage {
  const scale = Math.min(1, longEdge / Math.max(source.width, source.height));
  if (scale >= 1) return source;

  const staging = document.createElement("canvas");
  staging.width = source.width;
  staging.height = source.height;
  // `ImageData` insists on a buffer it owns; this runs once per loaded frame.
  const owned = new Uint8ClampedArray(source.data);
  staging.getContext("2d")!.putImageData(new ImageData(owned, source.width, source.height), 0, 0);

  const canvas = document.createElement("canvas");
  canvas.width = Math.round(source.width * scale);
  canvas.height = Math.round(source.height * scale);
  const context = canvas.getContext("2d", { willReadFrequently: true })!;
  context.imageSmoothingQuality = "high";
  context.drawImage(staging, 0, 0, canvas.width, canvas.height);
  return readCanvas(canvas);
}
