"use client";

/**
 * Estudio de imagen — single screen, mobile first.
 *
 * One tap on "GENERAR IMAGEN" = one request = one image. Nothing on this screen
 * generates automatically: there is no auto-retry, no variants and no upscale.
 */

import { useCallback, useEffect, useRef, useState } from "react";

import { base64ToBlob, buildFilename, downloadBlob, prepareReference } from "@/lib/client-image";
import {
  clearHistory,
  deleteHistory,
  listHistory,
  saveHistory,
  type HistoryEntry,
} from "@/lib/image-history";
import {
  ASPECT_RATIOS,
  DEFAULT_ASPECT_RATIO,
  DEFAULT_RESOLUTION,
  PROMPT_MAX_LENGTH,
  RESOLUTIONS,
  extensionForMimeType,
  type AspectRatio,
  type GenerateImageResponse,
  type ReferenceImage,
  type Resolution,
} from "@/lib/image-studio";

type Result = {
  url: string;
  blob: Blob;
  mimeType: string;
  prompt: string;
  aspectRatio: AspectRatio;
  resolution: Resolution;
  mock: boolean;
};

function ratioStyle(aspectRatio: AspectRatio) {
  return { aspectRatio: aspectRatio.replace(":", " / ") };
}

function formatDate(value: number) {
  return new Date(value).toLocaleString("es-EC", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function EstudioPage() {
  const [prompt, setPrompt] = useState("");
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>(DEFAULT_ASPECT_RATIO);
  const [resolution, setResolution] = useState<Resolution>(DEFAULT_RESOLUTION);
  const [reference, setReference] = useState<ReferenceImage | null>(null);
  const [referenceUrl, setReferenceUrl] = useState<string | null>(null);
  const [referenceName, setReferenceName] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const resultRef = useRef<HTMLElement>(null);
  const inFlightRef = useRef(false);
  const resultUrlRef = useRef<string | null>(null);
  const referenceUrlRef = useRef<string | null>(null);

  useEffect(() => {
    let active = true;
    listHistory().then((entries) => {
      if (active) setHistory(entries);
    });
    return () => {
      active = false;
    };
  }, []);

  useEffect(
    () => () => {
      if (resultUrlRef.current) URL.revokeObjectURL(resultUrlRef.current);
      if (referenceUrlRef.current) URL.revokeObjectURL(referenceUrlRef.current);
    },
    []
  );

  // On a phone the result lands below the form, so bring it into view.
  useEffect(() => {
    if (result) resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [result]);

  const clearReference = useCallback(() => {
    if (referenceUrlRef.current) URL.revokeObjectURL(referenceUrlRef.current);
    referenceUrlRef.current = null;
    setReference(null);
    setReferenceUrl(null);
    setReferenceName(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, []);

  const handleReferenceChange = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;
      setError(null);
      try {
        const prepared = await prepareReference(file);
        if (referenceUrlRef.current) URL.revokeObjectURL(referenceUrlRef.current);
        const url = URL.createObjectURL(base64ToBlob(prepared.data, prepared.mimeType));
        referenceUrlRef.current = url;
        setReference(prepared);
        setReferenceUrl(url);
        setReferenceName(file.name);
      } catch (cause) {
        clearReference();
        setError(cause instanceof Error ? cause.message : "No se pudo cargar la referencia.");
      }
    },
    [clearReference]
  );

  const handleGenerate = useCallback(async () => {
    if (inFlightRef.current) return;
    const trimmed = prompt.trim();
    if (!trimmed) {
      setError("Escribe qué quieres crear.");
      return;
    }

    inFlightRef.current = true;
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: trimmed, aspectRatio, resolution, reference }),
      });

      const payload = (await response.json().catch(() => null)) as
        | (GenerateImageResponse & { error?: string })
        | null;

      if (!response.ok || !payload?.image?.data) {
        throw new Error(payload?.error || "No se pudo generar la imagen. Inténtalo de nuevo.");
      }

      const blob = base64ToBlob(payload.image.data, payload.image.mimeType);
      if (resultUrlRef.current) URL.revokeObjectURL(resultUrlRef.current);
      const url = URL.createObjectURL(blob);
      resultUrlRef.current = url;

      setResult({
        url,
        blob,
        mimeType: payload.image.mimeType,
        prompt: trimmed,
        aspectRatio: payload.aspectRatio,
        resolution: payload.resolution,
        mock: Boolean(payload.mock),
      });

      const entries = await saveHistory({
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        prompt: trimmed,
        aspectRatio: payload.aspectRatio,
        resolution: payload.resolution,
        mimeType: payload.image.mimeType,
        createdAt: Date.now(),
        blob,
      });
      setHistory(entries);
    } catch (cause) {
      // A failure stops here. Nothing is retried automatically.
      setError(cause instanceof Error ? cause.message : "Error inesperado.");
    } finally {
      inFlightRef.current = false;
      setIsLoading(false);
    }
  }, [aspectRatio, prompt, reference, resolution]);

  const handleNewImage = useCallback(() => {
    if (resultUrlRef.current) URL.revokeObjectURL(resultUrlRef.current);
    resultUrlRef.current = null;
    setResult(null);
    setError(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const canGenerate = prompt.trim().length > 0 && !isLoading;

  return (
    <main className="mx-auto w-full max-w-xl px-4 pb-16 pt-8 sm:pt-12">
      <header className="mb-7">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">
          AdVibe · Nano Banana 2
        </p>
        <h1 className="mt-2 text-3xl font-semibold leading-tight sm:text-4xl">Estudio de imagen</h1>
        <p className="mt-2 text-sm text-[var(--text-muted)]">
          Describe lo que quieres, elige formato y resolución. Cada generación crea una sola imagen.
        </p>
      </header>

      <section className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-2xl shadow-black/40 sm:p-6">
        <label htmlFor="prompt" className="block text-sm font-medium">
          ¿Qué quieres crear?
        </label>
        <textarea
          id="prompt"
          value={prompt}
          onChange={(event) => setPrompt(event.target.value.slice(0, PROMPT_MAX_LENGTH))}
          rows={5}
          placeholder="Ej.: retrato de una mujer con chaqueta de cuero en una calle de noche, luces de neón reflejadas en el suelo mojado"
          className="mt-2 w-full resize-y rounded-2xl border border-[var(--border)] bg-[#050b13] p-3 text-base leading-relaxed outline-none placeholder:text-[#5c6b78] focus:border-[var(--accent)]"
        />
        <div className="mt-1 text-right text-xs text-[var(--text-muted)]">
          {prompt.length}/{PROMPT_MAX_LENGTH}
        </div>

        <div className="mt-5">
          <p className="text-sm font-medium">
            Referencia <span className="text-[var(--text-muted)]">(opcional)</span>
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleReferenceChange}
          />
          {referenceUrl ? (
            <div className="mt-2 flex items-center gap-3 rounded-2xl border border-[var(--border)] bg-[#050b13] p-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={referenceUrl}
                alt="Imagen de referencia seleccionada"
                className="h-16 w-16 shrink-0 rounded-xl object-cover"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm">{referenceName}</p>
                <p className="text-xs text-[var(--text-muted)]">Se enviará como referencia visual</p>
              </div>
              <button
                type="button"
                onClick={clearReference}
                className="rounded-full border border-[var(--border)] px-3 py-1.5 text-xs font-medium text-[var(--text-muted)] hover:border-white/30 hover:text-white"
              >
                Quitar
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="mt-2 w-full rounded-2xl border border-dashed border-[var(--border)] bg-[#050b13] px-4 py-3.5 text-sm font-medium text-[var(--text-muted)] hover:border-[var(--accent)] hover:text-white"
            >
              + Añadir imagen de referencia
            </button>
          )}
        </div>

        <fieldset className="mt-6">
          <legend className="text-sm font-medium">Formato</legend>
          <div className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-5">
            {ASPECT_RATIOS.map((option) => {
              const active = option.value === aspectRatio;
              return (
                <button
                  key={option.value}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setAspectRatio(option.value)}
                  className={`rounded-2xl border px-2 py-3 text-center ${
                    active
                      ? "border-[var(--accent)] bg-[var(--accent)]/12 text-white"
                      : "border-[var(--border)] bg-[#050b13] text-[var(--text-muted)] hover:border-white/25"
                  }`}
                >
                  <span className="block text-sm font-semibold">{option.label}</span>
                  <span className="mt-0.5 block text-[10px] leading-tight">{option.hint}</span>
                </button>
              );
            })}
          </div>
        </fieldset>

        <fieldset className="mt-6">
          <legend className="text-sm font-medium">Resolución</legend>
          <div className="mt-2 grid grid-cols-3 gap-2">
            {RESOLUTIONS.map((option) => {
              const active = option.value === resolution;
              return (
                <button
                  key={option.value}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setResolution(option.value)}
                  className={`rounded-2xl border px-2 py-3 text-center ${
                    active
                      ? "border-[var(--accent)] bg-[var(--accent)]/12 text-white"
                      : "border-[var(--border)] bg-[#050b13] text-[var(--text-muted)] hover:border-white/25"
                  }`}
                >
                  <span className="block text-sm font-semibold">{option.label}</span>
                  <span className="mt-0.5 block text-[10px] leading-tight">{option.hint}</span>
                </button>
              );
            })}
          </div>
        </fieldset>

        <button
          type="button"
          onClick={handleGenerate}
          disabled={!canGenerate}
          className="mt-7 flex w-full items-center justify-center gap-3 rounded-2xl bg-[var(--accent)] px-6 py-4 text-base font-bold uppercase tracking-wide text-[#04140a] disabled:cursor-not-allowed disabled:opacity-45"
        >
          {isLoading ? (
            <>
              <span
                aria-hidden
                className="h-5 w-5 animate-spin rounded-full border-2 border-[#04140a]/30 border-t-[#04140a]"
              />
              Generando…
            </>
          ) : (
            "Generar imagen"
          )}
        </button>
        <p className="mt-2 text-center text-xs text-[var(--text-muted)]">
          1 pulsación = 1 imagen. No se generan variantes ni copias automáticas.
        </p>
      </section>

      {error ? (
        <p
          role="alert"
          className="mt-5 rounded-2xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200"
        >
          {error}
        </p>
      ) : null}

      {result ? (
        <section ref={resultRef} className="mt-8 scroll-mt-4">
          <h2 className="text-lg font-semibold">Tu imagen</h2>
          {result.mock ? (
            <p className="mt-2 rounded-xl border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
              Modo simulado activo (GEMINI_MOCK_MODE=1). No se ha llamado a Nano Banana 2.
            </p>
          ) : null}
          <div
            className="mt-3 overflow-hidden rounded-3xl border border-[var(--border)] bg-black"
            style={ratioStyle(result.aspectRatio)}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={result.url}
              alt={result.prompt}
              className="h-full w-full object-contain"
            />
          </div>
          <p className="mt-2 text-xs text-[var(--text-muted)]">
            {result.aspectRatio} · {result.resolution}
          </p>
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() =>
                downloadBlob(
                  result.blob,
                  buildFilename(result.prompt, extensionForMimeType(result.mimeType))
                )
              }
              className="rounded-2xl bg-[var(--accent)] px-5 py-3.5 text-sm font-bold uppercase tracking-wide text-[#04140a]"
            >
              Descargar
            </button>
            <button
              type="button"
              onClick={handleNewImage}
              className="rounded-2xl border border-[var(--border)] px-5 py-3.5 text-sm font-semibold hover:border-white/30"
            >
              Nueva imagen
            </button>
          </div>
        </section>
      ) : null}

      {history.length > 0 ? (
        <section className="mt-10">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Historial</h2>
            <button
              type="button"
              onClick={async () => {
                await clearHistory();
                setHistory([]);
              }}
              className="text-xs text-[var(--text-muted)] underline underline-offset-4 hover:text-white"
            >
              Vaciar
            </button>
          </div>
          <p className="mt-1 text-xs text-[var(--text-muted)]">
            Guardado solo en este dispositivo.
          </p>
          <ul className="mt-4 space-y-3">
            {history.map((entry) => (
              <HistoryCard
                key={entry.id}
                entry={entry}
                onDelete={async () => setHistory(await deleteHistory(entry.id))}
              />
            ))}
          </ul>
        </section>
      ) : null}
    </main>
  );
}

function HistoryCard({ entry, onDelete }: { entry: HistoryEntry; onDelete: () => void }) {
  // The object URL is attached straight to the DOM node (and revoked on
  // cleanup) so the thumbnail needs no extra render pass.
  const attachThumbnail = useCallback(
    (node: HTMLImageElement | null) => {
      if (!node) return;
      const objectUrl = URL.createObjectURL(entry.blob);
      node.src = objectUrl;
      return () => URL.revokeObjectURL(objectUrl);
    },
    [entry.blob]
  );

  return (
    <li className="flex gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-3">
      <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-black">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img ref={attachThumbnail} alt={entry.prompt} className="h-full w-full object-cover" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="line-clamp-2 text-sm">{entry.prompt}</p>
        <p className="mt-1 text-xs text-[var(--text-muted)]">
          {entry.aspectRatio} · {entry.resolution} · {formatDate(entry.createdAt)}
        </p>
        <div className="mt-2 flex gap-3 text-xs">
          <button
            type="button"
            onClick={() =>
              downloadBlob(
                entry.blob,
                buildFilename(entry.prompt, extensionForMimeType(entry.mimeType))
              )
            }
            className="font-semibold text-[var(--accent)] underline underline-offset-4"
          >
            Descargar
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="text-[var(--text-muted)] underline underline-offset-4 hover:text-white"
          >
            Eliminar
          </button>
        </div>
      </div>
    </li>
  );
}
