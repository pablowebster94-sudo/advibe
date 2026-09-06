/** Small SVG text helpers shared by the creative renderer. */

export function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/**
 * SVG <text> doesn't auto-wrap, so we approximate line breaks from an
 * average glyph-width ratio. It's not pixel-perfect kerning, but it keeps
 * headlines legible across every format without a headless-browser text
 * measurer.
 */
export function wrapText(
  text: string,
  maxCharsPerLine: number,
  maxLines: number
): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const allLines: string[] = [];
  let current = "";

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length > maxCharsPerLine && current) {
      allLines.push(current);
      current = word;
    } else {
      current = candidate;
    }
  }
  if (current) allLines.push(current);

  if (allLines.length <= maxLines) return allLines;

  // More text than fits: keep the first maxLines lines and mark the cut
  // on the last one, rather than silently dropping the remainder.
  const visible = allLines.slice(0, maxLines);
  const last = visible[maxLines - 1].replace(/[.,;:]+$/, "");
  visible[maxLines - 1] = last.length > 1 ? `${last}…` : last;
  return visible;
}
