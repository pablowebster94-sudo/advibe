"use client";

import { useCallback, useRef, useState } from "react";
import { SUPPORTED_EXTENSIONS } from "@/lib/photo/pipeline";
import { Button } from "./ui";

/**
 * Deliberately unrestricted.
 *
 * `.ARW` has no registered MIME type, and several Android pickers — Samsung's
 * My Files among them — ignore extension entries in `accept` and grey out
 * anything they cannot map to a MIME type. On the target device that would grey
 * out every RAW file, which is the one thing this app exists to open.
 *
 * The extension hints stay first so desktop pickers still default to the right
 * filter, and `*` makes sure nothing is ever hidden. Nothing is lost by being
 * permissive here: `isSupportedFile` filters the selection and the import panel
 * lists by name whatever it skipped.
 */
const ACCEPT = [
  ".arw",
  ".dng",
  ".tif",
  ".tiff",
  ".jpg",
  ".jpeg",
  ".png",
  "image/*",
  "application/octet-stream",
  "*",
].join(",");

/**
 * Drag & drop plus a file picker.
 *
 * The picker matters more than the dropzone on the target device: on Android,
 * `<input type="file">` opens the system picker, which is what surfaces a camera
 * connected over USB. Drag & drop is the desktop path.
 */
export function Dropzone({
  onFiles,
  disabled = false,
  compact = false,
}: {
  onFiles: (files: FileList | File[]) => void;
  disabled?: boolean;
  compact?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const dragDepth = useRef(0);

  const handleDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      dragDepth.current = 0;
      setDragging(false);
      if (disabled) return;
      const files = Array.from(event.dataTransfer?.files ?? []);
      if (files.length > 0) onFiles(files);
    },
    [disabled, onFiles],
  );

  return (
    <div
      onDragEnter={(event) => {
        event.preventDefault();
        // Counting enter/leave stops the highlight flickering as the pointer
        // crosses child elements.
        dragDepth.current += 1;
        if (!disabled) setDragging(true);
      }}
      onDragOver={(event) => event.preventDefault()}
      onDragLeave={(event) => {
        event.preventDefault();
        dragDepth.current -= 1;
        if (dragDepth.current <= 0) setDragging(false);
      }}
      onDrop={handleDrop}
      className={`flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed text-center transition-colors ${
        compact ? "px-4 py-6" : "px-6 py-12"
      } ${
        dragging
          ? "border-[#78d94f] bg-[#78d94f]/10"
          : "border-neutral-700 bg-neutral-900/50 hover:border-neutral-600"
      } ${disabled ? "opacity-60" : ""}`}
    >
      <p className={`font-medium text-neutral-200 ${compact ? "text-sm" : "text-base"}`}>
        Arrastra tus fotografías aquí
      </p>
      <p className="max-w-md text-xs leading-relaxed text-neutral-500">
        {SUPPORTED_EXTENSIONS.map((extension) => extension.toUpperCase()).join(" · ")} · Los
        archivos originales no se modifican ni se suben a ningún servidor. Si conectas la cámara
        por cable, búscala en el selector de archivos como una unidad más.
      </p>
      <Button
        variant="primary"
        type="button"
        disabled={disabled}
        onClick={() => inputRef.current?.click()}
      >
        Seleccionar fotografías
      </Button>
      <input
        ref={inputRef}
        type="file"
        multiple
        accept={ACCEPT}
        className="sr-only"
        onChange={(event) => {
          if (event.target.files && event.target.files.length > 0) onFiles(event.target.files);
          // Reset so picking the same files twice still fires a change event.
          event.target.value = "";
        }}
      />
    </div>
  );
}
