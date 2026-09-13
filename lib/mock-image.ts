/**
 * Local placeholder generator used ONLY when GEMINI_MOCK_MODE=1.
 *
 * It exists so the whole flow (form -> API -> preview -> download -> history)
 * can be developed and tested without ever calling Nano Banana 2 or spending a
 * single generation credit. It never runs unless the env flag is explicitly on.
 */

import type { AspectRatio, GeneratedImage, Resolution } from "./image-studio";

const RATIO_VALUES: Record<AspectRatio, [number, number]> = {
  "1:1": [1, 1],
  "4:5": [4, 5],
  "9:16": [9, 16],
  "16:9": [16, 9],
  "3:2": [3, 2],
};

/** Approximate long-edge pixels per resolution tier, for the placeholder only. */
const LONG_EDGE: Record<Resolution, number> = { "1K": 1024, "2K": 2048, "4K": 4096 };

export function isMockMode() {
  return process.env.GEMINI_MOCK_MODE === "1";
}

export function mockDimensions(aspectRatio: AspectRatio, resolution: Resolution) {
  const [w, h] = RATIO_VALUES[aspectRatio];
  const longEdge = LONG_EDGE[resolution];
  const scale = longEdge / Math.max(w, h);
  return { width: Math.round(w * scale), height: Math.round(h * scale) };
}

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function wrap(text: string, perLine: number, maxLines: number) {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    if (!current) current = word;
    else if (current.length + word.length + 1 <= perLine) current += ` ${word}`;
    else {
      lines.push(current);
      current = word;
    }
    if (lines.length === maxLines) break;
  }
  if (current && lines.length < maxLines) lines.push(current);
  if (!lines.length) return ["(sin prompt)"];
  return lines;
}

export function createMockImage(input: {
  prompt: string;
  aspectRatio: AspectRatio;
  resolution: Resolution;
  hasReference: boolean;
}): GeneratedImage {
  const { width, height } = mockDimensions(input.aspectRatio, input.resolution);
  const base = Math.min(width, height);
  const lines = wrap(input.prompt, 34, 4);

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#0b1a10"/>
      <stop offset="55%" stop-color="#07101a"/>
      <stop offset="100%" stop-color="#04070d"/>
    </linearGradient>
  </defs>
  <rect width="${width}" height="${height}" fill="url(#g)"/>
  <rect x="${base * 0.03}" y="${base * 0.03}" width="${width - base * 0.06}" height="${height - base * 0.06}" fill="none" stroke="#78d94f" stroke-opacity="0.45" stroke-width="${Math.max(2, base * 0.006)}" rx="${base * 0.03}"/>
  <text x="50%" y="${height / 2 - base * 0.16}" fill="#78d94f" font-family="system-ui, sans-serif" font-size="${base * 0.055}" font-weight="700" text-anchor="middle">VISTA PREVIA SIMULADA</text>
  <text x="50%" y="${height / 2 - base * 0.08}" fill="#94a3ad" font-family="system-ui, sans-serif" font-size="${base * 0.036}" text-anchor="middle">Sin llamadas a Nano Banana 2</text>
  ${lines
    .map(
      (line, index) =>
        `<text x="50%" y="${height / 2 + base * (0.02 + index * 0.06)}" fill="#f7f8f5" font-family="system-ui, sans-serif" font-size="${base * 0.042}" text-anchor="middle">${escapeXml(line)}</text>`
    )
    .join("\n  ")}
  <text x="50%" y="${height / 2 + base * 0.32}" fill="#94a3ad" font-family="system-ui, sans-serif" font-size="${base * 0.038}" text-anchor="middle">${input.aspectRatio} · ${input.resolution} · ${width}×${height}px</text>
  <text x="50%" y="${height / 2 + base * 0.39}" fill="#94a3ad" font-family="system-ui, sans-serif" font-size="${base * 0.034}" text-anchor="middle">Referencia: ${input.hasReference ? "sí" : "no"}</text>
</svg>`;

  return { mimeType: "image/svg+xml", data: Buffer.from(svg, "utf8").toString("base64") };
}
