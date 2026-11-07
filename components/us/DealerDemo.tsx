"use client";

import { useMemo, useState } from "react";
import DemoBanner from "@/components/us/DemoBanner";
import { useLang } from "@/components/us/useLang";

type Car = { year: number; make: string; model: string; type: "SUV" | "Sedan" | "Truck"; price: number; miles: number; color: string };

// Inventario de muestra: autos y precios ficticios para la demo.
const CARS: Car[] = [
  { year: 2021, make: "Toyota", model: "RAV4 XLE", type: "SUV", price: 24990, miles: 38200, color: "#9aa4ad" },
  { year: 2020, make: "Honda", model: "Civic EX", type: "Sedan", price: 18490, miles: 41500, color: "#1e3a5f" },
  { year: 2019, make: "Ford", model: "F-150 XLT", type: "Truck", price: 27990, miles: 52800, color: "#7a1f1f" },
  { year: 2022, make: "Nissan", model: "Rogue SV", type: "SUV", price: 22990, miles: 29100, color: "#2b2b2b" },
  { year: 2018, make: "Chevrolet", model: "Malibu LT", type: "Sedan", price: 13990, miles: 67300, color: "#c9ccd1" },
  { year: 2020, make: "Jeep", model: "Grand Cherokee", type: "SUV", price: 26490, miles: 44900, color: "#3d4a3a" },
];

const usd = (n: number) => "$" + n.toLocaleString("en-US");

function CarArt({ color }: { color: string }) {
  const id = "car" + color.replace("#", "");
  return (
    <svg viewBox="0 0 320 140" className="h-full w-full" aria-hidden="true">
      <defs><linearGradient id={id} x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor={color} stopOpacity="0.95" /><stop offset="1" stopColor={color} stopOpacity="0.7" /></linearGradient></defs>
      <path d="M30 95 L55 62 Q65 50 85 48 L205 46 Q228 46 245 60 L270 78 Q295 82 298 98 L298 108 L22 108 L22 100 Z" fill={`url(#${id})`} />
      <path d="M78 60 L100 52 L150 51 L150 76 L70 76 Z M160 51 L205 51 Q220 52 232 64 L240 76 L160 76 Z" fill="#dbe7f2" opacity="0.85" />
      <circle cx="80" cy="108" r="20" fill="#111" /><circle cx="80" cy="108" r="9" fill="#888" />
      <circle cx="240" cy="108" r="20" fill="#111" /><circle cx="240" cy="108" r="9" fill="#888" />
    </svg>
  );
}

export default function DealerDemo() {
  const [lang, setLang] = useLang();
  const en = lang === "en";
  const [filter, setFilter] = useState<"All" | Car["type"]>("All");
  const [sent, setSent] = useState<string | null>(null);
  const cars = useMemo(() => CARS.filter((c) => filter === "All" || c.type === filter), [filter]);

  const submit = (which: string) => (e: React.FormEvent) => { e.preventDefault(); setSent(which); };

  return (
    <main lang={lang} className="min-h-screen bg-[#f5f6f8] text-[#111827]">
      <DemoBanner lang={lang} onLang={setLang} />

      <header className="bg-[#0f172a] text-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <p className="text-lg font-black tracking-tight">YOUR DEALERSHIP <span className="text-red-500">AUTO SALES</span></p>
          <a href="tel:+10000000000" className="shrink-0 whitespace-nowrap rounded-full bg-red-600 px-4 py-2 text-sm font-bold">{en ? "Call now" : "Llama ahora"}</a>
        </div>
      </header>

      <section className="bg-gradient-to-br from-[#0f172a] to-[#1e293b] px-4 pb-14 pt-10 text-white sm:px-6">
        <div className="mx-auto grid max-w-6xl items-center gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-red-400">{en ? "Quality pre-owned cars · Long Island" : "Autos usados de calidad · Long Island"}</p>
            <h1 className="mt-3 text-4xl font-black leading-tight sm:text-6xl">{en ? "Drive home today." : "Llévatelo hoy."}</h1>
            <p className="mt-4 max-w-xl text-white/75">{en ? "Hand-picked inventory, transparent prices and financing options for every credit situation.*" : "Inventario seleccionado, precios claros y opciones de financiamiento para todo tipo de crédito.*"}</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <a href="#inventory" className="rounded-full bg-red-600 px-6 py-3 font-bold">{en ? "See inventory" : "Ver inventario"}</a>
              <a href="#finance" className="rounded-full border border-white/30 px-6 py-3 font-bold">{en ? "Get pre-approved" : "Pre-aprobación"}</a>
              <a href="https://wa.me/10000000000" className="rounded-full bg-[#25d366] px-6 py-3 font-bold text-black">WhatsApp</a>
            </div>
          </div>
          <div className="aspect-[16/9] rounded-3xl bg-white/5 p-6"><CarArt color="#b91c1c" /></div>
        </div>
      </section>

      <section id="inventory" className="scroll-mt-12 px-4 py-12 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <h2 className="text-3xl font-black">{en ? "Featured inventory" : "Inventario destacado"}</h2>
            <div className="flex gap-2">
              {(["All", "SUV", "Sedan", "Truck"] as const).map((f) => (
                <button key={f} onClick={() => setFilter(f)} className={`rounded-full px-4 py-2 text-sm font-semibold ${filter === f ? "bg-[#0f172a] text-white" : "bg-white text-[#0f172a] ring-1 ring-black/10"}`}>
                  {f === "All" ? (en ? "All" : "Todos") : f === "Truck" ? (en ? "Trucks" : "Camionetas") : f}
                </button>
              ))}
            </div>
          </div>
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {cars.map((car) => (
              <article key={car.model} className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/5">
                <div className="aspect-[16/9] bg-gradient-to-b from-slate-100 to-slate-200 p-4"><CarArt color={car.color} /></div>
                <div className="p-5">
                  <h3 className="font-bold">{car.year} {car.make} {car.model}</h3>
                  <p className="mt-1 text-sm text-slate-500">{car.miles.toLocaleString("en-US")} {en ? "miles" : "millas"} · {car.type}</p>
                  <p className="mt-3 text-2xl font-black text-red-600">{usd(car.price)}</p>
                  <div className="mt-4 grid grid-cols-2 gap-2 text-sm font-semibold">
                    <a href="#finance" className="rounded-lg bg-[#0f172a] py-2 text-center text-white">{en ? "Apply" : "Aplicar"}</a>
                    <a href="https://wa.me/10000000000" className="rounded-lg bg-[#25d366] py-2 text-center">{en ? "Text us" : "Escríbenos"}</a>
                  </div>
                </div>
              </article>
            ))}
          </div>
          <p className="mt-4 text-xs text-slate-500">{en ? "Sample vehicles and prices for demonstration only." : "Vehículos y precios de muestra, solo para demostración."}</p>
        </div>
      </section>

      <section className="px-4 pb-12 sm:px-6">
        <div className="mx-auto grid max-w-6xl gap-5 lg:grid-cols-2">
          <form id="finance" onSubmit={submit("finance")} className="scroll-mt-12 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5">
            <h2 className="text-2xl font-black">{en ? "Get pre-approved in minutes" : "Pre-aprobación en minutos"}</h2>
            <p className="mt-1 text-sm text-slate-500">{en ? "No impact to apply. Se habla español." : "Aplicar no afecta tu crédito. We speak English."}</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <input required placeholder={en ? "Full name" : "Nombre completo"} className="rounded-lg border px-3 py-2.5" />
              <input required type="tel" placeholder={en ? "Phone" : "Teléfono"} className="rounded-lg border px-3 py-2.5" />
              <input placeholder={en ? "Monthly income" : "Ingreso mensual"} className="rounded-lg border px-3 py-2.5" />
              <select className="rounded-lg border px-3 py-2.5"><option>{en ? "Down payment" : "Enganche"}</option><option>$0 – $1,000</option><option>$1,000 – $3,000</option><option>$3,000+</option></select>
            </div>
            <button className="mt-4 w-full rounded-lg bg-red-600 py-3 font-bold text-white">{en ? "Check my options" : "Ver mis opciones"}</button>
            {sent === "finance" && <p className="mt-3 rounded-lg bg-lime-100 p-3 text-sm">{en ? "Demo: on a live site this request goes straight to the dealer's inbox and WhatsApp." : "Demo: en una web real esta solicitud llega directo al correo y WhatsApp del concesionario."}</p>}
          </form>
          <form onSubmit={submit("trade")} className="rounded-2xl bg-[#0f172a] p-6 text-white">
            <h2 className="text-2xl font-black">{en ? "What's your trade-in worth?" : "¿Cuánto vale tu auto?"}</h2>
            <p className="mt-1 text-sm text-white/60">{en ? "Tell us about your car and get an offer." : "Cuéntanos de tu auto y recibe una oferta."}</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <input required placeholder={en ? "Year / Make / Model" : "Año / Marca / Modelo"} className="rounded-lg bg-white/10 px-3 py-2.5 placeholder:text-white/40" />
              <input placeholder={en ? "Mileage" : "Millaje"} className="rounded-lg bg-white/10 px-3 py-2.5 placeholder:text-white/40" />
              <input required type="tel" placeholder={en ? "Phone" : "Teléfono"} className="rounded-lg bg-white/10 px-3 py-2.5 placeholder:text-white/40 sm:col-span-2" />
            </div>
            <button className="mt-4 w-full rounded-lg bg-white py-3 font-bold text-[#0f172a]">{en ? "Get my offer" : "Recibir oferta"}</button>
            {sent === "trade" && <p className="mt-3 rounded-lg bg-lime-300 p-3 text-sm text-black">{en ? "Demo: on a live site this lead is saved and the dealer is notified." : "Demo: en una web real este contacto se guarda y se avisa al concesionario."}</p>}
          </form>
        </div>
      </section>

      <section className="bg-white px-4 py-10 sm:px-6">
        <div className="mx-auto grid max-w-6xl gap-6 text-center sm:grid-cols-3">
          {[[en ? "Transparent pricing" : "Precios claros", en ? "The price you see is the price online." : "El precio que ves es el precio en línea."], [en ? "Bilingual team" : "Equipo bilingüe", en ? "English y español, every day." : "English y español, todos los días."], [en ? "Inspected cars" : "Autos revisados", en ? "Every vehicle goes through inspection." : "Cada vehículo pasa inspección."]].map(([a, b]) => (
            <div key={a}><p className="text-lg font-black">{a}</p><p className="mt-1 text-sm text-slate-500">{b}</p></div>
          ))}
        </div>
      </section>

      <footer className="bg-[#0f172a] px-4 py-8 text-xs text-white/50 sm:px-6">
        <div className="mx-auto max-w-6xl space-y-2">
          <p>* {en ? "Financing subject to lender approval. Prices exclude tax, title, registration and dealer fees where applicable." : "Financiamiento sujeto a aprobación del prestamista. Precios sin impuestos, título, registro ni cargos del concesionario cuando apliquen."}</p>
          <p>{en ? "Demo website designed by AdVibe Agency." : "Web de muestra diseñada por AdVibe Agencia."}</p>
        </div>
      </footer>

      <a href="https://wa.me/10000000000" className="fixed bottom-4 right-4 z-40 rounded-full bg-[#25d366] px-5 py-3 text-sm font-bold text-black shadow-lg sm:hidden">WhatsApp</a>
    </main>
  );
}
