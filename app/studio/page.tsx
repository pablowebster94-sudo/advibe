"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import type { PhotoRecord, ProjectRecord } from "@/lib/photo/types";
import { DEFAULT_SETTINGS, newProject, projectStats } from "@/lib/photo/pipeline";
import * as db from "@/lib/photo/storage/db";
import { formatBytes } from "@/lib/photo/jobs/queue";
import { Button, EmptyState, Notice, Panel, ProgressBar, Stat } from "@/components/studio/ui";

interface ProjectSummary {
  project: ProjectRecord;
  stats: ReturnType<typeof projectStats>;
}

export default function ProjectsPage() {
  const [summaries, setSummaries] = useState<ProjectSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [storage, setStorage] = useState<{ usage: number; quota: number } | null>(null);

  const [reloadToken, setReloadToken] = useState(0);
  const reload = useCallback(() => setReloadToken((token) => token + 1), []);

  useEffect(() => {
    let cancelled = false;

    // The state updates all sit after an await, so the effect never triggers a
    // cascading render on mount.
    void (async () => {
      try {
        const projects = await db.listProjects();
        const withStats = await Promise.all(
          projects.map(async (project) => ({
            project,
            stats: projectStats((await db.listPhotos(project.id)) as PhotoRecord[]),
          })),
        );
        const estimate = await db.estimateStorage();
        if (cancelled) return;
        setSummaries(withStats);
        if (estimate.supported) setStorage({ usage: estimate.usage, quota: estimate.quota });
        setLoading(false);
      } catch (loadError) {
        if (cancelled) return;
        setError(loadError instanceof Error ? loadError.message : String(loadError));
        setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [reloadToken]);

  const create = async () => {
    const suggested =
      name.trim() ||
      `Boda — ${new Date().toLocaleDateString("es-EC", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      })}`;
    const project = newProject(suggested, DEFAULT_SETTINGS);
    await db.putProject(project);
    setName("");
    globalThis.location.assign(`/studio/${project.id}`);
  };

  const remove = async (project: ProjectRecord) => {
    const confirmed = globalThis.confirm(
      `¿Eliminar "${project.name}" y todos sus datos analizados?\n\n` +
        "Tus archivos RAW originales NO se tocan: solo se borra lo que esta aplicación guardó en este dispositivo.",
    );
    if (!confirmed) return;
    await db.deleteProject(project.id);
    reload();
  };

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-xl font-semibold text-neutral-100">Proyectos</h1>
        <p className="mt-1 text-sm text-neutral-400">
          Cada proyecto es una sesión. Todo se procesa y se guarda en este dispositivo: las
          fotografías no se suben a ningún servidor.
        </p>
      </header>

      {error && <Notice tone="error">{error}</Notice>}

      <Panel title="Nuevo proyecto">
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") void create();
            }}
            placeholder="Boda — 08 agosto 2026"
            aria-label="Nombre del proyecto"
            data-testid="new-project-name"
            className="min-h-11 flex-1 rounded-lg border border-neutral-700 bg-neutral-900 px-3 text-sm text-neutral-100 outline-none placeholder:text-neutral-600 focus:border-[#78d94f]"
          />
          <Button variant="primary" onClick={create} data-testid="create-project">
            Crear proyecto
          </Button>
        </div>
      </Panel>

      {storage && storage.quota > 0 && (
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-neutral-500">
            <span>Espacio usado en este dispositivo</span>
            <span className="tabular-nums">
              {formatBytes(storage.usage)} de {formatBytes(storage.quota)}
            </span>
          </div>
          <ProgressBar value={storage.usage} total={storage.quota} tone="neutral" />
        </div>
      )}

      {loading ? (
        <p className="text-sm text-neutral-500">Cargando proyectos…</p>
      ) : summaries.length === 0 ? (
        <EmptyState
          title="Todavía no hay proyectos"
          description="Crea uno y arrastra las fotografías de la sesión. Se analizarán una a una y podrás revisar cada decisión antes de exportar."
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {summaries.map(({ project, stats }) => (
            <article
              key={project.id}
              className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-4"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <Link
                    href={`/studio/${project.id}`}
                    className="truncate text-base font-semibold text-neutral-100 hover:text-[#a4ef84]"
                  >
                    {project.name}
                  </Link>
                  <p className="text-xs text-neutral-500">
                    {new Date(project.createdAt).toLocaleString("es-EC")} ·{" "}
                    {project.settings.mode === "wedding" ? "Modo boda" : "Modo general"}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  className="h-8 min-h-8 px-2 text-xs"
                  onClick={() => remove(project)}
                >
                  Eliminar
                </Button>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2">
                <Stat label="Fotografías" value={stats.total} hint={formatBytes(stats.bytes)} />
                <Stat label="Analizadas" value={stats.analyzed} />
                <Stat label="Editadas" value={stats.edited} />
                <Stat label="Seleccionadas" value={stats.picked} />
              </div>

              <div className="mt-3 space-y-1">
                <ProgressBar value={stats.edited} total={Math.max(1, stats.total)} />
                <p className="text-[11px] text-neutral-500">
                  {stats.total === 0
                    ? "Sin fotografías todavía"
                    : `${Math.round((stats.edited / stats.total) * 100)}% procesado`}
                  {stats.errors > 0 && ` · ${stats.errors} con error`}
                </p>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
