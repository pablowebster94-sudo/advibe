"use client";

/**
 * AdVibe Color Lab.
 *
 * Describe the material, look at what the transform does to it, and take away a
 * `.cube` that works in CapCut. Everything runs in the browser: the footage
 * never leaves the machine, which for unreleased client work is not a nicety.
 *
 * The page is built around one rule from the colour side of the house — a
 * technical conversion and a creative look are different files and must not be
 * sold as one. So the type of LUT is derived from what the settings actually
 * do, shown before the download, and drives the intensity recommendation.
 */
import { useCallback, useMemo, useRef, useState } from "react";
import { Badge, Button, Notice, Panel, Stat } from "@/components/studio/ui";
import {
  ColorSlider,
  Field,
  Select,
  TextInput,
  Toggle,
  ToningControl,
} from "@/components/studio/color/controls";
import { LutPreview, type PreviewSource } from "@/components/studio/color/LutPreview";
import { buildChart } from "@/lib/color/chart";
import {
  CAMERA_PROFILES,
  LOOK_PRESETS,
  findCameraProfile,
  findLookPreset,
} from "@/lib/color/presets";
import { buildLut, type LutSpec, type ShotMetadata } from "@/lib/color/pipeline";
import { NEUTRAL_TONE_CURVE } from "@/lib/color/tonemap";
import type { LookOptions, ToningWheel } from "@/lib/color/look";
import { analyzeFootage, type FootageAnalysis } from "@/lib/color/analyze";
import { headroomStops, midGreyCode } from "@/lib/color/transfer";

const LUT_SIZES = [17, 33, 45, 65];

interface Grade {
  look: LookOptions;
  /** Contrast as a percentage offset from the neutral rendering's slope. */
  contrast: number;
  warmth: number;
  tint: number;
  exposureEv: number;
}

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

const METADATA_FIELDS: Array<[keyof ShotMetadata, string]> = [
  ["camera", "Cámara"],
  ["lens", "Óptica"],
  ["iso", "ISO"],
  ["shutter", "Obturador"],
  ["aperture", "Diafragma"],
  ["whiteBalance", "Balance de blancos"],
  ["exposureNote", "Exposición"],
  ["resolution", "Resolución"],
  ["frameRate", "Frame rate"],
  ["lighting", "Iluminación"],
  ["intent", "Look buscado"],
];

export default function ColorLabPage() {
  const [profileId, setProfileId] = useState("sony-slog3-cine");
  const [presetId, setPresetId] = useState("piel-natural");
  const [grade, setGrade] = useState<Grade>(() => gradeFromPreset("piel-natural"));
  const [name, setName] = useState("");
  const [size, setSize] = useState(33);
  const [inputRange, setInputRange] = useState<"full" | "legal">("full");
  const [technicalOnly, setTechnicalOnly] = useState(false);
  const [metadata, setMetadata] = useState<ShotMetadata>({});

  const [frame, setFrame] = useState<PreviewSource | null>(null);
  const [frameLabel, setFrameLabel] = useState("");
  const [analysis, setAnalysis] = useState<FootageAnalysis | null>(null);
  const [busy, setBusy] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  // The frame at full resolution, kept so that changing the camera profile can
  // re-measure the same material instead of leaving a reading on screen that
  // was taken through a different transform.
  const originalFrame = useRef<PreviewSource | null>(null);

  const profile = findCameraProfile(profileId)!;
  const preset = findLookPreset(presetId)!;

  const spec: LutSpec = useMemo(
    () => ({
      name: name.trim() || `${preset.label} · ${profile.profile.split(" ·")[0]}`,
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
      technicalOnly,
      metadata,
    }),
    [name, preset, profile, size, grade, inputRange, technicalOnly, metadata],
  );

  const result = useMemo(() => buildLut(spec), [spec]);
  const { report } = result;

  // The preview always runs on a 33-node grid. It is showing what the transform
  // does, and a coarse grid picked for file size would put its own artefacts on
  // screen where they would be read as the look.
  const previewCube = useMemo(
    () => (size === 33 ? result.cube : buildLut({ ...spec, size: 33 }).cube),
    [result.cube, size, spec],
  );

  const chart = useMemo<PreviewSource>(() => {
    const built = buildChart(profile);
    return { width: built.width, height: built.height, data: built.data };
  }, [profile]);

  const source = frame ?? chart;
  const sourceLabel = frame ? `Origen · ${frameLabel}` : "Carta de referencia (log)";

  const selectPreset = (id: string) => {
    setPresetId(id);
    setGrade(gradeFromPreset(id));
  };

  const patchLook = (patch: Partial<LookOptions>) =>
    setGrade((current) => ({ ...current, look: { ...current.look, ...patch } }));

  const download = () => {
    const blob = new Blob([result.text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = report.fileName;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const loadMaterial = useCallback(
    async (file: File | undefined) => {
      if (!file) return;
      setBusy(true);
      setLoadError(null);
      try {
        const isVideo = file.type.startsWith("video/") || /\.(mp4|mov|m4v|webm)$/i.test(file.name);
        const { image, label } = isVideo
          ? await captureFromVideo(file)
          : await captureFromImage(file);

        originalFrame.current = image;
        setFrame(downscale(image, 720));
        setFrameLabel(label);
        // The analysis gets the full frame and makes its own proxy, so the
        // measurements are not taken through the preview's resampling.
        setAnalysis(await analyzeFootage(image, findCameraProfile(profileId)!));
      } catch (error) {
        setLoadError(error instanceof Error ? error.message : String(error));
      } finally {
        setBusy(false);
      }
    },
    [profileId],
  );

  const changeProfile = (id: string) => {
    setProfileId(id);
    const loaded = originalFrame.current;
    if (!loaded) return;
    // Every number in the analysis panel is a measurement of the *converted*
    // frame, so a different profile makes all of them wrong. Clear them first,
    // then re-measure, rather than leaving stale figures on screen.
    setAnalysis(null);
    setBusy(true);
    void analyzeFootage(loaded, findCameraProfile(id)!)
      .then(setAnalysis)
      .catch((error: unknown) =>
        setLoadError(error instanceof Error ? error.message : String(error)),
      )
      .finally(() => setBusy(false));
  };

  const applySuggestions = () => {
    if (!analysis) return;
    setGrade((current) => ({
      ...current,
      exposureEv: analysis.suggestedExposureEv,
      look: { ...current.look, skinProtection: analysis.suggestedSkinProtection },
    }));
  };

  const kindTone =
    report.kind === "technical" ? "accent" : report.kind === "creative" ? "neutral" : "good";

  return (
    <div className="space-y-4">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold tracking-tight text-neutral-100">Color Lab</h1>
          <p className="mt-1 max-w-2xl text-sm leading-relaxed text-neutral-400">
            Convierte material log a Rec.709 y genera un LUT 3D <code>.cube</code> real para
            CapCut. Todo se procesa en este dispositivo; el vídeo no se sube a ningún sitio.
          </p>
        </div>
        <Badge tone={kindTone}>{report.kindLabel}</Badge>
      </header>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="space-y-4">
          <Panel
            title="Previsualización"
            action={
              <div className="flex items-center gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="video/*,image/*"
                  className="hidden"
                  onChange={(event) => {
                    void loadMaterial(event.target.files?.[0]);
                    event.target.value = "";
                  }}
                />
                <Button
                  variant="secondary"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={busy}
                >
                  {busy ? "Analizando…" : "Cargar material"}
                </Button>
                {frame && (
                  <Button
                    variant="ghost"
                    onClick={() => {
                      originalFrame.current = null;
                      setFrame(null);
                      setAnalysis(null);
                    }}
                  >
                    Quitar
                  </Button>
                )}
              </div>
            }
          >
            <div className="space-y-3">
              {loadError && <Notice tone="error">{loadError}</Notice>}
              <LutPreview source={source} cube={previewCube} sourceLabel={sourceLabel} />
              {!frame && (
                <p className="text-[11px] leading-relaxed text-neutral-500">
                  La carta está dibujada en la codificación de {profile.profile}: cada parche es
                  el valor de código que la cámara habría grabado para ese color. Con el LUT
                  neutro vuelve exactamente a su color de destino, así que lo que veas cambiar es
                  el look y no la carta.
                </p>
              )}
            </div>
          </Panel>

          {analysis && (
            <Panel
              title="Análisis del material"
              action={
                <Button variant="secondary" onClick={applySuggestions}>
                  Aplicar sugerencias
                </Button>
              }
            >
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  <Stat
                    label="Negros (1%)"
                    value={`${(analysis.log.floor * 100).toFixed(1)}%`}
                    hint="código de origen"
                  />
                  <Stat
                    label="Blancos (99%)"
                    value={`${(analysis.log.ceiling * 100).toFixed(1)}%`}
                    hint="código de origen"
                  />
                  <Stat
                    label="Piel en cuadro"
                    value={`${(analysis.rendered.skin.coverage * 100).toFixed(0)}%`}
                    hint={
                      analysis.rendered.skin.meanHue !== null
                        ? `tono ${analysis.rendered.skin.meanHue.toFixed(0)}°`
                        : "sin piel medible"
                    }
                  />
                  <Stat
                    label="Exposición"
                    value={`${analysis.suggestedExposureEv > 0 ? "+" : ""}${analysis.suggestedExposureEv} EV`}
                    hint="corrección sugerida"
                  />
                </div>
                {analysis.warnings.map((warning) => (
                  <Notice key={warning} tone="warn">
                    {warning}
                  </Notice>
                ))}
                <ul className="space-y-1.5 text-sm leading-relaxed text-neutral-400">
                  {analysis.notes.map((note) => (
                    <li key={note} className="flex gap-2">
                      <span
                        aria-hidden
                        className="mt-2 h-1 w-1 shrink-0 rounded-full bg-neutral-600"
                      />
                      <span>{note}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </Panel>
          )}

          <Panel title="Entrega">
            <dl className="space-y-3 text-sm">
              <Row term="1. Nombre del LUT" description={report.name} />
              <Row term="2. Tipo" description={report.kindLabel} />
              <Row
                term="3. Gamma / gamut de entrada"
                description={`${report.inputTransfer} · ${report.inputGamut} — gris 18% en ${report.inputMidGrey.toFixed(1)}%, ${report.inputHeadroom.toFixed(1)} pasos de margen sobre gris`}
              />
              <Row term="4. Transformación" description={report.transformation} />
              <Row term="5. Look" description={report.lookDescription} />
              <Row
                term="6. Intensidad en CapCut"
                description={`${report.capcutIntensity}%. ${report.intensityReason}`}
              />
              <Row
                term="7. Archivo"
                description={`${report.fileName} — rejilla ${report.size}³, ${report.size ** 3} entradas`}
              />
            </dl>

            <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
              <Stat label="Gris 18% sale a" value={`${(report.measured.midGrey * 100).toFixed(1)}%`} />
              <Stat label="Blanco máximo" value={`${(report.measured.white * 100).toFixed(1)}%`} />
              <Stat
                label="Recorte"
                value={`${(report.measured.clippedHigh * 100).toFixed(2)}%`}
                hint="nodos en blanco puro"
              />
              <Stat
                label="Error de rejilla"
                value={`${(report.measured.interpolationError * 100).toFixed(1)}%`}
                hint={
                  report.measured.interpolationError > 0.02
                    ? "sube a 65 si vas a corregir encima"
                    : "holgado"
                }
              />
            </div>

            {report.validation.errors.map((error) => (
              <div key={error} className="mt-3">
                <Notice tone="error">{error}</Notice>
              </div>
            ))}
            {report.validation.warnings.map((warning) => (
              <div key={warning} className="mt-3">
                <Notice tone="warn">{warning}</Notice>
              </div>
            ))}

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <Button variant="primary" onClick={download} disabled={!report.validation.valid}>
                Descargar {report.fileName}
              </Button>
              <span className="text-xs text-neutral-500">
                En CapCut: Ajustar → LUT → Importar, y la intensidad al {report.capcutIntensity}%.
              </span>
            </div>
          </Panel>
        </div>

        <div className="space-y-4">
          <Panel title="Material">
            <div className="space-y-3">
              <Field label="Cámara y perfil de imagen" hint={profile.note}>
                <Select value={profileId} onChange={changeProfile}>
                  {CAMERA_PROFILES.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.camera} — {option.profile}
                    </option>
                  ))}
                </Select>
              </Field>

              <div className="grid grid-cols-2 gap-2 text-[11px] text-neutral-500">
                <span>Gris 18% en {(midGreyCode(profile.transfer) * 100).toFixed(1)}%</span>
                <span className="text-right">
                  {headroomStops(profile.transfer).toFixed(1)} pasos sobre gris
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
            </div>
          </Panel>

          <Panel title="Look">
            <div className="space-y-3">
              <Field label="Punto de partida">
                <Select value={presetId} onChange={selectPreset}>
                  {LOOK_PRESETS.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.label}
                    </option>
                  ))}
                </Select>
              </Field>
              <p className="text-[11px] leading-relaxed text-neutral-500">{preset.description}</p>

              <Toggle
                label="Sólo conversión técnica"
                hint="Emite la transformación sin look. Es el LUT que va debajo de una corrección, no encima."
                checked={technicalOnly}
                onChange={setTechnicalOnly}
              />

              <fieldset disabled={technicalOnly} className={technicalOnly ? "opacity-40" : ""}>
                <ColorSlider
                  label="Exposición"
                  value={grade.exposureEv}
                  min={-3}
                  max={3}
                  step={0.05}
                  decimals={2}
                  suffix=" EV"
                  onChange={(value) => setGrade((current) => ({ ...current, exposureEv: value }))}
                />
                <ColorSlider
                  label="Contraste"
                  value={grade.contrast}
                  min={-40}
                  max={40}
                  hint="Pendiente de la curva alrededor del gris medio."
                  onChange={(value) => setGrade((current) => ({ ...current, contrast: value }))}
                />
                <ColorSlider
                  label="Elevación de negros"
                  value={grade.look.shadowLift}
                  min={-40}
                  max={60}
                  onChange={(value) => patchLook({ shadowLift: value })}
                />
                <ColorSlider
                  label="Calidez"
                  value={grade.warmth}
                  min={-60}
                  max={60}
                  hint="Reencuadra el eje neutro entre 8500 K y 4300 K. No corrige el balance de cámara: eso ya está grabado."
                  onChange={(value) => setGrade((current) => ({ ...current, warmth: value }))}
                />
                <ColorSlider
                  label="Matiz verde / magenta"
                  value={grade.tint}
                  min={-40}
                  max={40}
                  onChange={(value) => setGrade((current) => ({ ...current, tint: value }))}
                />
                <ColorSlider
                  label="Saturación"
                  value={grade.look.saturation}
                  min={-60}
                  max={60}
                  onChange={(value) => patchLook({ saturation: value })}
                />
                <ColorSlider
                  label="Intensidad de color"
                  value={grade.look.vibrance}
                  min={-60}
                  max={60}
                  hint="Sube sólo los colores todavía apagados."
                  onChange={(value) => patchLook({ vibrance: value })}
                />
                <ColorSlider
                  label="Protección de piel"
                  value={Math.round(grade.look.skinProtection * 100)}
                  min={0}
                  max={100}
                  neutral={70}
                  suffix="%"
                  hint="Cuánta saturación y viraje se le retiran a los tonos de piel."
                  onChange={(value) => patchLook({ skinProtection: value / 100 })}
                />
                <ColorSlider
                  label="Techo de saturación"
                  value={Math.round(grade.look.saturationCeiling * 100)}
                  min={50}
                  max={100}
                  neutral={92}
                  suffix="%"
                  hint="Límite superior de saturación, más estrecho en rojos, verdes y piel."
                  onChange={(value) => patchLook({ saturationCeiling: value / 100 })}
                />

                <div className="mt-3 space-y-2">
                  <ToningControl
                    label="Sombras"
                    hue={grade.look.shadowToning.hue}
                    strength={grade.look.shadowToning.strength}
                    onChange={(wheel: ToningWheel) => patchLook({ shadowToning: wheel })}
                  />
                  <ToningControl
                    label="Medios"
                    hue={grade.look.midtoneToning.hue}
                    strength={grade.look.midtoneToning.strength}
                    onChange={(wheel: ToningWheel) => patchLook({ midtoneToning: wheel })}
                  />
                  <ToningControl
                    label="Altas luces"
                    hue={grade.look.highlightToning.hue}
                    strength={grade.look.highlightToning.strength}
                    onChange={(wheel: ToningWheel) => patchLook({ highlightToning: wheel })}
                  />
                </div>
              </fieldset>
            </div>
          </Panel>

          <Panel title="Archivo">
            <div className="space-y-3">
              <Field label="Nombre del LUT">
                <TextInput value={name} onChange={setName} placeholder={spec.name} />
              </Field>
              <Field
                label="Rejilla"
                hint="33 es el estándar y lo que espera CapCut. 65 interpola mejor en sombras a costa de un archivo ocho veces mayor."
              >
                <Select value={String(size)} onChange={(value) => setSize(Number(value))}>
                  {LUT_SIZES.map((option) => (
                    <option key={option} value={String(option)}>
                      {option}³ — {option ** 3} entradas
                    </option>
                  ))}
                </Select>
              </Field>
            </div>
          </Panel>

          <Panel title="Datos del rodaje">
            <p className="mb-3 text-[11px] leading-relaxed text-neutral-500">
              Opcional, y sólo se escribe en la cabecera del archivo: nada de esto cambia un solo
              valor del LUT. Lo que dejes en blanco se queda fuera en lugar de rellenarse con un
              valor plausible.
            </p>
            <div className="space-y-3">
              {METADATA_FIELDS.map(([key, label]) => (
                <Field key={key} label={label}>
                  <TextInput
                    value={metadata[key] ?? ""}
                    onChange={(value) => setMetadata((current) => ({ ...current, [key]: value }))}
                  />
                </Field>
              ))}
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}

function Row({ term, description }: { term: string; description: string }) {
  return (
    <div className="grid gap-0.5 sm:grid-cols-[190px_minmax(0,1fr)] sm:gap-3">
      <dt className="text-xs uppercase tracking-wider text-neutral-500">{term}</dt>
      <dd className="leading-relaxed text-neutral-300">{description}</dd>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Getting a frame out of whatever the user dropped in
// ---------------------------------------------------------------------------

function readCanvas(canvas: HTMLCanvasElement): PreviewSource {
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) throw new Error("Este navegador no expone un contexto 2D de canvas.");
  const image = context.getImageData(0, 0, canvas.width, canvas.height);
  return { width: image.width, height: image.height, data: image.data };
}

function downscale(source: PreviewSource, longEdge: number): PreviewSource {
  const scale = Math.min(1, longEdge / Math.max(source.width, source.height));
  if (scale >= 1) return source;

  const staging = document.createElement("canvas");
  staging.width = source.width;
  staging.height = source.height;
  // The copy is deliberate: `ImageData` insists on a buffer it owns, and this
  // runs once per loaded frame rather than per pixel.
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

function captureFromVideo(file: File): Promise<{ image: PreviewSource; label: string }> {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    const url = URL.createObjectURL(file);
    video.preload = "metadata";
    video.muted = true;
    video.playsInline = true;

    const fail = (message: string) => {
      URL.revokeObjectURL(url);
      reject(new Error(message));
    };

    // Browsers decode a narrow set of codecs, and camera-original log footage
    // is very often outside it. Say what to do about it instead of failing with
    // a blank error, because exporting a still loses nothing here.
    video.onerror = () =>
      fail(
        "El navegador no puede decodificar este vídeo. Exporta un fotograma como PNG o TIFF " +
          "desde tu editor y súbelo: el análisis es exactamente el mismo.",
      );
    video.onloadeddata = () => {
      // A couple of seconds in: the first frame of a take is very often the
      // operator's hand still on the camera.
      video.currentTime = Math.min(2, (video.duration || 0) / 2);
    };
    video.onseeked = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        if (canvas.width === 0) {
          fail("El vídeo no expone dimensiones legibles.");
          return;
        }
        canvas.getContext("2d")!.drawImage(video, 0, 0);
        const image = readCanvas(canvas);
        URL.revokeObjectURL(url);
        resolve({ image, label: `${file.name} @ ${video.currentTime.toFixed(1)} s` });
      } catch (error) {
        fail(error instanceof Error ? error.message : String(error));
      }
    };
    video.src = url;
  });
}

function captureFromImage(file: File): Promise<{ image: PreviewSource; label: string }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const element = new Image();
    element.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("No se pudo abrir la imagen."));
    };
    element.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = element.naturalWidth;
        canvas.height = element.naturalHeight;
        canvas.getContext("2d")!.drawImage(element, 0, 0);
        const image = readCanvas(canvas);
        URL.revokeObjectURL(url);
        resolve({ image, label: file.name });
      } catch (error) {
        URL.revokeObjectURL(url);
        reject(error instanceof Error ? error : new Error(String(error)));
      }
    };
    element.src = url;
  });
}
