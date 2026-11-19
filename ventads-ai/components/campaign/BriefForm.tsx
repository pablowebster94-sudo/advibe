"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Field, Input, Textarea } from "@/components/ui/Field";
import { StrategyPanel } from "@/components/campaign/StrategyPanel";
import { DESTINATIONS, type DestinationId } from "@/lib/catalog/destinations";
import { readJson } from "@/lib/fetch-json";
import type { CampaignBriefInput, StrategyRecommendation } from "@/lib/services/strategy-service";

/**
 * The campaign brief: the operator describes the offer in plain language and
 * sees, beside it and in real time, the plan it implies and what is still
 * missing.
 *
 * Autosaves field by field. Every PUT answers with the recomputed strategy,
 * so the panel is always what the server would do — never a local guess that
 * could disagree with it.
 */

type Payload = {
  brief: CampaignBriefInput;
  strategy: StrategyRecommendation;
  approvalStatus: string;
};

const SAVE_DELAY_MS = 600;

/** Lists are typed as plain comma-separated text: faster than tag widgets for
 *  the two or three values these fields actually hold. */
function toList(text: string): string[] {
  return text.split(",").map((v) => v.trim()).filter(Boolean);
}

type MetaRequirement = { key: string; label: string; how: string };

export function BriefForm({ campaignId }: { campaignId: string }) {
  const router = useRouter();
  const [payload, setPayload] = useState<Payload | null>(null);
  const [busy, setBusy] = useState<null | "generar" | "aprobar" | "reabrir" | "publicar">(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [metaMissing, setMetaMissing] = useState<MetaRequirement[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  // Text the operator is still typing, kept locally so autosave never fights
  // the cursor. Server values win only on load.
  const [draft, setDraft] = useState<Record<string, string>>({});
  const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/campaigns/${campaignId}/brief`);
        const data = await readJson<Payload & { error?: string }>(res);
        if (cancelled) return;
        if (!res.ok) {
          setError(data.error ?? "No se pudo cargar el brief.");
          return;
        }
        setPayload(data);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Error de red.");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [campaignId]);

  // Clear pending autosaves if the screen goes away mid-typing.
  useEffect(() => {
    const pending = timers.current;
    return () => {
      for (const t of pending.values()) clearTimeout(t);
      pending.clear();
    };
  }, []);

  const save = useCallback(
    async (patch: Record<string, unknown>) => {
      setSaving(true);
      setError(null);
      try {
        const res = await fetch(`/api/campaigns/${campaignId}/brief`, {
          method: "PUT",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(patch),
        });
        const data = await readJson<Payload & { error?: string }>(res);
        if (!res.ok) {
          setError(data.error ?? "No se pudo guardar.");
          return;
        }
        setPayload(data);
        setSavedAt(Date.now());
      } catch (e) {
        setError(e instanceof Error ? e.message : "Error de red al guardar.");
      } finally {
        setSaving(false);
      }
    },
    [campaignId]
  );

  /** Debounced per field, so typing in one field never delays another. */
  const queue = useCallback(
    (field: string, value: unknown) => {
      const existing = timers.current.get(field);
      if (existing) clearTimeout(existing);
      timers.current.set(
        field,
        setTimeout(() => {
          timers.current.delete(field);
          void save({ [field]: value });
        }, SAVE_DELAY_MS)
      );
    },
    [save]
  );

  /** Runs one of the campaign actions and surfaces exactly what came back. */
  const act = async (what: "generar" | "aprobar" | "reabrir" | "publicar") => {
    setBusy(what);
    setNotice(null);
    setMetaMissing(null);
    const routes = {
      generar: { url: `/api/campaigns/${campaignId}/generate`, body: undefined },
      aprobar: { url: `/api/campaigns/${campaignId}/approve`, body: { action: "approve" } },
      reabrir: { url: `/api/campaigns/${campaignId}/approve`, body: { action: "reopen" } },
      publicar: { url: `/api/campaigns/${campaignId}/publish`, body: undefined },
    } as const;
    const route = routes[what];
    try {
      const res = await fetch(route.url, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: route.body ? JSON.stringify(route.body) : undefined,
      });
      const data = await readJson<{
        error?: string;
        approvalStatus?: string;
        missing?: MetaRequirement[];
      }>(res);

      if (!res.ok) {
        setNotice(data.error ?? "No se pudo completar la acción.");
        // The publish route answers with exactly which credentials are absent.
        if (Array.isArray(data.missing) && data.missing.some((m) => "how" in m)) {
          setMetaMissing(data.missing);
        }
        return;
      }

      if (what === "generar") {
        router.push(`/results/${campaignId}`);
        return;
      }
      if (data.approvalStatus) {
        setPayload((prev) => (prev ? { ...prev, approvalStatus: data.approvalStatus! } : prev));
        setNotice(
          data.approvalStatus === "APPROVED"
            ? "Campaña aprobada. La estrategia quedó congelada tal como se aprobó."
            : "Campaña de vuelta en borrador."
        );
      }
    } catch (e) {
      setNotice(e instanceof Error ? e.message : "Error de red.");
    } finally {
      setBusy(null);
    }
  };

  if (error && !payload) {
    return (
      <p className="rounded-[var(--radius-md)] border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-foreground">
        {error}
      </p>
    );
  }
  if (!payload) {
    return <p className="text-sm text-muted">Cargando el brief…</p>;
  }

  const { brief, strategy } = payload;
  const locked = payload.approvalStatus !== "DRAFT";
  const text = (field: keyof CampaignBriefInput, fallback: string) =>
    draft[field] ?? fallback;

  const onText = (field: keyof CampaignBriefInput, transform?: (v: string) => unknown) =>
    (event: { target: { value: string } }) => {
      const value = event.target.value;
      setDraft((d) => ({ ...d, [field]: value }));
      queue(field, transform ? transform(value) : value || null);
    };

  const numberOrNull = (v: string) => {
    const n = Number(v);
    return v.trim() === "" || !Number.isFinite(n) ? null : n;
  };

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_380px]">
      <form className="flex flex-col gap-7" onSubmit={(e) => e.preventDefault()}>
        {locked && (
          <p className="rounded-[var(--radius-md)] border border-border bg-surface-muted px-4 py-3 text-sm text-muted">
            Esta campaña ya fue aprobada. Vuélvela a borrador para editarla.
          </p>
        )}

        <fieldset disabled={locked} className="flex flex-col gap-5 disabled:opacity-60">
          <legend className="text-xs font-bold uppercase tracking-wide text-muted">
            La oferta
          </legend>
          <Field
            label="¿Qué se vende?"
            required
            hint="En palabras del negocio. No se inventará nada que no esté aquí."
          >
            <Textarea
              value={text("offerSummary", brief.offerSummary)}
              onChange={onText("offerSummary", (v) => v)}
              placeholder="Sofá de 3 puestos en tela, entrega en 48 horas en Cuenca"
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Precio" hint="Opcional. Sin precio, el copy no lo mencionará.">
              <Input
                value={text("priceDisplay", brief.priceDisplay ?? "")}
                onChange={onText("priceDisplay")}
                placeholder="$399"
              />
            </Field>
            <Field label="Beneficios" hint="Separados por coma.">
              <Input
                value={text("benefits", brief.benefits.join(", "))}
                onChange={onText("benefits", toList)}
                placeholder="Entrega en 48 h, Garantía de 1 año"
              />
            </Field>
          </div>
          <Field
            label="Condiciones y vigencia"
            hint="Evita prometer lo que el negocio no puede cumplir."
          >
            <Input
              value={text("restrictions", brief.restrictions ?? "")}
              onChange={onText("restrictions")}
              placeholder="Hasta agotar stock, solo Cuenca"
            />
          </Field>
        </fieldset>

        <fieldset disabled={locked} className="flex flex-col gap-5 disabled:opacity-60">
          <legend className="text-xs font-bold uppercase tracking-wide text-muted">
            A dónde lleva el anuncio
          </legend>
          <div className="grid gap-2 sm:grid-cols-3">
            {DESTINATIONS.map((d) => {
              const active = brief.destinationId === d.id;
              return (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => void save({ destinationId: d.id as DestinationId })}
                  className={`rounded-[var(--radius-sm)] border px-3 py-2.5 text-left transition-colors ${
                    active
                      ? "border-accent-strong bg-accent-soft/50"
                      : "border-border bg-surface hover:border-accent-strong/50"
                  }`}
                >
                  <span className="block text-sm font-semibold text-foreground">{d.label}</span>
                  <span className="block text-[11px] leading-snug text-muted">{d.description}</span>
                </button>
              );
            })}
          </div>
          {brief.destinationId === "WHATSAPP" && (
            <Field label="Número de WhatsApp" required>
              <Input
                value={text("whatsappNumber", brief.whatsappNumber ?? "")}
                onChange={onText("whatsappNumber")}
                placeholder="+593 99 999 9999"
              />
            </Field>
          )}
          {brief.destinationId === "SITIO_WEB" && (
            <Field label="Enlace de destino" required>
              <Input
                value={text("landingUrl", brief.landingUrl ?? "")}
                onChange={onText("landingUrl")}
                placeholder="https://..."
              />
            </Field>
          )}
          {brief.destinationId === "LLAMADA" && (
            <Field label="Teléfono" required>
              <Input
                value={text("phoneNumber", brief.phoneNumber ?? "")}
                onChange={onText("phoneNumber")}
                placeholder="+593 ..."
              />
            </Field>
          )}
        </fieldset>

        <fieldset disabled={locked} className="flex flex-col gap-5 disabled:opacity-60">
          <legend className="text-xs font-bold uppercase tracking-wide text-muted">
            Mercado
          </legend>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Países" required hint="Separados por coma.">
              <Input
                value={text("countries", brief.countries.join(", "))}
                onChange={onText("countries", toList)}
                placeholder="Ecuador"
              />
            </Field>
            <Field label="Ciudades" hint="Cada ciudad abre su propio conjunto.">
              <Input
                value={text("cities", brief.cities.join(", "))}
                onChange={onText("cities", toList)}
                placeholder="Cuenca, Gualaceo"
              />
            </Field>
            <Field label="Radio (km)">
              <Input
                type="number"
                min={1}
                value={text("radiusKm", brief.radiusKm?.toString() ?? "")}
                onChange={onText("radiusKm", numberOrNull)}
                placeholder="25"
              />
            </Field>
            <Field label="Idioma">
              <Input
                value={text("language", brief.language ?? "")}
                onChange={onText("language")}
                placeholder="es"
              />
            </Field>
          </div>
          <Field label="¿A quién le sirve?">
            <Textarea
              value={text("audienceNotes", brief.audienceNotes ?? "")}
              onChange={onText("audienceNotes")}
              placeholder="Parejas jóvenes amoblando su primer departamento"
            />
          </Field>
        </fieldset>

        <fieldset disabled={locked} className="flex flex-col gap-5 disabled:opacity-60">
          <legend className="text-xs font-bold uppercase tracking-wide text-muted">
            Presupuesto
          </legend>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Diario (USD)" required>
              <Input
                type="number"
                min={0}
                step="0.01"
                value={text("dailyBudgetUsd", brief.dailyBudgetUsd?.toString() ?? "")}
                onChange={onText("dailyBudgetUsd", numberOrNull)}
                placeholder="20"
              />
            </Field>
            <Field label="Total (USD)" hint="Alternativa al diario.">
              <Input
                type="number"
                min={0}
                step="0.01"
                value={text("lifetimeBudgetUsd", brief.lifetimeBudgetUsd?.toString() ?? "")}
                onChange={onText("lifetimeBudgetUsd", numberOrNull)}
                placeholder="280"
              />
            </Field>
            <Field label="Duración (días)">
              <Input
                type="number"
                min={1}
                value={text("durationDays", brief.durationDays?.toString() ?? "")}
                onChange={onText("durationDays", numberOrNull)}
                placeholder="14"
              />
            </Field>
          </div>
        </fieldset>

        <div className="flex items-center gap-3 text-xs text-muted" aria-live="polite">
          {saving ? (
            <span>Guardando…</span>
          ) : savedAt ? (
            <span>Guardado</span>
          ) : (
            <span>Se guarda solo mientras escribes.</span>
          )}
          {error && <span className="text-danger">{error}</span>}
        </div>
      </form>

      <aside className="lg:sticky lg:top-6 lg:self-start">
        <StrategyPanel strategy={strategy} />

        <div className="mt-4 flex flex-col gap-2">
          <Button
            className="w-full"
            disabled={!strategy.readyToPublish || locked || busy !== null}
            onClick={() => void act("generar")}
            title={
              strategy.readyToPublish
                ? undefined
                : "Completa los datos que impiden publicar"
            }
          >
            {busy === "generar" ? "Generando…" : "Generar anuncios"}
          </Button>

          {locked ? (
            <>
              <Button
                variant="secondary"
                className="w-full"
                disabled={busy !== null}
                onClick={() => void act("publicar")}
              >
                {busy === "publicar" ? "Publicando…" : "Publicar en Meta (pausada)"}
              </Button>
              <Button
                variant="ghost"
                className="w-full"
                disabled={busy !== null}
                onClick={() => void act("reabrir")}
              >
                Volver a borrador
              </Button>
            </>
          ) : (
            <Button
              variant="secondary"
              className="w-full"
              disabled={!strategy.readyToPublish || busy !== null}
              onClick={() => void act("aprobar")}
            >
              {busy === "aprobar" ? "Aprobando…" : "Aprobar campaña"}
            </Button>
          )}
        </div>

        {notice && (
          <p className="mt-3 rounded-[var(--radius-sm)] border border-border bg-surface px-3 py-2 text-xs text-foreground">
            {notice}
          </p>
        )}

        {metaMissing && metaMissing.length > 0 && (
          <section className="mt-3 rounded-[var(--radius-md)] border border-border bg-surface-muted p-3">
            <h3 className="text-xs font-bold uppercase tracking-wide text-muted">
              Falta para conectar Meta
            </h3>
            <ul className="mt-2 flex flex-col gap-2">
              {metaMissing.map((m) => (
                <li key={m.key}>
                  <p className="text-xs font-semibold text-foreground">{m.label}</p>
                  <p className="text-[11px] leading-snug text-muted">{m.how}</p>
                </li>
              ))}
            </ul>
          </section>
        )}
      </aside>
    </div>
  );
}
