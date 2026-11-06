/**
 * Retoque de la máscara de recorte (canal alfa) que devuelve el modelo de
 * quitar fondo. Funciones puras sobre un canal alfa de `width * height` bytes,
 * para poder probarlas sin navegador.
 */

export interface CleanupOptions {
  /** Alfa por debajo del cual un píxel se considera fondo (0–255). */
  threshold?: number;
  /**
   * Un trozo suelto se conserva solo si su área es al menos esta fracción del
   * trozo más grande. Así desaparecen las manchitas sin tocar un segundo sujeto.
   */
  minRatio?: number;
}

export interface CleanupStats {
  kept: number;
  removed: number;
  removedPixels: number;
}

/**
 * Quita restos sueltos: manchas desconectadas del sujeto principal y la neblina
 * casi transparente que el modelo deja por el fondo. Modifica `alpha` in situ.
 */
export function removeIslands(
  alpha: Uint8Array | Uint8ClampedArray,
  width: number,
  height: number,
  { threshold = 24, minRatio = 0.02 }: CleanupOptions = {},
): CleanupStats {
  const size = width * height;
  const labels = new Int32Array(size); // 0 = sin etiqueta
  const areas: number[] = [0];
  const stack = new Int32Array(size);

  for (let start = 0; start < size; start++) {
    if (labels[start] !== 0 || alpha[start] < threshold) continue;
    const label = areas.length;
    let area = 0;
    let top = 0;
    stack[top++] = start;
    labels[start] = label;
    while (top > 0) {
      const i = stack[--top];
      area++;
      const x = i % width;
      const y = (i - x) / width;
      // Vecindad de 8 para no partir bordes finos en diagonal.
      for (let dy = -1; dy <= 1; dy++) {
        const ny = y + dy;
        if (ny < 0 || ny >= height) continue;
        for (let dx = -1; dx <= 1; dx++) {
          const nx = x + dx;
          if ((dx === 0 && dy === 0) || nx < 0 || nx >= width) continue;
          const n = ny * width + nx;
          if (labels[n] === 0 && alpha[n] >= threshold) {
            labels[n] = label;
            stack[top++] = n;
          }
        }
      }
    }
    areas.push(area);
  }

  const largest = Math.max(0, ...areas);
  const keep = areas.map((a, i) => i > 0 && a >= largest * minRatio);
  let removed = 0;
  let removedPixels = 0;
  for (let i = 1; i < areas.length; i++) if (!keep[i]) { removed++; removedPixels += areas[i]; }

  for (let i = 0; i < size; i++) {
    if (!keep[labels[i]]) alpha[i] = 0;
  }
  return { kept: areas.length - 1 - removed, removed, removedPixels };
}

/**
 * Pinta un círculo en la máscara: `value` 0 borra, 255 restaura. El borde se
 * suaviza un píxel para que no quede dentado. Devuelve el rectángulo tocado
 * (para redibujar solo esa zona) o null si cae fuera de la imagen.
 */
export function paintCircle(
  alpha: Uint8Array | Uint8ClampedArray,
  width: number,
  height: number,
  cx: number,
  cy: number,
  radius: number,
  value: 0 | 255,
): { x: number; y: number; w: number; h: number } | null {
  const x0 = Math.max(0, Math.floor(cx - radius - 1));
  const y0 = Math.max(0, Math.floor(cy - radius - 1));
  const x1 = Math.min(width - 1, Math.ceil(cx + radius + 1));
  const y1 = Math.min(height - 1, Math.ceil(cy + radius + 1));
  if (x0 > x1 || y0 > y1) return null;
  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      const d = Math.hypot(x + 0.5 - cx, y + 0.5 - cy);
      const cover = Math.min(1, Math.max(0, radius + 0.5 - d)); // 1 dentro, 0 fuera
      if (cover <= 0) continue;
      const i = y * width + x;
      const current = alpha[i];
      alpha[i] = Math.round(current + (value - current) * cover);
    }
  }
  return { x: x0, y: y0, w: x1 - x0 + 1, h: y1 - y0 + 1 };
}
