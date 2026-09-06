/**
 * Advertising formats. `format` on Creative is a free-form string keyed
 * into this catalog, not a DB enum — adding Stories, Reels, Marketplace or
 * banner sizes later is one entry here (AGENTS.md #5), no migration.
 */
export const FORMATS = [
  {
    id: "SQUARE_1_1",
    label: "Feed 1:1",
    platform: "Instagram/Facebook",
    width: 1080,
    height: 1080,
  },
  {
    id: "PORTRAIT_4_5",
    label: "Feed 4:5",
    platform: "Instagram/Facebook",
    width: 1080,
    height: 1350,
  },
  {
    id: "STORY_9_16",
    label: "Stories/Reels 9:16",
    platform: "Instagram/Facebook",
    width: 1080,
    height: 1920,
  },
] as const;

export type FormatId = (typeof FORMATS)[number]["id"];

export function getFormat(id: string) {
  return FORMATS.find((format) => format.id === id) ?? FORMATS[0];
}
