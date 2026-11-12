// Envío de prospectos del sitio a JARVIS (centro de operaciones de AdVibe).
// Se llama desde el navegador a /api/jarvis/lead; el secreto nunca sale del servidor.
export type LeadJarvis = {
  name: string; company?: string; website?: string; phone?: string; email?: string;
  service?: string; budget?: string; event_id: string; source?: string;
};

export async function enviarLeadAJarvis(lead: LeadJarvis): Promise<void> {
  try {
    const body = JSON.stringify({ ...lead, event_source_url: typeof window !== "undefined" ? window.location.href : undefined });
    if (typeof navigator !== "undefined" && navigator.sendBeacon) {
      // sendBeacon sobrevive a la redirección a WhatsApp o Calendly que sigue al envío.
      if (navigator.sendBeacon("/api/jarvis/lead", new Blob([body], { type: "application/json" }))) return;
    }
    await fetch("/api/jarvis/lead", { method: "POST", headers: { "Content-Type": "application/json" }, body, keepalive: true });
  } catch (error) {
    console.error("No se pudo registrar el prospecto en JARVIS", error);
  }
}
