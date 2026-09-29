"use client";

import { useEffect, useRef, useState } from "react";

declare global { interface Window { FFmpeg?: any } }

type Scene = { clip: number; start: number; end: number; role: string; text: string; reason: string };
type Plan = { title: string; totalDuration: number; scenes: Scene[]; musicMood?: string; cta?: string };
type ClipInfo = { file: File; hasAudio: boolean };

const CDN = "https://unpkg.com";

async function inspectVideo(file: File) {
  const url = URL.createObjectURL(file);
  const video = document.createElement("video");
  video.preload = "metadata";
  video.muted = true;
  video.src = url;
  await new Promise<void>((resolve, reject) => {
    video.onloadedmetadata = () => resolve();
    video.onerror = () => reject(new Error("No se pudo leer " + file.name));
  });

  let hasAudio = false;
  try {
    const stream = (video as any).captureStream?.();
    hasAudio = !!stream?.getAudioTracks?.().length;
  } catch {}

  const duration = video.duration;
  const canvas = document.createElement("canvas");
  const width = 640;
  const height = Math.max(360, Math.round((video.videoHeight / video.videoWidth) * width));
  canvas.width = width;
  canvas.height = height;

  const times = [Math.min(0.2, duration / 4), Math.max(0.2, duration / 2)];
  const frames: { dataUrl: string; time: number }[] = [];

  for (const time of times) {
    video.currentTime = Math.min(time, Math.max(0, duration - 0.05));
    await new Promise<void>(resolve => { video.onseeked = () => resolve(); });
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.drawImage(video, 0, 0, width, height);
      frames.push({ dataUrl: canvas.toDataURL("image/jpeg", 0.62), time: video.currentTime });
    }
  }

  URL.revokeObjectURL(url);
  return { duration, frames, hasAudio };
}

function formatSrtTime(seconds: number) {
  const ms = Math.round((seconds % 1) * 1000);
  const total = Math.floor(seconds);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")},${String(ms).padStart(3, "0")}`;
}

function buildSrt(scenes: Scene[]) {
  let cursor = 0;
  return scenes
    .map((scene, i) => {
      const duration = Math.max(0, scene.end - scene.start);
      const start = cursor;
      const end = cursor + duration;
      cursor = end;
      if (!scene.text?.trim()) return "";
      return `${i + 1}\n${formatSrtTime(start)} --> ${formatSrtTime(end)}\n${scene.text.trim()}`;
    })
    .filter(Boolean)
    .join("\n\n");
}

export default function AIReelEditor() {
  const [files, setFiles] = useState<ClipInfo[]>([]);
  const [plan, setPlan] = useState<Plan>();
  const [result, setResult] = useState<string>();
  const [srtResult, setSrtResult] = useState<string>();
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState("Añade tus clips originales.");
  const [brief, setBrief] = useState("");
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
    const next = Array.from(list)
      .filter(f => f.type.startsWith("video/"))
      .slice(0, Math.max(0, 12 - files.length))
      .map(file => ({ file, hasAudio: true }));
    setFiles(prev => [...prev, ...next].slice(0, 12));
    setPlan(undefined);
    setResult(undefined);
    setSrtResult(undefined);
    setStatus(next.length + " clip(s) añadidos.");
  };

  const remove = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
    setPlan(undefined);
    setResult(undefined);
    setSrtResult(undefined);
  };

  const analyze = async () => {
    if (!files.length) return setStatus("Añade al menos un video.");
    setBusy(true);
    setStatus("Analizando escenas y fotogramas…");

    try {
      const clips = [];
      const inspected: ClipInfo[] = [...files];

      for (let i = 0; i < Math.min(files.length, 8); i++) {
        const sampled = await inspectVideo(files[i].file);
        inspected[i] = { ...files[i], hasAudio: sampled.hasAudio };
        clips.push({ index: i, name: files[i].file.name, ...sampled });
      }

      setFiles(inspected);

      const res = await fetch("/api/ai-reel/director", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brief, clips }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "No se pudo analizar.");

      setPlan(data.plan);
      const srt = buildSrt(data.plan.scenes || []);
      if (srt) setSrtResult(URL.createObjectURL(new Blob([srt], { type: "text/plain;charset=utf-8" })));
      setStatus("Plan de edición generado.");
    } catch (e) {
      setStatus("Error: " + (e instanceof Error ? e.message : "no se pudo analizar"));
    } finally {
      setBusy(false);
    }
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

    setBusy(true);
    setProgress(0);
    setResult(undefined);

    try {
      const engine = await getEngine();
      const scenes: Scene[] = plan?.scenes?.length
        ? plan.scenes
        : files.map((_, i) => ({ clip: i, start: 0, end: 5, role: "scene", text: "", reason: "" }));

      setStatus("Ejecutando el plan de edición…");

      for (let i = 0; i < files.length; i++) {
        await engine.writeFile("in" + i + ".mp4", new Uint8Array(await files[i].file.arrayBuffer()));
      }

      const videoFilters = scenes.map((s, i) =>
        "[" + s.clip + ":v]trim=start=" + Math.max(0, s.start) +
        ":end=" + Math.max(s.start + 0.5, s.end) +
        ",setpts=PTS-STARTPTS,scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,setsar=1[v" + i + "]"
      ).join(";");

      const audioFilters = scenes.map((s, i) => {
        const duration = Math.max(0.5, s.end - s.start);
        if (files[s.clip]?.hasAudio === false) {
          return "anullsrc=channel_layout=stereo:sample_rate=48000,atrim=duration=" +
            duration.toFixed(3) + ",asetpts=PTS-STARTPTS[a" + i + "]";
        }
        return "[" + s.clip + ":a]atrim=start=" + Math.max(0, s.start) +
          ":end=" + Math.max(s.start + 0.5, s.end) +
          ",asetpts=PTS-STARTPTS,aresample=48000[a" + i + "]";
      }).join(";");

      const vInputs = scenes.map((_, i) => "[v" + i + "]").join("");
      const aInputs = scenes.map((_, i) => "[a" + i + "]").join("");

      const filter =
        videoFilters + ";" +
        audioFilters + ";" +
        vInputs + "concat=n=" + scenes.length + ":v=1:a=0[vout];" +
        aInputs + "concat=n=" + scenes.length + ":v=0:a=1[aout]";

      const args = files.flatMap((_, i) => ["-i", "in" + i + ".mp4"]);

      await engine.exec([
        "-y", ...args,
        "-filter_complex", filter,
        "-map", "[vout]",
        "-map", "[aout]",
        "-r", "30",
        "-c:v", "libx264",
        "-preset", "ultrafast",
        "-crf", "23",
        "-pix_fmt", "yuv420p",
        "-c:a", "aac",
        "-b:a", "128k",
        "-movflags", "+faststart",
        "reel.mp4",
      ]);

      const data = await engine.readFile("reel.mp4");
      setResult(URL.createObjectURL(new Blob([data], { type: "video/mp4" })));

      const srt = buildSrt(scenes);
      if (srt) setSrtResult(URL.createObjectURL(new Blob([srt], { type: "text/plain;charset=utf-8" })));

      setStatus(
        "Reel generado · " +
        scenes.reduce((n, s) => n + Math.max(0, s.end - s.start), 0).toFixed(1) +
        " s · 1080×1920."
      );
    } catch (e) {
      console.error(e);
      setStatus("Error de render: " + (e instanceof Error ? e.message : "no se pudo generar"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#070707] px-5 py-10 text-white">
      <div className="mx-auto max-w-6xl">
        <p className="text-sm uppercase tracking-[.25em] text-lime-300">ADvibe Studio</p>
        <h1 className="mt-2 text-4xl font-semibold">AI Reel Editor</h1>
        <p className="mt-2 max-w-3xl text-white/60">
          Sube clips, deja que el Director IA proponga el montaje y deja que FFmpeg lo renderice localmente en 1080×1920.
        </p>

        <label className="mt-8 block cursor-pointer rounded-3xl border border-dashed border-white/20 bg-white/[.03] p-10 text-center hover:border-lime-300/50">
          <input hidden type="file" multiple accept="video/*" onChange={e => add(e.target.files)} />
          <strong>Añadir clips originales</strong>
          <div className="mt-2 text-sm text-white/50">MP4 / MOV / WebM · máximo 12</div>
        </label>

        {files.length > 0 && (
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {files.map((item, i) => (
              <div key={item.file.name + i} className="overflow-hidden rounded-2xl border border-white/10 bg-white/[.03]">
                <video src={URL.createObjectURL(item.file)} controls muted className="aspect-video w-full object-cover" />
                <div className="flex items-center justify-between gap-2 p-3 text-sm">
                  <span>Clip {i} · {item.file.name}</span>
                  <button onClick={() => remove(i)} className="text-white/40 hover:text-white">Eliminar</button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-6 rounded-3xl border border-white/10 bg-white/[.03] p-5">
          <label className="text-sm text-white/60">Brief opcional</label>
          <textarea
            value={brief}
            onChange={e => setBrief(e.target.value)}
            placeholder="Ej.: Medivision, reel de 30-40 s, elegante, vender examen visual y cerrar con WhatsApp."
            className="mt-2 min-h-24 w-full rounded-2xl border border-white/10 bg-black/40 p-4 outline-none"
          />

          <div className="mt-4 flex flex-wrap gap-3">
            <button onClick={analyze} disabled={busy || !files.length} className="rounded-2xl bg-white px-6 py-3 font-semibold text-black disabled:opacity-40">
              {busy ? "Analizando…" : "✨ Analizar con IA"}
            </button>
            <button onClick={generate} disabled={busy || !files.length} className="rounded-2xl border border-lime-300/40 px-6 py-3 font-semibold text-lime-200 disabled:opacity-40">
              {busy ? "Procesando…" : "🎬 Renderizar reel"}
            </button>
            <span className="self-center text-sm text-white/50">{status}</span>
          </div>
        </div>

        {plan && (
          <section className="mt-6 rounded-3xl border border-lime-300/20 bg-lime-300/[.03] p-5">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-widest text-lime-300">Director IA</p>
                <h2 className="mt-1 text-2xl font-semibold">{plan.title}</h2>
              </div>
              <div className="text-sm text-white/50">{plan.totalDuration}s · {plan.musicMood || "sin mood definido"}</div>
            </div>

            <div className="mt-5 space-y-3">
              {plan.scenes.map((s, i) => (
                <div key={i} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <strong>{i + 1}. Clip {s.clip}</strong>
                    <span className="text-sm text-lime-200">{s.start.toFixed(1)}s → {s.end.toFixed(1)}s</span>
                  </div>
                  <p className="mt-1 text-sm text-white/70">{s.role}{s.text ? " · “" + s.text + "”" : ""}</p>
                  <p className="mt-1 text-xs text-white/40">{s.reason}</p>
                </div>
              ))}
            </div>

            {plan.cta && <p className="mt-4 text-sm text-white/60">CTA: <span className="text-white">{plan.cta}</span></p>}
          </section>
        )}

        {result && (
          <section className="mt-8 rounded-3xl border border-lime-300/20 p-5">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-xl font-semibold">Resultado</h2>
              <div className="flex gap-2">
                <a href={result} download="advibe-reel.mp4" className="rounded-xl border border-white/10 px-4 py-2 text-sm">Descargar MP4</a>
                {srtResult && <a href={srtResult} download="advibe-captions.srt" className="rounded-xl border border-white/10 px-4 py-2 text-sm">Descargar SRT</a>}
              </div>
            </div>
            <video src={result} controls playsInline className="mx-auto max-h-[70vh] rounded-2xl bg-black" />
            {progress > 0 && <div className="mt-3 h-1 overflow-hidden rounded bg-white/10"><div className="h-full bg-lime-300" style={{ width: progress + "%" }} /></div>}
          </section>
        )}
      </div>
    </main>
  );
}
