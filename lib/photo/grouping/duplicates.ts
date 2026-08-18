/**
 * Duplicate / burst grouping and best-shot ranking.
 *
 * Nothing here ever deletes anything. It groups near-identical frames, ranks
 * them, and explains the ranking in plain Spanish; the photographer keeps the
 * decision, which is the only sane default when the difference between two
 * frames is a half-closed eye.
 */
import type { BestShotScore, DuplicateGroup, PhotoRecord } from "../types";
import { clamp, round } from "../analysis/image";
import { hammingDistance } from "../analysis/phash";

export interface GroupingOptions {
  /**
   * Maximum Hamming distance for two frames to be considered the same shot.
   * 10/64 is tight enough to keep different poses apart and loose enough to
   * survive an exposure change or a small reframe.
   */
  maxDistance?: number;
  /**
   * Frames further apart in time than this are never grouped, even if they look
   * alike — two identical altar shots an hour apart are different moments.
   */
  maxTimeGapMs?: number;
}

const DEFAULTS: Required<GroupingOptions> = {
  maxDistance: 10,
  maxTimeGapMs: 45_000,
};

interface Candidate {
  photo: PhotoRecord;
  dHash: string;
  aHash: string;
  capturedAt: number;
}

/**
 * Single-link clustering over the capture-ordered sequence.
 *
 * Bursts are contiguous in time, so we only ever compare a frame with the
 * members of the group still open — which keeps this linear instead of
 * quadratic across a 900-photo wedding.
 */
export function groupDuplicates(
  photos: readonly PhotoRecord[],
  options: GroupingOptions = {},
): DuplicateGroup[] {
  const { maxDistance, maxTimeGapMs } = { ...DEFAULTS, ...options };

  const candidates: Candidate[] = photos
    .filter((photo) => photo.analysis !== undefined)
    .map((photo) => ({
      photo,
      dHash: photo.analysis!.hashes.dHash,
      aHash: photo.analysis!.hashes.aHash,
      capturedAt: photo.exif.capturedAt ?? photo.lastModified ?? photo.addedAt,
    }))
    .sort((a, b) => a.capturedAt - b.capturedAt || a.photo.orderIndex - b.photo.orderIndex);

  const clusters: Candidate[][] = [];
  let current: Candidate[] = [];

  for (const candidate of candidates) {
    if (current.length === 0) {
      current = [candidate];
      continue;
    }
    const matches = current.some((member) => {
      if (Math.abs(candidate.capturedAt - member.capturedAt) > maxTimeGapMs) return false;
      const gradient = hammingDistance(candidate.dHash, member.dHash);
      if (gradient > maxDistance) return false;
      // Requiring the tone hash to agree too stops two different frames with
      // similar edge structure (same room, different people) from merging.
      return hammingDistance(candidate.aHash, member.aHash) <= maxDistance + 4;
    });

    if (matches) current.push(candidate);
    else {
      if (current.length > 1) clusters.push(current);
      current = [candidate];
    }
  }
  if (current.length > 1) clusters.push(current);

  return clusters.map((cluster, index) => {
    const scores: Record<string, BestShotScore> = {};
    for (const member of cluster) scores[member.photo.id] = scoreBestShot(member.photo);

    const suggested = cluster.reduce((best, member) =>
      scores[member.photo.id].total > scores[best.photo.id].total ? member : best,
    );

    return {
      id: `group-${String(index + 1).padStart(3, "0")}`,
      label: `GRUPO ${String(index + 1).padStart(3, "0")}`,
      photoIds: cluster.map((member) => member.photo.id),
      suggestedId: suggested.photo.id,
      scores,
    };
  });
}

/**
 * Ranks one frame within its group and writes the explanation the UI shows.
 *
 * "Ojos abiertos" is explicitly NOT claimed: we do not run eye-state detection,
 * and saying we did would be a lie the photographer would only discover after
 * culling. What we can measure honestly is how sharp the face is, whether the
 * exposure holds up, and how the subject sits in the frame.
 */
export function scoreBestShot(photo: PhotoRecord): BestShotScore {
  const analysis = photo.analysis;
  if (!analysis) {
    return {
      total: 0,
      sharpness: 0,
      exposure: 0,
      faces: 0,
      composition: 0,
      summary: "Sin analizar.",
    };
  }

  const faceRegion = analysis.skin.regions.find((region) => region.faceLike);
  const faceSharpness = faceRegion
    ? clamp(faceRegion.sharpness / (faceRegion.sharpness + 220), 0, 1)
    : analysis.sharpness;

  const exposureScore = analysis.exposure.verdicts.includes("correct")
    ? 1
    : clamp(1 - Math.abs(analysis.exposure.evOffset) / 2, 0, 1) -
      clamp(analysis.tone.unrecoverableHighlights * 6, 0, 0.4);

  // Composition proxy: how centred and how large the main subject is.
  const composition = faceRegion
    ? clamp(
        1 -
          Math.hypot(faceRegion.x + faceRegion.w / 2 - 0.5, faceRegion.y + faceRegion.h / 2 - 0.42) *
            1.6,
        0,
        1,
      ) *
        clamp(faceRegion.area / 0.08, 0.3, 1)
    : clamp(analysis.tone.centerMean / Math.max(0.05, analysis.tone.edgeMean), 0, 1);

  const facesScore = faceRegion ? faceSharpness : 0;

  const total = round(
    clamp(
      0.34 * analysis.sharpness +
        0.26 * facesScore +
        0.28 * clamp(exposureScore, 0, 1) +
        0.12 * composition,
      0,
      1,
    ),
    4,
  );

  const notes: string[] = [];
  notes.push(`nitidez ${(analysis.sharpness * 100).toFixed(0)}%`);
  if (faceRegion) notes.push(`rostro ${(faceSharpness * 100).toFixed(0)}% de foco`);
  notes.push(
    analysis.exposure.verdicts.includes("correct")
      ? "exposición correcta"
      : `exposición ${analysis.exposure.evOffset > 0 ? "baja" : "alta"}`,
  );
  notes.push(`encuadre ${(composition * 100).toFixed(0)}%`);

  return {
    total,
    sharpness: round(analysis.sharpness, 4),
    exposure: round(clamp(exposureScore, 0, 1), 4),
    faces: round(facesScore, 4),
    composition: round(composition, 4),
    summary: notes.join(" · "),
  };
}
