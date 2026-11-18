"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Account = { id: string; name?: string; account_status?: number; currency?: string; timezone_name?: string };
type MetaStatus = { connected: boolean; user?: { id: string; name?: string }; accounts?: Account[]; error?: string };

export default function MetaAdsPage() {
  const [status, setStatus] = useState<MetaStatus | null>(null);
  const [accountId, setAccountId] = useState("");
  const [campaignName, setCampaignName] = useState("");
  const [objective, setObjective] = useState("OUTCOME_TRAFFIC");
  const [categories, setCategories] = useState("[]");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function refresh() {
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/meta-marketing/status", { cache: "no-store" });
      const data = await response.json();
      setStatus(data);
      if (data.accounts?.length && !accountId) setAccountId(data.accounts[0].id);
    } catch {
      setStatus({ connected: false, error: "No se pudo comprobar la conexión." });
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => { void refresh(); }, []);

  async function createPausedCampaign(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/meta-marketing/campaigns", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ accountId, name: campaignName, objective, specialAdCategories: JSON.parse(categories) }),
      });
      const data = await response.json();
      if (!response.ok || !data.ok) throw new Error(data.error || "Meta rechazó la solicitud.");
      setMessage(`Campaña creada como PAUSED. ID: ${data.campaign?.id || "creada"}`);
      setCampaignName("");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Error creando campaña.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-4xl flex-col gap-8 px-6 py-10">
      <header className="flex items-center justify-between">
        <Link href="/" className="text-sm text-muted hover:text-foreground">← Volver al estudio</Link>
        <span className="text-sm font-semibold">ventADS<span className="text-accent-strong">.ai</span></span>
      </header>
      <section className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">Meta Ads</h1>
        <p className="text-sm text-muted">Revisa la conexión y crea una campaña de prueba en estado pausado. No se publica ni empieza a gastar.</p>
      </section>
      <section className="rounded-[var(--radius-lg)] border border-border p-5 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Estado de conexión</h2>
          <button onClick={refresh} disabled={busy} className="text-sm text-accent-strong underline disabled:opacity-50">{busy ? "Comprobando…" : "Actualizar"}</button>
        </div>
        {status === null ? <p className="text-sm text-muted">Verificando token y permisos…</p> : status.connected ? (
          <>
            <p className="text-sm text-foreground">Conectado como {status.user?.name || status.user?.id}</p>
            <p className="text-xs text-muted">{status.accounts?.length || 0} cuenta(s) publicitaria(s) accesible(s)</p>
          </>
        ) : (
          <p className="text-sm text-muted">{status.error || "Meta no está conectado. Configura META_SYSTEM_USER_TOKEN en el entorno server-side de Vercel."}</p>
        )}
      </section>
      {status?.connected && (status.accounts?.length || 0) > 0 && (
        <form onSubmit={createPausedCampaign} className="rounded-[var(--radius-lg)] border border-border p-5 flex flex-col gap-4">
          <h2 className="font-semibold">Crear campaña (pausada)</h2>
          <label className="flex flex-col gap-1 text-sm">Cuenta publicitaria
            <select required value={accountId} onChange={e => setAccountId(e.target.value)} className="rounded-md border border-border bg-background p-3 text-foreground">
              {status.accounts?.map(account => <option key={account.id} value={account.id}>{account.name || account.id} · {account.id} · {account.currency || ""}</option>)}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm">Nombre
            <input required maxLength={200} value={campaignName} onChange={e => setCampaignName(e.target.value)} placeholder="Ej. Promo noviembre — mensajes WhatsApp" className="rounded-md border border-border bg-background p-3 text-foreground" />
          </label>
          <label className="flex flex-col gap-1 text-sm">Objetivo
            <select value={objective} onChange={e => setObjective(e.target.value)} className="rounded-md border border-border bg-background p-3 text-foreground">
              <option value="OUTCOME_TRAFFIC">Tráfico</option>
              <option value="OUTCOME_ENGAGEMENT">Interacción</option>
              <option value="OUTCOME_LEADS">Clientes potenciales</option>
              <option value="OUTCOME_SALES">Ventas</option>
              <option value="OUTCOME_APP_PROMOTION">Promoción de aplicación</option>
              <option value="OUTCOME_AWARENESS">Reconocimiento</option>
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm">Categorías especiales de anuncios (JSON)
            <input value={categories} onChange={e => setCategories(e.target.value)} placeholder='[]' className="rounded-md border border-border bg-background p-3 text-foreground" />
            <span className="text-xs text-muted">Ejemplo: [] o ["HOUSING"] según aplique.</span>
          </label>
          <button disabled={busy || !accountId || !campaignName.trim()} className="rounded-md bg-accent-strong px-4 py-3 text-sm font-semibold text-white disabled:opacity-50">{busy ? "Procesando…" : "Crear campaña pausada"}</button>
          {message && <p role="status" className="text-sm text-foreground">{message}</p>}
        </form>
      )}
      <p className="text-xs text-muted">Este panel todavía no crea conjuntos de anuncios, anuncios ni publica creativos. La campaña se crea PAUSED para evitar gasto automático.</p>
    </main>
  );
}
