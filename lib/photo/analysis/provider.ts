/**
 * Analysis providers.
 *
 * The editor never calls an analyser directly; it asks the registry for the
 * active provider. Today there is exactly one — `LocalAnalysisProvider`, which
 * runs entirely on the device and calls nothing over the network.
 *
 * ---------------------------------------------------------------------------
 * Adding a hosted model later (Gemini or any other)
 * ---------------------------------------------------------------------------
 *
 * Implement `AnalysisProvider` and register it. Nothing in the editor, the
 * adjustment engine, the XMP writer or the UI needs to change, because they all
 * consume `PhotoAnalysis` and are indifferent to where it came from.
 *
 * Two rules that the interface is deliberately shaped around:
 *
 * 1. **The API key never reaches the browser.** A hosted provider must POST to
 *    a route on this origin (a serverless function) that holds the key
 *    server-side and forwards the request. `requiresNetwork` exists so the UI
 *    can say plainly that a photo is about to leave the device, and so the
 *    local-only guarantee stays checkable.
 *
 * 2. **A hosted model augments, it does not replace.** The local pass produces
 *    the measurements (histogram, clipping, skin, sharpness, noise) that the
 *    engine needs and that a language model cannot measure. A remote provider
 *    should run the local pass first and then enrich `scene` — the wedding
 *    moment, the quality of an expression — which is the part local statistics
 *    genuinely cannot judge. `enrich` is the seam for exactly that.
 *
 * Until such a provider exists and is configured, `activeProvider()` returns
 * the local one and no request is ever made. There is no placeholder key, no
 * stubbed response and no code path that pretends a model ran.
 */
import type { ExifData, PhotoAnalysis, SourceFormat } from "../types";
import type { RgbaImage } from "./image";
import { analyzeImage } from "./analyze";

export interface AnalysisInput {
  /** Downscaled proxy the statistics are computed on. */
  image: RgbaImage;
  exif: ExifData;
  format: SourceFormat;
  fileName: string;
}

export interface AnalysisProvider {
  readonly id: string;
  /** Shown in the UI; must describe what actually ran. */
  readonly label: string;
  /** True when using it sends image data off the device. */
  readonly requiresNetwork: boolean;
  isAvailable(): boolean;
  analyze(input: AnalysisInput): Promise<PhotoAnalysis>;
  /**
   * Optional semantic pass layered on top of a completed analysis. The local
   * provider does not implement it: it has no way to judge an expression, and
   * guessing would be worse than saying nothing.
   */
  enrich?(analysis: PhotoAnalysis, input: AnalysisInput): Promise<PhotoAnalysis>;
}

export const LocalAnalysisProvider: AnalysisProvider = {
  id: "local",
  label: "Análisis automático (en el dispositivo)",
  requiresNetwork: false,
  isAvailable: () => true,
  analyze: ({ image, exif, format }) => analyzeImage(image, { exif, format }),
};

const providers = new Map<string, AnalysisProvider>([[LocalAnalysisProvider.id, LocalAnalysisProvider]]);
let activeId = LocalAnalysisProvider.id;

export function registerAnalysisProvider(provider: AnalysisProvider): void {
  providers.set(provider.id, provider);
}

export function listAnalysisProviders(): AnalysisProvider[] {
  return [...providers.values()];
}

/**
 * Selects the provider used from now on. Unknown or unavailable ids fall back
 * to the local provider rather than failing an import halfway through a batch.
 */
export function setActiveAnalysisProvider(id: string): AnalysisProvider {
  const provider = providers.get(id);
  activeId = provider?.isAvailable() ? id : LocalAnalysisProvider.id;
  return activeProvider();
}

export function activeProvider(): AnalysisProvider {
  return providers.get(activeId) ?? LocalAnalysisProvider;
}

/** Runs the active provider, plus its enrichment pass when it has one. */
export async function runAnalysis(input: AnalysisInput): Promise<PhotoAnalysis> {
  const provider = activeProvider();
  const analysis = await provider.analyze(input);
  return provider.enrich ? provider.enrich(analysis, input) : analysis;
}
