/**
 * Session registry of the original files.
 *
 * The app deliberately does not copy 25 MB RAWs into IndexedDB — a 900-photo
 * wedding would be 22 GB of duplicated data on the phone. But a full-resolution
 * export needs the original back, because the stored proxy is bounded by the
 * project's `proxyEdge` (1600 px by default) and upscaling it would invent
 * detail that is not in the file.
 *
 * A `File` from an `<input type="file">` is a *handle* to bytes on disk, not the
 * bytes themselves: holding one costs almost nothing until something reads it.
 * So the originals are kept by reference for as long as the tab lives, and the
 * export reads the full-size embedded preview straight out of them.
 *
 * The registry is intentionally in-memory only. It does not survive a reload —
 * file handles cannot be persisted without the File System Access API, which
 * Android Chrome does not offer. After a reload the export says so and offers to
 * re-attach the originals, rather than silently shipping a smaller JPEG.
 */

/** photoId -> original file. */
const byPhotoId = new Map<string, File | Blob>();
/** Lower-cased file name -> original file, for re-attaching after a reload. */
const byFileName = new Map<string, File | Blob>();

export function rememberOriginal(photoId: string, fileName: string, file: File | Blob): void {
  byPhotoId.set(photoId, file);
  byFileName.set(fileName.toLowerCase(), file);
}

export function getOriginal(photoId: string, fileName?: string): File | Blob | undefined {
  return byPhotoId.get(photoId) ?? (fileName ? byFileName.get(fileName.toLowerCase()) : undefined);
}

export function hasOriginal(photoId: string, fileName?: string): boolean {
  return getOriginal(photoId, fileName) !== undefined;
}

/**
 * Re-attaches originals the user picked again after a reload, matching on file
 * name. Returns how many of `photos` are now covered.
 */
export function reattachOriginals(
  files: readonly File[],
  photos: readonly { id: string; fileName: string }[],
): number {
  for (const file of files) byFileName.set(file.name.toLowerCase(), file);
  let matched = 0;
  for (const photo of photos) {
    const file = byFileName.get(photo.fileName.toLowerCase());
    if (file) {
      byPhotoId.set(photo.id, file);
      matched += 1;
    }
  }
  return matched;
}

/** Drops the handles for one project's photos, e.g. when it is deleted. */
export function forgetOriginals(photoIds: readonly string[]): void {
  for (const id of photoIds) byPhotoId.delete(id);
}

export function clearOriginals(): void {
  byPhotoId.clear();
  byFileName.clear();
}
