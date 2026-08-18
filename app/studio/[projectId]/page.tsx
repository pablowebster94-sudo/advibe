"use client";

import { use, useCallback, useMemo, useState } from "react";
import Link from "next/link";
import type { Adjustments } from "@/lib/photo/types";
import { useEffectiveAdjustments, useProjectStore } from "@/lib/photo/hooks/useProjectStore";
import { formatBytes } from "@/lib/photo/jobs/queue";
import { Dropzone } from "@/components/studio/Dropzone";
import { ImportProgress } from "@/components/studio/ImportProgress";
import { PhotoGrid } from "@/components/studio/PhotoGrid";
import { DevelopView } from "@/components/studio/DevelopView";
import { GroupsView } from "@/components/studio/GroupsView";
import { ExportPanel } from "@/components/studio/ExportPanel";
import { Button, EmptyState, Notice, Panel, ProgressBar, Stat } from "@/components/studio/ui";

type Tab = "library" | "develop" | "groups" | "export" | "settings";

const TABS: Array<[Tab, string]> = [
  ["library", "Biblioteca"],
  ["develop", "Revelar"],
  ["groups", "Grupos"],
  ["export", "Exportar"],
  ["settings", "Ajustes"],
];

export default function ProjectPage({ params }: { params: Promise<{ projectId: string }> }) {
  // `params` is a promise in Next 16; `use()` unwraps it in a Client Component.
  const { projectId } = use(params);
  const store = useProjectStore(projectId);
  const { project, photos, groups, styles, stats, loading, error, importState, actions } = store;

  const [tab, setTab] = useState<Tab>("library");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const activePhoto = useMemo(
    () => photos.find((photo) => photo.id === activeId) ?? null,
    [photos, activeId],
  );
  const adjustments = useEffectiveAdjustments(activePhoto);

  const openPhoto = useCallback((id: string) => {
    setActiveId(id);
    setTab("develop");
  }, []);

  const toggleSelect = useCallback((id: string, additive: boolean) => {
    setSelectedIds((current) =>
      additive
        ? current.includes(id)
          ? current.filter((item) => item !== id)
          : [...current, id]
        : [id],
    );
  }, []);

  const navigate = useCallback(
    (delta: number) => {
      if (!activeId) return;
      const index = photos.findIndex((photo) => photo.id === activeId);
      const next = photos[index + delta];
      if (next) setActiveId(next.id);
    },
    [activeId, photos],
  );

  if (loading) return <p className="text-sm text-neutral-500">Cargando proyecto…</p>;
  if (error || !project) {
    return (
      <div className="space-y-3">
        <Notice tone="error">{error ?? "Proyecto no encontrado."}</Notice>
        <Link href="/studio" className="text-sm text-[#a4ef84] underline">
          Volver a proyectos
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-neutral-100">{project.name}</h1>
          <p className="text-xs text-neutral-500">
            {stats.total} fotografías · {formatBytes(stats.bytes)} ·{" "}
            {project.settings.mode === "wedding" ? "Modo boda" : "Modo general"}
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Stat label="Analizadas" value={stats.analyzed} />
          <Stat label="Editadas" value={stats.edited} />
          <Stat label="Selección" value={stats.picked} />
          <Stat label="Errores" value={stats.errors} />
        </div>
      </header>

      {stats.total > 0 && <ProgressBar value={stats.edited} total={stats.total} />}

      <nav className="flex gap-1 overflow-x-auto border-b border-neutral-800 pb-px">
        {TABS.map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            data-testid={`tab-${id}`}
            className={`min-h-11 shrink-0 border-b-2 px-4 text-sm transition-colors ${
              tab === id
                ? "border-[#78d94f] text-neutral-100"
                : "border-transparent text-neutral-500 hover:text-neutral-300"
            }`}
          >
            {label}
          </button>
        ))}
      </nav>

      {tab === "library" && (
        <div className="space-y-4">
          <Dropzone onFiles={actions.addFiles} disabled={importState.active} compact={stats.total > 0} />
          <ImportProgress state={importState} onCancel={actions.cancelImport} />

          {selectedIds.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 rounded-lg border border-neutral-800 bg-neutral-900/60 p-2">
              <span className="text-xs text-neutral-400">{selectedIds.length} marcada(s)</span>
              <Button
                variant="ghost"
                className="h-9 min-h-9"
                onClick={() => actions.setFlags(selectedIds, { picked: true, rejected: false })}
              >
                ★ Seleccionar
              </Button>
              <Button
                variant="ghost"
                className="h-9 min-h-9"
                onClick={() => actions.setFlags(selectedIds, { rejected: true, picked: false })}
              >
                ✕ Descartar
              </Button>
              <Button
                variant="ghost"
                className="h-9 min-h-9"
                onClick={() => actions.pasteAdjustments(selectedIds)}
                disabled={!store.clipboard}
              >
                Pegar ajustes
              </Button>
              <Button variant="ghost" className="h-9 min-h-9" onClick={() => setSelectedIds([])}>
                Limpiar
              </Button>
            </div>
          )}

          {photos.length === 0 ? (
            <EmptyState
              title="Sin fotografías"
              description="Conecta la cámara por cable o elige los archivos desde el almacenamiento. Los .ARW se leen sin copiarlos: solo se extrae la previsualización embebida y los metadatos."
            />
          ) : (
            <PhotoGrid
              photos={photos}
              settings={project.settings}
              selectedIds={selectedIds}
              activeId={activeId}
              onSelect={toggleSelect}
              onOpen={openPhoto}
              onTogglePick={(id) => {
                const photo = photos.find((item) => item.id === id);
                void actions.setFlags([id], { picked: !photo?.picked });
              }}
            />
          )}
        </div>
      )}

      {tab === "develop" &&
        (activePhoto ? (
          <DevelopView
            photo={activePhoto}
            photos={photos}
            settings={project.settings}
            adjustments={adjustments}
            selectedIds={selectedIds}
            onNavigate={navigate}
            onChange={(patch: Partial<Adjustments>) => actions.setManual(activePhoto.id, patch)}
            onReset={() => actions.clearManual(activePhoto.id)}
            onReapply={(strategy) => actions.reapplyAi(activePhoto.id, strategy)}
            onCopy={() => actions.copyAdjustments(activePhoto.id)}
            onSync={() => actions.pasteAdjustments(selectedIds)}
            onTogglePick={() => actions.setFlags([activePhoto.id], { picked: !activePhoto.picked })}
            onToggleReject={() =>
              actions.setFlags([activePhoto.id], { rejected: !activePhoto.rejected })
            }
          />
        ) : (
          <EmptyState
            title="Ninguna fotografía abierta"
            description="Abre una desde la biblioteca para ver el antes/después y ajustar los valores."
          />
        ))}

      {tab === "groups" && (
        <GroupsView
          groups={groups}
          photos={photos}
          onOpen={openPhoto}
          onPick={(id) => {
            const photo = photos.find((item) => item.id === id);
            void actions.setFlags([id], { picked: !photo?.picked });
          }}
          onRebuild={actions.refreshGroups}
        />
      )}

      {tab === "export" && (
        <ExportPanel project={project} photos={photos} selectedIds={selectedIds} />
      )}

      {tab === "settings" && (
        <div className="grid gap-3 lg:grid-cols-2">
          <Panel title="Modo de edición">
            <div className="space-y-4">
              <div className="flex gap-2">
                {(
                  [
                    ["wedding", "Boda"],
                    ["general", "General"],
                  ] as const
                ).map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => actions.updateSettings({ mode: value })}
                    className={`min-h-11 flex-1 rounded-lg border px-3 text-sm ${
                      project.settings.mode === value
                        ? "border-[#78d94f] text-[#a4ef84]"
                        : "border-neutral-700 text-neutral-300"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              <div>
                <div className="flex justify-between text-xs text-neutral-400">
                  <span>Intensidad creativa</span>
                  <span className="tabular-nums">
                    {Math.round(project.settings.intensity * 200)}%
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={project.settings.intensity}
                  onChange={(event) =>
                    actions.updateSettings({ intensity: Number(event.target.value) })
                  }
                  className="advibe-slider w-full"
                  style={{ ["--fill" as string]: `${project.settings.intensity * 100}%` }}
                />
                <p className="text-[11px] text-neutral-500">
                  Solo escala contraste, color y viñeta. Exposición, recuperación de luces y ruido
                  son corrección técnica y nunca se escalan.
                </p>
              </div>

              <div>
                <label
                  htmlFor="style-select"
                  className="mb-1 block text-xs text-neutral-400"
                >
                  Perfil de estilo
                </label>
                <select
                  id="style-select"
                  value={project.settings.styleProfileId ?? ""}
                  onChange={(event) =>
                    actions.updateSettings({ styleProfileId: event.target.value || undefined })
                  }
                  className="min-h-11 w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3 text-sm text-neutral-100"
                >
                  <option value="">Sin estilo (corrección neutra)</option>
                  {styles.map((style) => (
                    <option key={style.id} value={style.id}>
                      {style.name} · {style.sampleCount} ejemplos ·{" "}
                      {Math.round(style.confidence * 100)}% confianza
                    </option>
                  ))}
                </select>
                {styles.length === 0 && (
                  <p className="mt-1 text-[11px] text-neutral-500">
                    Todavía no has enseñado ningún estilo.{" "}
                    <Link href="/studio/estilos" className="text-[#a4ef84] underline">
                      Aprender mi estilo
                    </Link>
                  </p>
                )}
              </div>

              <Button variant="secondary" onClick={actions.reapplyAll} disabled={stats.analyzed === 0}>
                Reaplicar IA a todo el proyecto ({stats.analyzed})
              </Button>
            </div>
          </Panel>

          <Panel title="Almacenamiento y privacidad">
            <div className="space-y-3 text-sm leading-relaxed text-neutral-400">
              <p>
                Los archivos originales se leen una sola vez, al importar, y no se modifican ni se
                copian. De cada fotografía se guarda en este dispositivo una miniatura, un proxy de{" "}
                {project.settings.proxyEdge} px y los datos del análisis.
              </p>
              <div>
                <label htmlFor="proxy-edge" className="mb-1 block text-xs text-neutral-400">
                  Tamaño del proxy (afecta al espacio y al máximo del JPG exportado)
                </label>
                <select
                  id="proxy-edge"
                  value={project.settings.proxyEdge}
                  onChange={(event) =>
                    actions.updateSettings({ proxyEdge: Number(event.target.value) })
                  }
                  className="min-h-11 w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3 text-sm text-neutral-100"
                >
                  <option value={1200}>1200 px · ligero (~150 KB por foto)</option>
                  <option value={1600}>1600 px · equilibrado (~300 KB por foto)</option>
                  <option value={2560}>2560 px · alta (~700 KB por foto)</option>
                </select>
                <p className="mt-1 text-[11px] text-neutral-500">
                  Solo se aplica a las fotografías que importes a partir de ahora.
                </p>
              </div>
            </div>
          </Panel>
        </div>
      )}
    </div>
  );
}
