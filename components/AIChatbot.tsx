"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { trackEvent } from "@/lib/tracking";

type Message = { role: "assistant" | "user"; content: string };

export default function AIChatbot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "¡Hola! Soy Vibe, el asistente de AdVibe 👋 En 2 preguntas puedo detectar oportunidades para tu marca. ¿En qué industria opera tu negocio?",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [pulse, setPulse] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!pulse) return;
    const timer = window.setTimeout(() => setPulse(false), 4000);
    return () => window.clearTimeout(timer);
  }, [pulse]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function sendMessage() {
    const trimmed = input.trim();
    if (!trimmed || loading || trimmed.length > 2000) return;

    const newMessages = [...messages, { role: "user" as const, content: trimmed }];
    setMessages(newMessages);
    setInput("");
    setLoading(true);
    trackEvent("chatbot_message_sent", { message_count: newMessages.length });

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || "Chat API error");

      setMessages((prev) => [...prev, { role: "assistant", content: data.reply }]);
      if (newMessages.length >= 5) trackEvent("chatbot_lead_qualified", { messages: newMessages.length });
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "No pude completar el análisis ahora. Puedes solicitar el diagnóstico gratuito o escribirnos directamente por WhatsApp.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function toggle() {
    const nextOpen = !open;
    setOpen(nextOpen);
    setPulse(false);
    trackEvent("chatbot_toggle", { action: nextOpen ? "open" : "close" });
  }

  return (
    <>
      <div className="fixed bottom-[88px] left-4 z-[55] sm:bottom-6 sm:left-6">
        <AnimatePresence>
          {!open && pulse && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="absolute -top-14 left-0 hidden whitespace-nowrap rounded-2xl border border-white/10 bg-[#0a0a0a]/95 px-4 py-2 text-sm text-slate-200 shadow-lg backdrop-blur-xl sm:block"
            >
              ¿Cómo puede crecer tu marca con IA? 🤖
              <div className="absolute -bottom-1.5 left-5 h-3 w-3 rotate-45 border-b border-r border-white/10 bg-[#0a0a0a]/95" />
            </motion.div>
          )}
        </AnimatePresence>

        <motion.button
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.95 }}
          onClick={toggle}
          className="relative flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-cyan-400 to-violet-500 text-white shadow-[0_8px_32px_-8px_rgba(34,211,238,0.5)]"
          aria-label={open ? "Cerrar asistente IA" : "Abrir asistente IA"}
          aria-expanded={open}
          type="button"
        >
          <span className="absolute -right-1 -top-1 h-3.5 w-3.5 rounded-full bg-cyan-300" />
          {open ? "×" : "✦"}
        </motion.button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            role="dialog"
            aria-label="Asistente IA de AdVibe"
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.96 }}
            className="fixed bottom-[172px] left-4 z-[54] w-[calc(100vw-2rem)] max-w-sm overflow-hidden rounded-[2rem] border border-white/10 bg-[#070809]/96 shadow-[0_40px_120px_-40px_rgba(0,212,255,0.28)] backdrop-blur-xl sm:bottom-24 sm:left-6"
          >
            <div className="flex items-center gap-3 border-b border-white/10 bg-gradient-to-r from-cyan-500/10 to-violet-500/10 px-5 py-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400 to-violet-500 text-sm font-bold">V</div>
              <div>
                <p className="text-sm font-semibold text-white">Vibe · Asistente AdVibe</p>
                <p className="text-xs text-cyan-300">Análisis digital con IA</p>
              </div>
            </div>

            <div className="flex max-h-72 flex-col gap-3 overflow-y-auto p-4" aria-live="polite">
              {messages.map((msg, index) => (
                <motion.div key={`${msg.role}-${index}`} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-6 ${msg.role === "user" ? "bg-white text-slate-900" : "border border-white/10 bg-white/5 text-slate-100"}`}>
                    {msg.content}
                  </div>
                </motion.div>
              ))}
              {loading && <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-xs text-cyan-300">Analizando…</div>}
              <div ref={messagesEndRef} />
            </div>

            <form
              className="border-t border-white/10 p-3"
              onSubmit={(event) => {
                event.preventDefault();
                void sendMessage();
              }}
            >
              <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-2">
                <input
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  placeholder="Escribe tu respuesta…"
                  className="flex-1 bg-transparent text-sm text-white outline-none placeholder:text-slate-500"
                  disabled={loading}
                  maxLength={2000}
                  aria-label="Mensaje para Vibe"
                />
                <button type="submit" disabled={loading || !input.trim()} className="flex h-8 w-8 items-center justify-center rounded-xl bg-cyan-400 text-slate-950 disabled:opacity-40" aria-label="Enviar mensaje">
                  →
                </button>
              </div>
              <p className="mt-2 text-center text-[10px] text-slate-600">Diagnóstico gratuito · Sin compromiso</p>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
