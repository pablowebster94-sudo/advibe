"use client";

import { AnimatePresence, m } from "framer-motion";
import { useId, useMemo, useRef, useState } from "react";
import { site } from "@/lib/site";
import { buildMessage, waLink } from "@/lib/whatsapp";
import { Eyebrow } from "./SectionHeading";
import { ArrowLeft, ArrowRight, CheckIcon, WhatsAppIcon } from "./icons";

const TIPOS = [
  "Ventanas",
  "Puertas",
  "Fachada de vidrio",
  "Divisiones",
  "Vitrinas",
  "Cubierta de policarbonato",
  "Revestimiento en alucobond",
  "Modulares",
  "Otro proyecto",
];
const MATERIALES = ["Aluminio y vidrio", "Vidrio templado", "Vidrio laminado", "Policarbonato", "Alucobond", "Por definir"];
const LINEAS = [...site.aluminumLines, "Por definir", "No aplica"];
const UBICACIONES = [...site.coverage, "Otra ubicación"];

const STEPS = ["Tipo", "Material", "Línea", "Medidas", "Ubicación", "Detalles"] as const;

type Data = {
  tipo: string;
  material: string;
  linea: string;
  ancho: string;
  alto: string;
  cantidad: string;
  ubicacion: string;
  otraUbicacion: string;
  nombre: string;
  detalles: string;
};

const EMPTY: Data = { tipo: "", material: "", linea: "", ancho: "", alto: "", cantidad: "", ubicacion: "", otraUbicacion: "", nombre: "", detalles: "" };

function Choice({ name, value, checked, onChange }: { name: string; value: string; checked: boolean; onChange: (v: string) => void }) {
  return (
    <label
      className={`flex min-h-[56px] cursor-pointer items-center justify-between gap-3 border px-4 py-3 text-[15px] font-medium transition-colors focus-within:ring-2 focus-within:ring-steel/40 ${
        checked ? "border-navy bg-navy text-white" : "border-navy/20 bg-white text-navy hover:border-navy/60"
      }`}
    >
      <input type="radio" name={name} value={value} checked={checked} onChange={() => onChange(value)} className="sr-only" />
      <span>{value}</span>
      <span aria-hidden className={`flex h-5 w-5 shrink-0 items-center justify-center border ${checked ? "border-white bg-white text-navy" : "border-navy/30"}`}>
        {checked && <CheckIcon width={14} height={14} />}
      </span>
    </label>
  );
}

export function Configurator() {
  const uid = useId();
  const [step, setStep] = useState(0);
  const [data, setData] = useState<Data>(EMPTY);
  const [error, setError] = useState("");
  const panelRef = useRef<HTMLDivElement>(null);
  const set = <K extends keyof Data>(key: K, value: Data[K]) => {
    setData((d) => ({ ...d, [key]: value }));
    setError("");
  };

  const ubicacionFinal = data.ubicacion === "Otra ubicación" ? data.otraUbicacion.trim() : data.ubicacion;
  const medidas = [data.ancho.trim() && `ancho ${data.ancho.trim()}`, data.alto.trim() && `alto ${data.alto.trim()}`].filter(Boolean).join(" × ");

  const message = useMemo(
    () =>
      buildMessage("Hola ALVITEC, quiero solicitar una cotización.", [
        ["Nombre", data.nombre],
        ["Tipo de proyecto", data.tipo],
        ["Material", data.material],
        ["Línea de aluminio", data.linea],
        ["Medidas aproximadas", medidas],
        ["Cantidad", data.cantidad],
        ["Ubicación", ubicacionFinal],
        ["Detalles", data.detalles],
      ]),
    [data, medidas, ubicacionFinal]
  );

  const validate = (s: number) => {
    if (s === 0 && !data.tipo) return "Elige un tipo de proyecto para continuar.";
    if (s === 1 && !data.material) return "Elige un material o selecciona «Por definir».";
    if (s === 2 && !data.linea) return "Elige una línea o selecciona «Por definir».";
    if (s === 4 && !ubicacionFinal) return data.ubicacion ? "Escribe la ciudad o sector del proyecto." : "Elige la ubicación del proyecto.";
    if (s === 5 && !data.nombre.trim()) return "Escribe tu nombre para enviar la solicitud.";
    return "";
  };

  const focusPanel = () => requestAnimationFrame(() => panelRef.current?.focus({ preventScroll: true }));

  const go = (target: number) => {
    if (target > step) {
      for (let s = step; s < target; s++) {
        const err = validate(s);
        if (err) {
          setStep(s);
          setError(err);
          return;
        }
      }
    }
    setError("");
    setStep(target);
    focusPanel();
  };

  const onSend = (e: React.MouseEvent<HTMLAnchorElement>) => {
    for (let s = 0; s < STEPS.length; s++) {
      const err = validate(s);
      if (err) {
        e.preventDefault();
        setStep(s);
        setError(err);
        return;
      }
    }
  };

  const isLast = step === STEPS.length - 1;

  return (
    <section id="configurador" className="bg-white py-20 sm:py-28 lg:py-36">
      <div className="container-site grid gap-12 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <Eyebrow index="04">Configurador</Eyebrow>
          <h2 className="mt-6 text-4xl font-semibold leading-[1.05] tracking-[-0.03em] text-navy sm:text-5xl">Arma tu solicitud en seis pasos.</h2>
          <p className="mt-6 max-w-sm text-base leading-relaxed text-ink/80">
            Responde lo que sepas y deja el resto «por definir». Al final se abre WhatsApp con el mensaje listo para enviar a ALVITEC.
          </p>

          <ol className="mt-10 hidden lg:block">
            {STEPS.map((label, i) => (
              <li key={label}>
                <button
                  type="button"
                  onClick={() => go(i)}
                  aria-current={i === step ? "step" : undefined}
                  className={`flex w-full items-center gap-5 border-t border-navy/15 py-4 text-left text-[13px] font-semibold uppercase tracking-[0.14em] transition-colors ${
                    i === step ? "text-navy" : "text-ink/75 hover:text-navy"
                  }`}
                >
                  <span className="tabular-nums">0{i + 1}</span>
                  <span className="flex-1">{label}</span>
                  {i < step && <CheckIcon width={16} height={16} className="text-steel" />}
                  {i === step && <span aria-hidden className="h-px w-8 bg-navy" />}
                </button>
              </li>
            ))}
          </ol>
        </div>

        <div className="lg:col-span-7 lg:col-start-6">
          <div className="border border-navy/15 bg-mist p-5 sm:p-10">
            <div className="flex items-center justify-between gap-4 text-[11px] font-semibold uppercase tracking-[0.2em] text-steel">
              <span>
                Paso {step + 1} de {STEPS.length}
              </span>
              <span>{STEPS[step]}</span>
            </div>
            <div
              className="mt-4 h-[3px] w-full bg-navy/10"
              role="progressbar"
              aria-label="Avance del configurador"
              aria-valuemin={1}
              aria-valuemax={STEPS.length}
              aria-valuenow={step + 1}
            >
              <div className="h-full bg-navy transition-[width] duration-500 ease-out" style={{ width: `${((step + 1) / STEPS.length) * 100}%` }} />
            </div>

            <div ref={panelRef} tabIndex={-1} className="mt-8 min-h-[380px] outline-none sm:mt-10">
              <AnimatePresence mode="wait" initial={false}>
                <m.div key={step} initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.25 }}>
                  {step === 0 && (
                    <fieldset>
                      <legend className="font-display text-2xl font-semibold tracking-[-0.02em] text-navy sm:text-3xl">¿Qué necesitas?</legend>
                      <div className="mt-7 grid gap-2.5 sm:grid-cols-2">
                        {TIPOS.map((v) => (
                          <Choice key={v} name={`${uid}-tipo`} value={v} checked={data.tipo === v} onChange={(x) => set("tipo", x)} />
                        ))}
                      </div>
                    </fieldset>
                  )}

                  {step === 1 && (
                    <fieldset>
                      <legend className="font-display text-2xl font-semibold tracking-[-0.02em] text-navy sm:text-3xl">¿Con qué material?</legend>
                      <div className="mt-7 grid gap-2.5 sm:grid-cols-2">
                        {MATERIALES.map((v) => (
                          <Choice key={v} name={`${uid}-material`} value={v} checked={data.material === v} onChange={(x) => set("material", x)} />
                        ))}
                      </div>
                    </fieldset>
                  )}

                  {step === 2 && (
                    <fieldset>
                      <legend className="font-display text-2xl font-semibold tracking-[-0.02em] text-navy sm:text-3xl">¿Qué línea de aluminio?</legend>
                      <p className="mt-3 text-sm text-ink/75">Si tu proyecto no lleva perfilería de aluminio, elige «No aplica».</p>
                      <div className="mt-7 grid gap-2.5 sm:grid-cols-2">
                        {LINEAS.map((v) => (
                          <Choice key={v} name={`${uid}-linea`} value={v} checked={data.linea === v} onChange={(x) => set("linea", x)} />
                        ))}
                      </div>
                    </fieldset>
                  )}

                  {step === 3 && (
                    <fieldset>
                      <legend className="font-display text-2xl font-semibold tracking-[-0.02em] text-navy sm:text-3xl">Medidas aproximadas</legend>
                      <p className="mt-3 text-sm text-ink/75">Opcional. Si aún no las tienes, continúa: se confirman al medir el espacio.</p>
                      <div className="mt-7 grid gap-5 sm:grid-cols-3">
                        <div>
                          <label htmlFor={`${uid}-ancho`} className="field-label">Ancho</label>
                          <input id={`${uid}-ancho`} className="field" inputMode="decimal" placeholder="Ej. 1,50 m" value={data.ancho} onChange={(e) => set("ancho", e.target.value)} maxLength={30} />
                        </div>
                        <div>
                          <label htmlFor={`${uid}-alto`} className="field-label">Alto</label>
                          <input id={`${uid}-alto`} className="field" inputMode="decimal" placeholder="Ej. 1,20 m" value={data.alto} onChange={(e) => set("alto", e.target.value)} maxLength={30} />
                        </div>
                        <div>
                          <label htmlFor={`${uid}-cantidad`} className="field-label">Cantidad</label>
                          <input id={`${uid}-cantidad`} className="field" inputMode="numeric" placeholder="Ej. 2" value={data.cantidad} onChange={(e) => set("cantidad", e.target.value)} maxLength={20} />
                        </div>
                      </div>
                    </fieldset>
                  )}

                  {step === 4 && (
                    <fieldset>
                      <legend className="font-display text-2xl font-semibold tracking-[-0.02em] text-navy sm:text-3xl">¿Dónde es el proyecto?</legend>
                      <div className="mt-7 grid gap-2.5 sm:grid-cols-2">
                        {UBICACIONES.map((v) => (
                          <Choice key={v} name={`${uid}-ubicacion`} value={v} checked={data.ubicacion === v} onChange={(x) => set("ubicacion", x)} />
                        ))}
                      </div>
                      {data.ubicacion === "Otra ubicación" && (
                        <div className="mt-5">
                          <label htmlFor={`${uid}-otra`} className="field-label">Ciudad o sector</label>
                          <input id={`${uid}-otra`} className="field" placeholder="Escribe la ciudad o sector" value={data.otraUbicacion} onChange={(e) => set("otraUbicacion", e.target.value)} maxLength={80} />
                        </div>
                      )}
                    </fieldset>
                  )}

                  {step === 5 && (
                    <fieldset>
                      <legend className="font-display text-2xl font-semibold tracking-[-0.02em] text-navy sm:text-3xl">Últimos detalles</legend>
                      <div className="mt-7 grid gap-5">
                        <div>
                          <label htmlFor={`${uid}-nombre`} className="field-label">Tu nombre</label>
                          <input id={`${uid}-nombre`} className="field" autoComplete="name" placeholder="Nombre y apellido" value={data.nombre} onChange={(e) => set("nombre", e.target.value)} maxLength={80} />
                        </div>
                        <div>
                          <label htmlFor={`${uid}-detalles`} className="field-label">Detalles del proyecto (opcional)</label>
                          <textarea id={`${uid}-detalles`} className="field min-h-[96px] resize-y" placeholder="Color, tipo de apertura, referencias, plazos…" value={data.detalles} onChange={(e) => set("detalles", e.target.value)} maxLength={600} />
                        </div>
                        <div>
                          <p className="field-label">Mensaje que se enviará</p>
                          <pre className="max-h-56 overflow-auto whitespace-pre-wrap border border-navy/15 bg-white p-4 font-sans text-[13px] leading-relaxed text-ink/85" data-testid="mensaje-configurador">{message}</pre>
                        </div>
                      </div>
                    </fieldset>
                  )}
                </m.div>
              </AnimatePresence>
            </div>

            <p role="alert" className={`mt-4 min-h-[1.5rem] text-sm font-semibold text-[#9B1C1C]`}>{error}</p>

            <div className="mt-3 flex flex-col-reverse gap-3 border-t border-navy/15 pt-6 sm:flex-row sm:items-center sm:justify-between">
              <button type="button" onClick={() => go(step - 1)} disabled={step === 0} className="btn-ghost disabled:pointer-events-none disabled:opacity-35">
                <ArrowLeft width={17} height={17} />
                Atrás
              </button>
              {isLast ? (
                <a href={waLink(message)} target="_blank" rel="noopener noreferrer" onClick={onSend} className="btn bg-[#0F7A41] text-white hover:bg-[#0B6535]" data-testid="enviar-configurador">
                  <WhatsAppIcon width={18} height={18} />
                  Enviar por WhatsApp
                </a>
              ) : (
                <button type="button" onClick={() => go(step + 1)} className="btn-primary">
                  Continuar
                  <ArrowRight width={17} height={17} />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
