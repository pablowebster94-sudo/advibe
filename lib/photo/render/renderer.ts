/**
 * WebGL2 develop renderer.
 *
 * Owns one context and reuses it across photos: creating a GL context per image
 * is the fastest way to hit the browser's context limit on a phone.
 *
 * Falls back to `null` when WebGL2 is unavailable; callers then show the
 * unedited preview and say so, rather than pretending an edit was applied.
 */
import type { Adjustments } from "../types";
import { BLUR_SHADER, DEVELOP_SHADER, VERTEX_SHADER } from "./glsl";
import { type DevelopUniforms, toUniforms } from "./uniforms";

type Canvas = OffscreenCanvas | HTMLCanvasElement;

interface Pass {
  texture: WebGLTexture;
  framebuffer: WebGLFramebuffer;
  width: number;
  height: number;
}

export class DevelopRenderer {
  readonly backend = "webgl2" as const;

  private readonly gl: WebGL2RenderingContext;
  private readonly canvas: Canvas;
  private readonly developProgram: WebGLProgram;
  private readonly blurProgram: WebGLProgram;
  private readonly quad: WebGLBuffer;
  private readonly curveTexture: WebGLTexture;
  private sourceTexture: WebGLTexture | null = null;
  private passes: Pass[] = [];
  private sourceWidth = 0;
  private sourceHeight = 0;

  private constructor(canvas: Canvas, gl: WebGL2RenderingContext) {
    this.canvas = canvas;
    this.gl = gl;
    this.developProgram = createProgram(gl, VERTEX_SHADER, DEVELOP_SHADER);
    this.blurProgram = createProgram(gl, VERTEX_SHADER, BLUR_SHADER);

    const quad = gl.createBuffer();
    if (!quad) throw new Error("No se pudo crear el buffer de vértices");
    gl.bindBuffer(gl.ARRAY_BUFFER, quad);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 3, -1, -1, 3]),
      gl.STATIC_DRAW,
    );
    this.quad = quad;

    const curve = gl.createTexture();
    if (!curve) throw new Error("No se pudo crear la textura de curva");
    this.curveTexture = curve;
  }

  /** Returns null when the device cannot give us a WebGL2 context. */
  static create(width = 1, height = 1): DevelopRenderer | null {
    let canvas: Canvas;
    if (typeof OffscreenCanvas !== "undefined") {
      canvas = new OffscreenCanvas(width, height);
    } else if (typeof document !== "undefined") {
      canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
    } else {
      return null;
    }

    const gl = canvas.getContext("webgl2", {
      premultipliedAlpha: false,
      preserveDrawingBuffer: true,
      antialias: false,
    }) as WebGL2RenderingContext | null;
    if (!gl) return null;

    try {
      return new DevelopRenderer(canvas, gl);
    } catch {
      return null;
    }
  }

  /**
   * Largest edge this GPU will accept as a texture. Anything bigger has to be
   * developed in bands; the value is typically 8192 or 16384, so a 6000 px
   * camera preview fits whole on essentially every device.
   */
  maxSourceSize(): number {
    return this.gl.getParameter(this.gl.MAX_TEXTURE_SIZE) as number;
  }

  get width(): number {
    return this.sourceWidth;
  }

  get height(): number {
    return this.sourceHeight;
  }

  /** Uploads a new source image, reallocating the intermediate buffers. */
  setSource(source: ImageBitmap | ImageData): void {
    const gl = this.gl;
    const width = source.width;
    const height = source.height;

    if (this.sourceTexture) gl.deleteTexture(this.sourceTexture);
    this.sourceTexture = createTexture(gl);
    gl.bindTexture(gl.TEXTURE_2D, this.sourceTexture);
    // Uploaded unflipped; the vertex shader inverts Y instead, so that the
    // source texture and the render-target textures share one convention.
    if (typeof ImageData !== "undefined" && source instanceof ImageData) {
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, source.data);
    } else {
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source as ImageBitmap);
    }

    if (width !== this.sourceWidth || height !== this.sourceHeight) {
      this.releasePasses();
      // Four ping-pong buffers: two for the fine blur, two for the coarse one.
      this.passes = [
        createPass(gl, width, height),
        createPass(gl, width, height),
        createPass(gl, Math.max(1, width >> 2), Math.max(1, height >> 2)),
        createPass(gl, Math.max(1, width >> 2), Math.max(1, height >> 2)),
      ];
      this.canvas.width = width;
      this.canvas.height = height;
      this.sourceWidth = width;
      this.sourceHeight = height;
    }
  }

  /** Renders `adjustments` onto the internal canvas. */
  render(adjustments: Adjustments): void {
    if (!this.sourceTexture) throw new Error("No hay imagen cargada en el renderizador");
    const gl = this.gl;
    const uniforms = toUniforms(adjustments);

    // 1. Fine blur (Texture) at full resolution.
    const fine = this.blur(this.sourceTexture, this.passes[0], this.passes[1], 1);
    // 2. Coarse blur (Clarity / Dehaze) at quarter resolution.
    const coarse = this.blur(fine, this.passes[2], this.passes[3], 2);

    // 3. Develop pass onto the canvas.
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, this.sourceWidth, this.sourceHeight);
    gl.useProgram(this.developProgram);
    this.bindQuad(this.developProgram);

    bindTexture(gl, this.developProgram, "uImage", this.sourceTexture, 0);
    bindTexture(gl, this.developProgram, "uFine", fine, 1);
    bindTexture(gl, this.developProgram, "uCoarse", coarse, 2);
    this.uploadCurve(uniforms.curve);
    bindTexture(gl, this.developProgram, "uCurve", this.curveTexture, 3);

    this.setUniforms(uniforms);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  /** Reads the rendered result back as pixels. */
  readPixels(): ImageData {
    const gl = this.gl;
    const pixels = new Uint8ClampedArray(this.sourceWidth * this.sourceHeight * 4);
    gl.readPixels(
      0,
      0,
      this.sourceWidth,
      this.sourceHeight,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      new Uint8Array(pixels.buffer),
    );
    // readPixels returns rows from the framebuffer's bottom edge, which the
    // vertex shader maps to the top of the image; flip to match the source.
    const flipped = new Uint8ClampedArray(pixels.length);
    const stride = this.sourceWidth * 4;
    for (let row = 0; row < this.sourceHeight; row += 1) {
      const from = (this.sourceHeight - 1 - row) * stride;
      flipped.set(pixels.subarray(from, from + stride), row * stride);
    }
    return new ImageData(flipped, this.sourceWidth, this.sourceHeight);
  }

  /** Encodes the rendered result. */
  async toBlob(type = "image/jpeg", quality = 0.9): Promise<Blob> {
    if (this.canvas instanceof OffscreenCanvas) {
      return this.canvas.convertToBlob({ type, quality });
    }
    const canvas = this.canvas as HTMLCanvasElement;
    return new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error("toBlob devolvió null"))),
        type,
        quality,
      );
    });
  }

  getCanvas(): Canvas {
    return this.canvas;
  }

  dispose(): void {
    const gl = this.gl;
    this.releasePasses();
    if (this.sourceTexture) gl.deleteTexture(this.sourceTexture);
    gl.deleteTexture(this.curveTexture);
    gl.deleteBuffer(this.quad);
    gl.deleteProgram(this.developProgram);
    gl.deleteProgram(this.blurProgram);
    this.sourceTexture = null;
  }

  // -- internals ------------------------------------------------------------

  private releasePasses(): void {
    for (const pass of this.passes) {
      this.gl.deleteTexture(pass.texture);
      this.gl.deleteFramebuffer(pass.framebuffer);
    }
    this.passes = [];
  }

  private bindQuad(program: WebGLProgram): void {
    const gl = this.gl;
    const location = gl.getAttribLocation(program, "aPosition");
    gl.bindBuffer(gl.ARRAY_BUFFER, this.quad);
    gl.enableVertexAttribArray(location);
    gl.vertexAttribPointer(location, 2, gl.FLOAT, false, 0, 0);
  }

  /** Two-pass separable Gaussian; returns the texture holding the result. */
  private blur(source: WebGLTexture, horizontal: Pass, vertical: Pass, radius: number): WebGLTexture {
    const gl = this.gl;
    gl.useProgram(this.blurProgram);
    this.bindQuad(this.blurProgram);
    const direction = gl.getUniformLocation(this.blurProgram, "uDirection");

    gl.bindFramebuffer(gl.FRAMEBUFFER, horizontal.framebuffer);
    gl.viewport(0, 0, horizontal.width, horizontal.height);
    bindTexture(gl, this.blurProgram, "uTexture", source, 0);
    gl.uniform2f(direction, radius / horizontal.width, 0);
    gl.drawArrays(gl.TRIANGLES, 0, 3);

    gl.bindFramebuffer(gl.FRAMEBUFFER, vertical.framebuffer);
    gl.viewport(0, 0, vertical.width, vertical.height);
    bindTexture(gl, this.blurProgram, "uTexture", horizontal.texture, 0);
    gl.uniform2f(direction, 0, radius / vertical.height);
    gl.drawArrays(gl.TRIANGLES, 0, 3);

    return vertical.texture;
  }

  private uploadCurve(lut: Uint8Array | null): void {
    const gl = this.gl;
    const data = new Uint8Array(256 * 4);
    for (let index = 0; index < 256; index += 1) {
      const value = lut ? lut[index] : index;
      data[index * 4] = value;
      data[index * 4 + 1] = value;
      data[index * 4 + 2] = value;
      data[index * 4 + 3] = 255;
    }
    gl.bindTexture(gl.TEXTURE_2D, this.curveTexture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 256, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, data);
  }

  private setUniforms(uniforms: DevelopUniforms): void {
    const gl = this.gl;
    const program = this.developProgram;
    const set1f = (name: string, value: number) => {
      gl.uniform1f(gl.getUniformLocation(program, name), value);
    };
    const set3f = (name: string, value: [number, number, number]) => {
      gl.uniform3f(gl.getUniformLocation(program, name), value[0], value[1], value[2]);
    };

    set1f("uExposure", uniforms.exposure);
    set1f("uContrast", uniforms.contrast);
    set1f("uHighlights", uniforms.highlights);
    set1f("uShadows", uniforms.shadows);
    set1f("uWhites", uniforms.whites);
    set1f("uBlacks", uniforms.blacks);
    set1f("uTemperature", uniforms.temperature);
    set1f("uTint", uniforms.tint);
    set1f("uVibrance", uniforms.vibrance);
    set1f("uSaturation", uniforms.saturation);
    set1f("uTexture", uniforms.texture);
    set1f("uClarity", uniforms.clarity);
    set1f("uDehaze", uniforms.dehaze);
    set1f("uSharpen", uniforms.sharpen);
    set1f("uVignette", uniforms.vignette);
    set1f("uVignetteMidpoint", uniforms.vignetteMidpoint);
    set1f("uVignetteFeather", uniforms.vignetteFeather);
    set1f("uHasCurve", uniforms.curve ? 1 : 0);
    set1f("uGradeBlending", uniforms.gradeBlending);
    set1f("uAspect", this.sourceWidth / Math.max(1, this.sourceHeight));

    gl.uniform2f(
      gl.getUniformLocation(program, "uTexel"),
      1 / Math.max(1, this.sourceWidth),
      1 / Math.max(1, this.sourceHeight),
    );
    gl.uniform1fv(gl.getUniformLocation(program, "uHslHue[0]"), uniforms.hslHue);
    gl.uniform1fv(gl.getUniformLocation(program, "uHslSat[0]"), uniforms.hslSat);
    gl.uniform1fv(gl.getUniformLocation(program, "uHslLum[0]"), uniforms.hslLum);
    set3f("uGradeShadow", uniforms.gradeShadow);
    set3f("uGradeMidtone", uniforms.gradeMidtone);
    set3f("uGradeHighlight", uniforms.gradeHighlight);
    set3f("uGradeGlobal", uniforms.gradeGlobal);
  }
}

function createTexture(gl: WebGL2RenderingContext): WebGLTexture {
  const texture = gl.createTexture();
  if (!texture) throw new Error("No se pudo crear la textura");
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  return texture;
}

function createPass(gl: WebGL2RenderingContext, width: number, height: number): Pass {
  const texture = createTexture(gl);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
  const framebuffer = gl.createFramebuffer();
  if (!framebuffer) throw new Error("No se pudo crear el framebuffer");
  gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  return { texture, framebuffer, width, height };
}

function bindTexture(
  gl: WebGL2RenderingContext,
  program: WebGLProgram,
  name: string,
  texture: WebGLTexture,
  unit: number,
): void {
  gl.activeTexture(gl.TEXTURE0 + unit);
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.uniform1i(gl.getUniformLocation(program, name), unit);
}

function compile(gl: WebGL2RenderingContext, type: number, source: string): WebGLShader {
  const shader = gl.createShader(type);
  if (!shader) throw new Error("No se pudo crear el shader");
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(shader);
    gl.deleteShader(shader);
    throw new Error(`Error compilando shader: ${log}`);
  }
  return shader;
}

function createProgram(
  gl: WebGL2RenderingContext,
  vertexSource: string,
  fragmentSource: string,
): WebGLProgram {
  const program = gl.createProgram();
  if (!program) throw new Error("No se pudo crear el programa");
  const vertex = compile(gl, gl.VERTEX_SHADER, vertexSource);
  const fragment = compile(gl, gl.FRAGMENT_SHADER, fragmentSource);
  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  gl.linkProgram(program);
  gl.deleteShader(vertex);
  gl.deleteShader(fragment);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const log = gl.getProgramInfoLog(program);
    gl.deleteProgram(program);
    throw new Error(`Error enlazando programa: ${log}`);
  }
  return program;
}
