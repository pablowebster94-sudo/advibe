"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";

type Vehicle = {
  slug: string;
  name: string;
  eyebrow: string;
  description: string;
  price: string;
  image: string;
  specs: string[];
};

const VEHICLES: Record<string, Vehicle> = {
  "mini-cooper": {
    slug: "mini-cooper",
    name: "Mini Cooper S",
    eyebrow: "AM MOTORSPORT · VEHÍCULOS",
    description: "Mini Cooper S 2023 con motor 2.0 Turbo, 178 HP y aproximadamente 17.000 km. Conoce la unidad y déjanos tus datos para recibir atención.",
    price: "$41.500",
    image: "https://images.unsplash.com/photo-1550355291-bbee04a92027?auto=format&fit=crop&w=1600&q=85",
    specs: ["2.0 Turbo · 178 HP", "DCT automática de 7 velocidades", "17.000 km aprox."],
  },
  "ford-f150": {
    slug: "ford-f150",
    name: "Ford F-150",
    eyebrow: "AM MOTORSPORT · VEHÍCULOS",
    description: "Ford F-150 2013 con motor 3.7 V6 Ti-VCT, transmisión automática y aproximadamente 124.000 km.",
    price: "$18.700",
    image: "https://images.unsplash.com/photo-1605893477799-b99e3b8b93fe?auto=format&fit=crop&w=1600&q=85",
    specs: ["3.7 V6 Ti-VCT · 3.726 cc", "Automática de 6 velocidades con Tow/Haul", "124.000 km aprox."],
  },
  "peugeot-208": {
    slug: "peugeot-208",
    name: "Peugeot 208",
    eyebrow: "AM MOTORSPORT · VEHÍCULOS",
    description: "Peugeot 208 2022 con motor 1.2 Turbo, caja automática y aproximadamente 29.000 km. Mantenimiento al día.",
    price: "$16.800",
    image: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1600&q=85",
    specs: ["1.2 Turbo", "Caja automática", "29.000 km aprox. · Mantenimiento al día"],
  },
};

const steps = [
  { key: "method", title: "¿Cómo te gustaría comprar?", options: ["Al contado", "Financiamiento", "Aún no lo sé"] },
  { key: "city", title: "¿En qué ciudad estás?", options: ["Cuenca", "Gualaceo", "Quito", "Guayaquil", "Otra ciudad"] },
  { key: "time", title: "¿Cuándo piensas comprar?", options: ["Esta semana", "Este mes", "Estoy comparando", "Más adelante"] },
];

export default function DriveVehiclePage() {
  const params = useParams<{ slug: string }>();
  const search = useSearchParams();
  const vehicle = VEHICLES[params.slug] ?? VEHICLES["mini-cooper"];
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const score = useMemo(() => {
    let value = 0;
    if (answers.method === "Al contado" || answers.method === "Financiamiento") value += 2;
    if (answers.time === "Esta semana") value += 3;
    if (answers.time === "Este mes") value += 2;
    return value >= 5 ? "HOT" : value >= 3 ? "WARM" : "COLD";
  }, [answers]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [step]);

  async function submitLead() {
    setError("");
    if (!name.trim() || phone.trim().length < 7) {
      setError("Completa tu nombre y un número de WhatsApp válido.");
      return;
    }
    setSending(true);
    try {
      const payload = {
        vehicle: vehicle.name,
        vehicleSlug: vehicle.slug,
        name: name.trim(),
        phone: phone.trim(),
        answers,
        score,
        utm: Object.fromEntries(search.entries()),
        page: window.location.href,
        createdAt: new Date().toISOString(),
      };
      const response = await fetch("/api/am-motorsport/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error("No se pudo guardar");
      const result = await response.json();
      if (typeof window !== "undefined" && (window as any).fbq) {
        (window as any).fbq("track", "Lead", { content_name: vehicle.name, content_category: "vehicle" }, { eventID: result.eventId });
      }
      setSubmitted(true);
    } catch {
      setError("No pudimos enviar tus datos. Intenta nuevamente.");
    } finally {
      setSending(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#070707] text-white">
      <section className="relative min-h-[92vh] overflow-hidden">
        <img src={vehicle.image} alt={vehicle.name} className="absolute inset-0 h-full w-full object-cover opacity-55" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/55 to-[#070707]" />
        <div className="relative mx-auto flex min-h-[92vh] max-w-6xl flex-col justify-between px-5 py-6 sm:px-8">
          <header className="flex items-center justify-between">
            <div className="tracking-[0.25em] text-sm font-black">AM MOTORSPORT</div>
            <div className="rounded-full border border-white/20 bg-black/30 px-4 py-2 text-xs font-semibold backdrop-blur">DRIVE</div>
          </header>

          <div className="max-w-3xl pb-12">
            <p className="mb-4 text-xs font-bold uppercase tracking-[0.25em] text-white/70">{vehicle.eyebrow}</p>
            <h1 className="text-5xl font-black tracking-tight sm:text-7xl">{vehicle.name}</h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-white/80 sm:text-lg">{vehicle.description}</p>
            <div className="mt-7 flex flex-wrap gap-3">
              <span className="rounded-full bg-white px-5 py-3 text-sm font-black text-black">{vehicle.price}</span>
              <span className="rounded-full border border-white/20 bg-black/30 px-5 py-3 text-sm font-semibold backdrop-blur">Atención personalizada</span>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-5 py-12 sm:px-8">
        {!submitted ? (
          <div className="grid gap-8 lg:grid-cols-[1fr_1.1fr]">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/50">Tu vehículo</p>
              <h2 className="mt-2 text-3xl font-black">{vehicle.name}</h2>
              <div className="mt-6 space-y-3">
                {vehicle.specs.map((spec) => (
                  <div key={spec} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-sm text-white/75">✓ {spec}</div>
                ))}
              </div>
            </div>

            <div className="rounded-[2rem] border border-white/10 bg-white/[0.05] p-5 shadow-2xl backdrop-blur sm:p-8">
              <div className="mb-7 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-white/40">Paso {Math.min(step + 1, 4)} de 4</p>
                  <p className="mt-1 text-sm text-white/60">Toma menos de un minuto</p>
                </div>
                <div className="text-sm font-black">{score === "HOT" ? "Alta intención" : score === "WARM" ? "Interés activo" : "Explorando"}</div>
              </div>

              {step < steps.length ? (
                <div>
                  <h3 className="text-2xl font-black">{steps[step].title}</h3>
                  <div className="mt-5 grid gap-3">
                    {steps[step].options.map((option) => (
                      <button
                        key={option}
                        onClick={() => { setAnswers((a) => ({ ...a, [steps[step].key]: option })); setStep((s) => s + 1); }}
                        className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-left font-semibold transition hover:border-white/30 hover:bg-white/[0.08]"
                      >{option}<span className="float-right text-white/40">→</span></button>
                    ))}
                  </div>
                </div>
              ) : (
                <div>
                  <h3 className="text-2xl font-black">¿Dónde te contactamos?</h3>
                  <p className="mt-2 text-sm text-white/60">Déjanos tus datos y un asesor de AM Motorsport continuará contigo.</p>
                  <div className="mt-6 space-y-3">
                    <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Tu nombre" className="w-full rounded-2xl border border-white/10 bg-black/30 px-5 py-4 outline-none placeholder:text-white/35 focus:border-white/40" />
                    <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="WhatsApp / teléfono" inputMode="tel" className="w-full rounded-2xl border border-white/10 bg-black/30 px-5 py-4 outline-none placeholder:text-white/35 focus:border-white/40" />
                    {error && <p className="text-sm text-red-300">{error}</p>}
                    <button disabled={sending} onClick={submitLead} className="w-full rounded-2xl bg-white px-5 py-4 font-black text-black transition hover:bg-white/90 disabled:opacity-50">
                      {sending ? "Enviando..." : "Quiero información de este vehículo"}
                    </button>
                    <p className="text-center text-xs leading-5 text-white/35">Tus datos se usarán para que AM Motorsport pueda contactarte sobre este vehículo.</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="mx-auto max-w-2xl rounded-[2rem] border border-white/10 bg-white/[0.05] p-8 text-center sm:p-12">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-white text-2xl text-black">✓</div>
            <p className="mt-6 text-xs font-bold uppercase tracking-[0.2em] text-white/40">Solicitud recibida</p>
            <h2 className="mt-2 text-3xl font-black">Gracias, {name.split(" ")[0]}.</h2>
            <p className="mx-auto mt-4 max-w-lg leading-7 text-white/65">Registramos tu interés en el {vehicle.name}. AM Motorsport podrá contactarte para continuar la atención.</p>
          </div>
        )}
      </section>

      <footer className="border-t border-white/10 px-5 py-8 text-center text-xs text-white/35">AM Motorsport · Drive</footer>
    </main>
  );
}
