import { getConceptType } from "@/lib/catalog/concepts";
import { getStyle } from "@/lib/catalog/styles";

// Rotated by variantSeed so "Regenerar" (and the automatic variant on first
// generation) visibly changes the scene, not just a random re-roll of the
// same idea.
const SCENE_IDEAS = [
  "in a clean studio setting with dramatic, directional lighting",
  "outdoors during golden hour, warm natural light, soft long shadows",
  "in an urban setting at dusk, city lights softly out of focus behind it",
  "in a minimalist environment with soft, even, diffused light",
] as const;

export function buildScenePrompt({
  conceptType,
  styleId,
  headline,
  variantSeed,
  hasProduct,
}: {
  conceptType: string;
  styleId: string;
  headline: string;
  variantSeed: number;
  hasProduct: boolean;
}): string {
  const concept = getConceptType(conceptType);
  const style = getStyle(styleId);
  const sceneIdea = SCENE_IDEAS[Math.abs(variantSeed) % SCENE_IDEAS.length];

  const productInstruction = hasProduct
    ? `The attached photo shows the real product. Preserve it EXACTLY as photographed: same shape, colors, materials, badges, logos, proportions, and every physical detail. Do not redesign, restyle, recolor, or alter the product in any way. You may only change what surrounds it — the environment, background, lighting, and camera composition. Integrate the product naturally and realistically into the new scene, ${sceneIdea}.`
    : `Create a background scene ${sceneIdea}, with an empty area of visual interest where a product could later be placed.`;

  return [
    `You are creating the background scene for a professional advertising creative.`,
    productInstruction,
    `Visual style: "${style.label}" — ${style.description}`,
    `Advertising angle: "${concept.label}" — ${concept.description}`,
    `Context for tone only (do not render this text in the image): "${headline}"`,
    `Do not render any text, words, letters, numbers, price tags, signage, logos, or watermarks anywhere in the image. Leave clean, uncluttered areas — text will be added on top afterward by a separate process.`,
    `Photorealistic, professional advertising photography quality.`,
  ].join("\n");
}
