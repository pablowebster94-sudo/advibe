"use client";

import { useEffect, useRef, useState } from "react";

declare global { interface Window { FFmpeg?: any } }

const CDN = "https://unpkg.com";

export default function AIReelEditor() {
  const [files, setFiles] = useState<File[]>([]);
  const [result, setResult] = useState<string>();
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState("Añade tus clips originales.");
  const [seconds, setSeconds] = useState(5);
  const ffmpeg = useRef<any>(null);

  useEffect(() => {
    if (document.querySelector("[data-advibe-ffmpeg]")) return;
    const s = document.createElement("script");
    s.src = CDN + "/@ffmpeg/ffmpeg@0.12.15/dist/umd/ffmpeg.js";
    s.dataset.advibeFfmpeg = "1";
    s.onload = () => setStatus("Motor de edición listo.");
    s.onerror = () => setStatus("No se pudo cargar FFmpeg.");
    document.head.appendChild(s);
  }, []);

  const add = (list: FileList | null) => {
    if (!list) return;
    const next = Array.from(list).filter(f => f.type.startsWith("video/")).slice(0, 12);
    setFiles(prev => [...prev, ...next].slice(0, 12));
    setResult(undefined);
    setStatus(next.length + " clip(s) añadidos.");
  };

  const getEngine = async () => {
    if (ffmpeg.current) return ffmpeg.current;
    if (!window.FFmpeg) throw new Error("El motor todavía está cargando.");
    const engine = new window.FFmpeg.FFmpeg();
    engine.on("progress", ({ progress }: { progress: number }) => setProgress(Math.round(progress * 100)));
    const blobURL = async (url: string, type: string) => {
      const r = await fetch(url);
      return URL.createObjectURL(new Blob([await r.blob()], { type }));
    };
    const base = CDN + "/@ffmpeg/core@0.12.10/dist/umd";
    await engine.load({
      coreURL: await blobURL(base + "/ffmpeg-core.js", "text/javascript"),
      wasmURL: await blobURL(base + "/ffmpeg-core.wasm", "application/wasm"),
    });
    ffmpeg.current = engine;
    return engine;
  };

  const generate = async () => {
    if (!files.length) return setStatus("Añade al menos un video.");
    setBusy(true); setProgress(0); setResult(undefined);
    try {
      const engine = await getEngine();
      setStatus("Construyendo montaje vertical…");
      for (let i = 0; i < files.length; i++) {
        await engine.writeFile("in" + i + ".mp4", new Uint8Array(await files[i].arrayBuffer()));
      }
      const videoFilters = files.map((_, i) =>
        "[" + i + ":v]trim=duration=" + seconds + ",setpts=PTS-STARTPTS,scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,setsar=1[v" + i + "]"
      ).join(";");
      const audioFilters = files.map((_, i) =>
        "[" + i + ":a]aresample=48000,atrim=duration=" + seconds + ",asetpts=PTS-STARTPTS[a" + i + "]"
      ).join(";");
      const vInputs = files.map((_, i) => "[v" + i + "]").join("");
      const aInputs = files.map((_, i) => "[a" + i + "]").join("");
      const filter = videoFilters + ";" + audioFilters + ";" +
        vInputs + "concat=n=" + files.length + ":v=1:a=0[vout];" +
        aInputs + "concat=n=" + files.length + ":v=0:a=1[aout]";
      const args = files.flatMap((_, i) => ["-i", "in" + i + ".mp4"]);
      await engine.exec([
        "-y", ...args, "-filter_complex", filter,
        "-map", "[vout]", "-map", "[aout]",
        "-r", "30", "-c:v", "libx264", "-preset", "ultrafast",
        "-crf", "23", "-pix_fmt", "yuv420p",
        "-c:a", "aac", "-b:a", "128k", "-movflags", "+faststart", "reel.mp4"
      ]);
      const data = await engine.readFile("reel.mp4");
      setResult(URL.createObjectURL(new Blob([data], { type: "video/mp4" })));
      setStatus("Reel generado · " + Math.min(files.length * seconds, 60) + " s · 1080×1920.");
    } catch (e) {
      console.error(e);
      setStatus("Error: " + (e instanceof Error ? e.message : "no se pudo generar"));
    } finally { setBusy(false); }
  };

  return (
    <main className="min-h-screen bg-[#070707] px-5 py-10 text-white">
      <div className="mx-auto max-w-5xl">
        <p className="text-sm uppercase tracking-[.25em] text-lime-300">ADvibe Studio</p>
        <h1 className="mt-2 text-4xl font-semibold">AI Reel Editor</h1>
        <p className="mt-2 max-w-2xl text-white/60">Primera versión: montaje vertical local. Los clips se procesan en tu navegador; no se suben a un servidor.</p>
        <label className="mt-8 block cursor-pointer rounded-3xl border border-dashed border-white/20 bg-white/[.03] p-10 text-center hover:border-lime-300/50">
          <input hidden type="file" multiple accept="video/*" onChange={e => add(e.target.files)} />
          <strong>Añadir clips originales</strong><div className="mt-2 text-sm text-white/50">MP4 / MOV / WebM · máximo 12</div>
        </label>
        {files.length > 0 && (
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {files.map((file, i) => (
              <div key={file.name + i} className="overflow-hidden rounded-2xl border border-white/10 bg-white/[.03]">
                <video src={URL.createObjectURL(file)} controls muted className="aspect-video w-full object-cover" />
                <div className="p-3 text-sm">Escena {i + 1} · {file.name}</div>
              </div>
            ))}
          </div>
        )}
        <div className="mt-6 flex flex-wrap items-end gap-4 rounded-3xl border border-white/10 bg-white/[.03] p-5">
          <label className="text-sm">Segundos por clip
            <select value={seconds} onChange={e => setSeconds(Number(e.target.value))} className="mt-2 block rounded-xl border border-white/10 bg-black p-3">
              {[3,4,5,6,7].map(n => <option key={n} value={n}>{n} s</option>)}
            </select>
          </label>
          <button onClick={generate} disabled={busy || !files.length} className="rounded-2xl bg-lime-300 px-6 py-3 font-semibold text-black disabled:opacity-40">
            {busy ? "Editando… " + progress + "%" : "Generar reel"}
          </button>
          <span className="text-sm text-white/50">{status}</span>
        </div>
        {result && (
          <section className="mt-8 rounded-3xl border border-lime-300/20 p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="text-xl font-semibold">Resultado</h2>
              <a href={result} download="advibe-reel.mp4" className="rounded-xl border border-white/10 px-4 py-2 text-sm">Descargar MP4</a>
            </div>
            <video src={result} controls playsInline className="mx-auto max-h-[70vh] rounded-2xl bg-black" />
          </section>
        )}
      </div>
    </main>
  );
}
