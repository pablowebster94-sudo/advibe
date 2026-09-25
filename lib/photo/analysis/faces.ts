/**
 * Pluggable face detection.
 *
 * Backends, in order of preference:
 *
 *  1. `native` — the browser's Shape Detection API (`window.FaceDetector`).
 *     Real detection, zero bytes downloaded. Currently ships behind a flag in
 *     Chrome on Android and is absent from iOS Safari, so it cannot be the only
 *     backend.
 *  2. `skin-region` — the classical detector in `analysis/skin.ts`. Always
 *     available, works offline, and is honest about what it is: skin blobs with
 *     face-like geometry, not verified faces.
 *
 * To add a model-based backend (BlazeFace / MediaPipe), implement
 * `FaceDetectorBackend` and register it with `setFaceDetectorBackend`. Nothing
 * else in the codebase needs to change. See docs/AI.md for the trade-offs.
 */
import type { RgbaImage } from "./image";

export interface DetectedFace {
  /** Normalised bounding box, 0..1. */
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface FaceDetectorBackend {
  readonly name: string;
  isAvailable(): boolean | Promise<boolean>;
  detect(image: RgbaImage): Promise<DetectedFace[]>;
}

interface NativeFaceDetectorLike {
  detect(source: ImageBitmap | ImageData): Promise<
    Array<{ boundingBox: { x: number; y: number; width: number; height: number } }>
  >;
}

type FaceDetectorConstructor = new (options?: {
  fastMode?: boolean;
  maxDetectedFaces?: number;
}) => NativeFaceDetectorLike;

function nativeConstructor(): FaceDetectorConstructor | null {
  const scope = globalThis as unknown as { FaceDetector?: FaceDetectorConstructor };
  return typeof scope.FaceDetector === "function" ? scope.FaceDetector : null;
}

export const nativeShapeDetectionBackend: FaceDetectorBackend = {
  name: "native-shape-detection",
  isAvailable() {
    return nativeConstructor() !== null && typeof createImageBitmap === "function";
  },
  async detect(image: RgbaImage): Promise<DetectedFace[]> {
    const Detector = nativeConstructor();
    if (!Detector) return [];
    const detector = new Detector({ fastMode: true, maxDetectedFaces: 24 });
    const bitmap = await createImageBitmap(
      new ImageData(new Uint8ClampedArray(image.data), image.width, image.height),
    );
    try {
      const faces = await detector.detect(bitmap);
      return faces.map((face) => ({
        x: face.boundingBox.x / image.width,
        y: face.boundingBox.y / image.height,
        w: face.boundingBox.width / image.width,
        h: face.boundingBox.height / image.height,
      }));
    } finally {
      bitmap.close();
    }
  },
};

let backend: FaceDetectorBackend | null = null;
let probed = false;

export function setFaceDetectorBackend(next: FaceDetectorBackend | null): void {
  backend = next;
  probed = next !== null;
}

/**
 * Returns the number of faces the active backend found, or `null` when no
 * backend is available. `null` is meaningful: it tells `analyzeSkin` to fall
 * back to the geometric heuristic and to label the result accordingly, instead
 * of reporting a confident zero.
 */
export async function detectFaceCount(image: RgbaImage): Promise<number | null> {
  if (!probed) {
    probed = true;
    try {
      backend = (await nativeShapeDetectionBackend.isAvailable())
        ? nativeShapeDetectionBackend
        : null;
    } catch {
      backend = null;
    }
  }
  if (!backend) return null;
  try {
    return (await backend.detect(image)).length;
  } catch {
    // A backend that throws once is treated as unavailable from then on.
    backend = null;
    return null;
  }
}
