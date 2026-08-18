/**
 * Perceptual hashing for duplicate detection.
 *
 * Two independent 64-bit hashes are computed because they fail differently:
 * dHash tracks local gradients (robust to exposure shifts), aHash tracks the
 * overall tone map (robust to small subject movement). Requiring both to agree
 * keeps burst frames together without merging genuinely different shots.
 */
import type { PerceptualHashes } from "../types";
import { type RgbaImage, luma, resize } from "./image";

function toHex(bits: boolean[]): string {
  let hex = "";
  for (let index = 0; index < bits.length; index += 4) {
    let nibble = 0;
    for (let bit = 0; bit < 4; bit += 1) {
      if (bits[index + bit]) nibble |= 1 << (3 - bit);
    }
    hex += nibble.toString(16);
  }
  return hex;
}

function grayscale(image: RgbaImage): Float32Array {
  const out = new Float32Array(image.width * image.height);
  for (let pixel = 0, at = 0; pixel < out.length; pixel += 1, at += 4) {
    out[pixel] = luma(image.data[at], image.data[at + 1], image.data[at + 2]);
  }
  return out;
}

/** 64-bit difference hash: each bit compares a pixel with its right neighbour. */
export function dHash(image: RgbaImage): string {
  const small = resize(image, 9, 8);
  const gray = grayscale(small);
  const bits: boolean[] = [];
  for (let y = 0; y < 8; y += 1) {
    for (let x = 0; x < 8; x += 1) {
      bits.push(gray[y * 9 + x] > gray[y * 9 + x + 1]);
    }
  }
  return toHex(bits);
}

/** 64-bit average hash: each bit says whether a cell is above the mean. */
export function aHash(image: RgbaImage): string {
  const small = resize(image, 8, 8);
  const gray = grayscale(small);
  let sum = 0;
  for (const value of gray) sum += value;
  const mean = sum / gray.length;
  const bits: boolean[] = [];
  for (const value of gray) bits.push(value > mean);
  return toHex(bits);
}

export function computeHashes(image: RgbaImage): PerceptualHashes {
  return { dHash: dHash(image), aHash: aHash(image) };
}

const POPCOUNT = new Uint8Array(16);
for (let value = 0; value < 16; value += 1) {
  POPCOUNT[value] = (value & 1) + ((value >> 1) & 1) + ((value >> 2) & 1) + ((value >> 3) & 1);
}

/** Hamming distance between two equal-length hex hashes, 0..64. */
export function hammingDistance(a: string, b: string): number {
  if (a.length !== b.length) return Number.MAX_SAFE_INTEGER;
  let distance = 0;
  for (let index = 0; index < a.length; index += 1) {
    const left = Number.parseInt(a[index], 16);
    const right = Number.parseInt(b[index], 16);
    if (Number.isNaN(left) || Number.isNaN(right)) return Number.MAX_SAFE_INTEGER;
    distance += POPCOUNT[(left ^ right) & 0xf];
  }
  return distance;
}
