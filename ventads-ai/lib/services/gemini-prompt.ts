import { getFormat } from "@/lib/catalog/formats";
import { getStyle } from "@/lib/catalog/styles";

/**
 * Art direction for Gemini image generation. Gemini produces the SCENE
 * (environment, light, camera, composition) around the real product; it
 * never draws copy. Headline, price, CTA, benefits and logo are laid on top
 * afterwards by creative-renderer.ts so every character is exact.
 *
 * Three levers make the output feel like an agency campaign instead of a
 * template, and make the variants genuinely different:
 * - CONCEPT_DIRECTION: each ad angle has its own art direction and its own
 *   bank of scenes (so the 3 concepts never look alike);
 * - FORMAT_COMPOSITION: each canvas is composed for its placement (feed
 *   square, feed portrait, story) with the empty zones our copy overlay uses;
 * - variantSeed: rotates scene, light and camera on every "Regenerar".
 */

type Scene = { setting: string; light: string; camera: string };

type ConceptDirection = {
  intent: string;
  mood: string;
  scenes: { vehicle: Scene[]; generic: Scene[] };
};

const CONCEPT_DIRECTION: Record<string, ConceptDirection> = {
  VENTA_DIRECTA: {
    intent:
      "Direct-response sales ad. The product is the undisputed hero and must read instantly; the image must create a sense of opportunity and urgency to buy now.",
    mood: "High contrast, punchy, commercial, clean and bold. Rich blacks, crisp highlights, saturated but faithful product color.",
    scenes: {
      vehicle: [
        { setting: "a modern dealership showroom at night with a polished dark concrete floor and architectural light strips", light: "strong key light from the front three-quarter side with bright rim lights tracing the body lines", camera: "low front three-quarter angle, 35mm, the vehicle filling most of the frame" },
        { setting: "a minimalist dark studio cyclorama with a glossy reflective floor", light: "overhead softbox strip lighting that draws long highlights along the bodywork", camera: "classic front three-quarter hero angle at bumper height, 50mm" },
        { setting: "an empty wet city street at blue hour with blurred warm city lights", light: "cool ambient light with warm streetlight reflections on the paint and wet asphalt", camera: "low three-quarter angle, shallow depth of field, background bokeh" },
        { setting: "a clean industrial parking deck with bold graphic concrete columns", light: "hard directional sunlight with deep shadows and high contrast", camera: "dynamic low angle, slight wide-angle perspective without distortion of the vehicle" },
      ],
      generic: [
        { setting: "a seamless studio set with a bold colored backdrop", light: "crisp commercial key light with a strong rim light", camera: "hero angle, product large and centered, tack sharp" },
        { setting: "a premium retail display surface with subtle reflections", light: "bright spotlight with controlled falloff", camera: "slightly low angle, 50mm, product dominant" },
        { setting: "a graphic set of geometric pedestals", light: "high contrast directional light", camera: "front three-quarter view, product filling the frame" },
        { setting: "a clean contemporary interior with shallow depth", light: "punchy key light and soft fill", camera: "eye level, product dominant and sharp" },
      ],
    },
  },
  CARACTERISTICA: {
    intent:
      "Feature-focused ad. The product dominates, and the scene makes its real design and engineering qualities feel precise and modern, without adding or inventing any feature.",
    mood: "Modern, technological, precise and clean. Cooler palette, controlled reflections, less aggressive than a sales ad.",
    scenes: {
      vehicle: [
        { setting: "a high-tech design studio with clean LED light panels and a matte grey floor", light: "cool, even light with precise reflections that reveal every surface of the body", camera: "three-quarter front view, 50mm, vehicle large and sharp" },
        { setting: "a modern architectural space of glass, steel and concrete", light: "diffused daylight with crisp specular highlights", camera: "side three-quarter view that shows the full silhouette and wheels" },
        { setting: "a dark tunnel lined with linear LED strips", light: "linear light reflections flowing across the paint", camera: "low front three-quarter angle with converging light lines" },
        { setting: "a minimalist white-and-grey test facility", light: "soft top light with subtle cool accents", camera: "clean profile-leaning three-quarter view, engineering-shot feel" },
      ],
      generic: [
        { setting: "a clean technical studio with subtle grid lines", light: "precise, even, cool light", camera: "detail-revealing three-quarter view, macro-sharp" },
        { setting: "a modern lab-like environment", light: "diffused light with crisp edge highlights", camera: "slightly elevated angle showing form and materials" },
        { setting: "a dark set with thin linear light accents", light: "rim light that outlines the product's shape", camera: "hero close-up, product dominant" },
        { setting: "a minimal matte surface with soft gradient backdrop", light: "soft box light, clean shadows", camera: "straight-on product view, catalog precision with ad polish" },
      ],
    },
  },
  ASPIRACIONAL: {
    intent:
      "Aspirational lifestyle ad. Cinematic image that creates desire and status; the product is still the protagonist, placed in a scene the target customer dreams of.",
    mood: "Cinematic, premium, emotional. Film-like color grading, atmospheric depth, elegant light.",
    scenes: {
      vehicle: [
        { setting: "a scenic coastal road at golden hour with the ocean softly out of focus", light: "warm low sun with a glowing rim light on the bodywork", camera: "cinematic three-quarter angle, 85mm compression, shallow depth of field" },
        { setting: "the driveway of a modern luxury house at dusk", light: "warm architectural lighting mixed with deep blue sky", camera: "low elegant three-quarter angle, vehicle as the centerpiece" },
        { setting: "a winding mountain road with dramatic peaks and soft mist", light: "soft morning light breaking through the clouds", camera: "wide cinematic framing with the vehicle large in the foreground" },
        { setting: "a rooftop overlooking the city skyline at night", light: "moody city glow with elegant reflections on the paint", camera: "three-quarter view with skyline bokeh behind" },
      ],
      generic: [
        { setting: "an elegant, sunlit living space", light: "warm natural window light", camera: "lifestyle composition with the product as the clear focus" },
        { setting: "a premium outdoor terrace at golden hour", light: "warm backlight with soft flare", camera: "shallow depth of field, cinematic framing" },
        { setting: "a refined boutique setting", light: "soft moody accent lighting", camera: "elegant close angle, product protagonist" },
        { setting: "an aspirational travel scene", light: "golden hour glow", camera: "cinematic wide shot with product dominant in the foreground" },
      ],
    },
  },
  OFERTA: {
    intent: "Promotional ad. The product must read instantly with an energetic, high-urgency feel.",
    mood: "Energetic, bold, high contrast, vivid.",
    scenes: {
      vehicle: [
        { setting: "a bold dealership forecourt with dramatic lighting", light: "strong key light and vivid rim", camera: "low front three-quarter hero angle" },
        { setting: "a dark studio with bold colored light accents", light: "high-contrast colored rim lights", camera: "dynamic hero angle" },
      ],
      generic: [
        { setting: "a vivid studio backdrop", light: "punchy commercial light", camera: "product large and centered" },
        { setting: "a bold graphic set", light: "high contrast light", camera: "hero angle" },
      ],
    },
  },
};

/** Where the copy overlay sits in each format, so Gemini keeps those zones clean. */
const FORMAT_COMPOSITION: Record<string, string> = {
  SQUARE_1_1:
    "Square 1:1 feed ad. Place the product large, slightly above the vertical center, occupying roughly 70-80% of the width. Keep the bottom 35% of the frame as a darker, calm, low-detail area (ground, shadow or soft background) for headline, price and button. Keep the top-left and top-right corners calm and uncluttered for a logo and a badge.",
  PORTRAIT_4_5:
    "Vertical 4:5 feed ad. The product dominates the upper-middle of the frame, large and sharp, occupying most of the width. Keep the bottom 38% as a darker, calm, low-detail area for the headline, price, benefits and button. Keep the top-left and top-right corners calm for a logo and a badge.",
  STORY_9_16:
    "Full-screen vertical 9:16 Story/Reel ad. Place the product in the middle band of the frame (roughly between 25% and 62% of the height), large, spanning most of the width. Keep the top 20% calm (sky, ceiling or soft background) and the bottom 38% darker and low-detail for headline, price, benefits and button. Use the extra height for atmosphere and depth, not empty flat space.",
};

const NO_TEXT_RULES =
  "ABSOLUTELY NO TEXT in the image: no words, letters, numbers, prices, phone numbers, URLs, buttons, call-to-action, captions, watermarks, signage, license-plate text, or added logos or brand names. Do not add any graphic overlays, frames or UI elements. Text and graphics are added afterwards by a separate process.";

const VEHICLE_IDENTITY_RULES = [
  "The attached photo shows the REAL vehicle being sold. It must remain exactly the same vehicle:",
  "- same make and model, same body shape and proportions, same generation;",
  "- same paint color and finish, same wheels and tires, same lights, grille, trims and mirrors;",
  "- badges and logos exactly as they are (do not deform, invent or remove them);",
  "- do not add accessories, spoilers, stickers, roof racks or any feature that is not in the photo;",
  "- do not change the vehicle's condition, stance or ride height.",
  "You MAY change only: the setting, background and surroundings, the lighting and reflections, the atmosphere, depth of field, camera framing and the vehicle's position within the canvas.",
  "Remove the original background (dealership, people, other vehicles) and rebuild the scene around the vehicle; keep realistic contact shadows and reflections so it sits naturally in the new environment.",
].join("\n");

const GENERIC_IDENTITY_RULES = [
  "The attached photo shows the REAL product being sold. Preserve it exactly: same shape, colors, materials, proportions, labels and logos, with no added or removed details.",
  "You MAY change only the setting, background, lighting, reflections, atmosphere, depth of field, camera framing and the product's position within the canvas.",
].join("\n");

export type ScenePromptInput = {
  conceptType: string;
  styleId: string;
  formatId: string;
  variantSeed: number;
  hasProduct: boolean;
  isVehicle: boolean;
  /** Campaign objective id (VENDER, MENSAJES, ...), used for tone only. */
  objective?: string | null;
  /** Whether the ad has a price to feature (drives the "opportunity" feel). */
  hasPrice?: boolean;
};

/** Deterministic scene for a concept + seed — exported for tests. */
export function pickScene(conceptType: string, isVehicle: boolean, variantSeed: number): Scene {
  const direction = CONCEPT_DIRECTION[conceptType] ?? CONCEPT_DIRECTION.VENTA_DIRECTA;
  const bank = isVehicle ? direction.scenes.vehicle : direction.scenes.generic;
  return bank[Math.abs(variantSeed) % bank.length];
}

export function buildScenePrompt(input: ScenePromptInput): string {
  const direction = CONCEPT_DIRECTION[input.conceptType] ?? CONCEPT_DIRECTION.VENTA_DIRECTA;
  const style = getStyle(input.styleId);
  const format = getFormat(input.formatId);
  const scene = pickScene(input.conceptType, input.isVehicle, input.variantSeed);
  const subject = input.isVehicle ? "vehicle" : "product";

  const identity = input.hasProduct
    ? input.isVehicle
      ? VEHICLE_IDENTITY_RULES
      : GENERIC_IDENTITY_RULES
    : `No product photo was provided: create the scene with a clear, empty hero position where a ${subject} will be placed later, following the same composition rules.`;

  return [
    `You are the art director and commercial photographer of a top performance-advertising agency${input.isVehicle ? " specialized in automotive campaigns" : ""}. Create the key visual for a paid social ad (Meta Ads) that sells the ${subject} in the attached photo. It must look like a real agency campaign shot, not a product cut-out on a template.`,
    identity,
    `Campaign angle: ${direction.intent}`,
    `Mood: ${direction.mood}`,
    `Scene: ${scene.setting}. Lighting: ${scene.light}. Camera: ${scene.camera}.`,
    `Brand style "${style.label}" (${style.description}): grade the scene to harmonize with a palette of ${style.palette.background}, ${style.palette.panel} and ${style.palette.accent} accents, without recoloring the ${subject} itself.`,
    input.hasPrice
      ? "A price will be shown on top, so the image should feel like an attainable opportunity, bright and inviting where the product is."
      : "",
    input.objective ? `Campaign objective (tone only): ${input.objective}.` : "",
    `Canvas: ${format.width}x${format.height}. ${FORMAT_COMPOSITION[format.id] ?? FORMAT_COMPOSITION.SQUARE_1_1}`,
    `Visual hierarchy: the ${subject} is the protagonist and occupies a large part of the frame; strong subject-background separation, depth, controlled contrast, no clutter, no distracting objects or people.`,
    "Quality: photorealistic high-end commercial photography, sharp focus on the subject, professional color grading, natural physically-correct lighting and shadows.",
    NO_TEXT_RULES,
  ]
    .filter(Boolean)
    .join("\n\n");
}

export type BackgroundPromptInput = {
  conceptType: string;
  styleId: string;
  formatId: string;
  variantSeed: number;
  isVehicle: boolean;
  /** Fraction of the canvas height (from the top) that stays visible above the copy panel. */
  visibleHeight: number;
};

/**
 * "Real product" mode: Gemini paints ONLY the empty environment. The real
 * product (background-removed photo, original pixels) is placed on it
 * afterwards by creative-renderer.ts#placeProductOnScene, so the model never
 * gets the chance to redraw — and alter — the car.
 */
export function buildBackgroundPrompt(input: BackgroundPromptInput): string {
  const direction = CONCEPT_DIRECTION[input.conceptType] ?? CONCEPT_DIRECTION.VENTA_DIRECTA;
  const style = getStyle(input.styleId);
  const format = getFormat(input.formatId);
  const scene = pickScene(input.conceptType, input.isVehicle, input.variantSeed);
  const subject = input.isVehicle ? "vehicle" : "product";
  const visiblePct = Math.round(input.visibleHeight * 100);
  const groundPct = Math.round(input.visibleHeight * 92);

  return [
    `You are the art director and commercial photographer of a top performance-advertising agency${input.isVehicle ? " specialized in automotive campaigns" : ""}. Create an EMPTY background plate for a paid social ad (Meta Ads): the set where a real ${subject} will be placed later by compositing.`,
    `The scene must be completely EMPTY: no ${input.isVehicle ? "cars, vehicles, motorcycles" : "products, objects on the hero spot"}, no people, no animals. Leave a clear, flat, unobstructed ${input.isVehicle ? "floor/ground area" : "surface"} in the center of the frame.`,
    `Campaign angle: ${direction.intent}`,
    `Mood: ${direction.mood}`,
    `Setting: ${scene.setting}. Lighting: ${scene.light}. Camera: eye level at about 1 meter, straight-on, normal 35-50mm perspective with a level horizon.`,
    `Brand style "${style.label}" (${style.description}): grade the scene to harmonize with ${style.palette.background}, ${style.palette.panel} and ${style.palette.accent} accents.`,
    `Canvas: ${format.width}x${format.height}. Only the top ${visiblePct}% of the canvas will be visible (the rest is covered by the ad's text panel), so build the composition there: the empty ground spot where the ${subject} will stand must be centered horizontally, with its ground contact line at about ${groundPct}% of the canvas height; keep the background behind it calm and slightly darker at the edges so a ${subject} placed in the center stands out. Keep the top-left corner calm for a logo.`,
    "Quality: photorealistic high-end commercial photography, natural physically-correct light, professional color grading, sharp but not busy.",
    NO_TEXT_RULES,
  ].join("\n\n");
}
