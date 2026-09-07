"use client";

/**
 * AdVibe Color Lab.
 *
 * Load a clip, describe the camera, measure the material, choose a look, take
 * away a `.cube`. Everything runs in the browser: the footage never leaves the
 * machine, which for unreleased client work is not a nicety.
 *
 * The page is a linear flow because the dependencies are real — a correction
 * derived before the material is analysed would be a correction for somebody
 * else's footage — and because the flow is the argument the tool is making:
 * transform, then correct *this clip*, then apply taste, as three separable
 * things rather than one "cinematic look" that happens to flatter one shot.
 */
import { useCallback, useMemo, useRef, useState } from "react";
import { Badge, Button, Notice, Panel } from "@/components/studio/ui";
import { Field, Select, TextInput, Toggle } from "@/components/studio/color/controls";
import { Step, type StepState } from "@/components/studio/color/Step";
import { AnalysisReport } from "@/components/studio/color/AnalysisReport";
import { LookControls, type Grade } from "@/components/studio/color/LookControls";
import { ResultCard } from "@/components/studio/color/ResultCard";
import { LutPreview, type PreviewSource } from "@/components/studio/color/LutPreview";
import { buildChart } from "@/lib/color/chart";
import { CAMERA_PROFILES, findCameraProfile, findLookPreset } from "@/lib/color/presets";
import type { CameraProfile } from "@/lib/color/presets";
import { buildLut, type LutSpec, type ShotMetadata } from "@/lib/color/pipeline";
import { NEUTRAL_TONE_CURVE } from "@/lib/color/tonemap";
import { GAMUT_LABELS, type GamutId } from "@/lib/color/gamut";
import { TRANSFERS, headroomStops, midGreyCode, type TransferId } from "@/lib/color/transfer";
import { analyzeClip, summarizeClip, type ClipAnalysis } from "@/lib/color/analyze";
import { deriveCorrection, type DerivedCorrection } from "@/lib/color/correction";
import { downscale, extractClip, isVideoFile, type ExtractedClip } from "@/lib/color/frames";

/**
 * 65³ is the recommendation and the default: a log-to-display transform bends
 * hardest exactly where skin sits, and 33 nodes leave a measurable bow in the
 * midtones. 33 stays available because it is a quarter of a megabyte against
 * seven and every player on earth takes it.
 */
const LUT_SIZES = [
  { size: 65, label: "65³ — máxima precisión (recomendado)", hint: "274 625 entradas, ~7 MB" },
  { size: 33, label: "33³ — compatibilidad máxima", hint: "35 937 entradas, ~1 MB" },
];

const FRAME_COUNT = 5;

const METADATA_FIELDS: Array<[keyof ShotMetadata, string, string]> = [
  ["camera", "Cámara", "Sony FX3"],
  ["lens", "Lente", "Sigma 24-70 f/2.8"],
  ["iso", "ISO", "800"],
  ["shutter", "Shutter", "1/50"],
  ["aperture", "Apertura", "f/2.8"],
  ["whiteBalance", "Balance de blancos", "5600 K"],
  ["ev", "EV", "-0.3"],
  ["resolution", "Resolución", "3840×2160"],
  ["frameRate", "FPS", "25"],
  ["lighting", "Iluminación", "ventana lateral + rebote"],
  ["intent", "Look buscado", "entrevista cálida, piel natural"],
];

function gradeFromPreset(presetId: string): Grade {
  const preset = findLookPreset(presetId)!;
  return {
    look: {
      ...preset.look,
      shadowToning: { ...preset.look.shadowToning },
      midtoneToning: { ...preset.look.midtoneToning },
      highlightToning: { ...preset.look.highlightToning },
    },
    contrast: Math.round((preset.tone.slopePerStop / NEUTRAL_TONE_CURVE.slopePerStop - 1) * 100),
    warmth: preset.warmth,
    tint: preset.tint,
    exposureEv: 0,
  };
}

export default function ColorLabPage() {
  // --- Step 1: the material ------------------------------------------------
  const [clipSource, setClipSource] = useState<ExtractedClip | null>(null);
  const [loading, setLoading] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // --- Step 2: the camera --------------------------------------------------
  const [profileId, setProfileId] = useState("sony-slog3-cine");
  const [transfer, setTransfer] = useState<TransferId>("sLog3");
  const [gamut, setGamut] = useState<GamutId>("sGamut3Cine");
  const [inputRange, setInputRange] = useState<"full" | "legal">("full");
  const [metadata, setMetadata] = useState<ShotMetadata>({});

  // --- Steps 3-4: the analysis ---------------------------------------------
  const [clip, setClip] = useState<ClipAnalysis | null>(null);
  const [derived, setDerived] = useState<DerivedCorrection | null>(null);
  const [analysing, setAnalysing] = useState(false);
  const [useCorrection, setUseCorrection] = useState(true);

  // --- Step 5: the look ----------------------------------------------------
  const [presetId, setPresetId] = useState("piel-natural");
  const [grade, setGrade] = useState<Grade>(() => gradeFromPreset("piel-natural"));
  const [skipLook, setSkipLook] = useState(false);

  // --- Step 6: the file ----------------------------------------------------
  const [size, setSize] = useState(65);
  const [name, setName] = useState("");
  const [generated, setGenerated] = useState<{ spec: LutSpec; stamp: number } | null>(null);

  const listedProfile = findCameraProfile(profileId)!;
  const preset = findLookPreset(presetId)!;

  /**
   * The profile actually used. When gamma or gamut is overridden by hand this
   * is a synthetic profile, and it is labelled as such in the report — a LUT
   * built on a curve the camera does not use is wrong in a way that is
   * invisible until somebody grades on top of it.
   */
  const profile: CameraProfile = useMemo(() => {
    if (transfer === listedProfile.transfer && gamut === listedProfile.gamut) return listedProfile;
    return {
      ...listedProfile,
      id: `${listedProfile.id}-manual`,
      profile: `${TRANSFERS[transfer].label} · ${GAMUT_LABELS[gamut]} (ajustado a mano)`,
      transfer,
      gamut,
      note: "Gamma y gamut fijados a mano, no los del perfil de cámara seleccionado.",
    };
  }, [listedProfile, transfer, gamut]);

  const analysisSummary = useMemo(() => (clip ? summarizeClip(clip) : []), [clip]);

  const spec: LutSpec = useMemo(
    () => ({
      name:
        name.trim() ||
        defaultName(profile, skipLook ? null : preset.label, useCorrection && derived !== null),
      profile,
      preset,
      size,
      exposureEv: grade.exposureEv,
      look: grade.look,
      tone: {
        ...preset.tone,
        slopePerStop: NEUTRAL_TONE_CURVE.slopePerStop * (1 + grade.contrast / 100),
      },
      warmth: grade.warmth,
      tint: grade.tint,
      inputRange,
      correction: useCorrection && derived ? derived : undefined,
      skipLook,
      analysisSummary,
      metadata,
    }),
    [
      name, preset, profile, size, grade, inputRange, derived, useCorrection, skipLook,
      analysisSummary, metadata,
    ],
  );

  // The heavy build only runs when the user asks for it: a 65³ grid is 275 000
  // pixel transforms and re-running it on every slider drag would make the
  // controls feel broken.
  const result = useMemo(() => (generated ? buildLut(generated.spec) : null), [generated]);

  // The preview is always 33³ and always live. It shows what the transform
  // does, so a coarser or finer grid chosen for file size would put its own
  // artefacts on screen where they would be read as the look.
  const previewCube = useMemo(() => buildLut({ ...spec, size: 33 }).cube, [spec]);

  const chart = useMemo<PreviewSource>(() => {
    const built = buildChart(profile);
    return { width: built.width, height: built.height, data: built.data };
  }, [profile]);

  const previewFrame = useMemo<PreviewSource | null>(() => {
    if (!clipSource || clipSource.frames.length === 0) return null;
    const middle = clipSource.frames[Math.floor(clipSource.frames.length / 2)];
    return downscale(middle.image, 720);
  }, [clipSource]);

  const previewSource = previewFrame ?? chart;

  // --- Actions -------------------------------------------------------------

  const loadFile = useCallback(async (file: File | undefined) => {
    if (!file) return;
    setLoadError(null);
    setLoading(isVideoFile(file) ? "Extrayendo fotogramas…" : "Abriendo imagen…");
    // A new clip invalidates everything measured from the old one.
    setClip(null);
    setDerived(null);
    setGenerated(null);
    try {
      const extracted = await extractClip(file, FRAME_COUNT, (done, total) =>
        setLoading(`Extrayendo fotogramas… ${done}/${total}`),
      );
      setClipSource(extracted);
      // Resolution and frame rate are read off the file, so they are the only
      // two technical fields that are filled in rather than asked for.
      setMetadata((current) => ({
        ...current,
        resolution: `${extracted.width}×${extracted.height}`,
        frameRate: extracted.frameRate ? String(extracted.frameRate) : current.frameRate,
      }));
    } catch (error) {
      setClipSource(null);
      setLoadError(error instanceof Error ? error.message : String(error));
    } finally {
      setLoading(null);
    }
  }, []);

  const runAnalysis = useCallback(async () => {
    if (!clipSource) return;
    setAnalysing(true);
    setLoadError(null);
    setGenerated(null);
    try {
      const measured = await analyzeClip(clipSource.frames, profile);
      const correction = deriveCorrection(measured);
      setClip(measured);
      setDerived(correction);
      // The measured skin coverage decides how hard the look is held off skin.
      setGrade((current) => ({
        ...current,
        look: { ...current.look, skinProtection: measured.suggestedSkinProtection },
      }));
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : String(error));
    } finally {
      setAnalysing(false);
    }
  }, [clipSource, profile]);

  const selectProfile = (id: string) => {
    const next = findCameraProfile(id)!;
    setProfileId(id);
    setTransfer(next.transfer);
    setGamut(next.gamut);
    // The analysis measured the frames through a different transform, so every
    // number in it is now about a conversion that is no longer selected.
    setClip(null);
    setDerived(null);
    setGenerated(null);
  };

  const selectPreset = (id: string) => {
    setPresetId(id);
    setGrade(gradeFromPreset(id));
  };

  const download = () => {
    if (!result) return;
    const blob = new Blob([result.text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = result.report.fileName;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  // --- Step states ---------------------------------------------------------

  const hasClip = clipSource !== null;
  const hasAnalysis = clip !== null && derived !== null;
  const stale = generated !== null && generated.spec !== spec;

  const state = (done: boolean, ready: boolean, active: boolean): StepState =>
    done ? "done" : active ? "active" : ready ? "ready" : "locked";

  return (
    <div className="space-y-4">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold tracking-tight text-neutral-100">Color Lab</h1>
          <p className="mt-1 max-w-2xl text-sm leading-relaxed text-neutral-400">
            Analiza tu material y genera un LUT 3D <code>.cube</code> hecho para ese plano, no un
            preset de catálogo. Todo se procesa en este dispositivo; el vídeo no se sube a ningún
            sitio.
          </p>
        </div>
        {result && <Badge tone="accent">{result.report.kindLabel}</Badge>}
      </header>

      {loadError && <Notice tone="error">{loadError}</Notice>}

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="space-y-4">
          {/* ---------------------------------------------------------- 1 */}
          <Step
            index={1}
            title="Cargar vídeo"
            state={state(hasClip, true, !hasClip)}
            summary={clipSource?.label}
            action={
              <>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="video/*,image/*"
                  className="hidden"
                  onChange={(event) => {
                    void loadFile(event.target.files?.[0]);
                    event.target.value = "";
                  }}
                />
                <Button
                  variant={hasClip ? "secondary" : "primary"}
                  onClick={() => fileInputRef.current?.click()}
                  disabled={loading !== null}
                >
                  {loading ?? (hasClip ? "Cambiar material" : "Elegir vídeo o imagen")}
                </Button>
              </>
            }
          >
            {clipSource ? (
              <div className="space-y-3">
                <div className="flex flex-wrap gap-3 text-xs text-neutral-400">
                  <span>
                    {clipSource.width}×{clipSource.height}
                  </span>
                  {clipSource.duration !== null && <span>{clipSource.duration.toFixed(1)} s</span>}
                  {clipSource.frameRate !== null && <span>{clipSource.frameRate} fps</span>}
                  <span>{clipSource.frames.length} fotogramas extraídos</span>
                </div>
                <FrameStrip clip={clipSource} />
              </div>
            ) : (
              <p className="text-sm leading-relaxed text-neutral-400">
                Carga el clip que vas a corregir. Se extraen {FRAME_COUNT} fotogramas repartidos
                por la duración y se analizan todos: un solo fotograma puede caer en un
                barrido, en medio segundo de exposición automática buscando, o en alguien
                cruzando el plano, y la corrección saldría de ese accidente.
                <br />
                <br />
                El navegador decodifica H.264/MP4 y WebM. Los códecs de cámara (H.265, ProRes,
                MXF) no se abren aquí: exporta un fragmento o un fotograma en PNG, que el
                análisis sólo ve píxeles.
              </p>
            )}
          </Step>

          {/* ---------------------------------------------------------- 3 */}
          <Step
            index={3}
            title="Analizar material"
            state={state(hasAnalysis, hasClip, hasClip && !hasAnalysis)}
            lockedReason="Carga primero el material."
            summary={
              clip ? `${clip.frames.length} fotogramas medidos tras la conversión` : undefined
            }
            action={
              <Button
                variant={hasAnalysis ? "secondary" : "primary"}
                onClick={() => void runAnalysis()}
                disabled={!hasClip || analysing}
              >
                {analysing ? "Analizando…" : hasAnalysis ? "Volver a analizar" : "Analizar"}
              </Button>
            }
          >
            <p className="text-sm leading-relaxed text-neutral-400">
              El cuadro se convierte a Rec.709 <em>antes</em> de medirlo. Un fotograma en log
              leído en crudo se interpreta como una foto plana, gris y mal expuesta, y el
              detector de piel no encuentra nada: la piel en log queda fuera de todos los
              límites de crominancia con los que se calibró. Convertido primero, cada medida
              significa lo que debe significar.
            </p>
          </Step>

          {/* ---------------------------------------------------------- 4 */}
          <Step
            index={4}
            title="Análisis y corrección"
            state={state(false, hasAnalysis, hasAnalysis)}
            lockedReason="Analiza el material para ver sus medidas."
          >
            {clip && derived ? (
              <div className="space-y-4">
                <AnalysisReport clip={clip} derived={derived} />
                <Toggle
                  label="Aplicar la corrección al LUT"
                  hint="Desactívalo para llevarte sólo la transformación técnica más el look, sin lo que este plano en concreto necesitaba."
                  checked={useCorrection}
                  onChange={setUseCorrection}
                />
              </div>
            ) : (
              <p className="text-sm text-neutral-500">
                Aquí aparecerán exposición, contraste, saturación, balance de blancos, altas
                luces, sombras y tonos de piel, y qué corrección sale de cada medida.
              </p>
            )}
          </Step>

          {/* ---------------------------------------------------------- 6 */}
          <Step
            index={6}
            title="Generar LUT"
            state={state(result !== null && !stale, hasAnalysis, hasAnalysis && result === null)}
            lockedReason="Analiza el material antes de generar."
            action={
              <Button
                variant="primary"
                onClick={() => setGenerated({ spec, stamp: Date.now() })}
                disabled={!hasAnalysis}
              >
                {result === null ? "Generar LUT" : stale ? "Regenerar" : "Generado"}
              </Button>
            }
          >
            <div className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Nombre del LUT">
                  <TextInput value={name} onChange={setName} placeholder={spec.name} />
                </Field>
                <Field
                  label="Tamaño de la rejilla"
                  hint={LUT_SIZES.find((option) => option.size === size)?.hint}
                >
                  <Select value={String(size)} onChange={(value) => setSize(Number(value))}>
                    {LUT_SIZES.map((option) => (
                      <option key={option.size} value={String(option.size)}>
                        {option.label}
                      </option>
                    ))}
                  </Select>
                </Field>
              </div>
              {stale && (
                <Notice tone="warn">
                  Has cambiado algo desde que se generó. El archivo de abajo es el anterior:
                  vuelve a generar para que refleje los ajustes actuales.
                </Notice>
              )}
            </div>
          </Step>

          {/* ---------------------------------------------------------- 7 */}
          <Step
            index={7}
            title="Resultado y descarga"
            state={state(false, result !== null, result !== null)}
            lockedReason="Genera el LUT para verlo aquí."
          >
            {result ? (
              <ResultCard
                report={result.report}
                cameraLabel={`${profile.camera} — ${profile.profile}`}
                analysisSummary={analysisSummary}
                onDownload={download}
              />
            ) : (
              <p className="text-sm text-neutral-500">
                El nombre, la cámara, la transformación, el análisis, el look, la intensidad
                recomendada para CapCut y el botón de descarga aparecen aquí.
              </p>
            )}
          </Step>
        </div>

        {/* ------------------------------------------------------------ */}
        {/* Right column: camera data, look, and the live preview          */}
        {/* ------------------------------------------------------------ */}
        <div className="space-y-4">
          <Step index={2} title="Datos de cámara" state={hasClip ? "active" : "ready"}>
            <div className="space-y-3">
              <Field label="Perfil de imagen" hint={profile.note}>
                <Select value={profileId} onChange={selectProfile}>
                  {CAMERA_PROFILES.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.camera} — {option.profile}
                    </option>
                  ))}
                </Select>
              </Field>

              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Gamma">
                  <Select
                    value={transfer}
                    onChange={(value) => {
                      setTransfer(value);
                      setClip(null);
                      setDerived(null);
                      setGenerated(null);
                    }}
                  >
                    {(Object.keys(TRANSFERS) as TransferId[]).map((id) => (
                      <option key={id} value={id}>
                        {TRANSFERS[id].label}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="Gamut">
                  <Select
                    value={gamut}
                    onChange={(value) => {
                      setGamut(value);
                      setClip(null);
                      setDerived(null);
                      setGenerated(null);
                    }}
                  >
                    {(Object.keys(GAMUT_LABELS) as GamutId[]).map((id) => (
                      <option key={id} value={id}>
                        {GAMUT_LABELS[id]}
                      </option>
                    ))}
                  </Select>
                </Field>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px] text-neutral-500">
                <span>Gris 18% en {(midGreyCode(transfer) * 100).toFixed(1)}%</span>
                <span className="text-right">
                  {headroomStops(transfer).toFixed(1)} pasos sobre gris
                </span>
              </div>

              <Field
                label="Rango de la grabación"
                hint="Si dudas, déjalo en completo: es lo que entrega casi todo el software de edición."
              >
                <Select value={inputRange} onChange={setInputRange}>
                  <option value="full">Completo (0-1023)</option>
                  <option value="legal">Legal / vídeo (64-940)</option>
                </Select>
              </Field>

              <details className="rounded-lg border border-neutral-800 bg-neutral-900/60">
                <summary className="cursor-pointer px-3 py-2 text-xs text-neutral-400">
                  Datos del rodaje (opcionales)
                </summary>
                <div className="space-y-3 border-t border-neutral-800 p-3">
                  <p className="text-[11px] leading-relaxed text-neutral-500">
                    Sólo se escriben en la cabecera del archivo: ninguno cambia un valor del LUT.
                    La corrección sale de medir los fotogramas, no de lo que se declare aquí —
                    un ISO mal anotado no debe torcer un color. Lo que dejes en blanco se queda
                    fuera en lugar de rellenarse con un valor plausible.
                  </p>
                  {METADATA_FIELDS.map(([key, label, placeholder]) => (
                    <Field key={key} label={label}>
                      <TextInput
                        value={metadata[key] ?? ""}
                        placeholder={placeholder}
                        onChange={(value) =>
                          setMetadata((current) => ({ ...current, [key]: value }))
                        }
                      />
                    </Field>
                  ))}
                </div>
              </details>
            </div>
          </Step>

          <Step
            index={5}
            title="Seleccionar look"
            state={state(false, hasAnalysis, hasAnalysis)}
            lockedReason="Analiza el material antes de elegir el look."
          >
            <div className="space-y-3">
              <Toggle
                label="Sin look creativo"
                hint="Deja la transformación técnica más la corrección medida. Es el LUT que va debajo de una corrección, no encima."
                checked={skipLook}
                onChange={setSkipLook}
              />
              <LookControls
                presetId={presetId}
                grade={grade}
                disabled={skipLook}
                onSelectPreset={selectPreset}
                onChange={setGrade}
              />
            </div>
          </Step>

          <Panel title="Previsualización">
            <div className="space-y-3">
              <LutPreview
                source={previewSource}
                cube={previewCube}
                sourceLabel={previewFrame ? "Tu material (log)" : "Carta de referencia (log)"}
              />
              <p className="text-[11px] leading-relaxed text-neutral-500">
                {previewFrame
                  ? "Fotograma central de tu clip, con la cadena completa aplicada en vivo. La rejilla de la previsualización es siempre 33³."
                  : `La carta está dibujada en la codificación de ${TRANSFERS[transfer].label}: cada parche es el valor de código que la cámara habría grabado para ese color.`}
              </p>
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}

/**
 * A name that describes what is actually in the file.
 *
 * A technical conversion called "Piel natural · medido" is a file somebody will
 * later apply expecting a look and a correction that are not in it, so the look
 * and the "medido" mark only appear when those layers are really present.
 */
function defaultName(profile: CameraProfile, look: string | null, measured: boolean): string {
  const camera = profile.camera.split(" ")[0];
  const head = look ?? `${TRANSFERS[profile.transfer].label} a Rec.709`;
  return `${head} · ${camera}${measured ? " · medido" : ""}`;
}

/** Thumbnails of the frames the analysis will actually use. */
function FrameStrip({ clip }: { clip: ExtractedClip }) {
  const thumbnails = useMemo(
    () =>
      clip.frames.map((frame) => ({
        time: frame.timeSeconds,
        url: toDataUrl(downscale(frame.image, 200)),
      })),
    [clip],
  );

  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      {thumbnails.map((thumbnail) => (
        <figure key={thumbnail.time} className="shrink-0">
          {/* eslint-disable-next-line @next/next/no-img-element -- a canvas data URL, not an asset */}
          <img
            src={thumbnail.url}
            alt={`Fotograma en ${thumbnail.time.toFixed(1)} segundos`}
            className="h-20 rounded border border-neutral-800"
          />
          <figcaption className="mt-1 text-center text-[10px] tabular-nums text-neutral-500">
            {thumbnail.time.toFixed(1)} s
          </figcaption>
        </figure>
      ))}
    </div>
  );
}

function toDataUrl(image: { data: Uint8ClampedArray; width: number; height: number }): string {
  const canvas = document.createElement("canvas");
  canvas.width = image.width;
  canvas.height = image.height;
  const owned = new Uint8ClampedArray(image.data);
  canvas.getContext("2d")!.putImageData(new ImageData(owned, image.width, image.height), 0, 0);
  return canvas.toDataURL("image/png");
}
