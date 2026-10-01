import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

/**
 * Creative copy is drawn as SVG text by sharp/librsvg, which finds fonts
 * through fontconfig. Serverless hosts (Vercel) ship no system fonts, so
 * every glyph rendered as an empty box. The fonts VentAds needs (DejaVu
 * Sans regular + bold, the family creative-renderer.ts asks for) live in
 * ./fonts and are pointed to here, before the first render. Idempotent.
 */
let configured: boolean | null = null;

export function ensureFontsConfigured(): boolean {
  if (configured !== null) return configured;
  const dir = [path.join(process.cwd(), "fonts"), path.join(process.cwd(), "ventads-ai", "fonts")].find(
    (candidate) => existsSync(path.join(candidate, "DejaVuSans.ttf"))
  );
  if (!dir) {
    console.warn("[fonts] bundled fonts not found; creative text will rely on system fonts");
    configured = false;
    return configured;
  }
  // Always our own config (bundled fonts only, no system fonts): the render
  // must be identical locally and on Vercel, whatever the host provides.
  {
    const tmp = path.join("/tmp", "ventads-fontconfig");
    mkdirSync(tmp, { recursive: true });
    const file = path.join(tmp, "fonts.conf");
    writeFileSync(
      file,
      `<?xml version="1.0"?>
<!DOCTYPE fontconfig SYSTEM "fonts.dtd">
<fontconfig>
  <dir>${dir}</dir>
  <cachedir>${path.join(tmp, "cache")}</cachedir>
  <alias><family>sans-serif</family><prefer><family>DejaVu Sans</family></prefer></alias>
</fontconfig>
`
    );
    process.env.FONTCONFIG_FILE = file;
  }
  configured = true;
  return configured;
}

ensureFontsConfigured();
