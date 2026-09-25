"use client";

import { formatBytes, formatEta } from "@/lib/photo/jobs/queue";
import type { ImportState } from "@/lib/photo/hooks/useProjectStore";
import { Button, Notice, ProgressBar, Stat } from "./ui";

export function ImportProgress({
  state,
  onCancel,
}: {
  state: ImportState;
  onCancel: () => void;
}) {
  const { progress } = state;
  const done = progress.completed + progress.failed;

  if (!state.active && done === 0 && state.skipped.length === 0 && state.errors.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3 rounded-xl border border-neutral-800 bg-neutral-900/70 p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-neutral-100">
            {state.active ? "Analizando fotografías…" : "Análisis terminado"}
          </h3>
          <p className="text-xs text-neutral-500">
            {done} de {progress.total}
            {progress.failed > 0 && ` · ${progress.failed} con error`}
          </p>
        </div>
        {state.active && (
          <Button variant="ghost" onClick={onCancel}>
            Detener
          </Button>
        )}
      </div>

      <ProgressBar value={done} total={progress.total} />

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Stat label="Procesadas" value={done} />
        <Stat label="Velocidad" value={`${progress.rate.toFixed(2)}/s`} />
        <Stat label="Restante" value={formatEta(progress.etaMs)} />
        <Stat label="Leído" value={formatBytes(progress.bytesProcessed)} />
      </div>

      {!state.usesWorkers && state.active && (
        <Notice tone="warn">
          Este navegador no permitió crear workers, así que el análisis se ejecuta en el hilo
          principal: funciona igual pero la interfaz puede ir a tirones con lotes grandes.
        </Notice>
      )}

      {state.skipped.length > 0 && (
        <Notice tone="warn">
          {state.skipped.length} archivo(s) omitido(s) por formato no soportado:{" "}
          {state.skipped.slice(0, 4).join(", ")}
          {state.skipped.length > 4 && ` y ${state.skipped.length - 4} más`}.
        </Notice>
      )}

      {state.errors.length > 0 && (
        <details className="rounded-lg border border-red-900 bg-red-950/30 px-3 py-2 text-sm text-red-200">
          <summary className="cursor-pointer font-medium">
            {state.errors.length} archivo(s) no se pudieron analizar
          </summary>
          <ul className="mt-2 space-y-1 text-xs">
            {state.errors.slice(0, 20).map((item) => (
              <li key={`${item.fileName}-${item.message}`}>
                <span className="font-mono">{item.fileName}</span>: {item.message}
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}
