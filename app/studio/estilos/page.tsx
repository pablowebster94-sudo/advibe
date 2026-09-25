"use client";

/**
 * "Aprender mi estilo".
 *
 * Learns from RAW + `.xmp` pairs the photographer exported from Lightroom: we
 * read their actual slider values, analyse the same photo ourselves, and record
 * how far their choice sat from a neutral corrective pass.
 */
import { useCallback, useEffect, useState } from "react";
import type { SceneTag, StyleProfile, StyleSample } from "@/lib/photo/types";
import { analyzeFile } from "@/lib/photo/jobs/analyzeTask";
import { learnStyleProfile } from "@/lib/photo/editing/styleLearning";
import { parseXmp } from "@/lib/photo/xmp/read";
import { SCENE_LABELS } from "@/lib/photo/editing/strategies";
import { createId, isSupportedFile } from "@/lib/photo/pipeline";
import * as db from "@/lib/photo/storage/db";
import { Button, EmptyState, Notice, Panel, ProgressBar } from "@/components/studio/ui";

interface PendingPair {
  baseName: string;
  image?: File;
  xmp?: File;
}

export default function StylesPage() {
  const [profiles, setProfiles] = useState<StyleProfile[]>([]);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [log, setLog] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [reloadToken, setReloadToken] = useState(0);
  const reload = useCallback(() => setReloadToken((token) => token + 1), []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const stored = await db.listStyleProfiles();
      if (!cancelled) setProfiles(stored);
    })();
    return () => {
      cancelled = true;
    };
  }, [reloadToken]);

  const learn = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setBusy(true);
    setError(null);
    setLog([]);

    try {
      // Pair each image with the sidecar that shares its base name.
      const pairs = new Map<string, PendingPair>();
      for (const file of Array.from(files)) {
        const dot = file.name.lastIndexOf(".");
        const base = dot <= 0 ? file.name : file.name.slice(0, dot);
        const extension = dot === -1 ? "" : file.name.slice(dot + 1).toLowerCase();
        const entry = pairs.get(base) ?? { baseName: base };
        if (extension === "xmp") entry.xmp = file;
        else if (isSupportedFile(file.name)) entry.image = file;
        pairs.set(base, entry);
      }

      const usable = [...pairs.values()].filter((pair) => pair.image && pair.xmp);
      const messages: string[] = [];
      for (const pair of pairs.values()) {
        if (!pair.image) messages.push(`${pair.baseName}: falta la imagen original.`);
        else if (!pair.xmp) messages.push(`${pair.baseName}: falta el archivo .xmp.`);
      }

      if (usable.length === 0) {
        setLog(messages);
        setError(
          "No se encontró ningún par imagen + .xmp. Exporta los metadatos desde Lightroom " +
            "(Metadatos > Guardar metadatos en el archivo) y sube ambos archivos juntos.",
        );
        return;
      }

      setProgress({ done: 0, total: usable.length });
      const samples: StyleSample[] = [];

      for (const pair of usable) {
        try {
          const xmpText = await pair.xmp!.text();
          const parsed = parseXmp(xmpText);
          if (parsed.empty) {
            messages.push(`${pair.baseName}: el .xmp no contiene ajustes de Camera Raw.`);
            continue;
          }
          if (parsed.unsupported.length > 0) {
            messages.push(
              `${pair.baseName}: ignorados ${parsed.unsupported.length} parámetro(s) no soportados (${parsed.unsupported.slice(0, 3).join(", ")}).`,
            );
          }

          const analyzed = await analyzeFile({
            fileName: pair.image!.name,
            blob: pair.image!,
            proxyEdge: 800,
          });

          // A file whose pixels the browser cannot decode still has EXIF, but a
          // style sample needs the "before" measurements, so this pair is
          // skipped with the reason stated instead of silently dropped.
          if (!analyzed.ok) {
            messages.push(`${pair.baseName}: ${analyzed.reason}`);
            continue;
          }

          samples.push({
            id: createId("smp"),
            fileName: pair.image!.name,
            before: analyzed.analysis,
            adjustments: parsed.adjustments,
            source: "xmp",
            scene: analyzed.analysis.scene.primary as SceneTag,
            addedAt: Date.now(),
          });
        } catch (pairError) {
          messages.push(
            `${pair.baseName}: ${pairError instanceof Error ? pairError.message : String(pairError)}`,
          );
        } finally {
          setProgress((current) => ({ ...current, done: current.done + 1 }));
        }
      }

      if (samples.length === 0) {
        setLog(messages);
        setError("No se pudo aprender de ningún par.");
        return;
      }

      const profile = learnStyleProfile(samples, {
        id: createId("sty"),
        name: name.trim() || "Mi estilo",
      });
      await db.putStyleProfile(profile);
      for (const sample of samples) await db.putStyleSample(profile.id, sample);

      messages.unshift(
        `Perfil "${profile.name}" creado con ${samples.length} ejemplo(s). Confianza ${Math.round(profile.confidence * 100)}%.`,
      );
      setLog(messages);
      setName("");
      reload();
    } catch (learnError) {
      setError(learnError instanceof Error ? learnError.message : String(learnError));
    } finally {
      setBusy(false);
    }
  };

  const remove = async (profile: StyleProfile) => {
    if (!globalThis.confirm(`¿Eliminar el perfil "${profile.name}"?`)) return;
    await db.deleteStyleProfile(profile.id);
    reload();
  };

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-xl font-semibold text-neutral-100">Aprender mi estilo</h1>
        <p className="mt-1 max-w-3xl text-sm leading-relaxed text-neutral-400">
          Sube fotografías que ya editaste <strong>junto a su archivo .xmp</strong>. El sistema
          analiza cada original, lee exactamente qué hiciste tú, y aprende la diferencia respecto
          de una corrección neutra. Eso es lo que se aplica luego a una sesión nueva: no copia tus
          valores, aprende tu criterio.
        </p>
      </header>

      {error && <Notice tone="error">{error}</Notice>}

      <Panel title="Enseñar un estilo nuevo">
        <div className="space-y-3">
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Estilo de Pablo"
            aria-label="Nombre del estilo"
            className="min-h-11 w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3 text-sm text-neutral-100 placeholder:text-neutral-600"
          />
          <label className="flex min-h-11 cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-neutral-700 px-4 py-6 text-sm text-neutral-300 hover:border-neutral-600">
            <input
              type="file"
              multiple
              accept=".arw,.dng,.tif,.tiff,.jpg,.jpeg,.png,.xmp"
              className="sr-only"
              disabled={busy}
              onChange={(event) => {
                void learn(event.target.files);
                event.target.value = "";
              }}
            />
            {busy ? "Aprendiendo…" : "Seleccionar originales + sus .xmp"}
          </label>

          {busy && progress.total > 0 && (
            <div className="space-y-1">
              <ProgressBar value={progress.done} total={progress.total} />
              <p className="text-xs text-neutral-500">
                {progress.done} de {progress.total} pares
              </p>
            </div>
          )}

          <Notice>
            Se necesitan al menos 5 pares para que el perfil tenga confianza suficiente. Los
            parámetros en los que tu criterio varíe mucho entre fotos se aplicarán con menos peso o
            se ignorarán: si no hay patrón, no se inventa uno.
          </Notice>

          {log.length > 0 && (
            <ul className="max-h-48 space-y-1 overflow-y-auto rounded-lg border border-neutral-800 p-2">
              {log.map((line, index) => (
                <li key={`${line}-${index}`} className="text-xs text-neutral-400">
                  {line}
                </li>
              ))}
            </ul>
          )}
        </div>
      </Panel>

      {profiles.length === 0 ? (
        <EmptyState
          title="Sin perfiles todavía"
          description="Cuando tengas uno, podrás elegirlo en los ajustes de cualquier proyecto."
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {profiles.map((profile) => (
            <article key={profile.id} className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h2 className="text-base font-semibold text-neutral-100">{profile.name}</h2>
                  <p className="text-xs text-neutral-500">
                    {profile.sampleCount} ejemplos · confianza{" "}
                    {Math.round(profile.confidence * 100)}%
                  </p>
                </div>
                <Button variant="ghost" className="h-8 min-h-8 px-2 text-xs" onClick={() => remove(profile)}>
                  Eliminar
                </Button>
              </div>

              <dl className="mt-3 space-y-1">
                {Object.entries(profile.biases)
                  .filter(([, bias]) => Math.abs(bias.mean) > 0.5)
                  .sort(([, a], [, b]) => Math.abs(b.mean) - Math.abs(a.mean))
                  .slice(0, 8)
                  .map(([key, bias]) => (
                    <div key={key} className="flex justify-between text-xs">
                      <dt className="text-neutral-500">{key}</dt>
                      <dd className="tabular-nums text-neutral-300">
                        {bias.mean > 0 ? "+" : ""}
                        {bias.mean.toFixed(1)}
                        <span className="ml-1 text-neutral-600">±{bias.stdDev.toFixed(1)}</span>
                      </dd>
                    </div>
                  ))}
              </dl>

              {Object.keys(profile.sceneBiases).length > 0 && (
                <p className="mt-2 text-[11px] text-neutral-500">
                  Con criterio propio por escena:{" "}
                  {Object.keys(profile.sceneBiases)
                    .map((scene) => SCENE_LABELS[scene as SceneTag])
                    .join(", ")}
                </p>
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
