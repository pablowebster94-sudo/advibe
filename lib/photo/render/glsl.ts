/**
 * GLSL for the develop preview.
 *
 * What this renders and what it does not:
 *
 *  - It renders the *preview*: the camera-rendered JPEG that lives inside the
 *    ARW, developed with our approximation of the Camera Raw pipeline. It is
 *    what the before/after slider and the JPEG export show.
 *  - It is NOT a RAW developer. The authoritative result is the `.xmp` opened in
 *    Lightroom Classic, which applies the same slider values to the actual
 *    sensor data with Adobe's own colour science and the camera's profile.
 *
 * Two sliders are deliberately not simulated here, because simulating them on
 * an already-denoised 8-bit preview would show something the RAW will not do:
 * luminance and colour noise reduction. Their values still travel in the XMP.
 * Everything else is applied.
 */

export const VERTEX_SHADER = `#version 300 es
in vec2 aPosition;
out vec2 vUv;
void main() {
  vUv = aPosition * 0.5 + 0.5;
  gl_Position = vec4(aPosition, 0.0, 1.0);
}`;

/** Separable Gaussian, used to build the low-frequency planes. */
export const BLUR_SHADER = `#version 300 es
precision highp float;
in vec2 vUv;
uniform sampler2D uTexture;
uniform vec2 uDirection;
out vec4 fragColor;

void main() {
  // 9-tap Gaussian with linear-sampling offsets.
  float weights[5] = float[](0.227027, 0.194595, 0.121622, 0.054054, 0.016216);
  vec4 result = texture(uTexture, vUv) * weights[0];
  for (int i = 1; i < 5; i++) {
    vec2 offset = uDirection * float(i);
    result += texture(uTexture, vUv + offset) * weights[i];
    result += texture(uTexture, vUv - offset) * weights[i];
  }
  fragColor = result;
}`;

export const DEVELOP_SHADER = `#version 300 es
precision highp float;

in vec2 vUv;
out vec4 fragColor;

uniform sampler2D uImage;
uniform sampler2D uFine;     // lightly blurred copy  -> texture
uniform sampler2D uCoarse;   // heavily blurred copy  -> clarity / dehaze
uniform sampler2D uCurve;    // 256x1 tone-curve LUT

uniform float uExposure;
uniform float uContrast;
uniform float uHighlights;
uniform float uShadows;
uniform float uWhites;
uniform float uBlacks;
uniform float uTemperature;
uniform float uTint;
uniform float uVibrance;
uniform float uSaturation;
uniform float uTexture;
uniform float uClarity;
uniform float uDehaze;
uniform float uSharpen;
uniform float uVignette;
uniform float uVignetteMidpoint;
uniform float uVignetteFeather;
uniform float uHasCurve;
uniform float uHslHue[8];
uniform float uHslSat[8];
uniform float uHslLum[8];
uniform vec3 uGradeShadow;    // hue(deg), sat(0..1), lum(-1..1)
uniform vec3 uGradeMidtone;
uniform vec3 uGradeHighlight;
uniform vec3 uGradeGlobal;
uniform float uGradeBlending;
uniform vec2 uTexel;
uniform float uAspect;

const vec3 LUMA = vec3(0.2126, 0.7152, 0.0722);

float luma(vec3 color) { return dot(color, LUMA); }

vec3 rgbToHsv(vec3 c) {
  vec4 K = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);
  vec4 p = mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g));
  vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r));
  float d = q.x - min(q.w, q.y);
  float e = 1.0e-10;
  return vec3(abs(q.z + (q.w - q.y) / (6.0 * d + e)), d / (q.x + e), q.x);
}

vec3 hsvToRgb(vec3 c) {
  vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
  vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
  return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

/**
 * Tone response applied to luminance only; the RGB triple is then scaled by the
 * ratio. Working on luminance rather than per channel is what stops a strong
 * shadow lift from turning skin grey.
 */
float applyTone(float L) {
  // Highlight recovery: strongest at the top, tapering through the midtones.
  float highMask = smoothstep(0.35, 1.0, L);
  L += uHighlights * 0.45 * highMask * (uHighlights < 0.0 ? L : (1.0 - L));

  // Shadow lift: strongest at the bottom.
  float lowMask = 1.0 - smoothstep(0.0, 0.65, L);
  L += uShadows * 0.45 * lowMask * (uShadows > 0.0 ? (1.0 - L) : L);

  // Endpoints.
  L += uWhites * 0.22 * smoothstep(0.45, 1.0, L);
  L += uBlacks * 0.22 * (1.0 - smoothstep(0.0, 0.55, L));

  // Contrast: an S-curve pivoting on middle grey, matching how the Camera Raw
  // slider behaves rather than a plain linear stretch.
  L = clamp(L, 0.0, 4.0);
  if (uContrast > 0.0) {
    float s = clamp(L, 0.0, 1.0);
    L = mix(L, s * s * (3.0 - 2.0 * s), uContrast * 0.85);
  } else if (uContrast < 0.0) {
    L = 0.5 + (L - 0.5) * (1.0 + uContrast * 0.55);
  }
  return L;
}

/** Camera Raw's eight HSL bands, as smooth weights over the hue circle. */
float bandWeight(float hueDeg, int band) {
  float centers[8] = float[](0.0, 30.0, 60.0, 120.0, 180.0, 240.0, 280.0, 320.0);
  float center = centers[band];
  float delta = abs(mod(hueDeg - center + 540.0, 360.0) - 180.0);
  return 1.0 - smoothstep(0.0, 45.0, delta);
}

vec3 applyHsl(vec3 color) {
  vec3 hsv = rgbToHsv(color);
  float hueDeg = hsv.x * 360.0;
  float hueShift = 0.0;
  float satShift = 0.0;
  float lumShift = 0.0;
  float total = 0.0;

  for (int band = 0; band < 8; band++) {
    float weight = bandWeight(hueDeg, band);
    if (weight <= 0.0) continue;
    hueShift += uHslHue[band] * weight;
    satShift += uHslSat[band] * weight;
    lumShift += uHslLum[band] * weight;
    total += weight;
  }
  if (total <= 0.0) return color;

  // The bands overlap; normalising keeps the seams smooth.
  hueShift /= total;
  satShift /= total;
  lumShift /= total;

  hsv.x = fract(hsv.x + hueShift * 0.08);
  hsv.y = clamp(hsv.y * (1.0 + satShift), 0.0, 1.0);
  vec3 result = hsvToRgb(hsv);
  return result * (1.0 + lumShift * 0.5);
}

vec3 applyColorGrade(vec3 color) {
  float L = clamp(luma(color), 0.0, 1.0);
  float blend = clamp(uGradeBlending, 0.0, 1.0);

  float shadowWeight = (1.0 - smoothstep(0.0, 0.5, L)) * blend;
  float highlightWeight = smoothstep(0.5, 1.0, L) * blend;
  float midWeight = (1.0 - shadowWeight - highlightWeight) * blend;

  vec3 result = color;
  vec3 wheels[4] = vec3[](uGradeShadow, uGradeMidtone, uGradeHighlight, uGradeGlobal);
  float weights[4] = float[](shadowWeight, midWeight, highlightWeight, 1.0);

  for (int i = 0; i < 4; i++) {
    vec3 wheel = wheels[i];
    if (wheel.y <= 0.0 && wheel.z == 0.0) continue;
    vec3 tint = hsvToRgb(vec3(wheel.x / 360.0, 1.0, 1.0));
    result = mix(result, result * (0.5 + tint), wheel.y * weights[i] * 0.6);
    result *= 1.0 + wheel.z * weights[i] * 0.5;
  }
  return result;
}

void main() {
  vec3 color = texture(uImage, vUv).rgb;
  vec3 fine = texture(uFine, vUv).rgb;
  vec3 coarse = texture(uCoarse, vUv).rgb;

  // --- White balance ------------------------------------------------------
  // Channel gains rather than a full chromatic-adaptation transform: on an
  // already-rendered sRGB preview this matches Camera Raw closely enough for
  // the slider to feel right, and the RAW gets the real thing from the XMP.
  color.r *= 1.0 + uTemperature * 0.22;
  color.b *= 1.0 - uTemperature * 0.22;
  color.g *= 1.0 - uTint * 0.16;
  color.r *= 1.0 + uTint * 0.06;
  color.b *= 1.0 + uTint * 0.06;

  // --- Exposure -----------------------------------------------------------
  color *= exp2(uExposure);

  // --- Dehaze -------------------------------------------------------------
  // Approximated on the low-frequency plane: haze is a low-frequency veil, so
  // subtracting a share of it and restoring contrast is the visible part of
  // what Camera Raw's Dehaze does.
  if (abs(uDehaze) > 0.001) {
    float veil = clamp(luma(coarse), 0.0, 1.0);
    color = (color - uDehaze * 0.35 * veil) / max(0.15, 1.0 - uDehaze * 0.35);
  }

  // --- Tone ---------------------------------------------------------------
  float L = max(luma(color), 1e-4);
  float toned = applyTone(L);
  color *= toned / L;

  // --- Tone curve ---------------------------------------------------------
  if (uHasCurve > 0.5) {
    float before = clamp(luma(color), 0.0, 1.0);
    float after = texture(uCurve, vec2(before, 0.5)).r;
    color *= after / max(before, 1e-4);
  }

  // --- Texture and clarity ------------------------------------------------
  // Unsharp masking at two scales: fine detail for Texture, the mid-frequency
  // band for Clarity, with Clarity weighted towards the midtones so it does not
  // eat into highlights and shadows.
  if (abs(uTexture) > 0.001) {
    color += (color - fine) * uTexture * 1.6;
  }
  if (abs(uClarity) > 0.001) {
    float mid = 1.0 - abs(clamp(luma(color), 0.0, 1.0) - 0.5) * 2.0;
    color += (color - coarse) * uClarity * 1.1 * mid;
  }
  if (uSharpen > 0.001) {
    // Cheap 4-tap high-pass, enough to preview the sharpening amount.
    vec3 blurred = (
      texture(uImage, vUv + vec2(uTexel.x, 0.0)).rgb +
      texture(uImage, vUv - vec2(uTexel.x, 0.0)).rgb +
      texture(uImage, vUv + vec2(0.0, uTexel.y)).rgb +
      texture(uImage, vUv - vec2(0.0, uTexel.y)).rgb) * 0.25;
    color += (color - blurred) * uSharpen;
  }

  color = max(color, vec3(0.0));

  // --- Colour -------------------------------------------------------------
  vec3 hsv = rgbToHsv(clamp(color, 0.0, 4.0));
  if (abs(uVibrance) > 0.001) {
    // Vibrance protects what is already saturated, and protects skin hues on
    // top of that — the same reason Lightroom's version is safe on faces.
    float hueDeg = hsv.x * 360.0;
    float skinDistance = abs(mod(hueDeg - 22.0 + 540.0, 360.0) - 180.0);
    float skin = 1.0 - smoothstep(0.0, 40.0, skinDistance);
    float headroom = 1.0 - hsv.y;
    float gain = uVibrance * headroom * (1.0 - skin * 0.55);
    hsv.y = clamp(hsv.y * (1.0 + gain * 1.4), 0.0, 1.0);
  }
  if (abs(uSaturation) > 0.001) {
    hsv.y = clamp(hsv.y * (1.0 + uSaturation), 0.0, 1.0);
  }
  color = hsvToRgb(hsv);

  color = applyHsl(color);
  color = applyColorGrade(color);

  // --- Vignette -----------------------------------------------------------
  if (abs(uVignette) > 0.001) {
    vec2 centred = (vUv - 0.5) * vec2(uAspect, 1.0) * 2.0;
    float distance = length(centred) / max(0.2, uVignetteMidpoint * 2.0);
    float feather = mix(0.05, 0.9, uVignetteFeather);
    float mask = smoothstep(1.0 - feather, 1.0 + feather * 0.4, distance);
    color *= 1.0 + uVignette * mask;
  }

  fragColor = vec4(clamp(color, 0.0, 1.0), 1.0);
}`;
